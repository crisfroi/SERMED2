import { serve } from 'https://deno.land/std@0.175.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      heart_rate,
      systolic_bp,
      oxygen_saturation,
      gcs_score,
      trauma_type,
      chief_complaint,
      age,
    } = await req.json();

    if (!heart_rate || !systolic_bp || !oxygen_saturation) {
      return new Response(
        JSON.stringify({ error: 'Missing vital signs' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate triage score (SALT - Sort, Assess, Lifesaving interventions, Treatment)
    let triageScore = 0;
    const abnormalities: string[] = [];

    // Respiratory Assessment
    if (oxygen_saturation < 85) {
      triageScore += 4;
      abnormalities.push('🔴 Critical hypoxemia (SpO2 < 85%)');
    } else if (oxygen_saturation < 90) {
      triageScore += 3;
      abnormalities.push('🟠 Severe hypoxemia (SpO2 < 90%)');
    } else if (oxygen_saturation < 95) {
      triageScore += 1;
      abnormalities.push('🟡 Mild hypoxemia (SpO2 < 95%)');
    }

    // Circulatory Assessment - Hemorrhage control
    if (systolic_bp < 60) {
      triageScore += 4;
      abnormalities.push('🔴 Profound shock (SBP < 60)');
    } else if (systolic_bp < 90) {
      triageScore += 3;
      abnormalities.push('🟠 Severe hypotension (SBP < 90)');
    } else if (systolic_bp > 180) {
      triageScore += 2;
      abnormalities.push('🟡 Hypertensive emergency (SBP > 180)');
    }

    // Heart Rate Assessment
    if (heart_rate > 120 && systolic_bp < 90) {
      triageScore += 2;
      abnormalities.push('⚠️ Compensatory tachycardia with hypotension');
    } else if (heart_rate > 140) {
      triageScore += 2;
      abnormalities.push('🟡 Severe tachycardia (HR > 140)');
    } else if (heart_rate < 40) {
      triageScore += 2;
      abnormalities.push('🟡 Severe bradycardia (HR < 40)');
    }

    // Neurological Assessment - GCS
    if (gcs_score) {
      if (gcs_score < 8) {
        triageScore += 4;
        abnormalities.push(`🔴 Critical altered consciousness (GCS ${gcs_score})`);
      } else if (gcs_score < 11) {
        triageScore += 3;
        abnormalities.push(`🟠 Severe altered consciousness (GCS ${gcs_score})`);
      } else if (gcs_score < 15) {
        triageScore += 1;
        abnormalities.push(`🟡 Mild altered consciousness (GCS ${gcs_score})`);
      }
    }

    // Trauma Assessment
    if (trauma_type || chief_complaint?.toLowerCase().includes('trauma')) {
      if (trauma_type === 'penetrating') {
        triageScore += 3;
        abnormalities.push('🔴 Penetrating trauma - High hemorrhage risk');
      } else if (trauma_type === 'blunt' || trauma_type === 'burn') {
        triageScore += 2;
        abnormalities.push('🟡 Significant mechanism of injury');
      }
    }

    // Determine emergency priority level (ESI level)
    let esiLevel: number;
    let category: string;
    let resourceEstimate: string;

    if (triageScore >= 8) {
      esiLevel = 1;
      category = 'EMERGENT - IMMEDIATE';
      resourceEstimate = 'Resuscitation - Continuous invasive monitoring';
    } else if (triageScore >= 5) {
      esiLevel = 2;
      category = 'URGENT - HIGH PRIORITY';
      resourceEstimate = 'Advanced interventions needed';
    } else if (triageScore >= 2) {
      esiLevel = 3;
      category = 'SEMI-URGENT';
      resourceEstimate = 'Moderate resources';
    } else {
      esiLevel = 4;
      category = 'NON-URGENT';
      resourceEstimate = 'Minimal resources';
    }

    // Transport recommendation
    const needsALS = triageScore >= 5;
    const needsTraumaCenter = trauma_type !== undefined && systolic_bp < 100;
    const needsStrokeCenter =
      chief_complaint?.toLowerCase().includes('stroke') && triageScore >= 2;
    const needsCardiacCenter =
      chief_complaint?.toLowerCase().includes('chest') &&
      (systolic_bp < 90 || heart_rate > 130);

    let transportRecommendation = 'Basic Life Support';
    if (needsALS) {
      transportRecommendation = 'Advanced Life Support';
    }
    if (needsTraumaCenter) {
      transportRecommendation += ' + TRAUMA CENTER';
    }
    if (needsStrokeCenter) {
      transportRecommendation += ' + STROKE CENTER';
    }
    if (needsCardiacCenter) {
      transportRecommendation += ' + CARDIAC CENTER';
    }

    // Interventions needed during transport
    const interventionsNeeded: string[] = [];
    if (oxygen_saturation < 94) interventionsNeeded.push('Oxygen therapy');
    if (systolic_bp < 100) interventionsNeeded.push('IV access (large bore)');
    if (gcs_score && gcs_score < 9) interventionsNeeded.push('Airway management consideration');
    if (heart_rate > 120 || systolic_bp < 90) interventionsNeeded.push('Continuous cardiac monitoring');
    if (esiLevel === 1) interventionsNeeded.push('Rapid transport - Lights and sirens');

    // Age-specific considerations
    let ageConsiderations = '';
    if (age && age > 65) {
      ageConsiderations =
        'Elderly patient - Higher risk for complications, notify receiving facility early';
    } else if (age && age < 18) {
      ageConsiderations = 'Pediatric patient - Use age/weight-appropriate equipment and dosing';
    }

    const result = {
      triageAssessment: {
        esiLevel,
        category,
        triageScore,
        resourceEstimate,
      },
      vitalSignAnalysis: {
        heartRate: heart_rate,
        systolicBP: systolic_bp,
        oxygenSaturation: oxygen_saturation,
        glasgowComaScale: gcs_score || 'Not assessed',
      },
      abnormalities,
      transportRecommendation,
      interventionsNeeded,
      ageConsiderations,
      disposition: {
        priority:
          esiLevel === 1 ? 'EMERGENT' : esiLevel === 2 ? 'URGENT' : 'NON-EMERGENT',
        estimatedTransportTime:
          esiLevel === 1 ? 'Minimize transport time' : 'Standard transport protocol',
        notifyReceivingFacility: esiLevel <= 2,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
