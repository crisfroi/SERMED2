// @ts-nocheck
// ============================================================================
// useComorbidity.ts - Comorbidity Detection & Risk Assessment Hook
// ASIS 14.0 - Diagnóstico Unificado - Hito 3
// ============================================================================

import { useCallback, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface ComorbidityItem {
  id: string;
  name: string;
  icdCode: string;
  riskScore: number;
  severity: 'low' | 'medium' | 'high';
  frequencyPercent: number;
  treatmentImpact: string;
  drugInteractions: number;
}

interface RiskProfile {
  charlsonIndex: number;
  elixhauserScore: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very-high';
  hospitalReadmissionRisk: number;
}

export const useComorbidity = (patientId: string, primaryDiagnosis?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Detect comorbidities based on diagnoses
  const detectComorbidities = useCallback(async (): Promise<ComorbidityItem[]> => {
    try {
      setLoading(true);
      setError(null);

      // Get patient diagnoses
      const { data: diagnoses, error: diagErr } = await supabase
        .from('diagnoses')
        .select('icd10_code')
        .eq('patient_id', patientId)
        .eq('status', 'active');

      if (diagErr) throw diagErr;

      if (!diagnoses || diagnoses.length === 0) {
        return [];
      }

      // Get comorbidities for each diagnosis
      const diagnosisCodes = diagnoses.map((d: any) => d.icd10_code);

      const { data: comorbidities, error: comErr } = await supabase
        .from('comorbidities')
        .select('*')
        .in('icd10_code', diagnosisCodes);

      if (comErr) throw comErr;

      const formatted: ComorbidityItem[] = (comorbidities || [])
        .filter((c: any) => !diagnosisCodes.includes(c.comorbid_code)) // Exclude primary diagnoses
        .map((c: any) => ({
          id: c.id,
          name: c.comorbid_name,
          icdCode: c.comorbid_code,
          riskScore: c.risk_score || 0,
          severity: getSeverityLevel(c.risk_score),
          frequencyPercent: c.frequency_percent || 0,
          treatmentImpact: c.treatment_impact || '',
          drugInteractions: c.drug_interactions || 0,
        }));

      return formatted;
    } catch (err: any) {
      setError(err.message);
      console.error('Error detecting comorbidities:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [patientId, supabase]);

  // Helper to determine severity level
  const getSeverityLevel = (riskScore: number): 'low' | 'medium' | 'high' => {
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  };

  // Calculate risk scores (Charlson & Elixhauser)
  const calculateRiskScores = useCallback(
    async (comorbidities: ComorbidityItem[]): Promise<RiskProfile> => {
      try {
        setLoading(true);

        // Call Supabase function to calculate scores
        const { data, error: err } = await supabase.rpc('calculate_risk_scores', {
          patient_id: patientId,
          comorbidity_ids: comorbidities.map((c) => c.icdCode),
        });

        if (err) throw err;

        return {
          charlsonIndex: data.charlson_index,
          elixhauserScore: data.elixhauser_score,
          riskCategory: getRiskCategory(data.charlson_index),
          hospitalReadmissionRisk: data.readmission_risk_percent,
        };
      } catch (err: any) {
        setError(err.message);
        console.error('Error calculating risk scores:', err);
        return {
          charlsonIndex: 0,
          elixhauserScore: 0,
          riskCategory: 'low',
          hospitalReadmissionRisk: 0,
        };
      } finally {
        setLoading(false);
      }
    },
    [patientId, supabase]
  );

  // Helper to determine risk category
  const getRiskCategory = (
    charlsonIndex: number
  ): 'low' | 'moderate' | 'high' | 'very-high' => {
    if (charlsonIndex >= 6) return 'very-high';
    if (charlsonIndex >= 4) return 'high';
    if (charlsonIndex >= 2) return 'moderate';
    return 'low';
  };

  // Get treatment recommendations for comorbidities
  const treatmentRecommendations = useCallback(
    async (comorbidities: ComorbidityItem[]) => {
      try {
        const recommendations: any[] = [];

        for (const comorb of comorbidities) {
          const { data, error: err } = await supabase
            .from('treatment_guidelines')
            .select('*')
            .eq('icd_code', comorb.icdCode)
            .limit(3);

          if (!err && data) {
            recommendations.push(
              ...data.map((rec: any) => ({
                title: rec.title,
                description: rec.description,
                priority: comorb.severity === 'high' ? 'high' : 'normal',
              }))
            );
          }
        }

        return recommendations;
      } catch (err) {
        console.error('Error getting treatment recommendations:', err);
        return [];
      }
    },
    [supabase]
  );

  // Check for drug interactions with comorbidities
  const checkMedicationComorbidityInteractions = useCallback(
    async (medicationIds: string[], comorbidityIds: string[]) => {
      try {
        const { data, error: err } = await supabase.rpc(
          'check_medication_comorbidity_interactions',
          {
            medication_ids: medicationIds,
            comorbidity_codes: comorbidityIds,
          }
        );

        if (err) throw err;
        return data || [];
      } catch (err) {
        console.error('Error checking medication-comorbidity interactions:', err);
        return [];
      }
    },
    [supabase]
  );

  // Get comorbidity statistics for population
  const getComorbidityStatistics = useCallback(
    async (icdCode: string) => {
      try {
        const { data, error: err } = await supabase
          .from('comorbidity_statistics')
          .select('*')
          .eq('primary_icd_code', icdCode)
          .order('frequency_percent', { ascending: false })
          .limit(10);

        if (err) throw err;
        return data || [];
      } catch (err) {
        console.error('Error getting comorbidity statistics:', err);
        return [];
      }
    },
    [supabase]
  );

  return {
    detectComorbidities,
    calculateRiskScores,
    treatmentRecommendations,
    checkMedicationComorbidityInteractions,
    getComorbidityStatistics,
    loading,
    error,
  };
};
