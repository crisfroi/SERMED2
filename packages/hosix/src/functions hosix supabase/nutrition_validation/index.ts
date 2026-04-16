import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// EDGE FUNCTION: validate_nutrition_plan
// ============================================================================
async function validateNutritionPlan(planData: any) {
  const errors: string[] = [];

  // Validate calorie target
  if (!planData.daily_calorie_target || planData.daily_calorie_target < 800) {
    errors.push("Calorie target must be at least 800 kcal/day");
  }
  if (planData.daily_calorie_target > 4000) {
    errors.push("Calorie target should not exceed 4000 kcal/day");
  }

  // Validate macronutrient percentages
  const totalPercentage =
    (planData.protein_percentage || 0) +
    (planData.carbs_percentage || 0) +
    (planData.fats_percentage || 0);

  if (Math.abs(totalPercentage - 100) > 1) {
    errors.push(
      `Macronutrient percentages must total 100% (current: ${totalPercentage}%)`
    );
  }

  // Individual percentage checks
  if ((planData.protein_percentage || 0) < 10 || (planData.protein_percentage || 0) > 35) {
    errors.push("Protein should be between 10-35% of total calories");
  }
  if ((planData.carbs_percentage || 0) < 45 || (planData.carbs_percentage || 0) > 65) {
    errors.push("Carbohydrates should be between 45-65% of total calories");
  }
  if ((planData.fats_percentage || 0) < 20 || (planData.fats_percentage || 0) > 35) {
    errors.push("Fats should be between 20-35% of total calories");
  }

  // Validate meal frequency
  if (!planData.meal_frequency || planData.meal_frequency < 3 || planData.meal_frequency > 6) {
    errors.push("Meal frequency should be between 3-6 meals per day");
  }

  // Validate dates
  if (new Date(planData.start_date) >= new Date(planData.end_date)) {
    errors.push("Start date must be before end date");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: generateWarnings(planData),
  };
}

function generateWarnings(planData: any): string[] {
  const warnings: string[] = [];

  // Check if plan is extremely high or low calorie
  if (planData.daily_calorie_target < 1200) {
    warnings.push("Very low calorie diet - ensure medical supervision");
  }
  if (planData.daily_calorie_target > 3500) {
    warnings.push("High calorie target - verify it aligns with patient needs");
  }

  // Check for extreme macronutrient ratios
  if ((planData.protein_percentage || 0) > 30) {
    warnings.push("High protein intake - monitor kidney function");
  }

  return warnings;
}

// ============================================================================
// EDGE FUNCTION: recommend_nutrition_interventions
// ============================================================================
async function recommendNutritionInterventions(assessmentData: any) {
  const recommendations: string[] = [];
  const interventions: any[] = [];

  try {
    // Fetch patient's previous assessments
    const { data: previousAssessments } = await supabase
      .from("patient_nutrition_assessments")
      .select("bmi, weight_kg, nutritional_status, created_at")
      .eq("patient_id", assessmentData.patient_id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Analyze BMI
    const bmi = assessmentData.bmi;
    if (bmi < 18.5) {
      recommendations.push("Increase caloric intake by 500 kcal/day");
      interventions.push({
        type: "dietary_counseling",
        topic: "Weight gain strategies",
        frequency: "weekly",
      });
    } else if (bmi >= 25 && bmi < 30) {
      recommendations.push("Reduce caloric intake by 300-500 kcal/day");
      recommendations.push("Increase physical activity to 150 min/week");
      interventions.push({
        type: "lifestyle_modification",
        topic: "Weight management",
      });
    } else if (bmi >= 30) {
      recommendations.push("Reduce caloric intake by 500-750 kcal/day");
      recommendations.push("Structured weight loss program recommended");
      interventions.push({
        type: "clinical_referral",
        specialist: "Bariatric Nutritionist",
      });
    }

    // Analyze risk factors
    if (assessmentData.risk_factors?.includes("malabsorption")) {
      recommendations.push("Consider nutritional supplementation");
      interventions.push({
        type: "supplementation",
        items: ["multivitamin", "mineral supplement"],
      });
    }

    if (assessmentData.risk_factors?.includes("feeding_difficulty")) {
      recommendations.push("Refer to speech-language pathology");
      interventions.push({
        type: "clinical_referral",
        specialist: "Speech Pathologist",
      });
    }

    // Analyze trends
    if (previousAssessments && previousAssessments.length > 1) {
      const weightChange =
        assessmentData.weight_kg - previousAssessments[1].weight_kg;
      if (weightChange < -2) {
        recommendations.push("Monitor for unintended weight loss");
        interventions.push({
          type: "monitoring",
          frequency: "weekly",
        });
      }
    }

    return {
      success: true,
      recommendations,
      interventions,
      next_followup_days: 14,
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
      case "validate_nutrition_plan":
        result = await validateNutritionPlan(data);
        break;
      case "recommend_nutrition_interventions":
        result = await recommendNutritionInterventions(data);
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
