// ============================================================================
// useInteractionChecker.ts - Medication Interaction Detection Hook
// ASIS 10.0 - Regímenes de Medicación - Hito 3
// ============================================================================

import { useCallback, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Interaction {
  id: string;
  medication1Id: string;
  medication2Id: string;
  medication1Name: string;
  medication2Name: string;
  severity: 'critical' | 'moderate' | 'mild';
  interactionDescription: string;
  managementRecommendation: string;
  alternativeMedications?: string[];
  evidence: string;
  onset: string;
}

export const useInteractionChecker = (patientId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Check interactions between medications
  const checkInteractions = useCallback(
    async (medicationIds: string[]): Promise<Interaction[]> => {
      try {
        setLoading(true);
        setError(null);

        if (medicationIds.length < 2) {
          return [];
        }

        // Call Supabase RPC function
        const { data, error: err } = await supabase.rpc(
          'check_medication_interactions_detailed',
          {
            medication_ids: medicationIds,
          }
        );

        if (err) throw err;

        const interactions: Interaction[] = (data || []).map((i: any) => ({
          id: i.id,
          medication1Id: i.medication1_id,
          medication2Id: i.medication2_id,
          medication1Name: i.medication1_name,
          medication2Name: i.medication2_name,
          severity: i.severity,
          interactionDescription: i.interaction_description,
          managementRecommendation: i.management_recommendation,
          alternativeMedications: i.alternative_medications || [],
          evidence: i.evidence,
          onset: i.onset,
        }));

        return interactions;
      } catch (err: any) {
        setError(err.message);
        console.error('Error checking interactions:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Check drug-disease interactions
  const checkDrugDiseaseInteractions = useCallback(
    async (medicationIds: string[], diagnosisCode: string) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase.rpc(
          'check_drug_disease_interactions',
          {
            medication_ids: medicationIds,
            diagnosis_code: diagnosisCode,
          }
        );

        if (err) throw err;
        return data || [];
      } catch (err: any) {
        setError(err.message);
        console.error('Error checking drug-disease interactions:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Get interaction severity count
  const getSeveritySummary = useCallback(
    async (medicationIds: string[]) => {
      try {
        const interactions = await checkInteractions(medicationIds);
        return {
          critical: interactions.filter((i) => i.severity === 'critical').length,
          moderate: interactions.filter((i) => i.severity === 'moderate').length,
          mild: interactions.filter((i) => i.severity === 'mild').length,
          total: interactions.length,
        };
      } catch (err) {
        console.error('Error getting severity summary:', err);
        return { critical: 0, moderate: 0, mild: 0, total: 0 };
      }
    },
    [checkInteractions]
  );

  // Get alternative medications for interaction
  const getAlternatives = useCallback(
    async (medicationId: string, interactionType: 'drug-drug' | 'drug-disease'): Promise<string[]> => {
      try {
        const { data, error: err } = await supabase
          .from('medication_alternatives')
          .select('alternative_medications')
          .eq('medication_id', medicationId)
          .eq('interaction_type', interactionType)
          .single();

        if (err) throw err;
        return data?.alternative_medications || [];
      } catch (err) {
        console.error('Error getting alternatives:', err);
        return [];
      }
    },
    [supabase]
  );

  // Generate interaction report
  const generateReport = useCallback(
    async (medicationIds: string[], diagnosisCodes?: string[]): Promise<string> => {
      try {
        const drugDrugInteractions = await checkInteractions(medicationIds);
        let drugDiseaseInteractions: any[] = [];

        if (diagnosisCodes && diagnosisCodes.length > 0) {
          for (const diagCode of diagnosisCodes) {
            const results = await checkDrugDiseaseInteractions(medicationIds, diagCode);
            drugDiseaseInteractions.push(...results);
          }
        }

        const report = `
MEDICATION INTERACTION REPORT
===============================================
Generated: ${new Date().toISOString()}
Medications Reviewed: ${medicationIds.length}

DRUG-DRUG INTERACTIONS
---------------------------------------
${drugDrugInteractions.map((i) => `• ${i.medication1Name} + ${i.medication2Name} [${i.severity.toUpperCase()}]
  ${i.interactionDescription}
  Management: ${i.managementRecommendation}`).join('\n')}

DRUG-DISEASE INTERACTIONS
---------------------------------------
${drugDiseaseInteractions.length > 0 ? drugDiseaseInteractions.map((i) => `• ${i.medication_name} in ${i.diagnosis_name}
  Recommendation: ${i.recommendation}`).join('\n') : 'None detected'}

CRITICAL INTERACTIONS: ${drugDrugInteractions.filter((i) => i.severity === 'critical').length}
MODERATE INTERACTIONS: ${drugDrugInteractions.filter((i) => i.severity === 'moderate').length}
MILD INTERACTIONS: ${drugDrugInteractions.filter((i) => i.severity === 'mild').length}
===============================================
        `;

        return report;
      } catch (err) {
        console.error('Error generating report:', err);
        return 'Error generating report';
      }
    },
    [checkInteractions, checkDrugDiseaseInteractions]
  );

  return {
    checkInteractions,
    checkDrugDiseaseInteractions,
    getSeveritySummary,
    getAlternatives,
    generateReport,
    loading,
    error,
  };
};
