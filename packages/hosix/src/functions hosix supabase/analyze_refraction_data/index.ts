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
      sphere_od,
      cylinder_od,
      axis_od,
      sphere_os,
      cylinder_os,
      axis_os,
      va_od,
      va_os,
      age,
    } = await req.json();

    if (!sphere_od || !sphere_os) {
      return new Response(
        JSON.stringify({ error: 'Missing refraction values' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate spherical equivalent (SE = Sphere + Cylinder/2)
    const se_od = sphere_od + (cylinder_od || 0) / 2;
    const se_os = sphere_os + (cylinder_os || 0) / 2;
    const se_average = (se_od + se_os) / 2;

    // Classify refractive error
    let errorType = 'Emmetropia (Normal)';
    let severity = 'None';

    if (Math.abs(se_average) < 0.5) {
      errorType = 'Emmetropia (Normal)';
      severity = 'None';
    } else if (se_average >= 0.5 && se_average <= 2.0) {
      errorType = 'Hyperopia (Miopía)';
      severity = se_average > 1.0 ? 'Mild-Moderate' : 'Mild';
    } else if (se_average > 2.0) {
      errorType = 'Hyperopia (Hipermetropía)';
      severity = se_average > 3.0 ? 'High' : 'Moderate';
    } else if (se_average < -0.5 && se_average >= -2.0) {
      errorType = 'Myopia (Miopía Leve)';
      severity = 'Mild';
    } else if (se_average < -2.0 && se_average >= -6.0) {
      errorType = 'Myopia (Miopía Moderada)';
      severity = 'Moderate';
    } else if (se_average < -6.0) {
      errorType = 'Myopia (Miopía Alta)';
      severity = 'High';
    }

    // Cylinder analysis
    const totalCylinder = Math.abs(cylinder_od || 0) + Math.abs(cylinder_os || 0);
    const hasAstigmatism = Math.abs(cylinder_od || 0) > 0.5 || Math.abs(cylinder_os || 0) > 0.5;

    // Visual acuity analysis
    const vaThresholds = {
      '20/20': 1.0,
      '20/25': 0.8,
      '20/30': 0.67,
      '20/40': 0.5,
      '20/60': 0.33,
      '20/100': 0.2,
      'CF': 0.05,
      'HM': 0.02,
       'LP': 0.01,
    };

    const getVAScore = (va: string) => vaThresholds[va as keyof typeof vaThresholds] || 0.5;
    const vaScore_od = getVAScore(va_od || '20/20');
    const vaScore_os = getVAScore(va_os || '20/20');

    // Determine corrective need
    let correctionRecommendation = 'Monitor without correction';
    if (Math.abs(se_average) > 1.5 || (hasAstigmatism && Math.abs(cylinder_od || 0) > 0.75)) {
      correctionRecommendation = 'Glasses prescription recommended';

      if (Math.abs(se_average) > 3.0 || totalCylinder > 2.0) {
        correctionRecommendation = 'Glasses prescription strongly recommended - Consider referral to optometrist';
      }
    }

    // Age-specific recommendations
    let ageRecommendation = '';
    if (age && age < 18) {
      if (Math.abs(se_average) > 1.0 || hasAstigmatism) {
        ageRecommendation =
          'IMPORTANT: Pediatric refractive errors can impact development. Regular monitoring essential.';
      }
    } else if (age && age > 40) {
      ageRecommendation = 'Age-related presbyopia may develop - Consider bifocal/progressive lenses';
    }

    const result = {
      refraction: {
        sphere: { OD: sphere_od, OS: sphere_os },
        cylinder: { OD: cylinder_od || 0, OS: cylinder_os || 0 },
        axis: { OD: axis_od || 0, OS: axis_os || 0 },
      },
      analysis: {
        sphericalEquivalent: {
          OD: Math.round(se_od * 100) / 100,
          OS: Math.round(se_os * 100) / 100,
          Average: Math.round(se_average * 100) / 100,
        },
        errorType,
        severity,
        hasAstigmatism,
        totalCylinderPower: Math.round(totalCylinder * 100) / 100,
      },
      visualAcuity: {
        OD: { value: va_od || '20/20', score: vaScore_od },
        OS: { value: va_os || '20/20', score: vaScore_os },
        avergageScore: Math.round(((vaScore_od + vaScore_os) / 2) * 100) / 100,
      },
      recommendations: {
        correction: correctionRecommendation,
        ageSpecific: ageRecommendation,
        followUp:
          Math.abs(se_average) > 2.0 || hasAstigmatism
            ? 'Annual eye exam recommended'
            : 'Every 2 years screening',
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
