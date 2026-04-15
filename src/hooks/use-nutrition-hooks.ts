// @ts-nocheck
// src/hooks/use-nutrition-hooks.ts
import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export interface NutritionAssessmentData {
  assessment_id: string;
  patient_id: string;
  assessment_date: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  dietary_restrictions: string;
  special_needs: string;
  nutritional_risk_level: 'low' | 'moderate' | 'high' | 'critical';
}

export interface MealPlan {
  plan_id: string;
  patient_id: string;
  start_date: string;
  end_date: string;
  plan_type: string;
  caloric_goal: number;
  protein_target: number;
  carbs_target: number;
  fats_target: number;
}

export interface MealEntry {
  entry_id: string;
  patient_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: string;
  portion_size: string;
  calories: number;
  adherence_percentage: number;
}

// Hook 1: useNutritionAssessment
export const useNutritionAssessment = (patientId: string) => {
  const [assessmentData, setAssessmentData] = useState<Partial<NutritionAssessmentData>>({});
  const [error, setError] = useState<string | null>(null);

  const assessmentQuery = useQuery({
    queryKey: ['nutrition-assessment', patientId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/nutrition-assessments/${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch assessment');
        const data = await response.json() as NutritionAssessmentData;
        setAssessmentData(data);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }
  });

  const createAssessment = useCallback(async (data: Partial<NutritionAssessmentData>) => {
    try {
      const response = await fetch('/api/nutrition-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, patient_id: patientId })
      });
      if (!response.ok) throw new Error('Failed to create assessment');
      const newAssessment = await response.json() as NutritionAssessmentData;
      setAssessmentData(newAssessment);
      return newAssessment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [patientId]);

  const calculateBMI = useCallback((weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }, []);

  const assessNutritionalRisk = useCallback((
    bmi: number,
    weightChange: number,
    albumin: number
  ): 'low' | 'moderate' | 'high' | 'critical' => {
    if (bmi < 18.5 || weightChange > 10 || albumin < 2.5) return 'critical';
    if (bmi < 20 || weightChange > 5 || albumin < 3) return 'high';
    if (bmi < 22 || weightChange > 2) return 'moderate';
    return 'low';
  }, []);

  return {
    assessment: assessmentData,
    loading: assessmentQuery.isLoading,
    error,
    createAssessment,
    calculateBMI,
    assessNutritionalRisk,
    refetch: assessmentQuery.refetch
  };
};

// Hook 2: useMealPlanning
export const useMealPlanning = (patientId: string) => {
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planQuery = useQuery({
    queryKey: ['meal-plans', patientId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/meal-plans/${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch meal plans');
        const data = await response.json() as MealPlan[];
        const active = data.find(p => {
          const now = new Date();
          return new Date(p.start_date) <= now && new Date(p.end_date) >= now;
        });
        if (active) setActivePlan(active);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }
  });

  const createMealPlan = useCallback(async (data: Partial<MealPlan>) => {
    try {
      const response = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, patient_id: patientId })
      });
      if (!response.ok) throw new Error('Failed to create meal plan');
      const newPlan = await response.json() as MealPlan;
      setActivePlan(newPlan);
      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [patientId]);

  const updateMealPlan = useCallback(async (planId: string, updates: Partial<MealPlan>) => {
    try {
      const response = await fetch(`/api/meal-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update meal plan');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const calculateMacroDistribution = useCallback((calories: number) => {
    return {
      protein_g: Math.round((calories * 0.30) / 4), // 30% of calories
      carbs_g: Math.round((calories * 0.45) / 4),    // 45% of calories
      fats_g: Math.round((calories * 0.25) / 9)      // 25% of calories
    };
  }, []);

  return {
    plans: planQuery.data || [],
    activePlan,
    loading: planQuery.isLoading,
    error,
    createMealPlan,
    updateMealPlan,
    calculateMacroDistribution,
    refetch: planQuery.refetch
  };
};

// Hook 3: useNutritionCompliance
export const useNutritionCompliance = (patientId: string) => {
  const [complianceMetrics, setComplianceMetrics] = useState({
    overall_adherence: 0,
    target_days_met: 0,
    total_days: 0,
    weight_change: 0,
    goal_on_track: false
  });

  const complianceQuery = useQuery({
    queryKey: ['nutrition-compliance', patientId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/nutrition-compliance/${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch compliance data');
        const data = await response.json();
        setComplianceMetrics(data);
        return data;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    refetchInterval: 60 * 60 * 1000 // 1 hour
  });

  const trackAdherence = useCallback(async (dayData: {
    date: string;
    calories_actual: number;
    calories_target: number;
    adherence_percentage: number;
  }) => {
    try {
      const response = await fetch(`/api/nutrition-compliance/${patientId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dayData)
      });
      if (!response.ok) throw new Error('Failed to track adherence');
      return response.json();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [patientId]);

  const calculateTrend = useCallback((historicalData: Array<{ adherence: number; date: string }>) => {
    if (historicalData.length < 2) return 'stable';
    
    const recentAdherence = historicalData.slice(-7).map(d => d.adherence);
    const avgRecent = recentAdherence.reduce((a, b) => a + b, 0) / recentAdherence.length;
    const avgPrevious = historicalData.slice(-14, -7).reduce((a, b) => a + b.adherence, 0) / 7;
    
    if (avgRecent > avgPrevious + 2) return 'improving';
    if (avgRecent < avgPrevious - 2) return 'declining';
    return 'stable';
  }, []);

  const generateRecommendations = useCallback(async () => {
    try {
      const response = await fetch(`/api/nutrition-compliance/${patientId}/recommendations`);
      if (!response.ok) throw new Error('Failed to generate recommendations');
      return response.json();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [patientId]);

  return {
    metrics: complianceMetrics,
    loading: complianceQuery.isLoading,
    trackAdherence,
    calculateTrend,
    generateRecommendations,
    refetch: complianceQuery.refetch
  };
};

// Hook 4: useNutritionDataFetch
export const useNutritionDataFetch = () => {
  const foodGroupsQuery = useQuery({
    queryKey: ['food-groups'],
    queryFn: async () => {
      const response = await fetch('/api/food-groups');
      if (!response.ok) throw new Error('Failed to fetch food groups');
      return response.json();
    },
    staleTime: 24 * 60 * 60 * 1000
  });

  const supplementsQuery = useQuery({
    queryKey: ['supplements'],
    queryFn: async () => {
      const response = await fetch('/api/supplements');
      if (!response.ok) throw new Error('Failed to fetch supplements');
      return response.json();
    },
    staleTime: 24 * 60 * 60 * 1000
  });

  const dietTypesQuery = useQuery({
    queryKey: ['diet-types'],
    queryFn: async () => {
      const response = await fetch('/api/diet-types');
      if (!response.ok) throw new Error('Failed to fetch diet types');
      return response.json();
    },
    staleTime: 24 * 60 * 60 * 1000
  });

  return {
    foodGroups: foodGroupsQuery.data || [],
    supplements: supplementsQuery.data || [],
    dietTypes: dietTypesQuery.data || [],
    loading: foodGroupsQuery.isLoading || supplementsQuery.isLoading || dietTypesQuery.isLoading,
    error: foodGroupsQuery.error || supplementsQuery.error || dietTypesQuery.error
  };
};
