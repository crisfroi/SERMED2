import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RiskFactors {
  maternal: string[];
  fetal: string[];
  obstetric: string[];
  complications: string[];
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { pregnancy_id } = await req.json();

    if (!pregnancy_id) {
      return new Response(
        JSON.stringify({ error: "pregnancy_id is required" }),
        { status: 400 }
      );
    }

    // Fetch pregnancy data
    const { data: pregnancy, error: fetchError } = await supabase
      .from("pregnancy")
      .select("*, patient:patient_id(date_of_birth, comorbidities)")
      .eq("id", pregnancy_id)
      .single();

    if (fetchError || !pregnancy) {
      return new Response(
        JSON.stringify({ error: "Pregnancy not found" }),
        { status: 404 }
      );
    }

    let riskScore = 0;
    const riskFactors: RiskFactors = {
      maternal: [],
      fetal: [],
      obstetric: pregnancy.complications || [],
      complications: pregnancy.complications || [],
    };

    // MATERNAL FACTORS
    if (pregnancy.patient) {
      const birthDate = new Date(pregnancy.patient.date_of_birth);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      if (age < 18) {
        riskScore += 15;
        riskFactors.maternal.push("Edad materna <18 años (adolescente)");
      } else if (age > 35) {
        riskScore += 12;
        riskFactors.maternal.push("Edad materna avanzada (>35)");
      } else if (age > 40) {
        riskScore += 18;
        riskFactors.maternal.push("Edad materna muy avanzada (>40)");
      }

      // Comorbidities
      if (pregnancy.patient.comorbidities) {
        if (pregnancy.patient.comorbidities.includes("hypertension")) {
          riskScore += 20;
          riskFactors.maternal.push("Hipertensión crónica");
        }
        if (pregnancy.patient.comorbidities.includes("diabetes")) {
          riskScore += 25;
          riskFactors.maternal.push("Diabetes pregestacional");
        }
        if (pregnancy.patient.comorbidities.includes("obesity")) {
          riskScore += 15;
          riskFactors.maternal.push("Obesidad (IMC >30)");
        }
      }
    }

    // OBSTETRIC FACTORS
    const gestAge = pregnancy.gestational_age_weeks || 0;

    if (gestAge > 42) {
      riskScore += 20;
      riskFactors.obstetric.push("Embarazo prolongado (>42 semanas)");
    } else if (gestAge < 8) {
      riskScore += 15;
      riskFactors.obstetric.push("Edad gestacional muy temprana");
    }

    if (pregnancy.risk_level && pregnancy.risk_level > 0) {
      riskScore += Math.min(pregnancy.risk_level / 2, 20);
    }

    // COMPLICATIONS
    if (pregnancy.complications && pregnancy.complications.length > 0) {
      for (const complication of pregnancy.complications) {
        if (
          complication.includes("preeclampsia") ||
          complication.includes("eclampsia")
        ) {
          riskScore += 25;
        } else if (complication.includes("gestational_diabetes")) {
          riskScore += 15;
        } else if (complication.includes("placental_abruption")) {
          riskScore += 30;
        } else if (complication.includes("bleeding")) {
          riskScore += 20;
        } else {
          riskScore += 10;
        }
      }
    }

    // FETAL FACTORS - would need fetal monitoring data
    // For now, basic assessment
    if (pregnancy.status === "active" && gestAge > 40) {
      riskFactors.fetal.push("Seguimiento fetal recomendado");
      if (gestAge > 42) {
        riskScore += 15;
        riskFactors.fetal.push("Riesgo de sufrimiento fetal en prolongado");
      }
    }

    // Cap score at 100
    riskScore = Math.min(Math.round(riskScore), 100);

    return new Response(
      JSON.stringify({
        riskScore,
        riskLevel:
          riskScore < 20
            ? "low"
            : riskScore < 50
              ? "moderate"
              : riskScore < 80
                ? "high"
                : "critical",
        riskFactors,
        recommendations: generateRecommendations(riskScore),
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

function generateRecommendations(riskScore: number): string[] {
  const recommendations: string[] = [];

  if (riskScore < 20) {
    recommendations.push("Control prenatal rutinario cada 4 semanas");
    recommendations.push("Educación prenatal estándar");
  } else if (riskScore < 50) {
    recommendations.push("Control prenatal mensual con especialista");
    recommendations.push("Ecografía de seguimiento a las 34 semanas");
    recommendations.push("Evaluación de factores de riesgo");
  } else if (riskScore < 80) {
    recommendations.push("Control prenatal quincenal con obstetra");
    recommendations.push("Monitoreo fetal frecuente");
    recommendations.push("Preparación para parto intrahospitalario");
    recommendations.push("Evaluación anestésica prenatal");
  } else {
    recommendations.push("URGENCIA: Internación para evaluación");
    recommendations.push("Monitoreo fetal continuo");
    recommendations.push("Equipo multidisciplinario en parto");
    recommendations.push("Evaluación de necesidad de terminación prematura");
  }

  return recommendations;
}
