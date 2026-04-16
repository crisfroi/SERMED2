/**
 * Edge Function: sync_process_queue
 * FASE A4: Process pending sync queue items
 * 
 * POST /functions/v1/sync_process_queue
 * Body: { hospital_id: string }
 * Returns: SyncResult { success, processed, synced, errors, conflicts, duration_ms }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface SyncQueueItem {
  id: string;
  tabla: string;
  accion: "INSERT" | "UPDATE" | "DELETE";
  registro_id: string;
  datos: Record<string, any>;
  hospital_id: string;
}

interface SyncResult {
  success: boolean;
  processed: number;
  synced: number;
  errors: number;
  conflicts: number;
  duration_ms: number;
  failed_items?: Array<{ id: string; tabla: string; error: string }>;
}

Deno.serve(async (req) => {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405 }
      );
    }

    const startTime = Date.now();
    const { hospital_id } = await req.json();

    if (!hospital_id) {
      return new Response(
        JSON.stringify({ error: "hospital_id required" }),
        { status: 400 }
      );
    }

    // Get pending items for this hospital
    const { data: pendingItems, error: fetchError } = await supabase
      .from("sync_queue")
      .select("*")
      .eq("hospital_id", hospital_id)
      .eq("estado", "PENDING")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching pending items:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch pending items" }),
        { status: 500 }
      );
    }

    let synced = 0;
    let errors = 0;
    let conflicts = 0;
    const failedItems: Array<{ id: string; tabla: string; error: string }> = [];

    // Process each item
    for (const item of pendingItems || []) {
      try {
        // Mark as PROCESSING
        await supabase
          .from("sync_queue")
          .update({ estado: "PROCESSING" })
          .eq("id", item.id);

        // Execute the operation based on accion
        let opError = null;

        if (item.accion === "INSERT") {
          const { error } = await supabase
            .from(item.tabla)
            .insert([item.datos]);
          opError = error;
        } else if (item.accion === "UPDATE") {
          const { error } = await supabase
            .from(item.tabla)
            .update(item.datos)
            .eq("id", item.registro_id);
          opError = error;
        } else if (item.accion === "DELETE") {
          const { error } = await supabase
            .from(item.tabla)
            .delete()
            .eq("id", item.registro_id);
          opError = error;
        }

        if (opError) {
          // Check if it's a conflict
          if (opError.message?.includes("conflict")) {
            await supabase
              .from("sync_queue")
              .update({ estado: "CONFLICT" })
              .eq("id", item.id);
            conflicts++;
          } else {
            await supabase
              .from("sync_queue")
              .update({
                estado: "ERROR",
                error_mensaje: opError.message,
                intento: (item.intento || 0) + 1,
              })
              .eq("id", item.id);
            errors++;
            failedItems.push({
              id: item.id,
              tabla: item.tabla,
              error: opError.message,
            });
          }
        } else {
          // Mark as SYNCED
          await supabase
            .from("sync_queue")
            .update({
              estado: "SYNCED",
              synced_at: new Date().toISOString(),
            })
            .eq("id", item.id);
          synced++;
        }
      } catch (err) {
        console.error(`Error processing item ${item.id}:`, err);
        errors++;
        failedItems.push({
          id: item.id,
          tabla: item.tabla,
          error: String(err),
        });
      }
    }

    // Log the operation
    const duration = Date.now() - startTime;
    await supabase.from("sync_log").insert([
      {
        hospital_id,
        operacion: "PROCESS_QUEUE",
        cantidad_items: pendingItems?.length || 0,
        cantidad_procesados: synced + errors + conflicts,
        cantidad_errores: errors,
        cantidad_conflictos: conflicts,
        duracion_ms: duration,
      },
    ]);

    const result: SyncResult = {
      success: errors === 0,
      processed: (pendingItems?.length || 0),
      synced,
      errors,
      conflicts,
      duration_ms: duration,
      ...(failedItems.length > 0 && { failed_items: failedItems }),
    };

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync_process_queue:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
