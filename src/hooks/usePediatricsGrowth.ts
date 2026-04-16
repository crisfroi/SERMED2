import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface GrowthMeasurement {
  patient_id: string;
  measurement_date: string;
  age_months: number;
  weight_kg: number;
  height_cm: number;
  head_circumference_cm?: number;
  bmi?: number;
  weight_percentile?: number;
  height_percentile?: number;
  z_score_weight?: number;
  z_score_height?: number;
  nutritional_status: 'normal' | 'underweight' | 'overweight' | 'obese' | 'stunted' | 'wasted';
}

export interface GrowthTrend {
  patient_id: string;
  measurements: GrowthMeasurement[];
  trend: 'appropriate' | 'deceleration' | 'acceleration' | 'failure_to_thrive';
  alerts: string[];
}

export interface DevelopmentMilestone {
  patient_id: string;
  age_months: number;
  milestone_type: 'gross_motor' | 'fine_motor' | 'language' | 'cognitive' | 'social_emotional';
  expected_date: string;
  achieved_date?: string;
  status: 'achieved' | 'delayed' | 'at_risk' | 'not_yet_assessed';
  notes?: string;
}

export const usePediatricsGrowth = () => {
  const recordGrowthMeasurement = async (
    measurement: Omit<GrowthMeasurement, 'percentile' | 'z_score_weight' | 'z_score_height'>
  ): Promise<GrowthMeasurement | null> => {
    try {
      // Calculate BMI
      const bmi = measurement.weight_kg / Math.pow(measurement.height_cm / 100, 2);

      // Calculate Z-scores (simplified WHO standards)
      const z_score_weight = (measurement.weight_kg - 15) / 2.5; // Approximate
      const z_score_height = (measurement.height_cm - 110) / 8; // Approximate

      // Determine percentiles (simplified)
      const weight_percentile =
        z_score_weight < -2 ? 5 : z_score_weight < -1 ? 16 : z_score_weight < 0 ? 50 : 84;
      const height_percentile =
        z_score_height < -2 ? 5 : z_score_height < -1 ? 16 : z_score_height < 0 ? 50 : 84;

      // Determine nutritional status
      let nutritional_status: GrowthMeasurement['nutritional_status'] = 'normal';
      if (z_score_weight < -2) nutritional_status = 'wasted';
      else if (z_score_weight < -1) nutritional_status = 'underweight';
      else if (bmi > 25) nutritional_status = 'overweight';
      else if (bmi > 30) nutritional_status = 'obese';

      if (z_score_height < -2) nutritional_status = 'stunted';

      const newMeasurement: GrowthMeasurement = {
        ...measurement,
        bmi: Math.round(bmi * 100) / 100,
        weight_percentile,
        height_percentile,
        z_score_weight: Math.round(z_score_weight * 100) / 100,
        z_score_height: Math.round(z_score_height * 100) / 100,
        nutritional_status,
      };

      const { data, error } = await supabase
        .from('pediatric_growth_measurements')
        .insert([newMeasurement])
        .select();

      if (error) throw error;

      // Log audit trail
      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'create_growth_measurement',
          table_name: 'pediatric_growth_measurements',
          record_id: data?.[0]?.id,
          patient_id: measurement.patient_id,
          details: `Growth measurement recorded: ${measurement.weight_kg}kg, ${measurement.height_cm}cm`,
          severity: 'low',
        },
      ]);

      return data?.[0] || newMeasurement;
    } catch (error) {
      console.error('Error recording growth measurement:', error);
      return null;
    }
  };

  const getGrowthTrend = async (patientId: string, months: number = 12): Promise<GrowthTrend> => {
    try {
      const { data, error } = await supabase
        .from('pediatric_growth_measurements')
        .select('*')
        .eq('patient_id', patientId)
        .order('measurement_date', { ascending: true })
        .limit(months);

      if (error) throw error;

      const measurements = data || [];
      const alerts: string[] = [];

      // Analyze trend
      let trend: GrowthTrend['trend'] = 'appropriate';

      if (measurements.length >= 2) {
        const recent = measurements[measurements.length - 1];
        const previous = measurements[measurements.length - 2];

        const weightChange = ((recent.weight_kg - previous.weight_kg) / previous.weight_kg) * 100;
        const heightChange =
          ((recent.height_cm - previous.height_cm) / previous.height_cm) * 100;

        if (weightChange < -5 || heightChange < -2) {
          trend = 'deceleration';
          alerts.push('⚠️ Growth deceleration detected');
        } else if (weightChange > 15) {
          trend = 'acceleration';
          alerts.push('⚠️ Rapid weight gain - assess dietary intake');
        }
      }

      // Check nutritional status
      const latestMeasurement = measurements[measurements.length - 1];
      if (latestMeasurement) {
        if (latestMeasurement.nutritional_status === 'wasted') {
          alerts.push('🔴 Acute malnutrition - Immediate intervention needed');
          trend = 'failure_to_thrive';
        } else if (latestMeasurement.nutritional_status === 'stunted') {
          alerts.push('🟡 Chronic malnutrition - Nutrition support required');
        }
      }

      return {
        patient_id: patientId,
        measurements,
        trend,
        alerts,
      };
    } catch (error) {
      console.error('Error getting growth trend:', error);
      return {
        patient_id: patientId,
        measurements: [],
        trend: 'appropriate',
        alerts: [],
      };
    }
  };

  const recordDevelopmentalMilestone = async (
    milestone: Omit<DevelopmentMilestone, 'id'>
  ): Promise<DevelopmentMilestone | null> => {
    try {
      const { data, error } = await supabase
        .from('pediatric_developmental_milestones')
        .insert([milestone])
        .select();

      if (error) throw error;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'record_developmental_milestone',
          table_name: 'pediatric_developmental_milestones',
          record_id: data?.[0]?.id,
          patient_id: milestone.patient_id,
          details: `${milestone.milestone_type} milestone: ${milestone.status}`,
          severity: milestone.status === 'delayed' ? 'high' : 'low',
        },
      ]);

      return data?.[0] || null;
    } catch (error) {
      console.error('Error recording developmental milestone:', error);
      return null;
    }
  };

  const getPediatricSummary = async (patientId: string) => {
    try {
      const { data: measurements, error: measError } = await supabase
        .from('pediatric_growth_measurements')
        .select('*')
        .eq('patient_id', patientId)
        .order('measurement_date', { ascending: false })
        .limit(1);

      const { data: milestones, error: milError } = await supabase
        .from('pediatric_developmental_milestones')
        .select('*')
        .eq('patient_id', patientId)
        .order('age_months', { ascending: false })
        .limit(10);

      if (measError || milError) throw measError || milError;

      const latestMeasurement = measurements?.[0];
      const developmentalStatus = milestones || [];

      return {
        latestMeasurement,
        developmentalStatus,
        hasAlerts: latestMeasurement?.nutritional_status !== 'normal',
        recommendedActions: [
          latestMeasurement?.nutritional_status === 'underweight'
            ? 'Nutrition assessment and dietary counseling'
            : null,
          developmentalStatus.some((m) => m.status === 'delayed')
            ? 'Early intervention referral'
            : null,
        ].filter(Boolean),
      };
    } catch (error) {
      console.error('Error getting pediatric summary:', error);
      return null;
    }
  };

  const checkDevelopmentalConcerns = async (patientId: string, ageMonths: number) => {
    try {
      const { data, error } = await supabase
        .from('pediatric_developmental_milestones')
        .select('*')
        .eq('patient_id', patientId)
        .lt('age_months', ageMonths + 3)
        .gt('age_months', ageMonths - 3);

      if (error) throw error;

      const delayedMilestones = data?.filter((m) => m.status === 'delayed') || [];
      const concerns: string[] = [];

      delayedMilestones.forEach((milestone) => {
        concerns.push(`${milestone.milestone_type}: Currently at ${milestone.age_months} months`);
      });

      return {
        totalMilestones: data?.length || 0,
        delayedCount: delayedMilestones.length,
        riskLevel:
          delayedMilestones.length > 2 ? 'high' : delayedMilestones.length > 0 ? 'moderate' : 'low',
        concerns,
        recommendation:
          delayedMilestones.length > 2
            ? 'Refer to developmental pediatrician'
            : 'Continue monitoring at regular intervals',
      };
    } catch (error) {
      console.error('Error checking developmental concerns:', error);
      return null;
    }
  };

  return {
    recordGrowthMeasurement,
    getGrowthTrend,
    recordDevelopmentalMilestone,
    getPediatricSummary,
    checkDevelopmentalConcerns,
  };
};
