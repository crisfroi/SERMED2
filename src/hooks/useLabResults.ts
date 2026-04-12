// ============================================================================
// useLabResults Hook - Laboratory Results Viewing and Interpretation
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LabResult {
  id: string;
  testName: string;
  testCode: string;
  value: number;
  unit: string;
  normalMin: number;
  normalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
  interpretation: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
  resultDate: string;
  comments?: string;
  trendStatus?: 'improving' | 'worsening' | 'stable';
}

export const useLabResults = () => {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(
    async (patientId: string, labOrderId?: string) => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('lab_test_results')
          .select(
            `
            id,
            result_value,
            result_status,
            interpretation,
            result_date,
            comments,
            unit_of_measure,
            laboratory_tests:test_id(test_name, test_code, normal_min_value, normal_max_value, critical_low_value, critical_high_value, unit_of_measure)
          `
          )
          .eq('laboratory_orders.patient_id', patientId);

        if (labOrderId) {
          query = query.eq('lab_order_id', labOrderId);
        }

        const { data, error: queryError } = await query
          .order('result_date', { ascending: false });

        if (queryError) throw queryError;

        const formattedResults: LabResult[] = (data || []).map((result: any) => ({
          id: result.id,
          testName: result.laboratory_tests.test_name,
          testCode: result.laboratory_tests.test_code,
          value: result.result_value,
          unit: result.unit_of_measure,
          normalMin: result.laboratory_tests.normal_min_value,
          normalMax: result.laboratory_tests.normal_max_value,
          criticalLow: result.laboratory_tests.critical_low_value,
          criticalHigh: result.laboratory_tests.critical_high_value,
          interpretation: result.interpretation,
          resultDate: result.result_date,
          comments: result.comments,
        }));

        setResults(formattedResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching results');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const exportResults = useCallback(
    async (patientId: string): Promise<ArrayBuffer> => {
      try {
        // Call Edge Function to generate PDF
        const response = await supabase.functions.invoke('export_lab_results', {
          body: { patientId },
        });

        if (response.error) throw response.error;
        return response.data;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Error exporting results'
        );
      }
    },
    []
  );

  return {
    results,
    loading,
    error,
    fetchResults,
    exportResults,
  };
};

export default useLabResults;
