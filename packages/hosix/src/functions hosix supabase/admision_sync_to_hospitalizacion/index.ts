/**
 * Edge Function: admision_sync_to_hospitalizacion
 * FASE B1: Sync admitted patients to hospitalization module
 * Scheduled: Every 2 minutes
 * 
 * POST /functions/v1/admision_sync_to_hospitalizacion
 * Optional body: { hospital_id?: string }
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

    const body = await req.json().catch(() => ({}));
    const hospital_id = body.hospital_id;

    console.log(
      `🔄 Syncing admitted patients${hospital_id ? ` for ${hospital_id}` : " (all hospitals)"}`
    );

    // Get recently admitted patients (estado = INTERNADO, without kardex yet)
    let query = supabase
      .from("admisiones")
      .select(
        `
        id, paciente_id, hospital_id, cama_asignada, urgencia_clasificacion,
        medico_id, notas_triaje, fecha_admision, especialidad_asignada
      `
      )
      .eq("estado", "INTERNADO");

    if (hospital_id) {
      query = query.eq("hospital_id", hospital_id);
    }

    // Only get admissions from last 24 hours (avoid huge backlog)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("fecha_admision", oneDayAgo);
    query = query.order("fecha_admision", { ascending: false });

    const { data: admissions, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching admissions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch admissions" }),
        { status: 500 }
      );
    }

    if (!admissions || admissions.length === 0) {
      console.log("✓ No admissions to sync");
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

    console.log(`Processing ${admissions.length} admitted patients...`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const admission of admissions) {
      try {
        // Check if kardex already exists
        const { data: existingKardex, error: checkError } = await supabase
          .from("kardex")
          .select("id")
          .eq("admision_id", admission.id)
          .limit(1);

        if (existingKardex && existingKardex.length > 0) {
          console.log(`  ✓ Kardex already exists for admission ${admission.id}`);
          skipped++;
          continue;
        }

        // Create kardex entry
        const { error: kardexError } = await supabase
          .from("kardex")
          .insert([
            {
              hospital_id: admission.hospital_id,
              paciente_id: admission.paciente_id,
              admision_id: admission.id,
              turno_fecha: new Date().toISOString(),
              especialidad: admission.especialidad_asignada || "Medicina General",
              diagnostico_principal: "Pendiente de revisión",
              medico_responsable_id: admission.medico_id,
              estado_paciente: "STABLE",
              observaciones_generales: admission.notas_triaje || "Admitido desde triaje",
              estado: "ACTIVO",
            },
          ]);

        if (kardexError) {
          console.error(
            `Error creating kardex for admission ${admission.id}:`,
            kardexError
          );
          errors++;
          continue;
        }

        // Create cama movement if assigned
        if (admission.cama_asignada) {
          await supabase
            .from("movimientos_cama")
            .insert([
              {
                hospital_id: admission.hospital_id,
                paciente_id: admission.paciente_id,
                admision_id: admission.id,
                cama_id: admission.cama_asignada,
                accion: "INGRESO",
                fecha_movimiento: new Date().toISOString(),
                responsable_id: admission.medico_id,
                notas: `Admitido a cama ${admission.cama_asignada}`,
              },
            ])
            .catch((err) => {
              console.warn(`Warning: Failed to create cama movement:`, err);
            });
        }

        synced++;
        console.log(
          `  ✅ Synced admission ${admission.id} for patient ${admission.paciente_id}`
        );
      } catch (err) {
        console.error(`Error processing admission ${admission.id}:`, err);
        errors++;
      }
    }

    // Log operation
    await supabase
      .from("sync_log")
      .insert([
        {
          hospital_id: hospital_id || null,
          operacion: "ADMISION_SYNC",
          cantidad_items: admissions.length,
          cantidad_procesados: synced,
          cantidad_errores: errors,
          cantidad_conflictos: 0,
          duracion_ms: 0,
        },
      ])
      .catch((err) => {
        console.warn("Warning: Failed to log sync operation:", err);
      });

    console.log(
      `📊 Sync complete: ${synced} synced, ${skipped} skipped, ${errors} errors`
    );

    return new Response(
      JSON.stringify({
        success: errors === 0,
        synced,
        skipped,
        errors,
        total: admissions.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admision_sync_to_hospitalizacion:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
