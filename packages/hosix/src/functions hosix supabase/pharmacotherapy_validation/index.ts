// supabase/functions/pharmacotherapy_validation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PrescriptionValidationRequest {
  medication_id: string;
  patient_id: string;
  patient_allergies: string[];
  patient_age: number;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
}

interface DrugInteractionsRequest {
  new_medication_id: string;
  active_medication_ids: string[];
}

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method === "POST") {
    try {
      const { action, payload } = await req.json();

      if (action === "validate_prescription") {
        return validatePrescription(payload, supabase);
      } else if (action === "calculate_drug_interactions") {
        return calculateDrugInteractions(payload, supabase);
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

async function validatePrescription(
  req: PrescriptionValidationRequest,
  supabase: any
) {
  const { medication_id, patient_id, patient_allergies, patient_age, is_pregnant, is_breastfeeding } =
    req;

  const warnings: string[] = [];
  const recommendations: string[] = [];
  let prescription_ok = true;

  // Fetch medication details
  const { data: medData } = await supabase
    .from("medication_master")
    .select("*")
    .eq("id", medication_id)
    .single();

  if (!medData) {
    return new Response(
      JSON.stringify({ error: "Medication not found" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check allergies
  const allergyMatch = patient_allergies.some(allergy =>
    medData.contraindications?.toLowerCase().includes(allergy.toLowerCase())
  );

  if (allergyMatch) {
    warnings.push(
      "⚠️ ALERGIA CONOCIDA: El medicamento contiene sustancias a las que el paciente es alérgico"
    );
    prescription_ok = false;
  }

  // Check pregnancy category
  if (is_pregnant) {
    if (["X", "D"].includes(medData.pregnancy_category)) {
      warnings.push(
        `⚠️ EMBARAZO: Medicamento en categoría ${medData.pregnancy_category} - CONTRAINDICADO en embarazo`
      );
      prescription_ok = false;
    } else if (medData.pregnancy_category === "C") {
      recommendations.push("⚠️ Usar solo si beneficios superan los riesgos (Categoría C)");
    }
  }

  // Check breastfeeding compatibility
  if (is_breastfeeding) {
    if (medData.breastfeeding_compatibility === "contraindicated") {
      warnings.push(
        "⚠️ LACTANCIA: Medicamento está contraindicado durante la lactancia"
      );
      prescription_ok = false;
    } else if (medData.breastfeeding_compatibility === "caution") {
      recommendations.push("⚠️ Usar con precaución durante lactancia - monitorear bebé");
    }
  }

  // Check pediatric considerations
  if (patient_age < 18) {
    if (medData.special_precautions?.includes("pediatric")) {
      recommendations.push("⚠️ Ajustar dosis según edad: usar calculador pediátrico");
    }
  }

  return new Response(
    JSON.stringify({
      medication_id,
      patient_id,
      prescription_ok,
      warnings,
      recommendations,
      validation_score: prescription_ok ? 100 : 0,
      can_prescribe: prescription_ok
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200
    }
  );
}

async function calculateDrugInteractions(
  req: DrugInteractionsRequest,
  supabase: any
) {
  const { new_medication_id, active_medication_ids } = req;

  const interactions: any[] = [];
  const majorInteractions: any[] = [];

  // Check interactions with each active medication
  for (const activeMedId of active_medication_ids) {
    const { data: interactionData } = await supabase
      .from("medication_interactions")
      .select("*")
      .or(
        `and(or(medication_1_id.eq.${new_medication_id},medication_2_id.eq.${new_medication_id}),or(medication_1_id.eq.${activeMedId},medication_2_id.eq.${activeMedId}))`
      );

    if (interactionData) {
      interactions.push(...interactionData);
      majorInteractions.push(
        ...interactionData.filter(
          i => ["major", "contraindicated"].includes(i.interaction_severity)
        )
      );
    }
  }

  const has_contraindicated = majorInteractions.some(
    i => i.interaction_severity === "contraindicated"
  );
  const has_major = majorInteractions.some(i => i.interaction_severity === "major");

  return new Response(
    JSON.stringify({
      new_medication_id,
      total_interactions: interactions.length,
      major_interactions: majorInteractions.length,
      has_contraindicated,
      has_major,
      interactions: interactions.map(i => ({
        severity: i.interaction_severity,
        effect: i.clinical_effect,
        management: i.management_recommendation,
        monitoring_required: i.requires_monitoring
      })),
      risk_level: has_contraindicated ? "critical" : has_major ? "high" : "manageable",
      recommendation: has_contraindicated
        ? "❌ PRESCRIPCIÓN CONTRAINDICADA - Consulte farmacología clínica"
        : has_major
        ? "⚠️ Interacciones mayores detectadas - Requiere monitoreo cercano"
        : "✓ Sin interacciones significativas"
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200
    }
  );
}
