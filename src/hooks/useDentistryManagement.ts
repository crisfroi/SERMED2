import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================
export interface ToothData {
  tooth_id: string; // FDI notation (11-48)
  status: 'healthy' | 'cavity' | 'filled' | 'root_canal' | 'missing' | 'extraction_needed';
  condition: 'sound' | 'restored' | 'carious' | 'suspicious' | 'crowned';
  notes?: string;
}

export interface DentalProcedure {
  id: string;
  patient_id: string;
  appointment_id?: string;
  procedure_type:
    | 'cleaning'
    | 'filling'
    | 'extraction'
    | 'root_canal'
    | 'crown'
    | 'implant'
    | 'orthodontic'
    | 'preventive'
    | 'other';
  tooth_id?: string;
  procedure_date: string;
  provider_id: string;
  status: 'planned' | 'scheduled' | 'completed' | 'cancelled';
  cost: number;
  insurance_coverage?: number;
  clinical_notes?: string;
}

export interface DentalExamination {
  id: string;
  patient_id: string;
  exam_date: string;
  examiner_id: string;
  tooth_map: Record<string, ToothData>;
  plaque_index?: number; // 0-3
  bleeding_index?: number; // 0-3
  pocket_depth_map?: Record<string, number[]>; // mm per tooth
  recommendations: string[];
  overall_risk: 'low' | 'moderate' | 'high';
  next_visit_recommended?: string;
}

export interface DentalAppointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  dentist_id: string;
  procedure_planned?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
  notes?: string;
}

export const useDentistryManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Record dental examination
  const recordDentalExam = useCallback(
    async (examData: Partial<DentalExamination>): Promise<DentalExamination | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('dental_examinations')
          .insert({
            ...examData,
            exam_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'dental_exam',
          entity_id: data.id,
          action: 'create',
          changed_by: examData.examiner_id || 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Dental examination recorded. Risk level: ${examData.overall_risk}. Recommendations: ${examData.recommendations?.join(', ')}`,
          severity: 'low',
        });

        return data as DentalExamination;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to record dental exam';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Schedule dental procedure
  const scheduleProcedure = useCallback(
    async (procData: Partial<DentalProcedure>): Promise<DentalProcedure | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('dental_procedures')
          .insert({
            ...procData,
            procedure_date: procData.procedure_date || new Date().toISOString(),
            status: 'planned',
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'dental_procedure',
          entity_id: data.id,
          action: 'create',
          changed_by: procData.provider_id || 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Dental procedure scheduled: ${procData.procedure_type}. Tooth: ${procData.tooth_id}. Cost: ${procData.cost}`,
          severity: 'low',
        });

        return data as DentalProcedure;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to schedule procedure';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get patient's dental history
  const getPatientDentalHistory = useCallback(
    async (patientId: string): Promise<any> => {
      try {
        setLoading(true);
        setError(null);

        const { data: exams, error: examsErr } = await supabase
          .from('dental_examinations')
          .select('*')
          .eq('patient_id', patientId)
          .order('exam_date', { ascending: false })
          .limit(5);

        if (examsErr) throw examsErr;

        const { data: procedures, error: procsErr } = await supabase
          .from('dental_procedures')
          .select('*')
          .eq('patient_id', patientId)
          .order('procedure_date', { ascending: false });

        if (procsErr) throw procsErr;

        return {
          examinations: exams || [],
          procedures: procedures || [],
          lastExamDate: exams?.[0]?.exam_date,
          totalProcedures: procedures?.length || 0,
          riskLevel: exams?.[0]?.overall_risk || 'unknown',
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get dental history';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Schedule appointment
  const scheduleAppointment = useCallback(
    async (appointmentData: Partial<DentalAppointment>): Promise<DentalAppointment | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('dental_appointments')
          .insert({
            ...appointmentData,
            status: 'scheduled',
          })
          .select()
          .single();

        if (err) throw err;

        return data as DentalAppointment;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to schedule appointment';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get upcoming appointments for dentist
  const getUpcomingAppointments = useCallback(
    async (dentistId: string): Promise<DentalAppointment[]> => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];

        const { data, error: err } = await supabase
          .from('dental_appointments')
          .select('*')
          .eq('dentist_id', dentistId)
          .gte('appointment_date', today)
          .in('status', ['scheduled', 'confirmed'])
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (err) throw err;

        return (data || []) as DentalAppointment[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get appointments';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Calculate dental risk score
  const calculateDentalRisk = useCallback((exam: Partial<DentalExamination>): string => {
    let riskScore = 0;

    if (exam.plaque_index && exam.plaque_index > 1) riskScore += 2;
    if (exam.bleeding_index && exam.bleeding_index > 1) riskScore += 2;

    const cavitiesCount = Object.values(exam.tooth_map || {}).filter(
      (t) => t.status === 'cavity'
    ).length;
    riskScore += cavitiesCount;

    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'moderate';
    return 'low';
  }, []);

  return {
    loading,
    error,
    recordDentalExam,
    scheduleProcedure,
    getPatientDentalHistory,
    scheduleAppointment,
    getUpcomingAppointments,
    calculateDentalRisk,
  };
};

