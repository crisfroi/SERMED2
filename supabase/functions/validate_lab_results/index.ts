// ============================================================================
// Edge Function: validate_lab_results
// Validate lab results, compare against normal ranges, and trigger alerts  
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface ValidationPayload {
  labOrderId: string;
  testId: string;
  resultValue: number;
  patientId: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { labOrderId, testId, resultValue, patientId } =
      (await req.json()) as ValidationPayload;

    // Fetch test configuration
    const { data: test, error: testError } = await supabase
      .from("laboratory_tests")
      .select(
        "id, test_name, normal_min_value, normal_max_value, critical_low_value, critical_high_value, unit_of_measure"
      )
      .eq("id", testId)
      .single();

    if (testError || !test) {
      return new Response(
        JSON.stringify({ error: "Test not found" }),
        { status: 404 }
      );
    }

    // Determine interpretation
    let interpretation = "normal";
    if (
      test.critical_low_value &&
      resultValue < test.critical_low_value
    ) {
      interpretation = "critical_low";
    } else if (
      test.critical_high_value &&
      resultValue > test.critical_high_value
    ) {
      interpretation = "critical_high";
    } else if (resultValue < test.normal_min_value) {
      interpretation = "low";
    } else if (resultValue > test.normal_max_value) {
      interpretation = "high";
    }

    // Update result in database
    const { error: updateError } = await supabase
      .from("lab_test_results")
      .update({
        interpretation,
        result_status:
          interpretation.includes("critical") && "error" || "valid",
        updated_at: new Date().toISOString(),
      })
      .eq("lab_order_id", labOrderId)
      .eq("test_id", testId);

    if (updateError) {
      throw updateError;
    }

    // Send critical alerts if needed
    if (interpretation.includes("critical")) {
      // Create alert notification
      await supabase.from("critical_lab_alerts").insert([
        {
          patient_id: patientId,
          lab_order_id: labOrderId,
          test_name: test.test_name,
          result_value: resultValue,
          interpretation,
          severity: "critical",
          alert_sent_at: new Date().toISOString(),
        },
      ]);

      // TODO: Send email/SMS notification to physicians
    }

    return new Response(
      JSON.stringify({
        success: true,
        testName: test.test_name,
        resultValue,
        interpretation,
        unit: test.unit_of_measure,
        normalMin: test.normal_min_value,
        normalMax: test.normal_max_value,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error validating lab result:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
