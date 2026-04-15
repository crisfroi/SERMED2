// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || ''
);

// Hook for managing lab orders
export const useLabOrderManagement = (patientId: string) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('lab_test_orders')
        .select('*, lab_test_types(*)')
        .eq('patient_id', patientId)
        .order('order_date', { ascending: false });

      if (err) throw err;
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching lab orders');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createOrder = useCallback(async (orderData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('lab_test_orders')
        .insert([{ ...orderData, patient_id: patientId, status: 'ordered' }])
        .select()
        .single();

      if (err) throw err;
      setOrders(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error creating lab order');
      throw err;
    }
  }, [patientId]);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      const { data, error: err } = await supabase
        .from('lab_test_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (err) throw err;
      setOrders(prev => prev.map(o => o.id === orderId ? data : o));
      return data;
    } catch (err: any) {
      setError(err.message || 'Error updating order status');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, createOrder, updateOrderStatus, refetch: fetchOrders };
};

// Hook for managing lab results
export const useLabResults = (patientId: string) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('lab_test_results')
        .select(`
          *,
          test_order_id (
            patient_id,
            lab_test_types (test_name, reference_unit)
          )
        `)
        .eq('test_order_id.patient_id', patientId)
        .order('result_date', { ascending: false });

      if (err) throw err;
      setResults(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching lab results');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const finializeResult = useCallback(async (resultId: string, finalData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('lab_test_results')
        .update({ ...finalData, is_final: true, updated_at: new Date().toISOString() })
        .eq('id', resultId)
        .select()
        .single();

      if (err) throw err;
      setResults(prev => prev.map(r => r.id === resultId ? data : r));
      return data;
    } catch (err: any) {
      setError(err.message || 'Error finalizing result');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { results, loading, error, finializeResult, refetch: fetchResults };
};

// Hook for quality control management
export const useQualityControl = () => {
  const [qcRuns, setQcRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQCRuns = useCallback(async (testTypeId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('lab_quality_control_runs')
        .select('*');

      if (testTypeId) {
        query = query.eq('test_type_id', testTypeId);
      }

      const { data, error: err } = await query
        .order('result_date', { ascending: false })
        .limit(50);

      if (err) throw err;
      setQcRuns(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching QC runs');
    } finally {
      setLoading(false);
    }
  }, []);

  const recordQCRun = useCallback(async (qcData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('lab_quality_control_runs')
        .insert([qcData])
        .select()
        .single();

      if (err) throw err;
      setQcRuns(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error recording QC run');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchQCRuns();
  }, [fetchQCRuns]);

  return { qcRuns, loading, error, recordQCRun, refetch: fetchQCRuns };
};
