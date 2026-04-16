// supabase/functions/nutrition-validation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors_headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface NutritionAssessmentRequest {
  patient_id: string;
  weight_kg: number;
  height_cm: number;
  age_years: number;
  medical_conditions: string[];
  allergies: string[];
  medications: string[];
}

interface NutritionValidationResult {
  valid: boolean;
  bmi: number;
  bmi_category: string;
  risk_level: string;
  recommended_plan_type: string;
  caloric_goal: number;
  protein_target_g: number;
  carbs_target_g: number;
  fats_target_g: number;
  warnings: string[];
  recommendations: string[];
  drug_interactions: string[];
}

const CALORIC_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  vigorous: 1.725
}

const WEIGHT_STATUS_BMI = {
  underweight: { min: 0, max: 18.5 },
  normal: { min: 18.5, max: 25 },
  overweight: { min: 25, max: 30 },
  obese: { min: 30, max: 999 }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors_headers })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    )

    const payload = await req.json() as NutritionAssessmentRequest
    const result: NutritionValidationResult = {
      valid: true,
      bmi: 0,
      bmi_category: "",
      risk_level: "low",
      recommended_plan_type: "maintenance",
      caloric_goal: 2000,
      protein_target_g: 50,
      carbs_target_g: 300,
      fats_target_g: 65,
      warnings: [],
      recommendations: [],
      drug_interactions: []
    }

    // Calculate BMI
    const heightInMeters = payload.height_cm / 100
    result.bmi = Math.round((payload.weight_kg / (heightInMeters * heightInMeters)) * 10) / 10

    // Determine BMI category
    for (const [category, range] of Object.entries(WEIGHT_STATUS_BMI)) {
      if (result.bmi >= range.min && result.bmi < range.max) {
        result.bmi_category = category
        break
      }
    }

    // Assess nutritional risk
    let riskScore = 0
    if (result.bmi < 18.5) { riskScore += 2; result.warnings.push("Low BMI - malnutrition risk") }
    if (result.bmi > 35) { riskScore += 1; result.warnings.push("Elevated BMI - metabolic complications risk") }

    // Check medical conditions
    const malnutritionRiskConditions = ["cancer", "chronic_kidney_disease", "diabetes", "tuberculosis", "hiv_aids"]
    for (const condition of payload.medical_conditions) {
      if (malnutritionRiskConditions.includes(condition.toLowerCase())) {
        riskScore += 2
        result.recommendations.push(`Specialized nutrition plan required for ${condition}`)
      }
    }

    if (payload.medical_conditions.includes("diabetes")) {
      result.recommended_plan_type = "diabetic_diet"
    } else if (payload.medical_conditions.includes("chronic_kidney_disease")) {
      result.recommended_plan_type = "renal_diet"
    } else if (payload.medical_conditions.includes("heart_disease")) {
      result.recommended_plan_type = "cardiac_diet"
    } else if (result.bmi > 30) {
      result.recommended_plan_type = "weight_loss"
    } else if (result.bmi < 18.5) {
      result.recommended_plan_type = "weight_gain"
    }

    // Set risk level
    if (riskScore >= 4) { result.risk_level = "critical" }
    else if (riskScore >= 2) { result.risk_level = "high" }
    else if (riskScore >= 1) { result.risk_level = "moderate" }
    else { result.risk_level = "low" }

    // Calculate caloric goal (using Mifflin-St Jeor equation as base)
    let bmr: number
    if (payload.age_years >= 18) {
      // Adult: Mifflin-St Jeor
      bmr = 10 * payload.weight_kg + 6.25 * payload.height_cm - 5 * payload.age_years + 5 // for males
    } else {
      // Pediatric: use age-based calculation
      bmr = Math.max(300, payload.weight_kg * 24)
    }

    result.caloric_goal = Math.round(bmr * CALORIC_MULTIPLIERS.moderate)

    // Calculate macronutrient targets
    result.protein_target_g = Math.round((result.caloric_goal * 0.15) / 4)
    result.carbs_target_g = Math.round((result.caloric_goal * 0.55) / 4)
    result.fats_target_g = Math.round((result.caloric_goal * 0.30) / 9)

    // Check for food allergies/restrictions
    if (payload.allergies && payload.allergies.length > 0) {
      result.recommendations.push(`Exclude allergens: ${payload.allergies.join(", ")}`)
      
      // Check for common allergen interactions with medications
      if (payload.medications.includes("aspirin") && payload.allergies.includes("acetaminophen")) {
        result.drug_interactions.push("Avoid acetaminophen; use aspirin or NSAIDs instead (with caution)")
      }
    }

    // Check for drug-nutrient interactions
    const known_interactions: { [key: string]: string[] } = {
      "metformin": ["vitamin B12", "folate"],
      "warfarin": ["vitamin K foods (leafy greens)"],
      "statins": ["grapefruit", "CoQ10 (may interact)"],
      "diuretics": ["potassium, sodium management needed"],
      "lithium": ["sodium intake must remain consistent"],
      "levothyroxine": ["iron, calcium (take separately)"],
      "bisphosphonates": ["calcium supplements (wait 30 min after dose)"]
    }

    for (const med of payload.medications) {
      if (med.toLowerCase() in known_interactions) {
        result.drug_interactions.push(
          `${med}: Monitor ${known_interactions[med.toLowerCase()].join(", ")}`
        )
      }
    }

    // Special recommendations by condition
    if (payload.medical_conditions.includes("gastroesophageal_reflux")) {
      result.recommendations.push("Avoid spicy foods, citrus, chocolate, caffeine")
      result.recommendations.push("Eat frequent small meals; avoid eating 2-3 hours before sleep")
    }

    if (payload.medical_conditions.includes("celiac_disease")) {
      result.recommendations.push("Gluten-free diet required")
      result.recommendations.push("Screen all processed foods for gluten contamination")
    }

    if (payload.medical_conditions.includes("hypertension")) {
      result.recommendations.push("DASH diet recommended - limit sodium to <2,300mg/day")
      result.recommendations.push("Increase potassium-rich foods (bananas, sweet potatoes, spinach)")
    }

    // Validation passed
    result.valid = true

    return new Response(JSON.stringify(result), {
      headers: { ...cors_headers, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Validation error: " + error.message,
        bmi: 0,
        bmi_category: "",
        risk_level: "unknown",
        recommended_plan_type: "",
        caloric_goal: 0,
        protein_target_g: 0,
        carbs_target_g: 0,
        fats_target_g: 0,
        warnings: [],
        recommendations: [],
        drug_interactions: []
      }),
      {
        headers: { ...cors_headers, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
