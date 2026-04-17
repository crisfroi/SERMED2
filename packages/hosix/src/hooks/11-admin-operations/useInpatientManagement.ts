import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================
export interface InpatientAdmission {
  id: string;
  patient_id: string;
  admission_date: string;
  admission_type: 'scheduled' | 'emergency' | 'urgent';
  admission_reason: string;
  responsible_provider_id: string;
  department_id: string;
  bed_id?: string;
  status: 'active' | 'on_leave' | 'discharge_pending' | 'discharged';
  current_diagnosis?: string;
  medical_notes?: string;
}

export interface InpatientBed {
  id: string;
  room_id: string;
  bed_number: string;
  bed_type: 'standard' | 'intensive' | 'isolation' | 'pediatric';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  current_patient_id?: string;
  last_cleaning?: string;
}

export interface HospitalRoom {
  id: string;
  department_id: string;
  room_number: string;
  room_type: 'general' | 'icu' | 'isolation' | 'emergency';
  capacity: number;
  available_beds: number;
  features?: string[];
}

export interface DailyRoundNotes {
  id: string;
  admission_id: string;
  round_date: string;
  provider_id: string;
  clinical_notes: string;
  vital_signs?: Record<string, any>;
  medications_given?: string[];
  next_review?: string;
}

export const useInpatientManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admit patient to hospital
  const admitPatient = useCallback(
    async (admissionData: Partial<InpatientAdmission>): Promise<InpatientAdmission | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('inpatient_admissions')
          .insert({
            ...admissionData,
            admission_date: new Date().toISOString(),
            status: 'active',
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'inpatient_admission',
          entity_id: data.id,
          action: 'create',
          changed_by: 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Patient ${admissionData.patient_id} admitted to ${admissionData.department_id}. Reason: ${admissionData.admission_reason}`,
          severity: 'medium',
        });

        return data as InpatientAdmission;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to admit patient';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get patient's admission history
  const getPatientAdmissions = useCallback(
    async (patientId: string, includeHistorical = true): Promise<InpatientAdmission[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('inpatient_admissions')
          .select('*')
          .eq('patient_id', patientId);

        if (!includeHistorical) {
          query = query.eq('status', 'active');
        }

        query = query.order('admission_date', { ascending: false });

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as InpatientAdmission[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get admissions';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get active admissions by department
  const getActiveBedOccupancy = useCallback(
    async (departmentId?: string): Promise<any> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('inpatient_beds')
          .select('*, room_id(*)')
          .eq('status', 'occupied');

        if (departmentId) {
          query = query.eq('room_id.department_id', departmentId);
        }

        const { data, error: err } = await query;

        if (err) throw err;

        const occupied = data?.length || 0;
        const { count: total } = await supabase
          .from('inpatient_beds')
          .select('*', { count: 'exact', head: true });

        return {
          occupiedBeds: occupied,
          totalBeds: total || 0,
          occupancyRate: total ? (occupied / total) * 100 : 0,
          availableBeds: (total || 0) - occupied,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get occupancy';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Assign bed to patient
  const assignBed = useCallback(
    async (admissionId: string, bedId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        // Update admission with bed
        const { error: err1 } = await supabase
          .from('inpatient_admissions')
          .update({ bed_id: bedId })
          .eq('id', admissionId);

        if (err1) throw err1;

        // Update bed status
        const { data: admission } = await supabase
          .from('inpatient_admissions')
          .select('patient_id')
          .eq('id', admissionId)
          .single();

        const { error: err2 } = await supabase
          .from('inpatient_beds')
          .update({ status: 'occupied', current_patient_id: admission?.patient_id })
          .eq('id', bedId);

        if (err2) throw err2;

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to assign bed';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Discharge patient
  const dischargePatient = useCallback(
    async (admissionId: string, dischargeNotes: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { data: admission } = await supabase
          .from('inpatient_admissions')
          .select('bed_id')
          .eq('id', admissionId)
          .single();

        // Update admission status
        const { error: err1 } = await supabase
          .from('inpatient_admissions')
          .update({
            status: 'discharged',
            medical_notes: dischargeNotes,
          })
          .eq('id', admissionId);

        if (err1) throw err1;

        // Free up bed
        if (admission?.bed_id) {
          const { error: err2 } = await supabase
            .from('inpatient_beds')
            .update({ status: 'available', current_patient_id: null })
            .eq('id', admission.bed_id);

          if (err2) throw err2;
        }

        // Log audit
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'inpatient_admission',
          entity_id: admissionId,
          action: 'update',
          changed_by: 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Patient discharged. Notes: ${dischargeNotes}`,
          severity: 'medium',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to discharge patient';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Record daily round notes
  const recordDailyRound = useCallback(
    async (roundData: Partial<DailyRoundNotes>): Promise<DailyRoundNotes | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('inpatient_daily_rounds')
          .insert({
            ...roundData,
            round_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (err) throw err;

        return data as DailyRoundNotes;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to record daily round';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    admitPatient,
    getPatientAdmissions,
    getActiveBedOccupancy,
    assignBed,
    dischargePatient,
    recordDailyRound,
  };
};
