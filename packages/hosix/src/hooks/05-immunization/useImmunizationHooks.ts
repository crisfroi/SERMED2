// Immunization - copy from src
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

export const useImmunizationHooks = () => {
  return { success: true };
};

export const useVaccineSchedule = () => {
  return { success: true };
};

export const useImmunizationRecord = () => {
  return { success: true };
};

export const useImmunizationGaps = () => {
  return { success: true };
};
