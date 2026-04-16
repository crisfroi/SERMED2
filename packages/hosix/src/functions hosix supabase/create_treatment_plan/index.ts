// ============================================================================
// create_treatment_plan.ts - Edge Function
// ASIS 14.0 - Diagnóstico Unificado - Treatment Planning & Care Coordination
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TreatmentPlanRequest {
  patient_id: string;
  diagnosis_id: string;
  diagnosis_codes: string[];
  clinical_findings: string;
  risk_factors?: string[];
}

interface TreatmentPlan {
  id: string;
  medications: any[];
  procedures: any[];
  follow_up: any;
  monitoring: string[];
  patient_education: string[];
  referrals: any[];
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
      diagnosis_id,
      diagnosis_codes,
      clinical_findings,
      risk_factors = [],
    }: TreatmentPlanRequest = await req.json();

    const treatmentPlan: TreatmentPlan = {
      id: crypto.randomUUID(),
      medications: [],
      procedures: [],
      follow_up: {},
      monitoring: [],
      patient_education: [],
      referrals: [],
    };

    // Step 1: Get recommended medications
    for (const code of diagnosis_codes) {
      const { data: guidedMeds, error: medErr } = await supabase
        .from('treatment_guidelines')
        .select(`
          medications:medication_recommendations(
            medication_id,
            medications(id, name, strength, form),
            dosage,
            frequency,
            duration,
            contraindications,
            monitoring
          )
        `)
        .eq('icd_code', code)
        .limit(10);

      if (medErr) throw medErr;

      if (guidedMeds) {
        guidedMeds.forEach((item: any) => {
          if (item.medications) {
            treatmentPlan.medications.push(...item.medications);
          }
        });
      }
    }

    // Step 2: Identify potential procedures
    const { data: procedures, error: procErr } = await supabase
      .from('clinical_procedures')
      .select('*')
      .in('applicable_diagnosis_codes', diagnosis_codes)
      .order('priority', { ascending: true })
      .limit(5);

    if (procErr) throw procErr;

    treatmentPlan.procedures = procedures || [];

    // Step 3: Determine follow-up intervals based on severity
    const { data: diagnosisData, error: diagErr } = await supabase
      .from('diagnoses')
      .select('severity, status')
      .eq('id', diagnosis_id)
      .single();

    if (diagErr) throw diagErr;

    const severity = diagnosisData?.severity || 'moderate';
    const followUpIntervals = {
      mild: 30,
      moderate: 14,
      severe: 7,
    };

    treatmentPlan.follow_up = {
      primary_care: followUpIntervals[severity as keyof typeof followUpIntervals],
      specialist: followUpIntervals[severity as keyof typeof followUpIntervals] * 2,
      emergency_signs: [
        'Severe chest pain',
        'Difficulty breathing',
        'Confusion',
        'Uncontrolled fever',
        'Loss of consciousness',
      ],
    };

    // Step 4: Get monitoring parameters
    const { data: monitoringParams, error: monErr } = await supabase
      .from('monitoring_protocols')
      .select('*')
      .in('diagnosis_code', diagnosis_codes)
      .limit(10);

    if (monErr) throw monErr;

    treatmentPlan.monitoring = (monitoringParams || []).map((m: any) => m.parameter_name);

    // Step 5: Get patient education materials
    const { data: education, error: eduErr } = await supabase
      .from('patient_education_materials')
      .select('*')
      .in('diagnosis_code', diagnosis_codes)
      .order('priority', { ascending: true })
      .limit(5);

    if (eduErr) throw eduErr;

    treatmentPlan.patient_education = (education || []).map((e: any) => e.topic);

    // Step 6: Identify specialty referrals
    if (severity === 'severe' || risk_factors.includes('complications')) {
      const { data: specialists, error: specErr } = await supabase
        .from('specialist_referrals')
        .select('*')
        .in('diagnosis_code', diagnosis_codes);

      if (specErr) throw specErr;

      treatmentPlan.referrals = specialists || [];
    }

    // Step 7: Check for contraindications with current medications
    const { data: currentPrescriptions, error: prescErr } = await supabase
      .from('prescriptions')
      .select('medication_id, medications(name, id)')
      .eq('patient_id', patient_id)
      .eq('status', 'active');

    if (prescErr) throw prescErr;

    const currentMedIds = (currentPrescriptions || []).map((p: any) => p.medication_id);

    // Filter out contraindicated medications
    const recommendedMedIds = treatmentPlan.medications.map((m: any) => m.medication_id);

    const { data: interactions, error: intErr } = await supabase
      .from('medication_contraindications')
      .select('*')
      .in('medication1_id', currentMedIds)
      .in('medication2_id', recommendedMedIds);

    if (intErr) throw intErr;

    const contraindMedIds = (interactions || []).map((i: any) => i.medication2_id);
    treatmentPlan.medications = treatmentPlan.medications.filter(
      (m: any) => !contraindMedIds.includes(m.medication_id)
    );

    // Step 8: Create treatment plan record
    const { data: createdPlan, error: createErr } = await supabase
      .from('treatment_plans')
      .insert({
        id: treatmentPlan.id,
        patient_id,
        diagnosis_id,
        diagnosis_codes,
        medications: treatmentPlan.medications,
        procedures: treatmentPlan.procedures,
        follow_up_schedule: treatmentPlan.follow_up,
        monitoring_parameters: treatmentPlan.monitoring,
        education_topics: treatmentPlan.patient_education,
        specialist_referrals: treatmentPlan.referrals,
        created_by: 'system',
        status: 'draft',
      })
      .select()
      .single();

    if (createErr) throw createErr;

    return new Response(
      JSON.stringify({
        success: true,
        plan: treatmentPlan,
        created_plan: createdPlan,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
