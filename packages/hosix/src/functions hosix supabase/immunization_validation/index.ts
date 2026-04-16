import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// EDGE FUNCTION: check_vaccination_schedule
// ============================================================================
async function checkVaccinationSchedule(patientId: string, ageMonths: number) {
  try {
    // Fetch patient's vaccinations
    const { data: vaccinations } = await supabase
      .from("patient_vaccinations")
      .select("vaccine_id, dose_number, vaccination_date")
      .eq("patient_id", patientId);

    // Fetch schedule template
    const { data: schedule } = await supabase
      .from("vaccine_schedules")
      .select("*")
      .lte("recommended_age_months", ageMonths + 3);

    // Calculate compliance
    let completedCount = 0;
    let overdueCount = 0;
    const gaps: any[] = [];

    schedule?.forEach((scheduledVaccine) => {
      const received = vaccinations?.find(
        (v) =>
          v.vaccine_id === scheduledVaccine.vaccine_id &&
          v.dose_number === scheduledVaccine.dose_number
      );

      if (received) {
        completedCount++;
      } else {
        const monthsSinceRecommended = ageMonths - scheduledVaccine.recommended_age_months;
        if (monthsSinceRecommended > 1) {
          overdueCount++;
          gaps.push({
            vaccine_id: scheduledVaccine.vaccine_id,
            dose_number: scheduledVaccine.dose_number,
            recommended_age: scheduledVaccine.recommended_age_months,
            current_age: ageMonths,
            months_overdue: monthsSinceRecommended,
          });
        }
      }
    });

    const compliancePercentage = schedule
      ? Math.round((completedCount / schedule.length) * 100)
      : 0;

    return {
      success: true,
      compliance: {
        percentage: compliancePercentage,
        completed: completedCount,
        total: schedule?.length || 0,
        overdue: overdueCount,
        status:
          compliancePercentage >= 80
            ? "compliant"
            : compliancePercentage >= 50
            ? "behind"
            : "significantly_behind",
      },
      gaps,
      recommendations:
        overdueCount > 0
          ? `Patient has ${overdueCount} overdue vaccination(s). Schedule catchup appointments.`
          : "Vaccination schedule is up to date.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// EDGE FUNCTION: validate_vaccine_administration
// ============================================================================
async function validateVaccineAdministration(recordData: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate lot number
    if (!recordData.lot_number || recordData.lot_number.length < 3) {
      errors.push("Valid lot number required");
    }

    // Check lot expiration
    if (recordData.lot_number) {
      const { data: lot } = await supabase
        .from("vaccine_lots")
        .select("expiration_date, cold_chain_maintained")
        .eq("lot_number", recordData.lot_number)
        .single();

      if (lot) {
        if (new Date(lot.expiration_date) < new Date()) {
          errors.push("Vaccine lot has expired");
        }

        if (!lot.cold_chain_maintained) {
          warnings.push("Cold chain may have been compromised for this lot");
        }
      }
    }

    // Validate injection site
    const validSites = [
      "left_arm",
      "right_arm",
      "left_leg",
      "right_leg",
      "left_shoulder",
      "right_shoulder",
    ];
    if (!validSites.includes(recordData.injection_site)) {
      errors.push("Invalid injection site");
    }

    // Validate vaccination date (must be in past)
    const vaccDate = new Date(recordData.vaccination_date);
    if (vaccDate > new Date()) {
      errors.push("Vaccination date cannot be in the future");
    }

    // Check for duplicate vaccination
    const { data: duplicates } = await supabase
      .from("patient_vaccinations")
      .select("id")
      .eq("patient_id", recordData.patient_id)
      .eq("vaccine_id", recordData.vaccine_id)
      .eq("dose_number", recordData.dose_number)
      .eq("vaccination_date", recordData.vaccination_date);

    if (duplicates && duplicates.length > 0) {
      warnings.push("This vaccination appears to be a duplicate of a recent record");
    }

    // Check spacing between doses
    if (recordData.dose_number > 1) {
      const { data: previousDose } = await supabase
        .from("patient_vaccinations")
        .select("vaccination_date")
        .eq("patient_id", recordData.patient_id)
        .eq("vaccine_id", recordData.vaccine_id)
        .eq("dose_number", recordData.dose_number - 1)
        .order("vaccination_date", { ascending: false })
        .limit(1)
        .single();

      if (previousDose) {
        const daysSinceLastDose = Math.floor(
          (vaccDate.getTime() - new Date(previousDose.vaccination_date).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastDose < 28) {
          warnings.push(
            `Only ${daysSinceLastDose} days since previous dose. Verify appropriate spacing.`
          );
        }
      }
    }

    return {
      success: errors.length === 0,
      valid: errors.length === 0,
      errors,
      warnings,
      can_proceed: errors.length === 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405 }
    );
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    let result;

    switch (action) {
      case "check_vaccination_schedule":
        result = await checkVaccinationSchedule(data.patientId, data.ageMonths);
        break;
      case "validate_vaccine_administration":
        result = await validateVaccineAdministration(data);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400 }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
});
