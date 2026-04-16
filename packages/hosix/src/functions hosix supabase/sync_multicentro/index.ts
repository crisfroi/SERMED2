/**
 * Edge Function: sync_multicentro
 * FASE A4: Sync all hospitals (scheduled task)
 * 
 * Scheduled to run every 5 minutes
 * POST /functions/v1/sync_multicentro
 * Returns: { hospitals_synced: number, total_processed: number, errors: number }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface HospitalSyncResult {
  hospital_id: string;
  hospital_name: string;
  processed: number;
  synced: number;
  errors: number;
  conflicts: number;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405 }
      );
    }

    console.log("🏥 Starting multi-center sync...");

    // Get all active hospitals
    const { data: hospitals, error: hospitalsError } = await supabase
      .from("hospitals")
      .select("id, nombre, estado")
      .eq("estado", "activo");

    if (hospitalsError || !hospitals) {
      console.error("Error fetching hospitals:", hospitalsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch hospitals" }),
        { status: 500 }
      );
    }

    console.log(`Found ${hospitals.length} active hospitals`);

    const results: HospitalSyncResult[] = [];
    let totalProcessed = 0;
    let totalSynced = 0;
    let totalErrors = 0;
    let totalConflicts = 0;

    // Process each hospital
    for (const hospital of hospitals) {
      try {
        console.log(
          `Processing hospital: ${hospital.nombre} (${hospital.id})`
        );

        // Get pending items for this hospital
        const { data: pendingItems, error: fetchError } = await supabase
          .from("sync_queue")
          .select("*")
          .eq("hospital_id", hospital.id)
          .eq("estado", "PENDING")
          .order("created_at", { ascending: true })
          .limit(50);

        if (fetchError) {
          console.error(
            `Error fetching items for ${hospital.nombre}:`,
            fetchError
          );
          continue;
        }

        if (!pendingItems || pendingItems.length === 0) {
          console.log(`No pending items for ${hospital.nombre}`);
          continue;
        }

        let synced = 0;
        let errors = 0;
        let conflicts = 0;

        // Process each item
        for (const item of pendingItems) {
          try {
            await supabase
              .from("sync_queue")
              .update({ estado: "PROCESSING" })
              .eq("id", item.id);

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
              }
            } else {
              await supabase
                .from("sync_queue")
                .update({
                  estado: "SYNCED",
                  synced_at: new Date().toISOString(),
                })
                .eq("id", item.id);
              synced++;
            }
          } catch (itemError) {
            console.error(`Error processing item ${item.id}:`, itemError);
            errors++;
          }
        }

        results.push({
          hospital_id: hospital.id,
          hospital_name: hospital.nombre,
          processed: pendingItems.length,
          synced,
          errors,
          conflicts,
        });

        totalProcessed += pendingItems.length;
        totalSynced += synced;
        totalErrors += errors;
        totalConflicts += conflicts;

        console.log(
          `✅ ${hospital.nombre}: Synced ${synced}/${pendingItems.length}, Errors ${errors}, Conflicts ${conflicts}`
        );
      } catch (hospitalError) {
        console.error(`Error processing hospital ${hospital.nombre}:`, hospitalError);
      }
    }

    // Log overall operation
    await supabase.from("sync_log").insert([
      {
        operacion: "AUTO_SYNC",
        cantidad_items: results.reduce((sum, r) => sum + r.processed, 0),
        cantidad_procesados: totalProcessed,
        cantidad_errores: totalErrors,
        cantidad_conflictos: totalConflicts,
        duracion_ms: 0,
      },
    ]);

    // Send notification if there are errors
    if (totalErrors > 0) {
      console.warn(`⚠️ Sync completed with ${totalErrors} errors`);
    } else {
      console.log(`✅ All hospitals synced successfully`);
    }

    return new Response(
      JSON.stringify({
        success: totalErrors === 0,
        hospitals_synced: results.length,
        total_processed: totalProcessed,
        total_synced: totalSynced,
        errors: totalErrors,
        conflicts: totalConflicts,
        hospital_results: results,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync_multicentro:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
