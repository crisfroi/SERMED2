// ============================================================================
// useNutritionPlanning Hook - Personalized Nutrition Plan Management
// Create, manage, and track personalized nutrition plans for children
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@hosix/hooks/shared/useAuth';

interface NutritionPlan {
  id: string;
  child_id: string;
  created_date: string;
  start_date: string;
  end_date?: string;
  nutritional_status_at_creation: string;
  objetivos: string[];
  recomendaciones_alimentarias: string[];
  restricciones?: string[];
  suplementos?: SuplementoRecomendado[];
  frecuencia_seguimiento: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  created_by?: string;
  status: 'active' | 'completed' | 'on_hold';
}

interface SuplementoRecomendado {
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracion_semanas: number;
  razon: string;
}

interface PlanFollowUp {
  id: string;
  plan_id: string;
  followup_date: string;
  weight_kg?: number;
  height_cm?: number;
  compliance_level: number; // 0-100 percentage
  observations?: string;
  adjustments_made?: string[];
  next_followup_date?: string;
}

export const useNutritionPlanning = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [followups, setFollowups] = useState<PlanFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async (childId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('child_id', childId)
        .order('created_date', { ascending: false });

      if (queryError) throw queryError;

      setPlans(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching nutrition plans');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFollowups = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('nutrition_plan_followups')
        .select('*')
        .eq('plan_id', planId)
        .order('followup_date', { ascending: false });

      if (queryError) throw queryError;

      setFollowups(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching follow-ups');
    } finally {
      setLoading(false);
    }
  }, []);

  const createNutritionPlan = useCallback(async (
    childId: string,
    nutritionalStatus: string,
    objetivos: string[],
    recomendaciones: string[],
    suplementos?: SuplementoRecomendado[],
    restricciones?: string[],
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' = 'monthly'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('nutrition_plans')
        .insert([
          {
            child_id: childId,
            created_date: new Date().toISOString(),
            start_date: new Date().toISOString(),
            nutritional_status_at_creation: nutritionalStatus,
            objetivos,
            recomendaciones_alimentarias: recomendaciones,
            restricciones,
            suplementos,
            frecuencia_seguimiento: frequency,
            created_by: user?.id,
            status: 'active',
          },
        ])
        .select();

      if (insertError) throw insertError;

      await fetchPlans(childId);
      return data?.[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating nutrition plan');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchPlans]);

  const recordFollowUp = useCallback(async (
    planId: string,
    weightKg?: number,
    heightCm?: number,
    complianceLevel: number = 100,
    observations?: string,
    adjustments?: string[],
    nextFollowupDate?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('nutrition_plan_followups')
        .insert([
          {
            plan_id: planId,
            followup_date: new Date().toISOString(),
            weight_kg: weightKg,
            height_cm: heightCm,
            compliance_level: complianceLevel,
            observations,
            adjustments_made: adjustments,
            next_followup_date: nextFollowupDate,
          },
        ])
        .select();

      if (insertError) throw insertError;

      await fetchFollowups(planId);
      return data?.[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error recording follow-up');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFollowups]);

  const completePlan = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('nutrition_plans')
        .update({ status: 'completed', end_date: new Date().toISOString() })
        .eq('id', planId);

      if (updateError) throw updateError;

      const { data } = await supabase.from('nutrition_plans').select('child_id').eq('id', planId).single();
      if (data?.child_id) {
        await fetchPlans(data.child_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error completing plan');
    } finally {
      setLoading(false);
    }
  }, [fetchPlans]);

  return {
    plans,
    followups,
    loading,
    error,
    fetchPlans,
    fetchFollowups,
    createNutritionPlan,
    recordFollowUp,
    completePlan,
  };
};
