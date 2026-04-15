// @ts-nocheck
import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PercentileResult {
  percentile_weight: number;
  percentile_height: number;
  bmi_percentile?: number;
  status: 'normal' | 'underweight' | 'overweight' | 'obese';
  alert?: string;
}

interface WHOGrowthData {
  loading: boolean;
  error: string | null;
}

/**
 * Hook for calculating WHO growth percentiles
 * Uses Edge Function who_growth_percentile for accurate references
 * Includes fallback calculation if Edge Function unavailable
 */
export const useWHOGrowth = (): WHOGrowthData & {
  calculatePercentile: (params: {
    weight_kg: number;
    height_cm: number;
    age_months: number;
    sex: 'M' | 'F';
  }) => Promise<PercentileResult>;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePercentile = useCallback(
    async (params: {
      weight_kg: number;
      height_cm: number;
      age_months: number;
      sex: 'M' | 'F';
    }): Promise<PercentileResult> => {
      try {
        setLoading(true);
        setError(null);

        // Try Edge Function first
        try {
          const { data, error: fnError } = await supabase.functions.invoke(
            'who_growth_percentile',
            {
              body: params,
            }
          );

          if (fnError) throw fnError;

          return data;
        } catch (fnErr) {
          console.warn('Edge Function failed, using fallback calculation');

          // Fallback calculation using WHO reference data
          return calculatePercentileFallback(params);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error calculating percentile';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    calculatePercentile,
  };
};

/**
 * Fallback percentile calculation using simplified WHO growth standards
 * Based on WHO Child Growth Standards (0-59 months)
 */
function calculatePercentileFallback(params: {
  weight_kg: number;
  height_cm: number;
  age_months: number;
  sex: 'M' | 'F';
}): PercentileResult {
  const { weight_kg, height_cm, age_months, sex } = params;

  // Simplified WHO references (in real implementation, use full WHO growth tables)
  // These are approximate median and SD values
  const WHO_REFS: { [key: string]: { weight: number; height: number; sd: number } } = {
    // Male references (simplified)
    M_0: { weight: 3.3, height: 49.9, sd: 0.6 },
    M_3: { weight: 5.9, height: 59.0, sd: 0.8 },
    M_6: { weight: 7.3, height: 67.0, sd: 0.9 },
    M_9: { weight: 8.6, height: 72.3, sd: 1.0 },
    M_12: { weight: 9.6, height: 76.0, sd: 1.0 },
    // Female references (simplified)
    F_0: { weight: 3.2, height: 49.5, sd: 0.6 },
    F_3: { weight: 5.6, height: 58.4, sd: 0.8 },
    F_6: { weight: 6.9, height: 65.7, sd: 0.9 },
    F_9: { weight: 8.0, height: 70.1, sd: 0.9 },
    F_12: { weight: 8.9, height: 73.5, sd: 1.0 },
  };

  // Get closest reference
  const roundedAge = Math.floor(age_months / 3) * 3;
  const refKey = `${sex}_${roundedAge}`;
  const ref = WHO_REFS[refKey];

  let percentile_weight = 50;
  let percentile_height = 50;

  if (ref) {
    // Z-score calculation: (value - median) / SD
    const weightZScore = (weight_kg - ref.weight) / ref.sd;
    const heightZScore = (height_cm - ref.height) / ref.sd;

    // Convert Z-score to percentile (simplified)
    percentile_weight = Math.round(50 + weightZScore * 15.87); // Approximate percentile
    percentile_height = Math.round(50 + heightZScore * 15.87);

    // Clamp between 0 and 100
    percentile_weight = Math.max(0, Math.min(100, percentile_weight));
    percentile_height = Math.max(0, Math.min(100, percentile_height));
  }

  // Calculate BMI if possible
  let bmi_percentile = 50;
  if (height_cm > 0) {
    const bmi = weight_kg / ((height_cm / 100) ** 2);
    // Simple BMI classification (ages 0-19)
    if (age_months < 240) {
      // Use age-specific BMI percentiles (simplified)
      bmi_percentile = Math.round(50 + (bmi - 16) * 10); // Approximate
      bmi_percentile = Math.max(0, Math.min(100, bmi_percentile));
    }
  }

  // Determine nutritional status
  let status: 'normal' | 'underweight' | 'overweight' | 'obese' = 'normal';
  let alert: string | undefined;

  if (percentile_weight < 5) {
    status = 'underweight';
    alert = 'Peso bajo para edad - Riesgo de desnutrición';
  } else if (percentile_weight > 95) {
    status = 'overweight';
    alert = 'Peso alto para edad - Riesgo de sobrepeso';
  } else if (percentile_weight > 99) {
    status = 'obese';
    alert = 'Obesidad infantil - Seguimiento especializado recomendado';
  }

  if (percentile_height < 5) {
    status = 'underweight';
    if (!alert) alert = 'Talla baja para edad - Evaluación recomendada';
  }

  return {
    percentile_weight,
    percentile_height,
    bmi_percentile,
    status,
    alert,
  };
}

export default useWHOGrowth;
