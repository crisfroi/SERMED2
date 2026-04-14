import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Pregnancy {
  id: string;
  patient_id: string;
  lmp_date: string;
  gestational_age_weeks: number;
  edd: string;
  status: 'active' | 'delivered' | 'terminated' | 'lost';
  risk_level: number;
  complications: string[];
  notes: string;
}

interface ObstetricPatientData {
  pregnancy: Pregnancy | null;
  patient: {
    id: string;
    full_name: string;
    date_of_birth: string;
    age: number;
  } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching and managing obstetric patient data
 * Includes pregnancy info, patient demographics, and recent deliveries
 */
export const useObstetricPatient = (pregnancyId: string): ObstetricPatientData & {
  updatePregnancy: (data: Partial<Pregnancy>) => Promise<void>;
  addComplication: (complication: string) => Promise<void>;
} => {
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [pregnancyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pregnancy data
      const { data: pregnancyData, error: pregnancyError } = await supabase
        .from('pregnancy')
        .select('*')
        .eq('id', pregnancyId)
        .single();

      if (pregnancyError) throw pregnancyError;
      setPregnancy(pregnancyData);

      // Fetch patient data
      if (pregnancyData.patient_id) {
        const { data: patientData, error: patientError } = await supabase
          .from('patient')
          .select('id, full_name, date_of_birth')
          .eq('id', pregnancyData.patient_id)
          .single();

        if (patientError) throw patientError;

        // Calculate age
        const birthDate = new Date(patientData.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        setPatient({
          ...patientData,
          age,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const updatePregnancy = useCallback(
    async (data: Partial<Pregnancy>) => {
      try {
        const { error: updateError } = await supabase
          .from('pregnancy')
          .update(data)
          .eq('id', pregnancyId);

        if (updateError) throw updateError;

        // Update local state
        setPregnancy((prev) => (prev ? { ...prev, ...data } : null));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error updating pregnancy');
        throw err;
      }
    },
    [pregnancyId]
  );

  const addComplication = useCallback(
    async (complication: string) => {
      try {
        if (!pregnancy) return;

        const updatedComplications = [
          ...(pregnancy.complications || []),
          complication,
        ];

        await updatePregnancy({
          complications: updatedComplications,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding complication');
        throw err;
      }
    },
    [pregnancy, updatePregnancy]
  );

  return {
    pregnancy,
    patient,
    loading,
    error,
    updatePregnancy,
    addComplication,
  };
};

export default useObstetricPatient;
