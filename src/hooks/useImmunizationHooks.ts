// @ts-nocheck
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================
interface VaccinationRecord {
  id: string;
  patient_id: string;
  vaccine_id: string;
  vaccine_name: string;
  dose_number: number;
  vaccination_date: string;
  lot_number: string;
  injection_site: string;
  route: string;
  immediate_reaction: boolean;
  reaction_description: string | null;
  clinical_notes: string;
  created_at: string;
}

interface VaccineSchedule {
  id: string;
  vaccine_id: string;
  vaccine_name: string;
  dose_number: number;
  recommended_age_months: number;
  status: 'completed' | 'pending' | 'overdue' | 'contraindicated';
  last_vaccination_date: string | null;
  next_due_date: string | null;
}

interface VaccinationGap {
  id: string;
  vaccine_id: string;
  vaccine_name: string;
  dose_number: number;
  expected_age_months: number;
  actual_age_months: number;
  age_gap_months: number;
  reason_for_gap: string;
  epidemiological_risk: 'low' | 'medium' | 'high';
  catch_up_priority: 'routine' | 'high_priority' | 'urgent';
  resolved: boolean;
  recommended_catch_up_date: string;
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================================
// HOOK: useImmunizationRecord
// ============================================================================
export const useImmunizationRecord = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVaccinationRecord = useCallback(
    async (input: Omit<VaccinationRecord, 'id' | 'created_at'>): Promise<ApiResponse<VaccinationRecord>> => {
      try {
        setIsLoading(true);
        setError(null);

        // Get vaccine info
        const { data: vaccineData } = await supabase
          .from('vaccine_types')
          .select('vaccine_name')
          .eq('id', input.vaccine_id)
          .single();

        const { data, error: dbError } = await supabase
          .from('patient_vaccinations')
          .insert([
            {
              ...input,
              vaccine_name: vaccineData?.vaccine_name || 'Unknown',
            },
          ])
          .select()
          .single();

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error creating vaccination record';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchPatientVaccinations = useCallback(
    async (patientId: string): Promise<ApiResponse<VaccinationRecord[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('patient_vaccinations')
          .select('*')
          .eq('patient_id', patientId)
          .order('vaccination_date', { ascending: false });

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching vaccinations';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    createVaccinationRecord,
    fetchPatientVaccinations,
    isLoading,
    error,
  };
};

// ============================================================================
// HOOK: useVaccineSchedule
// ============================================================================
export const useVaccineSchedule = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(
    async (patientId: string, ageMonths: number): Promise<ApiResponse<VaccineSchedule[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch schedule template
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('vaccine_schedules')
          .select('*, vaccine_types(vaccine_name)')
          .lte('recommended_age_months', ageMonths + 3)
          .order('recommended_age_months', { ascending: true });

        if (scheduleError) throw scheduleError;

        // Fetch patient vaccinations
        const { data: patientVaccinations } = await supabase
          .from('patient_vaccinations')
          .select('vaccine_id, dose_number, vaccination_date')
          .eq('patient_id', patientId);

        // Map schedules with completion status
        const enrichedSchedule = scheduleData?.map(schedule => {
          const vaccination = patientVaccinations?.find(
            v => v.vaccine_id === schedule.vaccine_id && v.dose_number === schedule.dose_number
          );

          const diffMonths = ageMonths - schedule.recommended_age_months;
          let status = 'pending';
          if (vaccination) {
            status = 'completed';
          } else if (diffMonths > 1) {
            status = 'overdue';
          }

          return {
            id: schedule.id,
            vaccine_id: schedule.vaccine_id,
            vaccine_name: schedule.vaccine_types?.vaccine_name || 'Unknown',
            dose_number: schedule.dose_number,
            recommended_age_months: schedule.recommended_age_months,
            status,
            last_vaccination_date: vaccination?.vaccination_date || null,
            next_due_date: null,
          };
        }) || [];

        return { success: true, data: enrichedSchedule };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching schedule';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const calculateCompletionPercentage = useCallback((schedule: VaccineSchedule[]) => {
    const completed = schedule.filter(s => s.status === 'completed').length;
    return Math.round((completed / schedule.length) * 100);
  }, []);

  return {
    fetchSchedule,
    calculateCompletionPercentage,
    isLoading,
    error,
  };
};

// ============================================================================
// HOOK: useImmunizationGaps
// ============================================================================
export const useImmunizationGaps = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImmunizationGaps = useCallback(
    async (patientId: string): Promise<ApiResponse<VaccinationGap[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('patient_immunization_gaps')
          .select('*')
          .eq('patient_id', patientId)
          .order('catch_up_priority', { ascending: true });

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching gaps';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const scheduleRescue = useCallback(
    async (gapId: string): Promise<ApiResponse<void>> => {
      try {
        setIsLoading(true);
        setError(null);

        // Update gap as resolved
        const { error: dbError } = await supabase
          .from('patient_immunization_gaps')
          .update({ resolved: true })
          .eq('id', gapId);

        if (dbError) throw dbError;

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error scheduling rescue';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    fetchImmunizationGaps,
    scheduleRescue,
    isLoading,
    error,
  };
};

// ============================================================================
// HOOK: useVaccineLotTracking
// ============================================================================
interface VaccineLot {
  id: string;
  vaccine_id: string;
  lot_number: string;
  manufacture_date: string;
  expiration_date: string;
  quantity_received: number;
  quantity_used: number;
  quantity_available: number;
  storage_temperature: number;
  cold_chain_maintained: boolean;
}

export const useVaccineLotTracking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLots = useCallback(
    async (vaccineId?: string): Promise<ApiResponse<VaccineLot[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase.from('vaccine_lots').select('*');

        if (vaccineId) {
          query = query.eq('vaccine_id', vaccineId);
        }

        const { data, error: dbError } = await query.order('expiration_date', { ascending: true });

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching lots';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateLotUsage = useCallback(
    async (lotId: string, unitsUsed: number): Promise<ApiResponse<VaccineLot>> => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current lot
        const { data: currentLot } = await supabase
          .from('vaccine_lots')
          .select('quantity_used, quantity_available')
          .eq('id', lotId)
          .single();

        const newUsed = (currentLot?.quantity_used || 0) + unitsUsed;
        const newAvailable = (currentLot?.quantity_available || 0) - unitsUsed;

        const { data, error: dbError } = await supabase
          .from('vaccine_lots')
          .update({
            quantity_used: newUsed,
            quantity_available: newAvailable,
          })
          .eq('id', lotId)
          .select()
          .single();

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error updating lot usage';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    fetchLots,
    updateLotUsage,
    isLoading,
    error,
  };
};
