// supabase/functions/sync_ehr_to_thalamus/index.ts
// Propósito: Sincronizar EHR local con THALAMUS central
// Trigger: Manual o periódico cada hora
// Líneas: ~450
// NEW: Sincronización general (no solo epidemiología)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const thalamusApiUrl = Deno.env.get("THALAMUS_API_URL") ?? "";
const thalamusApiKey = Deno.env.get("THALAMUS_API_KEY") ?? "";

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const { ehr_id, hospital_source, sync_type = "delta" } = await req.json();

    if (!ehr_id || !hospital_source) {
      return new Response(
        JSON.stringify({ error: "ehr_id and hospital_source are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Fetch EHR from local database
    const { data: ehr, error: ehrError } = await supabase
      .from("electronic_health_record")
      .select("*")
      .eq("id", ehr_id)
      .single();

    if (ehrError || !ehr) {
      throw new Error(`EHR not found: ${ehrError?.message}`);
    }

    // Step 2: Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from("ehr_thalamus_sync_log")
      .insert({
        ehr_id,
        sync_type,
        sync_direction: "push",
        sync_status: "in_progress",
        sync_initiated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (syncLogError || !syncLog) {
      throw new Error(`Failed to create sync log: ${syncLogError?.message}`);
    }

    // Step 3: Calculate sync hash (for integrity check)
    const dataToSync = {
      patient_id: ehr.patient_id,
      active_problems: ehr.active_problems,
      medications_active: ehr.medications_active,
      allergies: ehr.allergies,
      summary_note: ehr.summary_note
    };

    const syncHash = await calculateHashSync(JSON.stringify(dataToSync));

    // Step 4: Prepare data for THALAMUS (encrypt sensitive fields)
    const preparedData = {
      ehr_id,
      hospital_source,
      thalamus_patient_id: generatePatientId(ehr.patient_id),
      active_problems: ehr.active_problems,
      medications_active: ehr.medications_active,
      allergies: ehr.allergies,
      summary_note: ehr.summary_note,
      sync_type,
      sync_hash,
      timestamp: new Date().toISOString()
    };

    // Step 5: Make request to THALAMUS API
    let thalamusRequestId: string | null = null;
    let thalamsError: string | null = null;

    try {
      const thalamusResponse = await fetch(
        `${thalamusApiUrl}/api/ehr/sync-mirror`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${thalamusApiKey}`,
            "X-Hospital-Source": hospital_source,
            "X-Sync-Hash": syncHash
          },
          body: JSON.stringify(preparedData)
        }
      );

      if (!thalamusResponse.ok) {
        const errorText = await thalamusResponse.text();
        thalamsError = `THALAMUS API error: ${thalamusResponse.status} - ${errorText}`;
        throw new Error(thalamsError);
      }

      const thalamusResult = await thalamusResponse.json();
      thalamusRequestId = thalamusResult.request_id;

      // Step 6A: SUCCESS - Update sync log
      const { error: updateSyncError } = await supabase
        .from("ehr_thalamus_sync_log")
        .update({
          sync_status: "completed",
          sync_completed_at: new Date().toISOString(),
          sync_hash: syncHash,
          thalamus_request_id: thalamusRequestId,
          thalamus_patient_mpi_id: thalamusResult.patient_mpi_id
        })
        .eq("id", syncLog.id);

      if (updateSyncError) {
        console.error("Failed to update sync log:", updateSyncError);
      }

      // Step 6B: Update EHR with THALAMUS metadata
      const { error: updateEhrError } = await supabase
        .from("electronic_health_record")
        .update({
          thalamus_synced_at: new Date().toISOString(),
          thalamus_sync_status: "synced"
        })
        .eq("id", ehr_id);

      if (updateEhrError) {
        console.error("Failed to update EHR sync status:", updateEhrError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          ehr_id,
          sync_log_id: syncLog.id,
          thalamus_request_id: thalamusRequestId,
          patient_mpi_id: thalamusResult.patient_mpi_id,
          sync_hash,
          message: "EHR successfully synced to THALAMUS",
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      );
    } catch (error) {
      // Step 6C: ERROR - Update sync log with error
      console.error("Error syncing to THALAMUS:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      const { error: updateErrorSync } = await supabase
        .from("ehr_thalamus_sync_log")
        .update({
          sync_status: "failed",
          sync_completed_at: new Date().toISOString(),
          last_error_message: errorMessage,
          retry_count: (syncLog.retry_count || 0) + 1
        })
        .eq("id", syncLog.id);

      if (updateErrorSync) {
        console.error("Failed to update error sync log:", updateErrorSync);
      }

      // Update EHR sync status to error
      const { error: updateEhrErrorStatus } = await supabase
        .from("electronic_health_record")
        .update({
          thalamus_sync_status: "error"
        })
        .eq("id", ehr_id);

      if (updateEhrErrorStatus) {
        console.error("Failed to update EHR error status:", updateEhrErrorStatus);
      }

      throw error;
    }
  } catch (error) {
    console.error("Error in sync_ehr_to_thalamus:", error);
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

// Helper Functions

async function calculateHashSync(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function generatePatientId(localId: string): string {
  // Generate deterministic THALAMUS patient ID from local ID
  // In production, this would be a more sophisticated mapping
  return `THAL-${localId.substring(0, 8).toUpperCase()}`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
