/**
 * Edge Function: cirugia_sync_to_quirofanos
 * FASE B2: Sync surgery requests to quirófanos module
 * Scheduled: Every 3 minutes
 * 
 * POST /functions/v1/cirugia_sync_to_quirofanos
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

    console.log("🏥 Syncing pending surgeries to quirófanos...");

    // Get all pending procedures (not yet scheduled)
    const { data: procedures, error: procedureError } = await supabase
      .from("procedimientos")
      .select(
        `
        id, hospital_id, paciente_id, admision_id, especialidad, 
        diagnostico, procedimientos, prioridad, fecha_solicitud,
        medico_solicitante_id, notas_preoperatorio, estado
      `
      )
      .in("estado", ["PROGRAMACION", "PREOPERATORIO_OK"])
      .order("prioridad", { ascending: false })
      .order("fecha_solicitud", { ascending: true })
      .limit(50);

    if (procedureError) {
      console.error("Error fetching procedures:", procedureError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch procedures" }),
        { status: 500 }
      );
    }

    if (!procedures || procedures.length === 0) {
      console.log("✓ No procedures to sync");
      return new Response(
        JSON.stringify({
          success: true,
          synced: 0,
          skipped: 0,
          errors: 0,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${procedures.length} pending procedures...`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const procedure of procedures) {
      try {
        // Check if programacion already exists
        const { data: existingProg, error: checkError } = await supabase
          .from("programaciones")
          .select("id")
          .eq("procedimiento_id", procedure.id)
          .limit(1);

        if (existingProg && existingProg.length > 0) {
          console.log(
            `  ✓ Programación already exists for procedure ${procedure.id}`
          );
          skipped++;
          continue;
        }

        // Get default quirófano for this especialidad
        const { data: quirofano, error: qError } = await supabase
          .from("quirofanos")
          .select("id, nombre, bloque_id, sala_numero")
          .eq("hospital_id", procedure.hospital_id)
          .eq("especialidad", procedure.especialidad)
          .eq("disponible", true)
          .limit(1);

        if (qError || !quirofano || quirofano.length === 0) {
          console.warn(
            `  ⚠️ No available quirófano for ${procedure.especialidad} in hospital ${procedure.hospital_id}`
          );
          errors++;
          continue;
        }

        // Create programación (pending doctor approval)
        const { error: progError } = await supabase
          .from("programaciones")
          .insert([
            {
              hospital_id: procedure.hospital_id,
              procedimiento_id: procedure.id,
              paciente_id: procedure.paciente_id,
              admision_id: procedure.admision_id,
              quirofano_id: quirofano[0].id,
              bloque_id: quirofano[0].bloque_id,
              especialidad: procedure.especialidad,
              estado: "PENDIENTE_PROGRAMACION",
              prioridad: procedure.prioridad,
              diagnostico_preoperatorio: procedure.diagnostico,
              procedimientos_propuestos: procedure.procedimientos || [],
              notas_programacion: `Transferido desde hospitalización. ${procedure.notas_preoperatorio || ""}`,
              fecha_creacion: new Date().toISOString(),
              medico_responsable_id: procedure.medico_solicitante_id,
            },
          ]);

        if (progError) {
          console.error(
            `Error creating programación for procedure ${procedure.id}:`,
            progError
          );
          errors++;
          continue;
        }

        // Update procedure estado
        await supabase
          .from("procedimientos")
          .update({ estado: "EN_QUIROFANOS" })
          .eq("id", procedure.id)
          .catch((err) => console.warn("Warning: Failed to update procedure:", err));

        synced++;
        console.log(
          `  ✅ Synced procedure ${procedure.id} to quirófano ${quirofano[0].nombre}`
        );
      } catch (err) {
        console.error(`Error processing procedure ${procedure.id}:`, err);
        errors++;
      }
    }

    // Log
    await supabase.from("sync_log").insert([
      {
        operacion: "CIRUGIA_SYNC",
        cantidad_items: procedures.length,
        cantidad_procesados: synced,
        cantidad_errores: errors,
        cantidad_conflictos: 0,
        duracion_ms: 0,
      },
    ]);

    console.log(
      `📊 Sync complete: ${synced} synced, ${skipped} skipped, ${errors} errors`
    );

    return new Response(
      JSON.stringify({
        success: errors === 0,
        synced,
        skipped,
        errors,
        total: procedures.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in cirugia_sync_to_quirofanos:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
