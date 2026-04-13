// supabase/functions/log_ehr_access/index.ts
// Propósito: Registrar acceso a HCE (HIPAA audit trail)
// Trigger: Cada vez que se accede a EHR
// Líneas: ~250

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const requestBody = await req.json();
    const {
      ehr_id,
      accessed_by,
      access_type,
      reason,
      ip_address,
      user_agent,
      data_accessed
    } = requestBody;

    // Validate required fields
    if (!ehr_id || !accessed_by || !access_type) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: ehr_id, accessed_by, access_type"
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Validate EHR exists
    const { data: ehr, error: ehrError } = await supabase
      .from("electronic_health_record")
      .select("id")
      .eq("id", ehr_id)
      .single();

    if (ehrError || !ehr) {
      return new Response(
        JSON.stringify({ error: "EHR not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Step 2: Verify access is authorized
    const { data: user, error: userError } = await supabase
      .from("auth.users")
      .select("id, role")
      .eq("id", accessed_by)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Step 3: Check access permissions based on role
    let isAuthorized = false;
    const { data: assignment } = await supabase
      .from("patient_assignments")
      .select("*")
      .eq("patient_id", requestBody.patient_id)
      .eq("assigned_to", accessed_by)
      .single()
      .catch(() => ({ data: null }));

    if (assignment || user.role === "admin" || user.role === "system") {
      isAuthorized = true;
    }

    // Step 4: If not authorized, log denial
    if (!isAuthorized) {
      const { error: denialError } = await supabase
        .from("ehr_access_log")
        .insert({
          ehr_id,
          accessed_by,
          access_type,
          reason: reason || "unauthorized_attempt",
          ip_address: ip_address || "unknown",
          user_agent: user_agent || null,
          duration_seconds: 0,
          status: "denied",
          denial_reason: "Insufficient permissions"
        });

      if (denialError) {
        console.error("Failed to log denied access:", denialError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: "Unauthorized access",
          logged: true
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Step 5: Log authorized access
    const startTime = Date.now();
    const duration = Math.floor((Date.now() - startTime) / 1000);

    const { data: log, error: logError } = await supabase
      .from("ehr_access_log")
      .insert({
        ehr_id,
        accessed_by,
        access_type,
        reason: reason || "clinical_care",
        ip_address: ip_address || "unknown",
        user_agent: user_agent || null,
        duration_seconds: duration,
        status: "completed",
        data_accessed: data_accessed || {
          summary: true,
          episodes: false,
          documents: false
        }
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to log access: ${logError.message}`);
    }

    // Step 6: Check for suspicious patterns
    // Query last 10 accesses by this user to this EHR
    const { data: recentAccesses } = await supabase
      .from("ehr_access_log")
      .select("accessed_at")
      .eq("ehr_id", ehr_id)
      .eq("accessed_by", accessed_by)
      .order("accessed_at", { ascending: false })
      .limit(10)
      .catch(() => ({ data: [] }));

    let suspicious = false;
    if (recentAccesses && recentAccesses.length >= 3) {
      // Check if 3+ accesses in last 5 minutes (unusual pattern)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentCount = recentAccesses.filter(
        (a: any) => new Date(a.accessed_at) > fiveMinutesAgo
      ).length;

      if (recentCount >= 3) {
        suspicious = true;
        // Could trigger alert here
        console.warn(
          `Suspicious access pattern detected for user ${accessed_by} on EHR ${ehr_id}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        log_id: log?.id,
        access_logged: true,
        suspicious_pattern_detected: suspicious,
        timestamp: new Date().toISOString()
      }),
      {
        status: 201,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error in log_ehr_access:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
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
