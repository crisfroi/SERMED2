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
    const { pathogenicGenes, familyHistoryCount, carrierStatus, ageAtOnset } = await req.json();

    if (!pathogenicGenes && !familyHistoryCount && !carrierStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing genetic data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let riskScore = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Risk stratification based on pathogenic findings
    if (pathogenicGenes && pathogenicGenes.length > 0) {
      pathogenicGenes.forEach((gene: string) => {
        riskScore += 30; // Each pathogenic gene adds 30 points
        factors.push(`🔴 Pathogenic mutation in ${gene}`);
        recommendations.push(`Consider surveillance for ${gene}-associated conditions`);
      });
    }

    // Family history risk
    if (familyHistoryCount >= 3) {
      riskScore += 30;
      factors.push('🟠 Strong family history (3+ affected relatives)');
      recommendations.push('Family cascade testing recommended');
    } else if (familyHistoryCount >= 2) {
      riskScore += 20;
      factors.push('🟡 Moderate family history (2 affected relatives)');
      recommendations.push('Consider testing other family members');
    } else if (familyHistoryCount >= 1) {
      riskScore += 10;
      factors.push('ℹ️ Light family history (1 affected relative)');
    }

    // Carrier status analysis
    if (carrierStatus && carrierStatus.length > 0) {
      const autosomalRecessiveCarriers = carrierStatus.filter(
        (gene: any) => gene.inheritance === 'autosomal_recessive'
      ).length;
      const autosomalDominantCarriers = carrierStatus.filter(
        (gene: any) => gene.inheritance === 'autosomal_dominant'
      ).length;

      if (autosomalDominantCarriers > 0) {
        riskScore += 25;
        factors.push(`⚠️ Autosomal dominant carrier(s) - ${autosomalDominantCarriers} gene(s)`);
        recommendations.push('50% transmission risk to offspring');
      }

      if (autosomalRecessiveCarriers >= 2) {
        riskScore += 15;
        factors.push(
          `ℹ️ Multiple recessive carriers - ${autosomalRecessiveCarriers} genes (carrier status only)`
        );
        recommendations.push('Partner testing recommended before conception');
      }
    }

    // Age of onset analysis
    if (ageAtOnset) {
      if (ageAtOnset < 30) {
        riskScore += 10;
        factors.push(`🔴 Early onset (age ${ageAtOnset}) suggests genetic component`);
      } else if (ageAtOnset > 60) {
        riskScore = Math.max(0, riskScore - 5);
        factors.push('✅ Late onset - suggests lower genetic risk');
      }
    }

    // Determine risk category
    let riskCategory: string;
    let riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
    let actionRequired: string;

    if (riskScore >= 75) {
      riskLevel = 'very_high';
      riskCategory = 'CRITICAL GENETIC RISK';
      actionRequired = '🔴 URGENT: Immediate genetic counseling and subspecialty referral';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
      riskCategory = 'HIGH GENETIC RISK';
      actionRequired = '🟠 Schedule genetic counseling within 1-2 weeks';
    } else if (riskScore >= 25) {
      riskLevel = 'moderate';
      riskCategory = 'MODERATE GENETIC RISK';
      actionRequired = '🟡 Genetic counseling suggested for informed decision-making';
    } else {
      riskLevel = 'low';
      riskCategory = 'LOW GENETIC RISK';
      actionRequired = '✅ Continue routine screening/surveillance';
    }

    // Add care recommendations based on risk level
    if (riskLevel === 'very_high' || riskLevel === 'high') {
      recommendations.push('Multidisciplinary team evaluation');
      recommendations.push('Genetic testing of first-degree relatives');
      recommendations.push('Regular clinical surveillance');
    }

    if (riskLevel !== 'low') {
      recommendations.push('Reproductive counseling before family planning');
      recommendations.push('Preconception carrier screening of partner');
    }

    const result = {
      riskScore,
      riskLevel,
      riskCategory,
      factors,
      recommendations,
      actionRequired,
      clinicalGuidelines: {
        screeningFrequency:
          riskLevel === 'very_high'
            ? 'Every 6-12 months'
            : riskLevel === 'high'
              ? 'Annually'
              : riskLevel === 'moderate'
                ? 'Every 1-2 years'
                : 'Every 3-5 years',
        subspecialtyReferral:
          riskLevel === 'very_high' || riskLevel === 'high' ? 'Clinical Genetics' : 'As needed',
        geneticCounselingStatus:
          riskLevel === 'very_high' || riskLevel === 'high' ? 'Highly Recommended' : 'Optional',
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
