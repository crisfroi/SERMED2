// supabase/functions/surgery-validation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors_headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface SurgeryScheduleRequest {
  surgery_type_id: string;
  or_number: number;
  scheduled_date: string;
  patient_id: string;
  estimated_duration: number;
  surgical_team: { role: string; staff_id: string }[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors_headers })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    )

    const payload = await req.json() as SurgeryScheduleRequest
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    }

    // Validation 1: Check surgery type exists
    const { data: surgeryType } = await supabase
      .from("surgery_types")
      .select("*")
      .eq("surgery_id", payload.surgery_type_id)
      .single()

    if (!surgeryType) {
      result.valid = false
      result.errors.push("Invalid surgery type specified")
    } else {
      // Check estimated duration matches surgery type
      if (payload.estimated_duration < surgeryType.estimated_duration - 30 ||
          payload.estimated_duration > surgeryType.estimated_duration + 60) {
        result.warnings.push(
          `Estimated duration (${payload.estimated_duration}min) differs from typical duration (${surgeryType.estimated_duration}min)`
        )
      }

      // High-risk surgery checks
      if (surgeryType.risk_level === "critical") {
        result.recommendations.push("High-risk surgery - ensure critical care resources available")
        result.recommendations.push("Verify blood bank has adequate supply")
        result.recommendations.push("Confirm ICU bed availability for post-op")
      }
    }

    // Validation 2: Check OR availability
    const scheduled = new Date(payload.scheduled_date)
    const endTime = new Date(scheduled.getTime() + payload.estimated_duration * 60000)

    const { data: conflicts } = await supabase
      .from("surgery_schedules")
      .select("*")
      .eq("or_number", payload.or_number)
      .eq("status", "scheduled")
      .gte("scheduled_date", scheduled.toISOString())
      .lt("scheduled_date", endTime.toISOString())

    if (conflicts && conflicts.length > 0) {
      result.valid = false
      result.errors.push(`OR ${payload.or_number} has scheduling conflict(s)`)
    }

    // Validation 3: Check surgical team completeness
    const requiredRoles = ["Primary Surgeon", "Anesthesiologist", "Surgical Nurse"]
    const assignedRoles = payload.surgical_team.map(m => m.role)
    const missingRoles = requiredRoles.filter(r => !assignedRoles.includes(r))

    if (missingRoles.length > 0) {
      result.valid = false
      result.errors.push(`Missing required team members: ${missingRoles.join(", ")}`)
    }

    // Validation 4: Check staff certifications
    for (const teamMember of payload.surgical_team) {
      const { data: staff } = await supabase
        .from("staff_members")
        .select("certifications, license_expiry")
        .eq("staff_id", teamMember.staff_id)
        .single()

      if (!staff) {
        result.valid = false
        result.errors.push(`Staff member ${teamMember.staff_id} not found`)
        continue
      }

      const licenseExpiry = new Date(staff.license_expiry)
      const daysUntilExpiry = Math.floor((licenseExpiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24))

      if (daysUntilExpiry < 0) {
        result.valid = false
        result.errors.push(`${teamMember.role} license expired`)
      } else if (daysUntilExpiry < 30) {
        result.warnings.push(`${teamMember.role} license expiring in ${daysUntilExpiry} days`)
      }
    }

    // Validation 5: Check patient medical history for contraindications
    const { data: patient } = await supabase
      .from("patients")
      .select("medical_conditions, allergies")
      .eq("patient_id", payload.patient_id)
      .single()

    if (patient) {
      if (patient.allergies && patient.allergies.length > 0) {
        result.recommendations.push(`⚠️ Patient allergies: ${patient.allergies.join(", ")}`)
      }
      if (patient.medical_conditions && patient.medical_conditions.includes("bleeding_disorder")) {
        result.recommendations.push("Patient has bleeding disorder - ensure blood products available")
      }
    }

    // Validation 6: Check post-op bed availability
    const { data: beds } = await supabase
      .from("hospital_beds")
      .select("*")
      .eq("unit", "ICU")
      .eq("status", "available")
      .limit(1)

    if (!beds || beds.length === 0) {
      result.warnings.push("No ICU beds currently available - may need to reschedule")
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors_headers, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        valid: false,
        errors: ["Validation error: " + error.message],
        warnings: [],
        recommendations: []
      }),
      {
        headers: { ...cors_headers, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
