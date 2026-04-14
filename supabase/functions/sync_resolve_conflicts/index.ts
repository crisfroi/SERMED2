/**
 * Edge Function: sync_resolve_conflicts
 * FASE A4: Resolve conflicts between local and server versions
 * 
 * POST /functions/v1/sync_resolve_conflicts
 * Body: { conflict_id: string, strategy: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED', merged_data?: object }
 * Returns: { success: boolean, resolved: boolean, applied_version: object }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405 }
      );
    }

    const { conflict_id, strategy, merged_data, usuario_id } = await req.json();

    if (!conflict_id || !strategy) {
      return new Response(
        JSON.stringify({ error: "conflict_id and strategy required" }),
        { status: 400 }
      );
    }

    if (!["LOCAL_WINS", "SERVER_WINS", "MERGED"].includes(strategy)) {
      return new Response(
        JSON.stringify({ error: "Invalid strategy" }),
        { status: 400 }
      );
    }

    // Get conflict record
    const { data: conflict, error: getError } = await supabase
      .from("sync_conflicts")
      .select("*")
      .eq("id", conflict_id)
      .single();

    if (getError || !conflict) {
      return new Response(
        JSON.stringify({ error: "Conflict not found" }),
        { status: 404 }
      );
    }

    // Determine which version to apply
    let appliedVersion = conflict.server_version;

    if (strategy === "LOCAL_WINS") {
      appliedVersion = conflict.local_version;
    } else if (strategy === "MERGED") {
      appliedVersion = merged_data || conflict.server_version;
    }
    // SERVER_WINS uses default (server_version)

    // Update conflict record
    const { error: updateError } = await supabase
      .from("sync_conflicts")
      .update({
        resuelto: true,
        resolucion: strategy,
        resuelto_por: usuario_id,
        resuelto_en: new Date().toISOString(),
      })
      .eq("id", conflict_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update conflict" }),
        { status: 500 }
      );
    }

    // Apply to actual table
    const { tabla, registro_id } = conflict;

    if (strategy === "DELETE") {
      // Handle DELETE case
      await supabase
        .from(tabla)
        .delete()
        .eq("id", registro_id);
    } else {
      // INSERT/UPDATE
      const { error: applyError } = await supabase
        .from(tabla)
        .upsert([{ id: registro_id, ...appliedVersion }]);

      if (applyError) {
        console.error("Error applying resolved version:", applyError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        resolved: true,
        applied_version: appliedVersion,
        strategy,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync_resolve_conflicts:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
