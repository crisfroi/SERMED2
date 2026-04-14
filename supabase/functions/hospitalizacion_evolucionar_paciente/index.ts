import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EvolvePatientRequest {
  admision_id: string;
  paciente_id: string;
  tipo: "MEDICA" | "ENFERMERIA" | "PSICOLOGIA" | "NUTRICION";
  texto_evolucion: string;
  auto_sign?: boolean;
  medico_id?: string;
}

interface EvolvePatientResponse {
  evolucion_id?: string;
  exito: boolean;
  mensaje: string;
  estado?: "BORRADOR" | "FIRMADO";
  puede_egresar?: boolean;
  criterios_egreso?: {
    estable_vitales: boolean;
    sin_infecciones: boolean;
    sin_complicaciones: boolean;
    ambulation?: boolean;
    tolerancia_oral?: boolean;
  };
}

// Discharge criteria checker
async function checkEgresoReadiness(
  supabaseClient: any,
  admision_id: string
): Promise<{
  puede_egresar: boolean;
  criterios: {
    estable_vitales: boolean;
    sin_infecciones: boolean;
    sin_complicaciones: boolean;
    ambulation: boolean;
    tolerancia_oral: boolean;
  };
}> {
  try {
    // Get last 24h vitals
    const { data: vitales } = await supabaseClient
      .from("signos_vitales_historial")
      .select("*")
      .eq("admision_id", admision_id)
      .gte(
        "fecha",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      )
      .order("fecha", { ascending: false })
      .limit(12);

    const estable_vitales =
      vitales &&
      vitales.length >= 3 &&
      vitales.every(
        (v: any) =>
          v.fc &&
          v.fc >= 60 &&
          v.fc <= 100 &&
          v.ps &&
          v.ps >= 90 &&
          v.ps <= 140 &&
          v.temperatura >= 36.5 &&
          v.temperatura <= 37.5
      );

    // Check for active infections
    const { data: alertas } = await supabaseClient
      .from("alertas_medicas")
      .select("*")
      .eq("admision_id", admision_id)
      .eq("tipo_alerta", "INFECCION")
      .eq("activa", true);

    const sin_infecciones = !alertas || alertas.length === 0;

    // Check for complications
    const { data: complicaciones } = await supabaseClient
      .from("alertas_medicas")
      .select("*")
      .eq("admision_id", admision_id)
      .in("tipo_alerta", ["COMPLICACION", "SEVERA"])
      .eq("activa", true);

    const sin_complicaciones = !complicaciones || complicaciones.length === 0;

    // Check recent kardex for mobility and oral tolerance
    const { data: kardex } = await supabaseClient
      .from("kardex")
      .select("*")
      .eq("admision_id", admision_id)
      .order("fecha_kardex", { ascending: false })
      .limit(1)
      .single();

    const ambulation = kardex?.observaciones?.includes("deambula")
      ? true
      : false;
    const tolerancia_oral =
      kardex?.restricciones?.includes("NPO") === false ? true : false;

    // Patient is ready for discharge if:
    // 1. Vitals stable
    // 2. No infections
    // 3. No complications
    // 4. Can walk
    // 5. Tolerates oral

    const puede_egresar =
      estable_vitales &&
      sin_infecciones &&
      sin_complicaciones &&
      ambulation &&
      tolerancia_oral;

    return {
      puede_egresar,
      criterios: {
        estable_vitales: estable_vitales || false,
        sin_infecciones,
        sin_complicaciones,
        ambulation,
        tolerancia_oral,
      },
    };
  } catch (error) {
    console.error("Error checking egreso readiness:", error);
    return {
      puede_egresar: false,
      criterios: {
        estable_vitales: false,
        sin_infecciones: false,
        sin_complicaciones: false,
        ambulation: false,
        tolerancia_oral: false,
      },
    };
  }
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

    const body: EvolvePatientRequest = await req.json();

    // Validate required fields
    if (!body.admision_id || !body.paciente_id || !body.tipo || !body.texto_evolucion) {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje: "admision_id, paciente_id, tipo y texto_evolucion son requeridos",
        } as EvolvePatientResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate tipo
    const tiposValidos = ["MEDICA", "ENFERMERIA", "PSICOLOGIA", "NUTRICION"];
    if (!tiposValidos.includes(body.tipo)) {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje: `tipo debe ser uno de: ${tiposValidos.join(", ")}`,
        } as EvolvePatientResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create evolution record
    const estado = body.auto_sign ? "FIRMADO" : "BORRADOR";

    const { data: evolucion, error: evolucionError } = await supabaseClient
      .from("evoluciones")
      .insert({
        admision_id: body.admision_id,
        paciente_id: body.paciente_id,
        tipo: body.tipo,
        texto_evolucion: body.texto_evolucion,
        estado: estado,
        medico_id: body.medico_id || null,
        fecha_evolucion: new Date().toISOString(),
        fecha_firma: body.auto_sign ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (evolucionError) {
      throw evolucionError;
    }

    // Update admision with last evolution timestamp
    await supabaseClient
      .from("admisiones")
      .update({ fecha_ultima_evolucion: new Date().toISOString() })
      .eq("id", body.admision_id);

    // Check discharge readiness
    const { puede_egresar, criterios: criterios_egreso } =
      await checkEgresoReadiness(supabaseClient, body.admision_id);

    // If can discharge and is medical evolution, notify
    if (puede_egresar && body.tipo === "MEDICA") {
      try {
        // Create notification
        await supabaseClient.from("notificaciones").insert({
          tipo: "EGRESO_READY",
          titulo: "Paciente listo para egreso",
          descripcion: `Paciente ${body.paciente_id} en admisión ${body.admision_id} cumple criterios de egreso`,
          url: `/admision/${body.admision_id}`,
          leida: false,
        });
      } catch (e) {
        console.error("Notification creation failed (non-critical):", e);
      }
    }

    // Log in audit table
    try {
      await supabaseClient.from("audit_log").insert({
        tabla: "evoluciones",
        accion: "CREATE",
        registro_id: evolucion.id,
        datos: JSON.stringify(body),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Audit log failed (non-critical):", e);
    }

    return new Response(
      JSON.stringify({
        evolucion_id: evolucion.id,
        exito: true,
        mensaje: `Evolución ${body.tipo} creada y ${body.auto_sign ? "firmada" : "guardada como borrador"}`,
        estado: estado,
        puede_egresar,
        criterios_egreso,
      } as EvolvePatientResponse),
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
        mensaje: `Error creando evolución: ${error.message}`,
      } as EvolvePatientResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
