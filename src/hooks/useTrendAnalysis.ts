// @ts-nocheck
// ============================================================================
// useTrendAnalysis Hook - Laboratory Results Trend Analysis
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TrendDataPoint {
  date: string;
  value: number;
  testName: string;
  unit: string;
  normalMin: number;
  normalMax: number;
}

interface TrendMetrics {
  average: number;
  min: number;
  max: number;
  trend: 'improving' | 'worsening' | 'stable';
  lastChangePercent: number;
}

interface AvailableTest {
  id: string;
  name: string;
  code: string;
}

export const useTrendAnalysis = () => {
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [trendHistory, setTrendHistory] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableTests = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('laboratory_tests')
        .select('id, test_name, test_code')
        .eq('enabled', true)
        .order('test_category', { ascending: true });

      if (queryError) throw queryError;

      setAvailableTests(
        (data || []).map((test) => ({
          id: test.id,
          name: test.test_name,
          code: test.test_code,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching tests');
    }
  }, []);

  const fetchTrendData = useCallback(
    async (patientId: string, testCode: string, daysBack: number = 90) => {
      setLoading(true);
      setError(null);

      try {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - daysBack);

        const { data, error: queryError } = await supabase
          .from('lab_test_results')
          .select(
            `
            result_value,
            result_date,
            unit_of_measure,
            laboratory_tests:test_id(
              test_name,
              test_code,
              normal_min_value,
              normal_max_value,
              unit_of_measure
            ),
            laboratory_orders:lab_order_id(patient_id)
          `
          )
          .eq('laboratory_orders.patient_id', patientId)
          .eq('laboratory_tests.test_code', testCode)
          .gte('result_date', fromDate.toISOString())
          .order('result_date', { ascending: true });

        if (queryError) throw queryError;

        const formattedData: TrendDataPoint[] = (data || []).map((point: any) => ({
          date: point.result_date,
          value: point.result_value,
          testName: point.laboratory_tests.test_name,
          unit: point.laboratory_tests.unit_of_measure,
          normalMin: point.laboratory_tests.normal_min_value,
          normalMax: point.laboratory_tests.normal_max_value,
        }));

        setTrendHistory(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching trend data');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const calculateTrendMetrics = useCallback(
    (data: TrendDataPoint[]): TrendMetrics | null => {
      if (data.length === 0) return null;

      const values = data.map((d) => d.value);
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      // Calculate trend
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      let trend: 'improving' | 'worsening' | 'stable' = 'stable';
      if (Math.abs(firstAvg - secondAvg) > firstAvg * 0.1) {
        // > 10% change
        trend = secondAvg < firstAvg ? 'improving' : 'worsening';
      }

      const lastChangePercent =
        values.length > 1
          ? (((values[values.length - 1] - values[values.length - 2]) /
            values[values.length - 2]) *
          100)
          : 0;

      return {
        average,
        min,
        max,
        trend,
        lastChangePercent,
      };
    },
    []
  );

  return {
    availableTests,
    trendHistory,
    loading,
    error,
    fetchAvailableTests,
    fetchTrendData,
    calculateTrendMetrics,
  };
};

export default useTrendAnalysis;
