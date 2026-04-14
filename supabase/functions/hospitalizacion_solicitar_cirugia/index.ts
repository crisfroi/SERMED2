/**
 * Edge Function: hospitalizacion_solicitar_cirugia
 * FASE B2: Create surgery request when patient needs operation
 * 
 * Called from Hospitalización module when "Solicitar Cirugía" button clicked
 * POST /functions/v1/hospitalizacion_solicitar_cirugia
 * 
 * Body: {
 *   paciente_id: string,
 *   hospital_id: string,
 *   admision_id: string,
 *   especialidad_quirurgica: string,
 *   diagnostico_quirurgico: string,
 *   tipo_cirugia: 'ELECTIVA' | 'URGENCIA' | 'EMERGENCIA',
 *   procedimientos_propuestos: string[],
 *   notas_preoperatorio: string,
 *   medico_solicitante_id: string,
 *   urgencia_estimada: number (1-10)
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
      paciente_id,
      hospital_id,
      admision_id,
      especialidad_quirurgica,
      diagnostico_quirurgico,
      tipo_cirugia,
      procedimientos_propuestos,
      notas_preoperatorio,
      medico_solicitante_id,
      urgencia_estimada,
    } = await req.json();

    // Validate
    if (
      !paciente_id ||
      !hospital_id ||
      !admision_id ||
      !especialidad_quirurgica ||
      !tipo_cirugia
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    console.log(
      `🏥 Creating surgery request for patient: ${paciente_id} in hospital: ${hospital_id}`
    );

    // Determine priority based on tipo_cirugia and urgencia
    let prioridad = "NORMAL";
    if (tipo_cirugia === "EMERGENCIA") prioridad = "CRITICA";
    else if (tipo_cirugia === "URGENCIA") prioridad = "ALTA";
    else if (urgencia_estimada >= 7) prioridad = "ALTA";

    // Create procedimiento record in quirofanos table
    const procedimiento_id = crypto.randomUUID();
    const { error: procedimientoError } = await supabase
      .from("procedimientos")
      .insert([
        {
          id: procedimiento_id,
          hospital_id,
          paciente_id,
          admision_id,
          especialidad: especialidad_quirurgica,
          tipo_procedimiento: "CIRUGIA",
          diagnostico: diagnostico_quirurgico,
          procedimientos: procedimientos_propuestos || [],
          estado: "PROGRAMACION",
          prioridad,
          fecha_solicitud: new Date().toISOString(),
          medico_solicitante_id,
          notas_preoperatorio,
          indicaciones_preoperatorio: [],
          contraindicaciones: [],
        },
      ]);

    if (procedimientoError) {
      console.error("Error creating procedimiento:", procedimientoError);
      return new Response(
        JSON.stringify({ error: "Failed to create surgery request" }),
        { status: 500 }
      );
    }

    // Create preoperatorio record
    const { error: preError } = await supabase
      .from("preoperatorio")
      .insert([
        {
          hospital_id,
          paciente_id,
          admision_id,
          procedimiento_id,
          estado: "EVALUACION",
          notas: notas_preoperatorio,
          estudios_complementarios: [],
          evaluacion_medica: false,
          evaluacion_anestesia: false,
          evaluacion_enfermeria: false,
          autorizacion_paciente: false,
        },
      ]);

    if (preError) {
      console.error("Error creating preoperatorio:", preError);
      // Don't fail - procedimiento was created
    }

    // Update admision with pending_surgery flag
    await supabase
      .from("admisiones")
      .update({
        cirugia_pendiente: true,
        fecha_cirugia_solicitada: new Date().toISOString(),
      })
      .eq("id", admision_id)
      .catch((err) => console.warn("Warning: Failed to update admision:", err));

    // Notify anesthesia team if urgent/emergency
    if (["URGENCIA", "EMERGENCIA"].includes(tipo_cirugia)) {
      await supabase
        .from("sync_notifications")
        .insert([
          {
            hospital_id,
            tipo: "CIRUGIA_URGENTE",
            mensaje: `Solicitud de cirugía ${tipo_cirugia.toLowerCase()}: ${especialidad_quirurgica}`,
            datos: {
              paciente_id,
              procedimiento_id,
              especialidad: especialidad_quirurgica,
              tipo: tipo_cirugia,
            },
          },
        ])
        .catch((err) => console.warn("Warning: Failed to create notification:", err));
    }

    // Log
    await supabase.from("sync_log").insert([
      {
        hospital_id,
        operacion: "CIRUGIA_SOLICITUD",
        cantidad_items: 1,
        cantidad_procesados: 1,
        cantidad_errores: 0,
        cantidad_conflictos: 0,
        duracion_ms: 0,
      },
    ]);

    console.log(
      `✅ Surgery request created: ${procedimiento_id} for patient: ${paciente_id}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        procedimiento_id,
        prioridad,
        estado: "PROGRAMACION",
        message: "Solicitud de cirugía creada exitosamente",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error in hospitalizacion_solicitar_cirugia:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
