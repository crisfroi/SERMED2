// ============================================================================
// stage_diagnosis.ts - Edge Function
// ASIS 14.0 - Diagnóstico Unificado - Diagnosis Validation & Staging
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosisStageRequest {
  patient_id: string;
  icd10_code: string;
  diagnosis_description: string;
  onset_date: string;
  severity: 'mild' | 'moderate' | 'severe';
  clinical_context: string;
}

interface StageResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  comorbidities: any[];
  drug_interactions: any[];
  treatment_guidelines: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      patient_id,
      icd10_code,
      diagnosis_description,
      onset_date,
      severity,
      clinical_context,
    }: DiagnosisStageRequest = await req.json();

    const result: StageResult = {
      valid: true,
      warnings: [],
      errors: [],
      comorbidities: [],
      drug_interactions: [],
      treatment_guidelines: [],
    };

    // Step 1: Validate ICD-10 code
    const { data: icdCode, error: icdErr } = await supabase
      .from('icd10_codes')
      .select('*')
      .eq('code', icd10_code)
      .single();

    if (icdErr || !icdCode) {
      result.errors.push(`Invalid ICD-10 code: ${icd10_code}`);
      result.valid = false;
    }

    // Step 2: Check for duplicate diagnosis
    const { data: existingDiagnoses, error: dupErr } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('icd10_code', icd10_code)
      .eq('status', 'active')
      .order('onset_date', { ascending: false })
      .limit(1);

    if (dupErr) throw dupErr;

    if (existingDiagnoses && existingDiagnoses.length > 0) {
      const existing = existingDiagnoses[0];
      const monthsAgo = Math.floor(
        (Date.now() - new Date(existing.onset_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      if (monthsAgo < 6) {
        result.warnings.push(
          `Similar diagnosis already active for ${monthsAgo} month(s). Verify this is not a duplicate.`
        );
      }
    }

    // Step 3: Detect comorbidities
    const { data: patientActiveDiagnoses, error: patDiagErr } = await supabase
      .from('diagnoses')
      .select('icd10_code')
      .eq('patient_id', patient_id)
      .eq('status', 'active');

    if (patDiagErr) throw patDiagErr;

    const activeCodes = patientActiveDiagnoses?.map((d: any) => d.icd10_code) || [];

    if (activeCodes.length > 0) {
      // Check for active diagnoses that overlap (potential comorbidities)
      const { data: relatedDiagnoses, error: relErr } = await supabase
        .from('diagnoses')
        .select('*')
        .in('icd10_code', activeCodes)
        .eq('status', 'active')
        .limit(10);

      if (relErr) throw relErr;

      if (relatedDiagnoses && relatedDiagnoses.length > 0) {
        result.comorbidities = relatedDiagnoses;
        result.warnings.push(
          `${relatedDiagnoses.length} active comorbid diagnoses detected.`
        );
      }
    }

    // Step 4: Check current medications for drug-disease interactions
    const { data: currentMeds, error: medsErr } = await supabase
      .from('prescriptions')
      .select('medication_id, medications(name)')
      .eq('patient_id', patient_id)
      .eq('status', 'active');

    if (medsErr) throw medsErr;

    if (currentMeds && currentMeds.length > 0) {
      const medIds = currentMeds.map((m: any) => m.medication_id);

      const { data: drugDiseaseInt, error: drugDiseaseErr } = await supabase
        .from('drug_disease_interactions')
        .select('*')
        .in('medication_id', medIds)
        .eq('diagnosis_code', icd10_code);

      if (drugDiseaseErr) throw drugDiseaseErr;

      if (drugDiseaseInt && drugDiseaseInt.length > 0) {
        result.drug_interactions = drugDiseaseInt;

        const criticalCount = drugDiseaseInt.filter(
          (i: any) => i.contraindication_level === 'critical'
        ).length;
        const warningCount = drugDiseaseInt.filter(
          (i: any) => i.contraindication_level === 'warning'
        ).length;

        if (criticalCount > 0) {
          result.errors.push(
            `${criticalCount} critical drug-disease interaction(s). Review medications immediately.`
          );
          result.valid = false;
        }

        if (warningCount > 0) {
          result.warnings.push(
            `${warningCount} warning-level drug-disease interaction(s) found. Clinical review needed.`
          );
        }
      }
    }

    // Step 5: Get treatment guidelines
    const { data: guidelines, error: guideErr } = await supabase
      .from('treatment_guidelines')
      .select('*')
      .eq('icd_code', icd10_code)
      .order('priority', { ascending: true })
      .limit(5);

    if (guideErr) throw guideErr;

    result.treatment_guidelines = guidelines || [];

    // Step 6: Validate severity level
    if (!['mild', 'moderate', 'severe'].includes(severity)) {
      result.errors.push('Invalid severity level');
      result.valid = false;
    }

    // Step 7: Check clinical context
    if (!clinical_context || clinical_context.trim().length < 10) {
      result.errors.push('Insufficient clinical context. Minimum 10 characters required.');
      result.valid = false;
    }

    // Step 8: Validate onset date
    const onsetDateTime = new Date(onset_date);
    const today = new Date();

    if (onsetDateTime > today) {
      result.errors.push('Onset date cannot be in the future');
      result.valid = false;
    }

    const yearsAgo = (today.getTime() - onsetDateTime.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (yearsAgo > 100) {
      result.warnings.push('Onset date is more than 100 years ago. Verify accuracy.');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.valid ? 200 : 400,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        valid: false,
        warnings: [],
        errors: [error.message],
        comorbidities: [],
        drug_interactions: [],
        treatment_guidelines: [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
