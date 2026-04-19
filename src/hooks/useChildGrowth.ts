import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';

interface GrowthControl {
  id: string;
  child_id: string;
  visit_date: string;
  age_months: number;
  weight_kg: number;
  height_cm: number;
  head_circumference_cm: number;
  who_percentile_weight: number;
  who_percentile_height: number;
  nutritional_status: 'normal' | 'wasting' | 'stunting' | 'underweight' | 'overweight';
}

interface Milestone {
  id: string;
  child_id: string;
  age_months: number;
  gross_motor_2m?: boolean;
  gross_motor_4m?: boolean;
  gross_motor_6m?: boolean;
  gross_motor_9m?: boolean;
  gross_motor_12m?: boolean;
  fine_motor_2m?: boolean;
  fine_motor_4m?: boolean;
  fine_motor_6m?: boolean;
  fine_motor_9m?: boolean;
  fine_motor_12m?: boolean;
  language_2m?: boolean;
  language_4m?: boolean;
  language_6m?: boolean;
  language_9m?: boolean;
  language_12m?: boolean;
  social_emotional_2m?: boolean;
  social_emotional_4m?: boolean;
  social_emotional_6m?: boolean;
  social_emotional_9m?: boolean;
  social_emotional_12m?: boolean;
}

interface ChildGrowthData {
  growthControls: GrowthControl[];
  currentMilestone: Milestone | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching and managing child growth and developmental milestone data
 * Calculates WHO percentiles and developmental tracking
 */
export const useChildGrowth = (childId: string): ChildGrowthData & {
  addGrowthRecord: (data: Omit<GrowthControl, 'id' | 'child_id'>) => Promise<void>;
  updateMilestone: (field: string, value: boolean) => Promise<void>;
} => {
  const [growthControls, setGrowthControls] = useState<GrowthControl[]>([]);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [childId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch growth controls
      const { data: growthData, error: growthError } = await supabase
        .from('child_growth_control')
        .select('*')
        .eq('child_id', childId)
        .order('visit_date', { ascending: true });

      if (growthError) throw growthError;
      setGrowthControls(growthData || []);

      // Fetch current milestone
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('developmental_milestone')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (milestoneError && milestoneError.code !== 'PGRST116') {
        throw milestoneError;
      }
      setCurrentMilestone(milestoneData || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const addGrowthRecord = useCallback(
    async (data: Omit<GrowthControl, 'id' | 'child_id'>) => {
      try {
        // Call WHO growth percentile function
        const response = await supabase.functions.invoke('who_growth_percentile', {
          body: {
            weight_kg: data.weight_kg,
            height_cm: data.height_cm,
            age_months: data.age_months,
            sex: 'M', // Will need to fetch from patient record
          },
        });

        const percentiles = response.data;

        const { error: insertError } = await supabase
          .from('child_growth_control')
          .insert([
            {
              child_id: childId,
              ...data,
              who_percentile_weight: percentiles.percentile_weight,
              who_percentile_height: percentiles.percentile_height,
            },
          ]);

        if (insertError) throw insertError;

        // Refetch data
        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding growth record');
        throw err;
      }
    },
    [childId]
  );

  const updateMilestone = useCallback(
    async (field: string, value: boolean) => {
      try {
        if (!currentMilestone) {
          // Create new milestone if doesn't exist
          const { error: insertError } = await supabase
            .from('developmental_milestone')
            .insert([
              {
                child_id: childId,
                age_months: 0,
                [field]: value,
              },
            ]);

          if (insertError) throw insertError;
        } else {
          const { error: updateError } = await supabase
            .from('developmental_milestone')
            .update({ [field]: value })
            .eq('id', currentMilestone.id);

          if (updateError) throw updateError;
        }

        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error updating milestone');
        throw err;
      }
    },
    [childId, currentMilestone]
  );

  return {
    growthControls,
    currentMilestone,
    loading,
    error,
    addGrowthRecord,
    updateMilestone,
  };
};

export default useChildGrowth;

