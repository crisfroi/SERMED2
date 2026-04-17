// ============================================================================
// useDiagnosisHistory.ts - Diagnosis Timeline & History Management Hook
// ASIS 14.0 - Diagnóstico Unificado - Hito 3
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface DiagnosisItem {
  id: string;
  icdCode: string;
  diagnosisName: string;
  onsetDate: string;
  resolutionDate?: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'suspected';
  clinicalContext: string;
  notes?: string;
}

export const useDiagnosisHistory = (patientId: string) => {
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Fetch all diagnoses for patient
  const fetchDiagnoses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('patient_id', patientId)
        .order('onset_date', { ascending: false });

      if (err) throw err;

      const formatted: DiagnosisItem[] = (data || []).map((d: any) => ({
        id: d.id,
        icdCode: d.icd10_code,
        diagnosisName: d.diagnosis_description,
        onsetDate: d.onset_date,
        resolutionDate: d.resolution_date,
        severity: d.severity,
        status: d.status,
        clinicalContext: d.clinical_context,
        notes: d.notes,
      }));

      setDiagnoses(formatted);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching diagnoses:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, supabase]);

  useEffect(() => {
    fetchDiagnoses();
  }, [fetchDiagnoses]);

  // Delete diagnosis
  const deleteDiagnosis = useCallback(
    async (diagnosisId: string): Promise<boolean> => {
      try {
        const { error: err } = await supabase
          .from('diagnoses')
          .delete()
          .eq('id', diagnosisId);

        if (err) throw err;
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting diagnosis:', err);
        return false;
      }
    },
    [supabase]
  );

  // Update diagnosis (mark as resolved, etc.)
  const updateDiagnosis = useCallback(
    async (diagnosisId: string, updates: Partial<any>): Promise<boolean> => {
      try {
        const { error: err } = await supabase
          .from('diagnoses')
          .update(updates)
          .eq('id', diagnosisId);

        if (err) throw err;
        await fetchDiagnoses(); // Refresh
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error('Error updating diagnosis:', err);
        return false;
      }
    },
    [supabase, fetchDiagnoses]
  );

  // Mark diagnosis as resolved
  const resolveDiagnosis = useCallback(
    async (diagnosisId: string, resolutionDate: string): Promise<boolean> => {
      return updateDiagnosis(diagnosisId, {
        status: 'resolved',
        resolution_date: resolutionDate,
      });
    },
    [updateDiagnosis]
  );

  // Get active diagnoses
  const getActiveDiagnoses = useCallback((): DiagnosisItem[] => {
    return diagnoses.filter((d) => d.status === 'active');
  }, [diagnoses]);

  // Get resolved diagnoses
  const getResolvedDiagnoses = useCallback((): DiagnosisItem[] => {
    return diagnoses.filter((d) => d.status === 'resolved');
  }, [diagnoses]);

  // Get diagnosis by period
  const getDiagnosesByPeriod = useCallback(
    (days: number): DiagnosisItem[] => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return diagnoses.filter(
        (d) => new Date(d.onsetDate) >= cutoffDate
      );
    },
    [diagnoses]
  );

  // Export history to various formats
  const exportHistory = useCallback(
    (diagnosisItems?: DiagnosisItem[]) => {
      const dataToExport = diagnosisItems || diagnoses;

      return {
        patientId,
        exportDate: new Date().toISOString(),
        totalDiagnoses: dataToExport.length,
        activeDiagnoses: dataToExport.filter((d) => d.status === 'active').length,
        resolvedDiagnoses: dataToExport.filter((d) => d.status === 'resolved').length,
        diagnoses: dataToExport.map((d) => ({
          icdCode: d.icdCode,
          diagnosisName: d.diagnosisName,
          onset: d.onsetDate,
          resolution: d.resolutionDate,
          severity: d.severity,
          status: d.status,
          duration: d.resolutionDate
            ? Math.floor(
                (new Date(d.resolutionDate).getTime() -
                  new Date(d.onsetDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
          context: d.clinicalContext,
        })),
      };
    },
    [patientId, diagnoses]
  );

  // Get diagnosis statistics
  const getStatistics = useCallback(() => {
    return {
      total: diagnoses.length,
      active: diagnoses.filter((d) => d.status === 'active').length,
      resolved: diagnoses.filter((d) => d.status === 'resolved').length,
      suspected: diagnoses.filter((d) => d.status === 'suspected').length,
      severe: diagnoses.filter((d) => d.severity === 'severe').length,
      moderate: diagnoses.filter((d) => d.severity === 'moderate').length,
      mild: diagnoses.filter((d) => d.severity === 'mild').length,
      averageDurationDays: Math.floor(
        diagnoses
          .filter((d) => d.resolutionDate)
          .reduce(
            (sum, d) =>
              sum +
              (new Date(d.resolutionDate!).getTime() -
                new Date(d.onsetDate).getTime()) /
                (1000 * 60 * 60 * 24),
            0
          ) / Math.max(1, diagnoses.filter((d) => d.resolutionDate).length)
      ),
    };
  }, [diagnoses]);

  // Get common diagnosis combinations (comorbidities)
  const getCommonCombinations = useCallback((): Array<{
    combination: string;
    count: number;
    percentage: number;
  }> => {
    const combinations: { [key: string]: number } = {};

    diagnoses.forEach((d) => {
      const activeDates = diagnoses
        .filter(
          (other) =>
            other.id !== d.id &&
            new Date(other.onsetDate) <= new Date(d.onsetDate) &&
            (!other.resolutionDate || new Date(other.resolutionDate) >= new Date(d.onsetDate))
        )
        .map((other) => other.diagnosisName)
        .sort();

      if (activeDates.length > 0) {
        const key = [d.diagnosisName, ...activeDates].sort().join(' + ');
        combinations[key] = (combinations[key] || 0) + 1;
      }
    });

    return Object.entries(combinations)
      .map(([combination, count]) => ({
        combination,
        count,
        percentage: (count / diagnoses.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [diagnoses]);

  return {
    diagnoses,
    loading,
    error,
    deleteDiagnosis,
    updateDiagnosis,
    resolveDiagnosis,
    getActiveDiagnoses,
    getResolvedDiagnoses,
    getDiagnosesByPeriod,
    exportHistory,
    getStatistics,
    getCommonCombinations,
    refetchHistory: fetchDiagnoses,
  };
};
