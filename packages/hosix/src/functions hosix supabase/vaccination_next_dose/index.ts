import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Ecuador National Vaccination Schema
const ECUADOR_SCHEMA = [
  { age: 0, vaccines: ["BCG", "HepB-0"] },
  { age: 2, vaccines: ["DPT-1", "OPV-1", "HepB-1"] },
  { age: 4, vaccines: ["DPT-2", "OPV-2", "HepB-2"] },
  { age: 6, vaccines: ["DPT-3", "OPV-3"] },
  { age: 12, vaccines: ["MMR", "Varicela"] },
  { age: 15, vaccines: ["DPT-R"] },
  { age: 18, vaccines: ["OPV-R"] },
];

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { child_id } = await req.json();

    if (!child_id) {
      return new Response(
        JSON.stringify({ error: "child_id is required" }),
        { status: 400 }
      );
    }

    // Fetch child age
    const { data: child, error: childError } = await supabase
      .from("patient")
      .select("date_of_birth")
      .eq("id", child_id)
      .single();

    if (childError || !child) {
      return new Response(
        JSON.stringify({ error: "Child not found" }),
        { status: 404 }
      );
    }

    // Calculate age in months
    const birthDate = new Date(child.date_of_birth);
    const today = new Date();
    const ageMonths =
      (today.getFullYear() - birthDate.getFullYear()) * 12 +
      (today.getMonth() - birthDate.getMonth());

    // Fetch administered vaccines
    const { data: administered } = await supabase
      .from("vaccination_administration")
      .select("vaccine_name, administered_date")
      .eq("child_id", child_id);

    const administeredVaccines = new Set(
      (administered || []).map((v) => v.vaccine_name)
    );

    // Find next vaccine according to Ecuador schema
    let nextVaccine: string | null = null;
    let nextAge = 0;
    let scheduledDate: string | null = null;

    for (const schemaItem of ECUADOR_SCHEMA) {
      // Find vaccines not yet given at this age that are older than current age
      if (schemaItem.age <= ageMonths + 1) {
        // Check which vaccines at this age haven't been given
        for (const vaccine of schemaItem.vaccines) {
          if (!administeredVaccines.has(vaccine)) {
            nextVaccine = vaccine;
            nextAge = schemaItem.age;
            break;
          }
        }
        if (nextVaccine) break; // Found the first pending vaccine
      }
    }

    // If no pending vaccines in current or past ages, find next scheduled
    if (!nextVaccine) {
      for (const schemaItem of ECUADOR_SCHEMA) {
        if (schemaItem.age > ageMonths) {
          for (const vaccine of schemaItem.vaccines) {
            if (!administeredVaccines.has(vaccine)) {
              nextVaccine = vaccine;
              nextAge = schemaItem.age;
              break;
            }
          }
          if (nextVaccine) break;
        }
      }
    }

    // Calculate scheduled date and days until
    let daysUntil = 0;
    if (nextVaccine) {
      const scheduleDateObj = new Date(birthDate);
      scheduleDateObj.setMonth(scheduleDateObj.getMonth() + nextAge);
      scheduledDate = scheduleDateObj.toISOString().split('T')[0];

      daysUntil = Math.ceil(
        (scheduleDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24)
      );
    }

    return new Response(
      JSON.stringify({
        child_id,
        current_age_months: ageMonths,
        next_vaccine: nextVaccine,
        next_vaccine_age_months: nextAge,
        scheduled_date: scheduledDate,
        days_until: daysUntil,
        status: nextVaccine
          ? daysUntil < 0
            ? "overdue"
            : "pending"
          : "complete",
        completion_message:
          nextVaccine === null
            ? `Esquema de vacunación completo para ${ageMonths} meses`
            : `Próxima vacuna: ${nextVaccine} a los ${nextAge} meses`,
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
