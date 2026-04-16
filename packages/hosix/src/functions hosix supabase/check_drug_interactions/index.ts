// ============================================================================
// check_drug_interactions.ts - Edge Function
// ASIS 10.0 - Regímenes de Medicación - Drug-Drug Interaction Detection
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InteractionRequest {
  medication_ids: string[];
  include_disease_interactions?: boolean;
  diagnosis_codes?: string[];
}

interface Interaction {
  id: string;
  medication1_id: string;
  medication2_id: string;
  medication1_name: string;
  medication2_name: string;
  severity: 'critical' | 'moderate' | 'mild';
  interaction_type: string;
  description: string;
  mechanism: string;
  management: string;
  onset_time: string;
  evidence_level: string;
  evidence_url?: string;
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
      medication_ids,
      include_disease_interactions = false,
      diagnosis_codes = [],
    }: InteractionRequest = await req.json();

    const interactions: Interaction[] = [];

    // Validate input
    if (!medication_ids || medication_ids.length < 2) {
      return new Response(
        JSON.stringify({
          interactions: [],
          message: 'At least 2 medications required for interaction checking',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all medication pairs
    const pairs: [string, string][] = [];
    for (let i = 0; i < medication_ids.length; i++) {
      for (let j = i + 1; j < medication_ids.length; j++) {
        pairs.push([medication_ids[i], medication_ids[j]]);
      }
    }

    // Check each pair
    for (const [med1Id, med2Id] of pairs) {
      const { data: pairInteractions, error: err } = await supabase
        .from('medication_interactions')
        .select(
          `
          id,
          medication1_id,
          medication2_id,
          medications_1:medications(id,name),
          medications_2:medications(id,name),
          severity,
          interaction_type,
          description,
          mechanism,
          management,
          onset_time,
          evidence_level,
          evidence_url
        `
        )
        .or(`and(eq(medication1_id,${med1Id}),eq(medication2_id,${med2Id})),and(eq(medication1_id,${med2Id}),eq(medication2_id,${med1Id}))`);

      if (err) throw err;

      if (pairInteractions && pairInteractions.length > 0) {
        for (const interaction of pairInteractions) {
          interactions.push({
            id: interaction.id,
            medication1_id: interaction.medication1_id,
            medication2_id: interaction.medication2_id,
            medication1_name: interaction.medications_1?.name || 'Unknown',
            medication2_name: interaction.medications_2?.name || 'Unknown',
            severity: interaction.severity,
            interaction_type: interaction.interaction_type,
            description: interaction.description,
            mechanism: interaction.mechanism,
            management: interaction.management,
            onset_time: interaction.onset_time,
            evidence_level: interaction.evidence_level,
            evidence_url: interaction.evidence_url,
          });
        }
      }
    }

    // Check drug-disease interactions if requested
    if (include_disease_interactions && diagnosis_codes.length > 0) {
      for (const medId of medication_ids) {
        for (const diagCode of diagnosis_codes) {
          const { data: diseaseInteractions, error: diseaseErr } = await supabase
            .from('drug_disease_interactions')
            .select(
              `
              id,
              medication_id,
              medications(name),
              diagnosis_code,
              icd10_codes(description),
              contraindication_level,
              clinical_consequence,
              management_strategy,
              evidence_level
            `
            )
            .eq('medication_id', medId)
            .eq('diagnosis_code', diagCode)
            .limit(1);

          if (diseaseErr) throw diseaseErr;

          if (diseaseInteractions && diseaseInteractions.length > 0) {
            const diseaseInt = diseaseInteractions[0];
            interactions.push({
              id: diseaseInt.id,
              medication1_id: medId,
              medication2_id: diagCode,
              medication1_name: diseaseInt.medications?.name || 'Unknown',
              medication2_name: diseaseInt.icd10_codes?.description || 'Unknown',
              severity: diseaseInt.contraindication_level,
              interaction_type: 'drug-disease',
              description: diseaseInt.clinical_consequence,
              mechanism: 'Disease state interaction',
              management: diseaseInt.management_strategy,
              onset_time: 'Variable',
              evidence_level: diseaseInt.evidence_level,
            });
          }
        }
      }
    }

    // Categorize by severity
    const categorized = {
      critical: interactions.filter((i) => i.severity === 'critical'),
      moderate: interactions.filter((i) => i.severity === 'moderate'),
      mild: interactions.filter((i) => i.severity === 'mild'),
    };

    return new Response(
      JSON.stringify({
        total_interactions: interactions.length,
        by_severity: {
          critical: categorized.critical.length,
          moderate: categorized.moderate.length,
          mild: categorized.mild.length,
        },
        interactions: interactions.sort((a, b) => {
          const severityOrder = { critical: 0, moderate: 1, mild: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }),
        warning:
          categorized.critical.length > 0
            ? `${categorized.critical.length} critical interaction(s) detected. Clinical review required.`
            : null,
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
        error: error.message,
        interactions: [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
