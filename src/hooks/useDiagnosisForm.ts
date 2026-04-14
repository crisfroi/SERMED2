// ============================================================================
// useDiagnosisForm.ts - Diagnosis Creation & ICD-10 Search Hook
// ASIS 14.0 - Diagnóstico Unificado - Hito 3
// ============================================================================

import { useCallback, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface DiagnosisDetails {
  icdCode: string;
  description: string;
  categoryCode: string;
  category: string;
  commonComorbidities: string[];
  treatmentGuidelines: string[];
  icmrICD10Description: string;
}

export const useDiagnosisForm = (patientId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icd10Codes, setIcd10Codes] = useState<any[]>([]);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Search for ICD-10 codes
  const searchDiagnosis = useCallback(
    (query: string): any[] => {
      if (!query || query.length < 2) return [];

      // Find matches in preloaded codes
      return icd10Codes.filter(
        (code) =>
          code.code.toLowerCase().includes(query.toLowerCase()) ||
          code.description.toLowerCase().includes(query.toLowerCase()) ||
          code.category.toLowerCase().includes(query.toLowerCase())
      );
    },
    [icd10Codes]
  );

  // Fetch ICD-10 codes (called once on mount)
  const loadICD10Codes = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error: err } = await supabase
        .from('icd10_codes')
        .select('code, description, category, category_code')
        .limit(1000);

      if (err) throw err;

      const formatted = (data || []).map((d: any) => ({
        code: d.code,
        description: d.description,
        category: d.category,
        categoryCode: d.category_code,
      }));

      setIcd10Codes(formatted);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading ICD-10 codes:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Get diagnosis details and related conditions
  const getDiagnosisDetails = useCallback(
    async (icdCode: string): Promise<DiagnosisDetails | null> => {
      try {
        const { data, error: err } = await supabase
          .from('diagnosis_details')
          .select(
            `
            icd_code,
            description,
            category_code,
            category,
            common_comorbidities,
            treatment_guidelines
          `
          )
          .eq('icd_code', icdCode)
          .single();

        if (err) throw err;

        return {
          icdCode: data.icd_code,
          description: data.description,
          categoryCode: data.category_code,
          category: data.category,
          commonComorbidities: data.common_comorbidities || [],
          treatmentGuidelines: data.treatment_guidelines || [],
          icmrICD10Description: data.description,
        };
      } catch (err) {
        console.error('Error getting diagnosis details:', err);
        return null;
      }
    },
    [supabase]
  );

  // Create new diagnosis
  const createDiagnosis = useCallback(
    async (diagnosisData: {
      patient_id: string;
      icd10_code: string;
      diagnosis_description: string;
      onset_date: string;
      severity: 'mild' | 'moderate' | 'severe';
      clinical_context: string;
      confirmed_status: 'suspected' | 'confirmed' | 'ruled-out';
      treatment_plan?: string | null;
    }) => {
      try {
        setLoading(true);
        setError(null);

        // Validate input
        if (!diagnosisData.icd10_code) {
          throw new Error('ICD-10 code is required');
        }

        if (!diagnosisData.clinical_context) {
          throw new Error('Clinical context is required');
        }

        // Insert diagnosis
        const { data, error: err } = await supabase
          .from('diagnoses')
          .insert({
            patient_id: diagnosisData.patient_id,
            icd10_code: diagnosisData.icd10_code,
            diagnosis_description: diagnosisData.diagnosis_description,
            onset_date: diagnosisData.onset_date,
            severity: diagnosisData.severity,
            clinical_context: diagnosisData.clinical_context,
            confirmed_status: diagnosisData.confirmed_status,
            treatment_plan: diagnosisData.treatment_plan,
            status: 'active',
          })
          .select()
          .single();

        if (err) throw err;

        return {
          id: data.id,
          ...data,
        };
      } catch (err: any) {
        setError(err.message);
        console.error('Error creating diagnosis:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Check for similar diagnoses in patient history
  const checkSimilarDiagnoses = useCallback(
    async (icdCode: string): Promise<any[]> => {
      try {
        const { data, error: err } = await supabase
          .from('diagnoses')
          .select('*')
          .eq('patient_id', patientId)
          .eq('icd10_code', icdCode)
          .order('onset_date', { ascending: false });

        if (err) throw err;
        return data || [];
      } catch (err) {
        console.error('Error checking similar diagnoses:', err);
        return [];
      }
    },
    [patientId, supabase]
  );

  // Get treatment guidelines for diagnosis
  const getTreatmentGuidelines = useCallback(
    async (icdCode: string): Promise<string[]> => {
      try {
        const details = await getDiagnosisDetails(icdCode);
        return details?.treatmentGuidelines || [];
      } catch (err) {
        console.error('Error getting treatment guidelines:', err);
        return [];
      }
    },
    [getDiagnosisDetails]
  );

  return {
    searchDiagnosis,
    createDiagnosis,
    getDiagnosisDetails,
    checkSimilarDiagnoses,
    getTreatmentGuidelines,
    loadICD10Codes,
    icd10Codes,
    loading,
    error,
  };
};
