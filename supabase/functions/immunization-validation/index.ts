// supabase/functions/immunization-validation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors_headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface VaccinationRequest {
  patient_id: string;
  vaccine_id: string;
  date_of_birth: string;
  medical_history: string[];
  allergies: string[];
  recent_vaccines: string[];
}

interface ImmunizationValidationResult {
  valid: boolean;
  can_vaccinate: boolean;
  age_appropriate: boolean;
  contraindications: string[];
  warnings: string[];
  recommendations: string[];
  minimum_interval_days: number;
  herd_immunity_impact: string;
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

    const payload = await req.json() as VaccinationRequest
    const result: ImmunizationValidationResult = {
      valid: true,
      can_vaccinate: true,
      age_appropriate: true,
      contraindications: [],
      warnings: [],
      recommendations: [],
      minimum_interval_days: 0,
      herd_immunity_impact: ""
    }

    // Get vaccine information
    const { data: vaccine } = await supabase
      .from("vaccine_master")
      .select("*")
      .eq("vaccine_id", payload.vaccine_id)
      .single()

    if (!vaccine) {
      result.valid = false
      result.can_vaccinate = false
      result.contraindications.push("Unknown vaccine ID")
      return new Response(JSON.stringify(result), {
        headers: { ...cors_headers, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Check age appropriateness
    const dob = new Date(payload.date_of_birth)
    const today = new Date()
    const ageInMonths = Math.floor((today.getTime() - dob.getTime()) / (30 * 24 * 60 * 60 * 1000))
    const ageInYears = Math.floor(ageInMonths / 12)

    const scheduleMonths = vaccine.schedule_age.split(",").map(m => parseInt(m.trim())).filter(m => !isNaN(m))
    const isAgeAppropriate = scheduleMonths.some(m => Math.abs(m - ageInMonths) <= 2) || ageInMonths > Math.max(...scheduleMonths)

    if (!isAgeAppropriate && ageInMonths < Math.min(...scheduleMonths)) {
      result.age_appropriate = false
      result.warnings.push(
        `Vaccine not recommended at age ${ageInYears}y ${ageInMonths % 12}m. Recommended age(s): ${vaccine.schedule_age}`
      )
    }

    // Check contraindications from vaccine master
    if (vaccine.contraindications) {
      const contraList = vaccine.contraindications.split(",").map(c => c.trim().toLowerCase())
      for (const condition of payload.medical_history) {
        if (contraList.includes(condition.toLowerCase())) {
          result.can_vaccinate = false
          result.contraindications.push(`Medical history of ${condition} is a contraindication`)
        }
      }
    }

    // Check allergies
    if (vaccine.potential_side_effects && vaccine.potential_side_effects.includes("anaphylaxis")) {
      if (payload.allergies.includes("eggs") && vaccine.vaccine_name.includes("influenza")) {
        result.warnings.push("Egg allergy - use egg-free influenza vaccine")
      }
      if (payload.allergies.includes("gelatin")) {
        result.warnings.push("Gelatin allergy - some vaccines contain gelatin components")
      }
      if (payload.allergies.includes("neomycin")) {
        result.warnings.push("Neomycin allergy - some vaccines contain neomycin")
      }
    }

    // Check for minimum interval since last vaccine
    const { data: lastVaccines } = await supabase
      .from("patient_vaccinations")
      .select("*")
      .eq("patient_id", payload.patient_id)
      .order("date_administered", { ascending: false })
      .limit(10)

    if (lastVaccines && lastVaccines.length > 0) {
      const lastVaccineDate = new Date(lastVaccines[0].date_administered)
      const daysSinceLastVaccine = Math.floor((today.getTime() - lastVaccineDate.getTime()) / (24 * 60 * 60 * 1000))

      // Minimum intervals vary by vaccine combination
      let minimumInterval = 4 // default 4 weeks
      
      if (payload.recent_vaccines.includes("live_attenuated")) {
        minimumInterval = 28 // 4 weeks between live vaccines
        if (daysSinceLastVaccine < minimumInterval) {
          result.can_vaccinate = false
          result.contraindications.push(
            `Must wait ${minimumInterval - daysSinceLastVaccine} days after live vaccine`
          )
        }
      }

      result.minimum_interval_days = Math.max(0, minimumInterval - daysSinceLastVaccine)
    }

    // Check for immunocompromised status
    const immunocompromisedConditions = ["HIV/AIDS", "cancer", "organ_transplant", "severe_immunosuppression"]
    for (const condition of payload.medical_history) {
      if (immunocompromisedConditions.some(ic => condition.toLowerCase().includes(ic.toLowerCase()))) {
        if (vaccine.vaccine_name.includes("live")) {
          result.can_vaccinate = false
          result.contraindications.push("Live vaccines contraindicated in immunocompromised patients")
        } else {
          result.warnings.push("Vaccine response may be inadequate in immunocompromised patient")
          result.recommendations.push("Consider additional doses or booster schedule")
        }
      }
    }

    // Pregnancy check
    if (payload.medical_history.includes("pregnancy")) {
      if (vaccine.vaccine_name && (vaccine.vaccine_name.includes("MMR") || vaccine.vaccine_name.includes("Varicella"))) {
        result.can_vaccinate = false
        result.contraindications.push("Live vaccines contraindicated in pregnancy")
      } else {
        result.recommendations.push("Inactivated vaccines are safe during pregnancy")
      }
    }

    // Herd immunity impact assessment
    const { data: regionalData } = await supabase
      .from("herd_immunity_tracking")
      .select("coverage_percentage, target_percentage, population_region")
      .eq("vaccine_id", payload.vaccine_id)
      .single()

    if (regionalData) {
      if (regionalData.coverage_percentage >= regionalData.target_percentage) {
        result.herd_immunity_impact = "At goal - maintaining population protection"
      } else if (regionalData.coverage_percentage >= regionalData.target_percentage - 5) {
        result.herd_immunity_impact = "Below goal - additional vaccinations needed to maintain herd immunity"
      } else {
        result.herd_immunity_impact = "CRITICAL - Below herd immunity threshold, outbreak risk elevated"
      }
    }

    // Generate personalized recommendations
    result.recommendations.push("Keep vaccination record in safe place")
    result.recommendations.push(`Next ${vaccine.vaccine_name} dose due after ${vaccine.schedule_age} months if applicable`)
    
    if (!result.can_vaccinate || result.contraindications.length > 0) {
      result.recommendations.push("URGENT: Consult with healthcare provider before vaccination")
    }

    // Check recent illness
    if (payload.medical_history.includes("fever") || payload.medical_history.includes("acute_illness")) {
      result.warnings.push("Patient has recent acute illness - may want to defer non-urgent vaccinations")
      result.recommendations.push("If fever present, defer until fever resolves")
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors_headers, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        valid: false,
        can_vaccinate: false,
        age_appropriate: false,
        error: "Validation error: " + error.message,
        contraindications: ["Validation failed - unable to process request"],
        warnings: [],
        recommendations: ["Consult healthcare provider"],
        minimum_interval_days: 0,
        herd_immunity_impact: "Unknown"
      }),
      {
        headers: { ...cors_headers, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
