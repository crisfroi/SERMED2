import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================
export interface NursingTask {
  id: string;
  patient_id: string;
  admission_id?: string;
  task_type:
    | 'wound_care'
    | 'catheter_care'
    | 'medication_administration'
    | 'vital_signs_monitoring'
    | 'hygiene'
    | 'patient_positioning'
    | 'other';
  frequency: 'once' | 'every_2_hours' | 'every_4_hours' | 'every_6_hours' | 'daily';
  assigned_to: string; // nurse_id
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_date: string;
  due_date: string;
  completed_date?: string;
  clinical_notes?: string;
}

export interface PatientCareOrder {
  id: string;
  patient_id: string;
  order_date: string;
  care_type:
    | 'personal_hygiene'
    | 'wound_dressing'
    | 'pain_management'
    | 'infection_prevention'
    | 'mobility_assistance'
    | 'nutritional_support'
    | 'psychological_support';
  provider_id: string;
  instructions: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'active' | 'completed' | 'discontinued';
  completion_notes?: string;
}

export interface NursingShift {
  id: string;
  nurse_id: string;
  shift_start: string;
  shift_end: string;
  patients_assigned: number;
  shift_handover_notes?: string;
  status: 'scheduled' | 'active' | 'completed';
}

export const useNursingManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create nursing task
  const createNursingTask = useCallback(
    async (taskData: Partial<NursingTask>): Promise<NursingTask | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('nursing_tasks')
          .insert({
            ...taskData,
            status: 'pending',
            created_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'nursing_task',
          entity_id: data.id,
          action: 'create',
          changed_by: 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Nursing task created: ${taskData.task_type}. Assigned to ${taskData.assigned_to}. Frequency: ${taskData.frequency}`,
          severity: 'low',
        });

        return data as NursingTask;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create nursing task';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get pending nursing tasks for nurse
  const getAssignedTasks = useCallback(
    async (nurseId: string): Promise<NursingTask[]> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('nursing_tasks')
          .select('*')
          .eq('assigned_to', nurseId)
          .in('status', ['pending', 'in_progress'])
          .order('due_date', { ascending: true });

        if (err) throw err;

        return (data || []) as NursingTask[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get assigned tasks';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Complete nursing task
  const completeTask = useCallback(
    async (taskId: string, notes: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('nursing_tasks')
          .update({
            status: 'completed',
            completed_date: new Date().toISOString(),
            clinical_notes: notes,
          })
          .eq('id', taskId);

        if (err) throw err;

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to complete task';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create care order
  const createCareOrder = useCallback(
    async (orderData: Partial<PatientCareOrder>): Promise<PatientCareOrder | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('patient_care_orders')
          .insert({
            ...orderData,
            order_date: new Date().toISOString(),
            status: 'active',
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'care_order',
          entity_id: data.id,
          action: 'create',
          changed_by: orderData.provider_id || 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Care order created: ${orderData.care_type}. Priority: ${orderData.priority}. Instructions: ${orderData.instructions}`,
          severity: orderData.priority === 'stat' ? 'high' : 'medium',
        });

        return data as PatientCareOrder;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create care order';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get active care orders for patient
  const getPatientCareOrders = useCallback(
    async (patientId: string, includeCompleted = false): Promise<PatientCareOrder[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('patient_care_orders')
          .select('*')
          .eq('patient_id', patientId);

        if (!includeCompleted) {
          query = query.eq('status', 'active');
        }

        query = query.order('order_date', { ascending: false });

        const { data, error: err } = await query;

        if (err) throw err;

        return (data || []) as PatientCareOrder[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get care orders';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get nurse shift assignments
  const getNurseShifts = useCallback(
    async (nurseId: string): Promise<NursingShift[]> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('nursing_shifts')
          .select('*')
          .eq('nurse_id', nurseId)
          .order('shift_start', { ascending: false });

        if (err) throw err;

        return (data || []) as NursingShift[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get shifts';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createNursingTask,
    getAssignedTasks,
    completeTask,
    createCareOrder,
    getPatientCareOrders,
    getNurseShifts,
  };
};
