// supabase/functions/consolidate_ehr_summary/index.ts
// Propósito: Consolidar resumen de Historia Médica Electrónica
// Trigger: Después de cada cambio en episodios o medicamentos
// Líneas: ~300

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  try {
    // CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const { ehr_id } = await req.json();

    if (!ehr_id) {
      return new Response(
        JSON.stringify({ error: "ehr_id is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Fetch EHR and all related episodes
    const { data: ehr, error: ehrError } = await supabase
      .from("electronic_health_record")
      .select("*")
      .eq("id", ehr_id)
      .single();

    if (ehrError || !ehr) {
      throw new Error(`EHR not found: ${ehrError?.message}`);
    }

    // Step 2: Fetch recent episodes (last year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: episodes, error: episodesError } = await supabase
      .from("ehr_episode_links")
      .select("*")
      .eq("ehr_id", ehr_id)
      .gte("episode_date", oneYearAgo.toISOString())
      .order("episode_date", { ascending: false });

    if (episodesError) {
      throw new Error(`Failed to fetch episodes: ${episodesError.message}`);
    }

    // Step 3: Build consolidated summary
    const problemsSet = new Set<string>();
    const medicationsSet = new Set<string>();
    let recentSummary = "";
    let episodeCount = 0;

    (episodes || []).forEach((ep: any) => {
      episodeCount++;
      if (ep.primary_diagnosis) {
        problemsSet.add(ep.primary_diagnosis);
      }
      if (ep.secondary_diagnoses && Array.isArray(ep.secondary_diagnoses)) {
        ep.secondary_diagnoses.forEach((d: string) => problemsSet.add(d));
      }
    });

    // Step 4: Build summary note
    const problems = Array.from(problemsSet);
    const medicationCount = ehr.medications_active?.length || 0;
    const allergyCount = ehr.allergies?.length || 0;

    const summaryNote = `Paciente con ${episodeCount} encuentro${episodeCount !== 1 ? "s" : ""} en el último año. ` +
      `Problemas activos: ${problems.length > 0 ? problems.join(", ") : "None documented"}. ` +
      `Medicamentos activos: ${medicationCount}. ` +
      `Alergias documentadas: ${allergyCount}.`;

    // Step 5: Update EHR with consolidated data
    const { error: updateError } = await supabase
      .from("electronic_health_record")
      .update({
        summary_note: summaryNote,
        active_problems: problems,
        last_summary_updated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", ehr_id);

    if (updateError) {
      throw new Error(`Failed to update EHR: ${updateError.message}`);
    }

    // Step 6: Create snapshot for history
    const { error: snapshotError } = await supabase
      .from("ehr_snapshot_history")
      .insert({
        ehr_id: ehr_id,
        snapshot_date: new Date().toISOString(),
        summary_note_snapshot: summaryNote,
        problems_list_snapshot: problems,
        medications_snapshot: ehr.medications_active || [],
        created_by: ehr.last_updated_by,
        snapshot_reason: "scheduled_consolidation"
      });

    if (snapshotError) {
      console.error(`Failed to create snapshot: ${snapshotError.message}`);
      // Don't throw - snapshot failure shouldn't block main operation
    }

    return new Response(
      JSON.stringify({
        success: true,
        ehr_id,
        summary_note: summaryNote,
        active_problems: problems,
        episodes_analyzed: episodeCount,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error in consolidate_ehr_summary:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
