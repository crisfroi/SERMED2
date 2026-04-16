// supabase/functions/lab_validation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface LabValidationRequest {
  test_id: string;
  result_value: number;
  reference_min: number;
  reference_max: number;
  critical_low: number;
  critical_high: number;
}

interface LabFollowupRequest {
  test_type: string;
  result_value: number;
  result_flag: string;
  patient_id: string;
}

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method === "POST") {
    try {
      const { action, payload } = await req.json();

      if (action === "validate_lab_test") {
        return validateLabTest(payload);
      } else if (action === "recommend_lab_followup") {
        return recommendLabFollowup(payload, supabase);
      }

      return new Response(
        JSON.stringify({ error: "Unknown action" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

async function validateLabTest(req: LabValidationRequest) {
  const { test_id, result_value, reference_min, reference_max, critical_low, critical_high } = req;

  let flag = "normal";
  let recommendation = "Resultado dentro de rango normal";

  if (result_value <= critical_low || result_value >= critical_high) {
    flag = result_value <= critical_low ? "critical_low" : "critical_high";
    recommendation = "⚠️ CRÍTICO - Requiere intervención inmediata. Notifique al médico responsable.";
  } else if (result_value < reference_min) {
    flag = "low";
    recommendation = "💛 Valor por debajo del rango. Considere interpretación clínica.";
  } else if (result_value > reference_max) {
    flag = "high";
    recommendation = "💛 Valor por encima del rango. Considere interpretación clínica.";
  }

  return new Response(
    JSON.stringify({
      test_id,
      flag,
      recommendation,
      validation_passed: flag === "normal",
      accuracy_score: calculateAccuracy(result_value, reference_min, reference_max)
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200
    }
  );
}

async function recommendLabFollowup(req: LabFollowupRequest, supabase: any) {
  const { test_type, result_value, result_flag, patient_id } = req;

  const recommendations: string[] = [];
  let followup_days = null;

  // Test-specific follow-up recommendations
  switch (test_type) {
    case "HEM": // Hemoglobin
      if (result_flag === "low") {
        recommendations.push("Evaluar causas de anemia", "Considerar transfusión si <7 g/dL");
        followup_days = 7;
      } else if (result_flag === "high") {
        recommendations.push("Evaluar policitemia", "Considerar flebotomía si >20 g/dL");
        followup_days = 14;
      }
      break;

    case "GLU": // Glucose
      if (result_flag === "high") {
        recommendations.push("Evaluar diabetes", "Repetir prueba en ayuno", "Considerar HbA1c");
        followup_days = 3;
      } else if (result_flag === "low") {
        recommendations.push("Síntomas de hipoglucemia", "Administrar glucosa rápida", "Repetir en 15 min");
        followup_days = 1;
      }
      break;

    case "CRE": // Creatinine
      if (result_flag === "high") {
        recommendations.push("Evaluar función renal", "Buscar nefrotoxinas", "Considerar diálisis");
        followup_days = 2;
      }
      break;

    case "TSH": // Thyroid
      if (result_flag !== "normal") {
        recommendations.push("Evaluar función tiroidea", "Considerar T3/T4 libre", "Repetir en 6-8 semanas");
        followup_days = 42;
      }
      break;

    default:
      recommendations.push("Repetir prueba si hay cambios clínicos", "Correlacionar con cuadro clínico");
      followup_days = 14;
  }

  // Log recommendation
  try {
    await supabase
      .from("lab_test_orders")
      .update({ updated_at: new Date().toISOString() })
      .eq("patient_id", patient_id);
  } catch (e) {
    console.log("Could not log recommendation:", e.message);
  }

  return new Response(
    JSON.stringify({
      patient_id,
      test_type,
      recommendations,
      suggested_followup_days: followup_days,
      priority: result_flag.includes("critical") ? "STAT" : "routine"
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200
    }
  );
}

function calculateAccuracy(value: number, min: number, max: number): number {
  if (value < min) return 100 - (((min - value) / min) * 100);
  if (value > max) return 100 - (((value - max) / max) * 100);
  return 100;
}
