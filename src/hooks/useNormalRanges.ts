// ============================================================================
// useNormalRanges Hook - Demographic-specific Normal Ranges
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

interface RangeData {
  sex?: string;
  ageMin?: number;
  ageMax?: number;
  normalMin: number;
  normalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export const useNormalRanges = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNormalRanges = useCallback(
    async (testCode: string, age: number, sex: 'M' | 'F'): Promise<RangeData> => {
      setLoading(true);
      setError(null);

      try {
        // Get test first
        const { data: testData, error: testError } = await supabase
          .from('laboratory_tests')
          .select('id, normal_min_value, normal_max_value, critical_low_value, critical_high_value')
          .eq('test_code', testCode)
          .single();

        if (testError || !testData) {
          throw new Error('Test not found');
        }

        // Try to find age/sex-specific range
        const { data: rangeData } = await supabase
          .from('lab_normal_ranges')
          .select('normal_min, normal_max, critical_low, critical_high')
          .eq('test_id', testData.id)
          .or(`sex.eq.${sex},sex.is.null`)
          .lte('min_age_years', age)
          .gte('max_age_years', age)
          .order('sex', { ascending: false })
          .limit(1)
          .single();

        if (rangeData) {
          return {
            sex,
            ageMin: age,
            ageMax: age,
            normalMin: rangeData.normal_min,
            normalMax: rangeData.normal_max,
            criticalLow: rangeData.critical_low,
            criticalHigh: rangeData.critical_high,
          };
        }

        // Fall back to default test ranges
        return {
          sex,
          ageMin: age,
          ageMax: age,
          normalMin: testData.normal_min_value,
          normalMax: testData.normal_max_value,
          criticalLow: testData.critical_low_value,
          criticalHigh: testData.critical_high_value,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error fetching ranges';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const validateResult = useCallback(
    (
      testCode: string,
      testName: string,
      resultValue: number,
      unit: string,
      ranges: RangeData
    ) => {
      let interpretation: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';

      if (ranges.criticalLow && resultValue < ranges.criticalLow) {
        interpretation = 'critical_low';
      } else if (ranges.criticalHigh && resultValue > ranges.criticalHigh) {
        interpretation = 'critical_high';
      } else if (resultValue < ranges.normalMin) {
        interpretation = 'low';
      } else if (resultValue > ranges.normalMax) {
        interpretation = 'high';
      } else {
        interpretation = 'normal';
      }

      const rangeMiddle = (ranges.normalMin + ranges.normalMax) / 2;
      const percentageOfNormal = (resultValue / rangeMiddle) * 100;

      const distanceFromEdge =
        resultValue < rangeMiddle
          ? resultValue - ranges.normalMin
          : ranges.normalMax - resultValue;

      return {
        testCode,
        testName,
        resultValue,
        unit,
        applicableRange: ranges,
        interpretation,
        percentageOfNormal,
        distanceFromEdge,
      };
    },
    []
  );

  return {
    loading,
    error,
    getNormalRanges,
    validateResult,
  };
};

export default useNormalRanges;

