/**
 * Edge Function: admision_crear_hospitalizacion
 * FASE B1: Create hospitalization record when patient is admitted
 * 
 * Called from TriageForm when user clicks "ADMITIR PACIENTE"
 * POST /functions/v1/admision_crear_hospitalizacion
 * 
 * Body: {
 *   admision_id: string,
 *   paciente_id: string,
 *   hospital_id: string,
 *   cama_id?: string,
 *   especialidad: string,
 *   diagnostico_inicial: string,
 *   medico_responsable_id: string,
 *   notas_ingreso?: string
 * }
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

    const {
      admision_id,
      paciente_id,
      hospital_id,
      cama_id,
      especialidad,
      diagnostico_inicial,
      medico_responsable_id,
      notas_ingreso,
    } = await req.json();

    // Validate required fields
    if (
      !admision_id ||
      !paciente_id ||
      !hospital_id ||
      !especialidad ||
      !medico_responsable_id
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    console.log(
      `📋 Creating hospitalization for patient: ${paciente_id} in hospital: ${hospital_id}`
    );

    // 1. Update admision estado to INTERNADO
    const { error: admisionError } = await supabase
      .from("admisiones")
      .update({
        estado: "INTERNADO",
        fecha_internamiento: new Date().toISOString(),
      })
      .eq("id", admision_id);

    if (admisionError) {
      console.error("Error updating admisión:", admisionError);
      return new Response(
        JSON.stringify({ error: "Failed to update admisión" }),
        { status: 500 }
      );
    }

    // 2. Create kardex entry (first nursing record)
    const kardex_id = crypto.randomUUID();
    const { error: kardexError } = await supabase
      .from("kardex")
      .insert([
        {
          id: kardex_id,
          hospital_id,
          paciente_id,
          admision_id,
          turno_fecha: new Date().toISOString(),
          especialidad,
          diagnostico_principal: diagnostico_inicial,
          diagnosticos_secundarios: [],
          medico_responsable_id,
          estado_paciente: "STABLE",
          observaciones_generales: notas_ingreso || "Paciente admitido en servicio",
          estado: "ACTIVO",
        },
      ]);

    if (kardexError) {
      console.error("Error creating kardex:", kardexError);
      // Revert admisión update
      await supabase
        .from("admisiones")
        .update({ estado: "PENDIENTE" })
        .eq("id", admision_id);

      return new Response(
        JSON.stringify({ error: "Failed to create kardex" }),
        { status: 500 }
      );
    }

    // 3. Create initial vital signs record if cama_id provided
    if (cama_id) {
      const { error: camaError } = await supabase
        .from("movimientos_cama")
        .insert([
          {
            hospital_id,
            paciente_id,
            admision_id,
            cama_id,
            accion: "INGRESO",
            fecha_movimiento: new Date().toISOString(),
            responsable_id: medico_responsable_id,
            notas: `Paciente asignado a cama ${cama_id} al ingresar`,
          },
        ]);

      if (camaError) {
        console.error("Error creating cama movement:", camaError);
        // Don't fail - kardex was created successfully
      }
    }

    // 4. Log in sync_log
    await supabase.from("sync_log").insert([
      {
        hospital_id,
        operacion: "ADMISION_TO_HOSPITALIZACION",
        cantidad_items: 1,
        cantidad_procesados: 1,
        cantidad_errores: 0,
        cantidad_conflictos: 0,
        duracion_ms: 0,
      },
    ]);

    // 5. Broadcast notification
    await supabase.from("sync_notifications").insert([
      {
        hospital_id,
        tipo: "ADMISION_CREATED",
        mensaje: `Paciente ${paciente_id} admitido en ${especialidad}`,
        datos: {
          paciente_id,
          admision_id,
          kardex_id,
          especialidad,
        },
      },
    ]);

    console.log(
      `✅ Hospitalization created for patient: ${paciente_id}, kardex: ${kardex_id}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        kardex_id,
        admision_id,
        message: "Paciente admitido exitosamente",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error in admision_crear_hospitalizacion:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
