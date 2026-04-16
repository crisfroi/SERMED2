import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { lmp_date } = await req.json();

    if (!lmp_date) {
      return new Response(
        JSON.stringify({ error: "lmp_date is required (YYYY-MM-DD format)" }),
        { status: 400 }
      );
    }

    // Parse LMP date
    const lmpDate = new Date(lmp_date);
    if (isNaN(lmpDate.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
        { status: 400 }
      );
    }

    // Calculate gestational age
    const today = new Date();
    const diffTime = today.getTime() - lmpDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    // Gestational weeks and days
    const weeks = Math.floor(diffDays / 7);
    const days = Math.floor(diffDays % 7);

    // Calculate EDD (Expected Delivery Date)
    // Standard: LMP + 280 days (40 weeks)
    const eddDate = new Date(lmpDate);
    eddDate.setDate(eddDate.getDate() + 280);

    // Determine if term
    const isterm = weeks >= 37 && weeks <= 42;
    const isPostterm = weeks > 42;
    const isPreterm = weeks < 37;

    // Generate status message
    let status = "";
    if (isPostterm) {
      status = "Embarazo Prolongado (>42 semanas) - Requiere valoración urgente";
    } else if (isterm) {
      status = "Embarazo a Término (37-42 semanas) - Parto espontáneo esperado";
    } else if (isPreterm) {
      status = `Embarazo Pretérmino (${weeks} semanas) - ${280 - diffDays} días hasta término`;
    }

    return new Response(
      JSON.stringify({
        weeks,
        days,
        total_days: Math.round(diffDays),
        edd: eddDate.toISOString().split('T')[0],
        is_term: isterm,
        is_preterm: isPreterm,
        is_postterm: isPostterm,
        status,
        days_until_edd: Math.ceil((eddDate.getTime() - today.getTime()) / (1000 * 3600 * 24)),
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
