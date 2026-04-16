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
      heartRate,
      systolicBP,
      diastolicBP,
      oxygenSaturation,
      respiration,
      glasgowComaScale,
    } = await req.json();

    if (!heartRate || !systolicBP || !oxygenSaturation) {
      return new Response(
        JSON.stringify({ error: 'Missing critical vital signs' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sofa = 0;
    const abnormalities: string[] = [];

    // Respiration (PaO2/FiO2 ratio) - simplified to SpO2
    if (oxygenSaturation < 90) {
      sofa += 4;
      abnormalities.push('🔴 Critical hypoxemia (O2 < 90%)');
    } else if (oxygenSaturation < 95) {
      sofa += 2;
      abnormalities.push('🟡 Hypoxemia (O2 < 95%)');
    }

    // Coagulation (platelets) - simulated based on abnormal trends
    // If multiple abnormalities present, increase coagulation score
    if (abnormalities.length > 1) {
      sofa += 1;
    }

    // Liver (bilirubin) - simulated
    // Not directly available, estimate based on other signs
    sofa += 0; // Neutral for now

    // Cardiovascular (hypotension/vasopressor need)
    if (systolicBP < 70) {
      sofa += 4;
      abnormalities.push('🔴 Severe hypotension (SBP < 70)');
    } else if (systolicBP < 100) {
      sofa += 2;
      abnormalities.push('🟡 Hypotension (SBP < 100)');
    } else if (systolicBP > 180) {
      sofa += 1;
      abnormalities.push('🟡 Hypertension (SBP > 180)');
    }

    // Heart rate abnormalities
    if (heartRate < 40 || heartRate > 130) {
      abnormalities.push('⚠️ Heart rate critical');
    }

    // Respiration rate abnormalities
    if (respiration && (respiration < 8 || respiration > 35)) {
      abnormalities.push('⚠️ Respiratory rate critical');
    }

    // Central Nervous System (Glasgow Coma Scale)
    if (glasgowComaScale) {
      if (glasgowComaScale < 6) {
        sofa += 4;
        abnormalities.push('🔴 Severe altered consciousness (GCS < 6)');
      } else if (glasgowComaScale < 10) {
        sofa += 2;
        abnormalities.push('🟡 Altered consciousness (GCS < 10)');
      }
    }

    // Determine severity classification
    let severity: string;
    let severityColor: string;
    let clinicalAction: string;

    if (sofa >= 8) {
      severity = 'CRITICAL';
      severityColor = '🔴';
      clinicalAction = 'Immediate physician notification. Consider ICU transfer. Monitor continuously.';
    } else if (sofa >= 4) {
      severity = 'HIGH';
      severityColor = '🟠';
      clinicalAction = 'Close monitoring. Repeat vitals every 15 minutes. May need ICU.';
    } else if (sofa >= 2) {
      severity = 'MODERATE';
      severityColor = '🟡';
      clinicalAction = 'Monitor every hour. Check for progressive deterioration.';
    } else {
      severity = 'LOW';
      severityColor = '🟢';
      clinicalAction = 'Routine monitoring. Standard care plan.';
    }

    const result = {
      sofaScore: sofa,
      severity: `${severityColor} ${severity}`,
      abnormalities,
      clinicalAction,
      vitals: {
        heartRate,
        systolicBP,
        diastolicBP,
        oxygenSaturation,
        respirationRate: respiration,
        glasgowComaScale,
      },
      timestamp: new Date().toISOString(),
      recommendations: {
        monitoring: severity === 'CRITICAL' ? 'Continuous' : severity === 'HIGH' ? 'Every 15 min' : 'Hourly',
        physiciaNnotification: severity !== 'LOW',
        icuConsideration: sofa >= 4,
        nextReassessment: severity === 'CRITICAL' ? '5 minutes' : severity === 'HIGH' ? '30 minutes' : '4 hours',
      },
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
