import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// EDGE FUNCTION: calculate_reorder_quantities
// ============================================================================
async function calculateReorderQuantities() {
  try {
    // Fetch all inventory items
    const { data: inventory } = await supabase
      .from("medicine_inventory")
      .select("*, suppliers(id, company_name)");

    if (!inventory || inventory.length === 0) {
      return {
        success: true,
        reorders: [],
        message: "No inventory items to process",
      };
    }

    const reorders: any[] = [];

    for (const item of inventory) {
      // Check if reorder is needed
      if (item.quantity_on_hand <= item.reorder_level) {
        // Calculate optimal reorder quantity using Wilson EOQ formula
        // For simplicity, we use: reorder_quantity = 2x reorder level
        const reorderQuantity = item.reorder_level * 2;

        // Calculate lead time (default 7 days, can be adjusted per supplier)
        const leadTimeDays = 7;
        const dailyUsage = item.reorder_level / 30; // Assume reorder level = 30 day usage
        const safetyStock = dailyUsage * (leadTimeDays + 3); // Safety stock

        // Calculate total order quantity
        const orderQuantity = Math.ceil(
          reorderQuantity + safetyStock - item.quantity_on_hand
        );

        const orderCost = orderQuantity * item.unit_cost;

        // Estimate reorder frequency
        const reorderFrequencyDays = Math.ceil(
          (reorderQuantity / dailyUsage) * 0.5
        );

        reorders.push({
          medicine_name: item.medicine_name,
          medicine_id: item.id,
          supplier_id: item.supplier_id,
          supplier_name: item.suppliers?.company_name || "Unknown",
          current_quantity: item.quantity_on_hand,
          reorder_level: item.reorder_level,
          recommended_reorder_quantity: orderQuantity,
          estimated_cost: orderCost,
          lead_time_days: leadTimeDays,
          safety_stock: Math.ceil(safetyStock),
          reorder_frequency_days: reorderFrequencyDays,
          urgency:
            item.quantity_on_hand === 0
              ? "critical"
              : item.quantity_on_hand <= item.reorder_level * 0.5
              ? "high"
              : "normal",
        });
      }
    }

    // Sort by urgency
    const urgencyOrder = { critical: 0, high: 1, normal: 2 };
    reorders.sort(
      (a, b) =>
        (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 3) -
        (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 3)
    );

    const totalReorderCost = reorders.reduce((sum, r) => sum + r.estimated_cost, 0);

    return {
      success: true,
      reorders,
      summary: {
        total_reorders_needed: reorders.length,
        critical: reorders.filter((r) => r.urgency === "critical").length,
        high: reorders.filter((r) => r.urgency === "high").length,
        total_estimated_cost: totalReorderCost,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// EDGE FUNCTION: validate_pharmaceutical_control
// ============================================================================
async function validatePharmaceuticalControl(batchData: any) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validations: any = {};

  try {
    // Validate batch documentation
    if (!batchData.batch_number) {
      errors.push("Batch number is required");
    }

    // Validate expiration date
    if (!batchData.expiration_date) {
      errors.push("Expiration date is required");
    } else {
      const expDate = new Date(batchData.expiration_date);
      const today = new Date();

      if (expDate < today) {
        errors.push("Batch has expired");
      } else {
        const daysUntilExpiration = Math.floor(
          (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiration < 90) {
          warnings.push(
            `Batch expires in ${daysUntilExpiration} days - plan for disposal`
          );
        }

        validations.time_to_expiration = daysUntilExpiration;
      }
    }

    // Validate manufacturing date (should be before expiration)
    if (batchData.manufacturing_date && batchData.expiration_date) {
      const mfgDate = new Date(batchData.manufacturing_date);
      const expDate = new Date(batchData.expiration_date);

      if (mfgDate >= expDate) {
        errors.push("Manufacturing date must be before expiration date");
      }

      const shelfLife = Math.floor(
        (expDate.getTime() - mfgDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      validations.shelf_life_days = shelfLife;
    }

    // Validate storage conditions
    if (batchData.storage_temperature !== undefined) {
      // Standard storage: 15-25°C
      if (batchData.storage_temperature < 2 || batchData.storage_temperature > 30) {
        warnings.push(
          `Storage temperature ${batchData.storage_temperature}°C is outside recommended range (15-25°C)`
        );
      }
      validations.storage_temperature = batchData.storage_temperature;
    }

    // Validate cold chain integrity (if required)
    if (batchData.requires_cold_chain) {
      if (!batchData.temperature_log || batchData.temperature_log.length === 0) {
        errors.push("Temperature log required for cold chain products");
      }

      // Check for temperature excursions
      if (batchData.temperature_log) {
        const excursions = batchData.temperature_log.filter(
          (entry: any) => entry.temperature < 2 || entry.temperature > 8
        );

        if (excursions.length > 0) {
          warnings.push(
            `${excursions.length} temperature excursions detected in cold chain`
          );
        }

        validations.temperature_excursions = excursions.length;
      }
    }

    // Validate seal integrity
    if (batchData.seal_intact !== undefined) {
      if (!batchData.seal_intact) {
        errors.push("Product seal is compromised - do not use");
      }
      validations.seal_integrity = batchData.seal_intact;
    }

    // Validate quantity
    if (batchData.quantity <= 0) {
      errors.push("Quantity must be greater than 0");
    }

    // Overall quality assessment
    validations.quality_assessment =
      errors.length === 0
        ? warnings.length === 0
          ? "approved"
          : "approved_with_warnings"
        : "rejected";

    return {
      success: errors.length === 0,
      valid: errors.length === 0,
      errors,
      warnings,
      validations,
      can_dispense: errors.length === 0,
      approval_status: validations.quality_assessment,
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
      case "calculate_reorder_quantities":
        result = await calculateReorderQuantities();
        break;
      case "validate_pharmaceutical_control":
        result = await validatePharmaceuticalControl(data);
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
