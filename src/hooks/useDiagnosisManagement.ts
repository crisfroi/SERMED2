import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';
import { useDiagnosisForm } from './useDiagnosisForm';
import { useDiagnosisHistory } from './useDiagnosisHistory';

export const useDiagnosisManagement = (patientId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const diagnosisForm = useDiagnosisForm(patientId);
  const diagnosisHistory = useDiagnosisHistory(patientId);

  // Fetch all diagnoses for the patient
  const fetchDiagnoses = useCallback(
    async (statusFilter?: string) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('diagnoses')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error: err } = await query;

        if (err) throw err;

        return (data || []).map((d) => ({
          id: d.id,
          icd10Code: d.icd10_code || '',
          description: d.description || '',
          severity: d.severity || 'mild',
          status: d.status || 'active',
          diagnosisDate: d.diagnosis_date || new Date().toISOString(),
          notes: d.notes || '',
          provider: d.provider_id || '',
        }));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch diagnoses';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [patientId]
  );

  // Delete a diagnosis
  const deleteDiagnosis = useCallback(
    async (diagnosisId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('diagnoses')
          .delete()
          .eq('id', diagnosisId)
          .eq('patient_id', patientId);

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'diagnosis',
          entity_id: diagnosisId,
          action: 'delete',
          changed_by: 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Diagnosis record deleted for patient ${patientId}`,
          severity: 'medium',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete diagnosis';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [patientId]
  );

  // Update diagnosis status
  const updateDiagnosisStatus = useCallback(
    async (diagnosisId: string, status: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('diagnoses')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', diagnosisId)
          .eq('patient_id', patientId);

        if (err) throw err;

        // Log audit
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'diagnosis',
          entity_id: diagnosisId,
          action: 'update',
          changed_by: 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Diagnosis status updated to ${status}`,
          severity: 'low',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update diagnosis';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [patientId]
  );

  return {
    fetchDiagnoses,
    deleteDiagnosis,
    updateDiagnosisStatus,
    createDiagnosis: diagnosisForm.createDiagnosis,
    searchDiagnosis: diagnosisForm.searchDiagnosis,
    getDiagnosisDetails: diagnosisForm.getDiagnosisDetails,
    loading,
    error,
  };
};

