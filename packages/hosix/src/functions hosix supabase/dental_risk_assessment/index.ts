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
    const { plaqueIndex, bleedingIndex, cavityCount, toothMap, age, smokingStatus } = await req.json();

    if (plaqueIndex === undefined || bleedingIndex === undefined || cavityCount === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing plaqueIndex, bleedingIndex, or cavityCount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Base risk calculation - PRIMARY INDICATORS
    let riskScore = 0;

    // Plaque Index scoring (0-3 scale → 0-3 points)
    riskScore += plaqueIndex > 1 ? 2 : plaqueIndex > 0.5 ? 1 : 0;

    // Bleeding Index scoring (0-3 scale → 0-3 points)
    riskScore += bleedingIndex > 1 ? 2 : bleedingIndex > 0.5 ? 1 : 0;

    // Caries count (1 cavity = 1 point)
    riskScore += Math.min(cavityCount, 4); // Cap at 4 points

    // SECONDARY RISK FACTORS
    const riskModifiers: Record<string, number> = {};

    // Age risk factor
    if (age) {
      if (age > 60) {
        riskScore += 2;
        riskModifiers.age = '+2 (Senior patient >60)';
      } else if (age > 40) {
        riskScore += 1;
        riskModifiers.age = '+1 (Middle-aged >40)';
      }
    }

    // Smoking risk factor
    if (smokingStatus === 'active') {
      riskScore += 3;
      riskModifiers.smoking = '+3 (Active smoker)';
    } else if (smokingStatus === 'former') {
      riskScore += 1;
      riskModifiers.smoking = '+1 (Former smoker)';
    }

    // Tooth map analysis - count critical tooth statuses
    let criticalTeeth = 0;
    if (toothMap && typeof toothMap === 'object') {
      Object.entries(toothMap).forEach(([tooth, status]: [string, any]) => {
        if (status.status === 'cavity' || status.status === 'extraction_needed') {
          criticalTeeth++;
        }
      });
      if (criticalTeeth > 3) {
        riskScore += 2;
        riskModifiers.criticalTeeth = `+2 (${criticalTeeth} critical teeth)`;
      }
    }

    // FINAL RISK CLASSIFICATION
    let riskLevel: 'low' | 'moderate' | 'high';
    let colorEmoji: string;
    let healthGrade: string;
    let urgencyLevel: string;

    if (riskScore >= 8) {
      riskLevel = 'high';
      colorEmoji = '🔴';
      healthGrade = 'F - Poor';
      urgencyLevel = 'URGENT - Needs immediate treatment';
    } else if (riskScore >= 4) {
      riskLevel = 'moderate';
      colorEmoji = '🟡';
      healthGrade = 'C - Fair';
      urgencyLevel = 'IMPORTANT - Schedule within 2 weeks';
    } else {
      riskLevel = 'low';
      colorEmoji = '🟢';
      healthGrade = 'A - Good';
      urgencyLevel = 'Routine - Regular checkup schedule okay';
    }

    // CLINICAL RECOMMENDATIONS
    const recommendations: string[] = [];

    if (plaqueIndex > 1.5) {
      recommendations.push('🔴 Professional cleaning + oral hygiene instruction needed');
    }
    if (bleedingIndex > 1.5) {
      recommendations.push('⚠️ Signs of gingivitis/periodontitis - Refer to periodontist');
    }
    if (cavityCount > 2) {
      recommendations.push('⚠️ Multiple caries - Accelerated treatment plan recommended');
    }
    if (smokingStatus === 'active') {
      recommendations.push('🚭 Smoking cessation counseling recommended');
    }
    if (age && age > 50) {
      recommendations.push('👴 Increased risk for periodontitis - More frequent monitoring');
    }

    // TREATMENT PLAN SUGGESTIONS
    const treatmentPriority: string[] = [];
    if (cavityCount > 0) treatmentPriority.push('Fill active cavities');
    if (criticalTeeth > 0) treatmentPriority.push('Consider extractions for severely damaged teeth');
    if (bleedingIndex > 1) treatmentPriority.push('Scaling and root planing');
    if (plaqueIndex > 1.5) treatmentPriority.push('Professional cleaning + patient education');

    // FOLLOW-UP SCHEDULE
    let followupInterval: string;
    if (riskLevel === 'high') {
      followupInterval = 'Every 3 months';
    } else if (riskLevel === 'moderate') {
      followupInterval = 'Every 6 months';
    } else {
      followupInterval = 'Annual';
    }

    const result = {
      overallRisk: `${colorEmoji} ${riskLevel.toUpperCase()}`,
      riskScore: {
        total: riskScore,
        breakdown: {
          plaqueIndex: plaqueIndex > 1 ? 2 : plaqueIndex > 0.5 ? 1 : 0,
          bleedingIndex: bleedingIndex > 1 ? 2 : bleedingIndex > 0.5 ? 1 : 0,
          cavityCount: Math.min(cavityCount, 4),
          ...riskModifiers,
        },
      },
      healthGrade,
      urgency: urgencyLevel,
      recommendations,
      treatmentPlan: {
        priority: treatmentPriority,
        estimatedVisits: riskLevel === 'high' ? 4 : riskLevel === 'moderate' ? 2 : 1,
        estimatedCost:
          riskLevel === 'high' ? '$500-1000' : riskLevel === 'moderate' ? '$200-500' : '$50-150',
      },
      followupSchedule: followupInterval,
      precautions:
        smokingStatus === 'active' ? '⚠️ Active smoker - Higher treatment complexity' : 'None noted',
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
