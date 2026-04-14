import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MoverCamaRequest {
  admision_id: string;
  cama_destino_id: string;
  motivo: string;
}

interface MoverCamaResponse {
  exito: boolean;
  mensaje: string;
  cama_anterior?: string;
  cama_nueva?: string;
  timestamp?: string;
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

    const body: MoverCamaRequest = await req.json();

    // Validate required fields
    if (!body.admision_id || !body.cama_destino_id || !body.motivo) {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje:
            "admision_id, cama_destino_id y motivo son requeridos",
        } as MoverCamaResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get current admision with current bed
    const { data: admision, error: admisionError } = await supabaseClient
      .from("admisiones")
      .select("id, cama_asignada")
      .eq("id", body.admision_id)
      .single();

    if (admisionError || !admision) {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje: "Admisión no encontrada",
        } as MoverCamaResponse),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cama_anterior = admision.cama_asignada;

    // Verify destination bed exists and is available
    const { data: camaDest, error: camaDestError } = await supabaseClient
      .from("camas")
      .select("id, numero, estado")
      .eq("id", body.cama_destino_id)
      .single();

    if (camaDestError || !camaDest) {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje: "Cama destino no encontrada",
        } as MoverCamaResponse),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (camaDest.estado !== "DISPONIBLE") {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje: `Cama ${camaDest.numero} no está disponible (estado: ${camaDest.estado})`,
        } as MoverCamaResponse),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update admision with new bed
    const { error: updateAdmisionError } = await supabaseClient
      .from("admisiones")
      .update({ cama_asignada: body.cama_destino_id })
      .eq("id", body.admision_id);

    if (updateAdmisionError) {
      throw updateAdmisionError;
    }

    // Mark new bed as OCUPADA
    const { error: updateCamaDestError } = await supabaseClient
      .from("camas")
      .update({ estado: "OCUPADA" })
      .eq("id", body.cama_destino_id);

    if (updateCamaDestError) {
      throw updateCamaDestError;
    }

    // Mark old bed as DISPONIBLE (if exists)
    if (cama_anterior) {
      const { error: updateCamaAntError } = await supabaseClient
        .from("camas")
        .update({ estado: "DISPONIBLE" })
        .eq("id", cama_anterior);

      if (updateCamaAntError) {
        console.error("Error updating old bed status:", updateCamaAntError);
      }
    }

    // Create movement record
    const timestamp = new Date().toISOString();
    const { data: movimiento, error: movimientoError } = await supabaseClient
      .from("movimientos_cama")
      .insert({
        admision_id: body.admision_id,
        cama_origen_id: cama_anterior || null,
        cama_destino_id: body.cama_destino_id,
        motivo: body.motivo,
        fecha_movimiento: timestamp,
      })
      .select()
      .single();

    if (movimientoError) {
      console.error("Error creating movement record:", movimientoError);
    }

    // Log in audit table
    try {
      await supabaseClient.from("audit_log").insert({
        tabla: "movimientos_cama",
        accion: "CREATE",
        registro_id: movimiento?.id || null,
        datos: JSON.stringify(body),
        timestamp: timestamp,
      });
    } catch (e) {
      console.error("Audit log failed (non-critical):", e);
    }

    return new Response(
      JSON.stringify({
        exito: true,
        mensaje: `Paciente movido desde cama ${cama_anterior || "Sin asignar"} a cama ${camaDest.numero}`,
        cama_anterior: cama_anterior || "Sin asignar",
        cama_nueva: camaDest.numero,
        timestamp,
      } as MoverCamaResponse),
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
        mensaje: `Error moviendo paciente: ${error.message}`,
      } as MoverCamaResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
