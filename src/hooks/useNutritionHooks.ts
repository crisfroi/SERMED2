// @ts-nocheck
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================
interface NutritionAssessment {
  id: string;
  patient_id: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  muscle_mass_percentage: number;
  fat_percentage: number;
  hemoglobin_g_dl: number | null;
  albumin_g_dl: number | null;
  nutritional_status: 'normal' | 'underweight' | 'overweight' | 'obese' | 'malnourished';
  risk_factors: string[];
  clinical_notes: string;
  created_at: string;
  updated_at: string;
}

interface CreateAssessmentInput {
  patient_id: string;
  weight_kg: number;
  height_cm: number;
  muscle_mass_percentage: number;
  fat_percentage: number;
  hemoglobin_g_dl?: number;
  albumin_g_dl?: number;
  nutritional_status: string;
  risk_factors: string[];
  clinical_notes: string;
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================================
// HOOK: useNutritionAssessment
// ============================================================================
export const useNutritionAssessment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = useCallback(
    async (assessmentId: string): Promise<ApiResponse<NutritionAssessment>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('patient_nutrition_assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching assessment';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchPatientAssessments = useCallback(
    async (patientId: string, limit = 10): Promise<ApiResponse<NutritionAssessment[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('patient_nutrition_assessments')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching assessments';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createAssessment = useCallback(
    async (input: CreateAssessmentInput): Promise<ApiResponse<NutritionAssessment>> => {
      try {
        setIsLoading(true);
        setError(null);

        // Calculate BMI: weight(kg) / (height(m))^2
        const heightInMeters = input.height_cm / 100;
        const bmi = input.weight_kg / (heightInMeters * heightInMeters);

        const { data, error: dbError } = await supabase
          .from('patient_nutrition_assessments')
          .insert([
            {
              patient_id: input.patient_id,
              weight_kg: input.weight_kg,
              height_cm: input.height_cm,
              bmi: Math.round(bmi * 10) / 10,
              muscle_mass_percentage: input.muscle_mass_percentage,
              fat_percentage: input.fat_percentage,
              hemoglobin_g_dl: input.hemoglobin_g_dl || null,
              albumin_g_dl: input.albumin_g_dl || null,
              nutritional_status: input.nutritional_status,
              risk_factors: input.risk_factors,
              clinical_notes: input.clinical_notes,
            },
          ])
          .select()
          .single();

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error creating assessment';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateAssessment = useCallback(
    async (assessmentId: string, input: Partial<CreateAssessmentInput>): Promise<ApiResponse<NutritionAssessment>> => {
      try {
        setIsLoading(true);
        setError(null);

        let updateData: any = { ...input };

        // Recalculate BMI if weight or height changed
        if (input.weight_kg && input.height_cm) {
          const heightInMeters = input.height_cm / 100;
          updateData.bmi = Math.round((input.weight_kg / (heightInMeters * heightInMeters)) * 10) / 10;
        }

        const { data, error: dbError } = await supabase
          .from('patient_nutrition_assessments')
          .update(updateData)
          .eq('id', assessmentId)
          .select()
          .single();

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error updating assessment';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    fetchAssessment,
    fetchPatientAssessments,
    createAssessment,
    updateAssessment,
    isLoading,
    error,
  };
};

// ============================================================================
// HOOK: useNutritionTracking
// ============================================================================
interface WeightHistory {
  date: string;
  weight_kg: number;
  bmi: number;
}

export const useNutritionTracking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeightHistory = useCallback(
    async (patientId: string, days = 90): Promise<ApiResponse<WeightHistory[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error: dbError } = await supabase
          .from('patient_nutrition_assessments')
          .select('created_at, weight_kg, bmi')
          .eq('patient_id', patientId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (dbError) throw dbError;

        const history = data?.map(item => ({
          date: new Date(item.created_at).toLocaleDateString(),
          weight_kg: item.weight_kg,
          bmi: item.bmi,
        })) || [];

        return { success: true, data: history };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching weight history';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const calculateTrend = useCallback(
    (history: WeightHistory[]): 'improving' | 'declining' | 'stable' => {
      if (history.length < 2) return 'stable';

      const first = history[0].weight_kg;
      const last = history[history.length - 1].weight_kg;
      const diff = Math.abs(last - first);

      if (diff < 0.5) return 'stable';
      return last < first ? 'improving' : 'declining';
    },
    []
  );

  return {
    fetchWeightHistory,
    calculateTrend,
    isLoading,
    error,
  };
};

// ============================================================================
// HOOK: useNutritionPlanning
// ============================================================================
interface NutritionPlan {
  id: string;
  patient_id: string;
  daily_calorie_target: number;
  protein_percentage: number;
  carbs_percentage: number;
  fats_percentage: number;
  therapeutic_diet_type: string;
  meal_frequency: number;
  supplements: any[];
  objectives: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export const useNutritionPlanning = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientPlans = useCallback(
    async (patientId: string): Promise<ApiResponse<NutritionPlan[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('nutrition_plans')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching plans';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createPlan = useCallback(
    async (planData: Partial<NutritionPlan>): Promise<ApiResponse<NutritionPlan>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('nutrition_plans')
          .insert([planData])
          .select()
          .single();

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error creating plan';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    fetchPatientPlans,
    createPlan,
    isLoading,
    error,
  };
};
