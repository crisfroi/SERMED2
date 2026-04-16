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
    const { weight, height, ageMonths } = await req.json();

    if (!weight || !height || ageMonths === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing weight, height, or ageMonths' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // WHO Growth Standards - Simplified percentile calculation
    const calculatePercentile = (value: number, mean: number, sd: number) => {
      const zScore = (value - mean) / sd;
      // Approximation of normal distribution CDF
      const cdf = 0.5 * (1 + Math.tanh(0.7978845608 * (zScore + 0.0498673470 * Math.pow(zScore, 3))));
      return Math.round(cdf * 100);
    };

    // WHO reference data (approximate for 0-24 months)
    const whoReferences: Record<number, Record<string, [number, number]>> = {
      0: { weight: [3.3, 0.4], height: [49.9, 1.6] },
      3: { weight: [5.6, 0.5], height: [59.8, 2.0] },
      6: { weight: [7.3, 0.7], height: [67.0, 2.3] },
      12: { weight: [9.6, 1.0], height: [75.7, 2.7] },
      24: { weight: [12.8, 1.3], height: [87.6, 3.1] },
    };

    // Find closest reference
    const ageMonthsRef = Object.keys(whoReferences)
      .map((age) => ({ age: parseInt(age), diff: Math.abs(parseInt(age) - ageMonths) }))
      .sort((a, b) => a.diff - b.diff)[0].age;

    const reference = whoReferences[ageMonthsRef];
    const [weightMean, weightSD] = reference.weight;
    const [heightMean, heightSD] = reference.height;

    const weightPercentile = calculatePercentile(weight, weightMean, weightSD);
    const heightPercentile = calculatePercentile(height, heightMean, heightSD);

    // Calculate Z-scores
    const weightZScore = (weight - weightMean) / weightSD;
    const heightZScore = (height - heightMean) / heightSD;

    // Determine growth status
    let status: string;
    let alerts: string[] = [];

    if (Math.abs(weightZScore) > 2 && Math.abs(heightZScore) > 2) {
      status = 'Failure to Thrive';
      alerts.push('🔴 CRITICAL: Child below -2SD for both weight and height');
    } else if (weightZScore < -2) {
      status = 'Wasting (Acute Malnutrition)';
      alerts.push('🔴 Acute malnutrition - Immediate intervention needed');
    } else if (heightZScore < -2) {
      status = 'Stunting (Chronic Malnutrition)';
      alerts.push('🟡 Chronic malnutrition - Nutrition support required');
    } else if (weightZScore > 2) {
      status = 'Overweight/Risk Obesity';
      alerts.push('⚠️ Rapid weight gain - Assess dietary intake');
    } else if (weightPercentile > 50 && heightPercentile > 50) {
      status = 'Appropriate Growth';
    } else {
      status = 'Below Average but Stable';
      alerts.push('ℹ️ Monitor closely - Consider nutrition assessment');
    }

    const result = {
      ageMonths,
      measurements: {
        weight,
        height,
        weightPercentile,
        heightPercentile,
      },
      WHO_Standards: {
        referenceAgeMonths: ageMonthsRef,
        weightMean,
        heightMean,
      },
      zsores: {
        weightZScore: Math.round(weightZScore * 100) / 100,
        heightZScore: Math.round(heightZScore * 100) / 100,
      },
      growthStatus: status,
      alerts,
      recommendations: [
        status.includes('Wasting') ? 'Refer to nutritionist - Consider supplementation' : null,
        status.includes('Stunting') ? 'Long-term nutrition support - Micronutrient screening' : null,
        status.includes('Overweight') ? 'Dietary assessment - Limit sugary drinks' : null,
      ].filter(Boolean),
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
