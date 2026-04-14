import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateKardexRequest {
  admision_id: string;
  turno: "MANANA" | "TARDE" | "NOCHE";
  vitales: {
    fc?: number;
    ps?: number;
    pd?: number;
    fr?: number;
    temperatura?: number;
    sato2?: number;
    glasgow?: number;
    peso?: number;
    talla?: number;
  };
  medicamentos?: Array<{
    nombre: string;
    dosis: string;
    hora: string;
    via: string;
    observaciones?: string;
  }>;
  observaciones?: string;
  pendientes?: string[];
  restricciones?: string[];
}

interface CreateKardexResponse {
  kardex_id?: string;
  exito: boolean;
  mensaje: string;
  alertas_generadas?: Array<{
    tipo: string;
    severidad: string;
    vital: string;
    valor: number;
    rango_esperado: string;
  }>;
}

// Vital ranges for alert detection
const VITAL_RANGES = {
  fc: { min: 60, max: 100, critical_min: 40, critical_max: 130 },
  ps: { min: 90, max: 140, critical_min: 70, critical_max: 200 },
  pd: { min: 60, max: 90, critical_min: 40, critical_max: 120 },
  fr: { min: 12, max: 20, critical_min: 8, critical_max: 40 },
  temperatura: { min: 36, max: 37.5, critical_min: 35, critical_max: 39.5 },
  sato2: { min: 95, max: 100, critical_min: 85, critical_max: 100 },
  glasgow: { min: 15, max: 15, critical_min: 3, critical_max: 15 },
};

function detectarAnomalias(vitales: CreateKardexRequest["vitales"]): Array<{
  tipo: string;
  severidad: string;
  vital: string;
  valor: number;
  rango_esperado: string;
}> {
  const alertas: Array<{
    tipo: string;
    severidad: string;
    vital: string;
    valor: number;
    rango_esperado: string;
  }> = [];

  // FC validation
  if (vitales.fc) {
    const ranges = VITAL_RANGES.fc;
    let severidad = "LEVE";
    if (vitales.fc < ranges.critical_min || vitales.fc > ranges.critical_max) {
      severidad = "SEVERA";
    } else if (vitales.fc < ranges.min || vitales.fc > ranges.max) {
      severidad = "MODERADA";
    }

    if (severidad !== "LEVE") {
      alertas.push({
        tipo: "VITAL_ANORMAL",
        severidad,
        vital: "FRECUENCIA_CARDIACA",
        valor: vitales.fc,
        rango_esperado: `${ranges.min}-${ranges.max} bpm`,
      });
    }
  }

  // PS validation
  if (vitales.ps) {
    const ranges = VITAL_RANGES.ps;
    let severidad = "LEVE";
    if (vitales.ps < ranges.critical_min || vitales.ps > ranges.critical_max) {
      severidad = "SEVERA";
    } else if (vitales.ps < ranges.min || vitales.ps > ranges.max) {
      severidad = "MODERADA";
    }

    if (severidad !== "LEVE") {
      alertas.push({
        tipo: "VITAL_ANORMAL",
        severidad,
        vital: "PRESION_SISTOLICA",
        valor: vitales.ps,
        rango_esperado: `${ranges.min}-${ranges.max} mmHg`,
      });
    }
  }

  // Temperatura validation
  if (vitales.temperatura) {
    const ranges = VITAL_RANGES.temperatura;
    let severidad = "LEVE";
    if (
      vitales.temperatura < ranges.critical_min ||
      vitales.temperatura > ranges.critical_max
    ) {
      severidad = "SEVERA";
    } else if (
      vitales.temperatura < ranges.min ||
      vitales.temperatura > ranges.max
    ) {
      severidad = "MODERADA";
    }

    if (severidad !== "LEVE") {
      alertas.push({
        tipo: "VITAL_ANORMAL",
        severidad,
        vital: "TEMPERATURA",
        valor: vitales.temperatura,
        rango_esperado: `${ranges.min}-${ranges.max} °C`,
      });
    }
  }

  // SatO2 validation
  if (vitales.sato2) {
    if (vitales.sato2 < 90) {
      const severidad = vitales.sato2 < 85 ? "SEVERA" : "MODERADA";
      alertas.push({
        tipo: "VITAL_ANORMAL",
        severidad,
        vital: "SATURACION_OXIGENO",
        valor: vitales.sato2,
        rango_esperado: "≥ 95 %",
      });
    }
  }

  return alertas;
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

    const body: CreateKardexRequest = await req.json();

    // Validate required fields
    if (!body.admision_id || !body.turno) {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje: "admision_id y turno son requeridos",
        } as CreateKardexResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify turno is valid
    if (!["MANANA", "TARDE", "NOCHE"].includes(body.turno)) {
      return new Response(
        JSON.stringify({
          exito: false,
          mensaje: "turno debe ser MANANA, TARDE o NOCHE",
        } as CreateKardexResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Detect anomalies in vitals
    const alertas = detectarAnomalias(body.vitales);

    // Create kardex record
    const { data: kardex, error: kardexError } = await supabaseClient
      .from("kardex")
      .insert({
        admision_id: body.admision_id,
        fecha_kardex: new Date().toISOString().split("T")[0],
        turno: body.turno,

        // Vitals
        fc: body.vitales.fc || null,
        ps: body.vitales.ps || null,
        pd: body.vitales.pd || null,
        fr: body.vitales.fr || null,
        temperatura: body.vitales.temperatura || null,
        sato2: body.vitales.sato2 || null,
        glasgow: body.vitales.glasgow || null,
        peso: body.vitales.peso || null,
        talla: body.vitales.talla || null,

        // Text fields
        medicamentos_administrados: body.medicamentos || [],
        observaciones: body.observaciones || "",
        pendientes: body.pendientes || [],
        restricciones: body.restricciones || [],
        estado: "ACTIVO",
      })
      .select()
      .single();

    if (kardexError) {
      throw kardexError;
    }

    // Create alert records for anomalies detected
    if (alertas.length > 0) {
      const alertRecords = alertas.map((alerta) => ({
        admision_id: body.admision_id,
        tipo_alerta: "VITAL_ANORMAL",
        descripcion: `${alerta.vital}: ${alerta.valor} (rango: ${alerta.rango_esperado})`,
        severidad: alerta.severidad,
        activa: true,
      }));

      const { error: alertError } = await supabaseClient
        .from("alertas_medicas")
        .insert(alertRecords);

      if (alertError) {
        console.error("Error creating alerts:", alertError);
        // Don't fail the whole request if alerts fail
      }
    }

    // Log in audit table if exists
    try {
      await supabaseClient.from("audit_log").insert({
        tabla: "kardex",
        accion: "CREATE",
        registro_id: kardex.id,
        datos: JSON.stringify(body),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Audit log failed (non-critical):", e);
    }

    return new Response(
      JSON.stringify({
        kardex_id: kardex.id,
        exito: true,
        mensaje: `Kardex ${body.turno} creado exitosamente`,
        alertas_generadas: alertas,
      } as CreateKardexResponse),
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
        mensaje: `Error creando kardex: ${error.message}`,
      } as CreateKardexResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
