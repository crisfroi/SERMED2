// ============================================================================
// validate_medication_order.ts - Edge Function
// ASIS 10.0 - Regímenes de Medicación - Hito 4
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRequest {
  patient_id: string;
  medication_ids: string[];
  dose: string;
  frequency: string;
}

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  interactions: any[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { patient_id, medication_ids, dose, frequency }: ValidateRequest = await req.json();

    const validationResult: ValidationResult = {
      valid: true,
      warnings: [],
      errors: [],
      interactions: [],
    };

    // Step 1: Check patient allergies
    const { data: allergies, error: allergyErr } = await supabase
      .from('allergies')
      .select('medication_id, allergen')
      .eq('patient_id', patient_id)
      .eq('active', true);

    if (allergyErr) throw allergyErr;

    // Check for allergy conflicts
    for (const med_id of medication_ids) {
      const hasAllergy = allergies?.some((a: any) => a.medication_id === med_id);
      if (hasAllergy) {
        validationResult.errors.push(
          `Patient has documented allergy to medication ${med_id}. Prescription cannot be created.`
        );
        validationResult.valid = false;
      }
    }

    // Step 2: Check medication contraindications
    if (medication_ids.length > 1) {
      const { data: interactions, error: intErr } = await supabase.rpc(
        'check_medication_interactions',
        {
          medication_ids,
        }
      );

      if (intErr) throw intErr;

      const criticalInteractions = interactions?.filter(
        (i: any) => i.severity === 'critical'
      ) || [];
      const moderateInteractions = interactions?.filter(
        (i: any) => i.severity === 'moderate'
      ) || [];

      if (criticalInteractions.length > 0) {
        validationResult.errors.push(
          `${criticalInteractions.length} critical interaction(s) detected. Clinical review required.`
        );
        validationResult.valid = false;
      }

      if (moderateInteractions.length > 0) {
        validationResult.warnings.push(
          `${moderateInteractions.length} moderate interaction(s) detected. Verify appropriate monitoring.`
        );
      }

      validationResult.interactions = interactions || [];
    }

    // Step 3: Validate dose ranges
    const { data: medications, error: medErr } = await supabase
      .from('medications')
      .select('id, name, min_dose, max_dose, unit')
      .in('id', medication_ids);

    if (medErr) throw medErr;

    for (const med of medications || []) {
      const doseValue = parseFloat(dose);
      if (med.min_dose && doseValue < med.min_dose) {
        validationResult.warnings.push(
          `${med.name}: Dose ${doseValue}${med.unit} is below recommended minimum ${med.min_dose}${med.unit}`
        );
      }
      if (med.max_dose && doseValue > med.max_dose) {
        validationResult.errors.push(
          `${med.name}: Dose ${doseValue}${med.unit} exceeds maximum ${med.max_dose}${med.unit}`
        );
        validationResult.valid = false;
      }
    }

    // Step 4: Check patient age/special populations
    const { data: patientData, error: patErr } = await supabase
      .from('patients')
      .select('date_of_birth, gender, pregnancy_status')
      .eq('id', patient_id)
      .single();

    if (patErr) throw patErr;

    const age = calculateAge(patientData.date_of_birth);

    if (age < 18) {
      validationResult.warnings.push(
        'Patient is under 18 years old. Verify pediatric dosing appropriateness.'
      );
    }

    if (age > 65) {
      validationResult.warnings.push(
        'Patient is 65+ years old. Consider Beers Criteria for medication appropriateness.'
      );
    }

    if (patientData.pregnancy_status === 'pregnant' || patientData.pregnancy_status === 'lactating') {
      const { data: pregMeds, error: pregErr } = await supabase
        .from('pregnancy_contraindications')
        .select('medication_id')
        .in('medication_id', medication_ids);

      if (pregErr) throw pregErr;

      if ((pregMeds?.length || 0) > 0) {
        validationResult.errors.push(
          'One or more medications are contraindicated during pregnancy/lactation.'
        );
        validationResult.valid = false;
      }
    }

    // Step 5: Check recent prescriptions (avoid duplicate therapy)
    const { data: recentPrescriptions, error: recErr } = await supabase
      .from('prescriptions')
      .select('medication_id')
      .eq('patient_id', patient_id)
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (recErr) throw recErr;

    const recentMedIds = recentPrescriptions?.map((p: any) => p.medication_id) || [];
    const duplicates = medication_ids.filter((id) => recentMedIds.includes(id));

    if (duplicates.length > 0) {
      validationResult.warnings.push(
        `Duplicate therapy detected: ${duplicates.join(', ')} already prescribed within 7 days.`
      );
    }

    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        valid: false,
        warnings: [],
        errors: [error.message],
        interactions: [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
