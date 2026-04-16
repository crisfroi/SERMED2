import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// WHO Growth Standards (simplified reference data for 0-59 months)
// Full implementation would use complete WHO growth tables
const WHO_GROWTH_STANDARDS = {
  M: {
    // Male weight (kg) by age in months
    weight: {
      0: { median: 3.3, sd: 0.6 },
      3: { median: 5.9, sd: 0.8 },
      6: { median: 7.3, sd: 0.9 },
      9: { median: 8.6, sd: 1.0 },
      12: { median: 9.6, sd: 1.0 },
      18: { median: 11.0, sd: 1.2 },
      24: { median: 12.2, sd: 1.3 },
      36: { median: 14.4, sd: 1.6 },
      48: { median: 16.3, sd: 1.9 },
      60: { median: 18.0, sd: 2.2 },
    },
    height: {
      0: { median: 49.9, sd: 1.8 },
      3: { median: 59.0, sd: 2.0 },
      6: { median: 67.0, sd: 2.2 },
      9: { median: 72.3, sd: 2.3 },
      12: { median: 76.0, sd: 2.4 },
      18: { median: 81.1, sd: 2.5 },
      24: { median: 85.6, sd: 2.7 },
      36: { median: 94.4, sd: 3.1 },
      48: { median: 102.1, sd: 3.5 },
      60: { median: 109.0, sd: 3.8 },
    },
  },
  F: {
    // Female references (similar pattern, slightly different values)
    weight: {
      0: { median: 3.2, sd: 0.6 },
      3: { median: 5.6, sd: 0.8 },
      6: { median: 6.9, sd: 0.9 },
      9: { median: 8.0, sd: 0.9 },
      12: { median: 8.9, sd: 1.0 },
      18: { median: 10.2, sd: 1.1 },
      24: { median: 11.5, sd: 1.2 },
      36: { median: 13.8, sd: 1.5 },
      48: { median: 15.7, sd: 1.8 },
      60: { median: 17.5, sd: 2.1 },
    },
    height: {
      0: { median: 49.5, sd: 1.8 },
      3: { median: 58.4, sd: 2.0 },
      6: { median: 65.7, sd: 2.1 },
      9: { median: 70.1, sd: 2.3 },
      12: { median: 73.5, sd: 2.4 },
      18: { median: 78.7, sd: 2.5 },
      24: { median: 83.2, sd: 2.6 },
      36: { median: 92.0, sd: 3.0 },
      48: { median: 99.5, sd: 3.3 },
      60: { median: 106.1, sd: 3.6 },
    },
  },
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { weight_kg, height_cm, age_months, sex } = await req.json();

    // Validate inputs
    if (!weight_kg || !height_cm || age_months === undefined || !sex) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: weight_kg, height_cm, age_months, sex",
        }),
        { status: 400 }
      );
    }

    // Get closest age group reference
    const ageRefs = Object.keys(WHO_GROWTH_STANDARDS[sex as "M" | "F"].weight)
      .map(Number)
      .sort((a, b) => a - b);

    let closestAge = ageRefs[0];
    for (const ref of ageRefs) {
      if (Math.abs(ref - age_months) < Math.abs(closestAge - age_months)) {
        closestAge = ref;
      }
    }

    const standards =
      WHO_GROWTH_STANDARDS[sex as "M" | "F"] ||
      WHO_GROWTH_STANDARDS["M"];
    const weightRef = standards.weight[closestAge as keyof typeof standards.weight];
    const heightRef = standards.height[closestAge as keyof typeof standards.height];

    if (!weightRef || !heightRef) {
      return new Response(
        JSON.stringify({ error: "Age group not supported" }),
        { status: 400 }
      );
    }

    // Calculate Z-scores
    const weightZScore = (weight_kg - weightRef.median) / weightRef.sd;
    const heightZScore = (height_cm - heightRef.median) / heightRef.sd;

    // Convert Z-scores to percentiles using normal distribution approximation
    const percentile_weight = zScoreToPercentile(weightZScore);
    const percentile_height = zScoreToPercentile(heightZScore);

    // Calculate BMI if age > 2 years (24 months) for BMI assessment
    let bmi_percentile = 50;
    if (age_months >= 24 && height_cm > 0) {
      const bmi = weight_kg / ((height_cm / 100) ** 2);
      // Simplified BMI percentile (would need age/sex-specific BMI tables for precision)
      const bmiBoundary = sex === "M" ? 16.9 : 16.6; // Approximate median BMI
      const bmiZScore = (bmi - bmiBoundary) / 1.5; // Approximate SD
      bmi_percentile = zScoreToPercentile(bmiZScore);
    }

    // Determine nutritional status
    let status: "normal" | "underweight" | "overweight" | "obese" = "normal";
    let alert: string | undefined;

    if (percentile_weight < 5) {
      status = "underweight";
      alert =
        "Peso bajo para edad - Riesgo de desnutrición, requiere seguimiento";
    } else if (percentile_height < 5) {
      status = "underweight";
      alert = "Talla baja para edad - Evaluación de desnutrición crónica recomendada";
    } else if (percentile_weight > 95) {
      status = "overweight";
      alert = "Peso elevado para edad - Evaluar sobrepeso";
    } else if (percentile_weight > 99) {
      status = "obese";
      alert = "Obesidad infantil - Seguimiento nutricional especializado";
    }

    return new Response(
      JSON.stringify({
        percentile_weight: Math.round(percentile_weight),
        percentile_height: Math.round(percentile_height),
        bmi_percentile: Math.round(bmi_percentile),
        status,
        alert,
        reference_age_months: closestAge,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
});

// Convert Z-score to percentile using normal distribution approximation
function zScoreToPercentile(zScore: number): number {
  // Using approximation: P ≈ 50 + 33.35 * (Z)
  // More accurate: P = 50 + 50/2.326 * erf(Z / sqrt(2)) but using simpler formula
  let percentile = 50 + zScore * 13.13; // Empirical approximation

  // Use more accurate piecewise approximation
  if (Math.abs(zScore) < 3) {
    // More exact for |Z| < 3
    const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
    const d = (0.3989423 * Math.exp((-zScore * zScore) / 2)) / Math.sqrt(2 * Math.PI);
    const prob =
      1 -
      d *
        t *
        (0.319381530 +
          t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

    percentile = zScore >= 0 ? prob * 100 : (1 - prob) * 100;
  }

  return Math.max(0.1, Math.min(99.9, percentile));
}
