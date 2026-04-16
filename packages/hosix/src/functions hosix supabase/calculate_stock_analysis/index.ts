import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

interface MedicationData {
  medication_id: string;
  variant_type: "inpatient" | "nursing" | "surgery";
  quantity: number;
  unit_cost: number;
  batch_number?: string;
  expiry_date?: string;
}

interface StockAnalysisResult {
  total_medications: number;
  total_value: number;
  medication_breakdown: {
    medication_id: string;
    variants: {
      type: string;
      quantity: number;
      subtotal: number;
    }[];
    total_value: number;
  }[];
  expiring_soon: {
    medication_id: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
  }[];
  high_value_items: {
    medication_id: string;
    total_value: number;
    quantity: number;
  }[];
  variant_distribution: {
    inpatient: number;
    nursing: number;
    surgery: number;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Content-Type": "text/plain" } });
  }

  try {
    const { medications } = await req.json() as { medications: MedicationData[] };

    if (!medications || !Array.isArray(medications)) {
      return new Response(
        JSON.stringify({ error: "Invalid medications data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result: StockAnalysisResult = {
      total_medications: medications.length,
      total_value: 0,
      medication_breakdown: [],
      expiring_soon: [],
      high_value_items: [],
      variant_distribution: {
        inpatient: 0,
        nursing: 0,
        surgery: 0,
      },
    };

    // Group by medication
    const medByMedId = new Map<
      string,
      {
        variants: Map<
          string,
          { quantity: number; subtotal: number }
        >;
        items: MedicationData[];
      }
    >();

    for (const med of medications) {
      const key = med.medication_id;
      const subtotal = med.quantity * med.unit_cost;

      if (!medByMedId.has(key)) {
        medByMedId.set(key, {
          variants: new Map(),
          items: [],
        });
      }

      const data = medByMedId.get(key)!;
      data.items.push(med);
      result.total_value += subtotal;

      // Track by variant
      const variantKey = med.variant_type;
      const variant = data.variants.get(variantKey) || {
        quantity: 0,
        subtotal: 0,
      };
      variant.quantity += med.quantity;
      variant.subtotal += subtotal;
      data.variants.set(variantKey, variant);

      // Variant distribution
      result.variant_distribution[med.variant_type] += med.quantity;

      // Check expiring
      if (med.expiry_date) {
        const expiryDate = new Date(med.expiry_date);
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        if (expiryDate <= thirtyDaysFromNow && expiryDate > today) {
          result.expiring_soon.push({
            medication_id: med.medication_id,
            batch_number: med.batch_number || "unknown",
            expiry_date: med.expiry_date,
            quantity: med.quantity,
          });
        }
      }
    }

    // Build medication breakdown
    for (const [medId, data] of medByMedId.entries()) {
      const breakdown: {
        medication_id: string;
        variants: {
          type: string;
          quantity: number;
          subtotal: number;
        }[];
        total_value: number;
      } = {
        medication_id: medId,
        variants: [],
        total_value: 0,
      };

      let medTotalValue = 0;

      for (const [variantType, variant] of data.variants.entries()) {
        breakdown.variants.push({
          type: variantType,
          quantity: variant.quantity,
          subtotal: variant.subtotal,
        });
        medTotalValue += variant.subtotal;
      }

      breakdown.total_value = medTotalValue;
      result.medication_breakdown.push(breakdown);

      // High value items
      if (medTotalValue > 1000) {
        result.high_value_items.push({
          medication_id: medId,
          total_value: medTotalValue,
          quantity: data.items.reduce((sum, m) => sum + m.quantity, 0),
        });
      }
    }

    // Sort
    result.medication_breakdown.sort((a, b) => b.total_value - a.total_value);
    result.high_value_items.sort((a, b) => b.total_value - a.total_value);
    result.expiring_soon.sort(
      (a, b) =>
        new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
    );

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in calculate_stock_analysis:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
