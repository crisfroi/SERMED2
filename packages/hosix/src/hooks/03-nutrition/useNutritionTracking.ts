// ============================================================================
// useNutritionTracking Hook - Nutrition Monitoring and Follow-up
// Track nutrition status, feeding, and nutritional assessments
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface NutritionAssessment {
  id: string;
  child_id: string;
  visit_date: string;
  age_months: number;
  weight_kg: number;
  height_cm: number;
  head_circumference_cm?: number;
  nutritional_status: 'normal' | 'wasting' | 'stunting' | 'underweight' | 'overweight' | 'obese';
  bmi?: number;
  notes?: string;
  assessed_by?: string;
}

interface FeedingData {
  id: string;
  child_id: string;
  assessment_date: string;
  feeding_method: 'breastfeeding' | 'formula' | 'mixed' | 'solid_foods';
  frequency_per_day: number;
  duration_minutes?: number;
  milk_type?: string;
  complementary_foods?: string[];
  issues?: string[];
}

interface NutritionTrend {
  period: string;
  average_weight: number;
  average_height: number;
  status_progression: string[];
  recommendations: string[];
}

export const useNutritionTracking = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<NutritionAssessment[]>([]);
  const [feedingData, setFeedingData] = useState<FeedingData[]>([]);
  const [trends, setTrends] = useState<NutritionTrend | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateBMI = (weightKg: number, heightCm: number): number => {
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
  };

  const determineNutritionalStatus = (weightKg: number, heightCm: number, ageMonths: number): string => {
    const bmi = calculateBMI(weightKg, heightCm);
    
    // Simplified WHO growth standards based on age
    if (ageMonths < 60) {
      if (bmi < 14.5) return 'wasting';
      if (bmi > 17.5) return 'overweight';
      return 'normal';
    } else {
      if (bmi < 14.5) return 'underweight';
      if (bmi < 18.5) return 'normal';
      if (bmi < 25) return 'overweight';
      return 'obese';
    }
  };

  const fetchAssessments = useCallback(async (childId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('nutrition_assessments')
        .select('*')
        .eq('child_id', childId)
        .order('visit_date', { ascending: false });

      if (queryError) throw queryError;

      const processedAssessments: NutritionAssessment[] = (data || []).map((assessment) => ({
        id: assessment.id,
        child_id: assessment.child_id,
        visit_date: assessment.visit_date,
        age_months: assessment.age_months,
        weight_kg: assessment.weight_kg,
        height_cm: assessment.height_cm,
        head_circumference_cm: assessment.head_circumference_cm,
        nutritional_status: assessment.nutritional_status,
        bmi: calculateBMI(assessment.weight_kg, assessment.height_cm),
        notes: assessment.notes,
        assessed_by: assessment.assessed_by,
      }));

      setAssessments(processedAssessments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching assessments');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeedingData = useCallback(async (childId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('feeding_data')
        .select('*')
        .eq('child_id', childId)
        .order('assessment_date', { ascending: false });

      if (queryError) throw queryError;

      setFeedingData(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching feeding data');
    } finally {
      setLoading(false);
    }
  }, []);

  const recordAssessment = useCallback(async (
    childId: string,
    weightKg: number,
    heightCm: number,
    headCircumference?: number,
    notes?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const nutritionalStatus = determineNutritionalStatus(weightKg, heightCm, 24);
      
      const { data, error: insertError } = await supabase
        .from('nutrition_assessments')
        .insert([
          {
            child_id: childId,
            visit_date: new Date().toISOString(),
            weight_kg: weightKg,
            height_cm: heightCm,
            head_circumference_cm: headCircumference,
            nutritional_status: nutritionalStatus,
            notes,
            assessed_by: user?.id,
          },
        ])
        .select();

      if (insertError) throw insertError;

      await fetchAssessments(childId);
      return data?.[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error recording assessment');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchAssessments]);

  const recordFeedingData = useCallback(async (
    childId: string,
    feedingMethod: 'breastfeeding' | 'formula' | 'mixed' | 'solid_foods',
    frequency: number,
    duration?: number,
    milkType?: string,
    complementaryFoods?: string[],
    issues?: string[]
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('feeding_data')
        .insert([
          {
            child_id: childId,
            assessment_date: new Date().toISOString(),
            feeding_method: feedingMethod,
            frequency_per_day: frequency,
            duration_minutes: duration,
            milk_type: milkType,
            complementary_foods: complementaryFoods,
            issues,
          },
        ])
        .select();

      if (insertError) throw insertError;

      await fetchFeedingData(childId);
      return data?.[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error recording feeding data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFeedingData]);

  return {
    assessments,
    feedingData,
    trends,
    loading,
    error,
    fetchAssessments,
    fetchFeedingData,
    recordAssessment,
    recordFeedingData,
  };
};
// ============================================================================
// useNutritionTracking Hook - Nutrition Monitoring and Follow-up
// Track nutrition status, feeding, and nutritional assessments
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface NutritionAssessment {
  id: string;
  child_id: string;
  visit_date: string;
  age_months: number;
  weight_kg: number;
  height_cm: number;
  head_circumference_cm?: number;
  nutritional_status: 'normal' | 'wasting' | 'stunting' | 'underweight' | 'overweight' | 'obese';
  bmi?: number;
  notes?: string;
  assessed_by?: string;
}

interface FeedingData {
  id: string;
  child_id: string;
  assessment_date: string;
  feeding_method: 'breastfeeding' | 'formula' | 'mixed' | 'solid_foods';
  frequency_per_day: number;
  duration_minutes?: number;
  milk_type?: string;
  complementary_foods?: string[];
  issues?: string[];
}

interface NutritionTrend {
  period: string;
  average_weight: number;
  average_height: number;
  status_progression: string[];
  recommendations: string[];
}

export const useNutritionTracking = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<NutritionAssessment[]>([]);
  const [feedingData, setFeedingData] = useState<FeedingData[]>([]);
  const [trends, setTrends] = useState<NutritionTrend | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateBMI = (weightKg: number, heightCm: number): number => {
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
  };

  const determineNutritionalStatus = (weightKg: number, heightCm: number, ageMonths: number): string => {
    const bmi = calculateBMI(weightKg, heightCm);
    
    // Simplified WHO growth standards based on age
    if (ageMonths < 60) {
      if (bmi < 14.5) return 'wasting';
      if (bmi > 17.5) return 'overweight';
      return 'normal';
    } else {
      if (bmi < 14.5) return 'underweight';
      if (bmi < 18.5) return 'normal';
      if (bmi < 25) return 'overweight';
      return 'obese';
    }
  };

  const fetchAssessments = useCallback(async (childId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('nutrition_assessments')
        .select('*')
        .eq('child_id', childId)
        .order('visit_date', { ascending: false });

      if (queryError) throw queryError;

      const processedAssessments: NutritionAssessment[] = (data || []).map((assessment) => ({
        id: assessment.id,
        child_id: assessment.child_id,
        visit_date: assessment.visit_date,
        age_months: assessment.age_months,
        weight_kg: assessment.weight_kg,
        height_cm: assessment.height_cm,
        head_circumference_cm: assessment.head_circumference_cm,
        nutritional_status: assessment.nutritional_status,
        bmi: calculateBMI(assessment.weight_kg, assessment.height_cm),
        notes: assessment.notes,
        assessed_by: assessment.assessed_by,
      }));

      setAssessments(processedAssessments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching assessments');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeedingData = useCallback(async (childId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('feeding_data')
        .select('*')
        .eq('child_id', childId)
        .order('assessment_date', { ascending: false });

      if (queryError) throw queryError;

      setFeedingData(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching feeding data');
    } finally {
      setLoading(false);
    }
  }, []);

  const recordAssessment = useCallback(async (
    childId: string,
    weightKg: number,
    heightCm: number,
    headCircumference?: number,
    notes?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const nutritionalStatus = determineNutritionalStatus(weightKg, heightCm, 24); // Assume average age for now
      
      const { data, error: insertError } = await supabase
        .from('nutrition_assessments')
        .insert([
          {
            child_id: childId,
            visit_date: new Date().toISOString(),
            weight_kg: weightKg,
            height_cm: heightCm,
            head_circumference_cm: headCircumference,
            nutritional_status: nutritionalStatus,
            notes,
            assessed_by: user?.id,
          },
        ])
        .select();

      if (insertError) throw insertError;

      await fetchAssessments(childId);
      return data?.[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error recording assessment');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchAssessments]);

  const recordFeedingData = useCallback(async (
    childId: string,
    feedingMethod: 'breastfeeding' | 'formula' | 'mixed' | 'solid_foods',
    frequency: number,
    duration?: number,
    milkType?: string,
    complementaryFoods?: string[],
    issues?: string[]
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('feeding_data')
        .insert([
          {
            child_id: childId,
            assessment_date: new Date().toISOString(),
            feeding_method: feedingMethod,
            frequency_per_day: frequency,
            duration_minutes: duration,
            milk_type: milkType,
            complementary_foods: complementaryFoods,
            issues,
          },
        ])
        .select();

      if (insertError) throw insertError;

      await fetchFeedingData(childId);
      return data?.[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error recording feeding data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFeedingData]);

  return {
    assessments,
    feedingData,
    trends,
    loading,
    error,
    fetchAssessments,
    fetchFeedingData,
    recordAssessment,
    recordFeedingData,
  };
};


