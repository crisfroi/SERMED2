// ============================================================================
// useLabOrder Hook - Laboratory Order Management
// Handle lab order creation, test selection, and order tracking
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface AvailableTest {
  id: string;
  name: string;
  code: string;
  category: string;
  normalMin: number;
  normalMax: number;
  unit: string;
}

interface AvailableSampleType {
  id: string;
  name: string;
  container: string;
}

interface TestSelection {
  testId: string;
  testName: string;
  testCode: string;
  sampleTypeId: string;
  sampleTypeName: string;
  urgency: 'normal' | 'urgent' | 'stat';
}

export const useLabOrder = () => {
  const { user } = useAuth();
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [availableSampleTypes, setAvailableSampleTypes] = useState<AvailableSampleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableTests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('laboratory_tests')
        .select('id, test_name, test_code, test_category, normal_min_value, normal_max_value, unit_of_measure')
        .eq('enabled', true)
        .order('test_category', { ascending: true });

      if (queryError) throw queryError;

      setAvailableTests(
        (data || []).map((test) => ({
          id: test.id,
          name: test.test_name,
          code: test.test_code,
          category: test.test_category,
          normalMin: test.normal_min_value,
          normalMax: test.normal_max_value,
          unit: test.unit_of_measure,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching tests');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSampleTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('lab_sample_types')
        .select('id, sample_name, collection_container')
        .eq('enabled', true)
        .order('sample_name', { ascending: true });

      if (queryError) throw queryError;

      setAvailableSampleTypes(
        (data || []).map((st) => ({
          id: st.id,
          name: st.sample_name,
          container: st.collection_container,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching sample types');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(
    async (
      patientId: string,
      clinicalIndication: string,
      selectedTests: TestSelection[],
      priority: 'normal' | 'urgent' | 'stat' = 'normal',
      requestedForDate?: Date
    ) => {
      if (!user) throw new Error('User not authenticated');

      setLoading(true);
      setError(null);

      try {
        // 1. Create main order
        const { data: orderData, error: orderError } = await supabase
          .from('laboratory_orders')
          .insert([
            {
              patient_id: patientId,
              ordered_by_provider_id: user.id,
              clinical_indication: clinicalIndication,
              priority,
              status: 'pending',
              requested_for_date: requestedForDate?.toISOString().split('T')[0],
            },
          ])
          .select('id')
          .single();

        if (orderError) throw orderError;

        // 2. Add order lines (tests)
        const orderLines = selectedTests.map((test, idx) => ({
          lab_order_id: orderData.id,
          sequence_number: idx + 1,
          test_id: test.testId,
          sample_type_id: test.sampleTypeId,
          urgency: test.urgency,
        }));

        const { error: linesError } = await supabase
          .from('lab_order_lines')
          .insert(orderLines);

        if (linesError) throw linesError;

        return orderData.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error creating order';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    availableTests,
    availableSampleTypes,
    loading,
    error,
    fetchAvailableTests,
    fetchSampleTypes,
    createOrder,
  };
};

export default useLabOrder;
