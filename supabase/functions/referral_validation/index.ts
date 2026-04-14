// supabase/functions/referral_validation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ReferralRequest {
  id: string;
  patient_id: string;
}

interface ReferralCompletenessRequest {
  referral_id: string;
  clinical_indication: string;
  clinical_history?: string;
  relevant_exams?: string;
}

interface ReferralTimelinessRequest {
  referral_id: string;
  request_date: string;
  expected_response_date: string;
  response_received_date?: string;
}

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method === "POST") {
    try {
      const { action, payload } = await req.json();

      if (action === "validate_referral_completeness") {
        return validateReferralCompleteness(payload);
      } else if (action === "calculate_referral_timeliness") {
        return calculateReferralTimeliness(payload);
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

async function validateReferralCompleteness(req: ReferralCompletenessRequest) {
  const {referral_id, clinical_indication, clinical_history, relevant_exams} = req;

  const issues: string[] = [];
  let completeness_score = 100;

  // Check mandatory fields
  if (!clinical_indication || clinical_indication.trim().length < 20) {
    issues.push("Indicación clínica incompleta o muy breve");
    completeness_score -= 20;
  }

  if (!clinical_history || clinical_history.trim().length === 0) {
    issues.push("Historia clínica no documentada");
    completeness_score -= 15;
  }

  if (!relevant_exams || relevant_exams.trim().length === 0) {
    issues.push("Exámenes relevantes no reportados");
    completeness_score -= 15;
  }

  const is_complete = issues.length === 0;

  return new Response(
    JSON.stringify({
      referral_id,
      is_complete,
      completeness_score: Math.max(0, completeness_score),
      issues,
      recommendations: is_complete
        ? ["Referencia completa y lista para envío"]
        : ["Complete los campos faltantes antes de enviar"]
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200
    }
  );
}

async function calculateReferralTimeliness(req: ReferralTimelinessRequest) {
  const { referral_id, request_date, expected_response_date, response_received_date } = req;

  const expectedDate = new Date(expected_response_date);
  const requestDate = new Date(request_date);
  const daysDue = Math.ceil((expectedDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  let status = "on_track";
  let urgency = "normal";

  if (daysDue < 0) {
    status = "overdue";
    urgency = Math.abs(daysDue) > 7 ? "critical" : "high";
  } else if (daysDue < 2) {
    status = "urgent";
    urgency = "high";
  }

  let timeliness_score = 100;
  if (response_received_date) {
    const responseDate = new Date(response_received_date);
    const daysToRespond = Math.ceil((responseDate.getTime() - requestDate.getTime()) / (1000 * 3600 * 24));
    const expectedDays = Math.ceil((expectedDate.getTime() - requestDate.getTime()) / (1000 * 3600 * 24));
    timeliness_score = Math.round((1 - Math.max(0, (daysToRespond - expectedDays) / expectedDays)) * 100);
  }

  return new Response(
    JSON.stringify({
      referral_id,
      days_remaining: daysDue,
      status,
      urgency,
      timeliness_score: Math.max(0, timeliness_score),
      recommendation: 
        status === "overdue"
          ? "Referencia vencida. Seguimiento inmediato requerido."
          : status === "urgent"
          ? "Respuesta esperada pronto. Considere seguimiento proactivo."
          : "Referencia dentro del plazo estimado."
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200
    }
  );
}
