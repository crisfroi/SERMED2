import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SolicitudInterconsultaRequest {
  admision_id: string;
  paciente_id: string;
  especialidad: string;
  urgencia: "ROUTINE" | "SEMIURGENTE" | "URGENTE";
  motivo_consulta: string;
}

interface SolicitudInterconsultaResponse {
  interconsulta_id?: string;
  exito: boolean;
  mensaje: string;
  asignada?: boolean;
  especialista_id?: string | null;
  timestamp_asignacion?: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const body: SolicitudInterconsultaRequest = await req.json();

    // Validate required fields
    if (
      !body.admision_id ||
      !body.paciente_id ||
      !body.especialidad ||
      !body.urgencia ||
      !body.motivo_consulta
    ) {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje:
            "admision_id, paciente_id, especialidad, urgencia y motivo_consulta son requeridos",
        } as SolicitudInterconsultaResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate urgencia
    const urgenciasValidas = ["ROUTINE", "SEMIURGENTE", "URGENTE"];
    if (!urgenciasValidas.includes(body.urgencia)) {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje: `urgencia debe ser uno de: ${urgenciasValidas.join(", ")}`,
        } as SolicitudInterconsultaResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create interconsulta record
    const { data: interconsulta, error: interconsultaError } =
      await supabaseClient
        .from("interconsultas")
        .insert({
          admision_id: body.admision_id,
          paciente_id: body.paciente_id,
          especialidad_solicitada: body.especialidad,
          motivo_consulta: body.motivo_consulta,
          urgencia: body.urgencia,
          estado: "SOLICITADA",
          fecha_solicitud: new Date().toISOString(),
        })
        .select()
        .single();

    if (interconsultaError) {
      throw interconsultaError;
    }

    // If urgent, try to auto-assign available specialist
    let asignada = false;
    let especialista_id: string | null = null;
    let timestamp_asignacion: string | undefined;

    if (body.urgencia === "URGENTE") {
      // Get available specialists for this specialty
      const { data: specialists } = await supabaseClient
        .from("personal_medico")
        .select("id, nombre, especialidad")
        .eq("especialidad", body.especialidad)
        .eq("estado", "ACTIVO")
        .order("especialidad", { ascending: true })
        .limit(1);

      if (specialists && specialists.length > 0) {
        especialista_id = specialists[0].id;
        timestamp_asignacion = new Date().toISOString();
        asignada = true;

        // Update interconsulta with assignment
        const { error: updateError } = await supabaseClient
          .from("interconsultas")
          .update({
            estado: "ASIGNADA",
            especialista_id: especialista_id,
            fecha_asignacion: timestamp_asignacion,
          })
          .eq("id", interconsulta.id);

        if (updateError) {
          console.error("Error updating interconsulta assignment:", updateError);
        }

        // Notify specialist
        try {
          await supabaseClient.from("notificaciones").insert({
            usuario_id: especialista_id,
            tipo: "INTERCONSULTA_ASIGNADA",
            titulo: "Nueva interconsulta asignada",
            descripcion: `Interconsulta urgent ${body.especialidad} en paciente ${body.paciente_id}: ${body.motivo_consulta}`,
            url: `/interconsulta/${interconsulta.id}`,
            leida: false,
          });
        } catch (e) {
          console.error("Notification failed (non-critical):", e);
        }
      }
    }

    // Log in audit table
    try {
      await supabaseClient.from("audit_log").insert({
        tabla: "interconsultas",
        accion: "CREATE",
        registro_id: interconsulta.id,
        datos: JSON.stringify(body),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Audit log failed (non-critical):", e);
    }

    return new Response(
      JSON.stringify({
        interconsulta_id: interconsulta.id,
        exito: true,
        mensaje: asignada
          ? `Interconsulta ${body.especialidad} creada y asignada automáticamente`
          : `Interconsulta ${body.especialidad} creada y pendiente de asignación`,
        asignada,
        especialista_id,
        timestamp_asignacion,
      } as SolicitudInterconsultaResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        exito: false,
        mensaje: `Error solicitando interconsulta: ${error.message}`,
      } as SolicitudInterconsultaResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
