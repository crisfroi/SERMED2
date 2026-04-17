// ============================================================================
// Edge Function: export_lab_results
// Generate PDF export of laboratory results with charts and interpretations
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface ExportPayload {
  patientId: string;
  labOrderId?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { patientId, labOrderId } =
      (await req.json()) as ExportPayload;

    // Fetch patient info
    const { data: patient, error: patientError } = await supabase
      .from("patient")
      .select("id, party_id, party(party_name)")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        { status: 404 }
      );
    }

    // Fetch lab orders
    let ordersQuery = supabase
      .from("laboratory_orders")
      .select(
        `
        id,
        order_date,
        clinical_indication,
        priority,
        lab_order_lines(
          test_id,
          laboratory_tests(test_name, test_code, unit_of_measure),
          lab_test_results(
            result_value,
            interpretation,
            result_date,
            comments
          )
        )
      `
      )
      .eq("patient_id", patientId);

    if (labOrderId) {
      ordersQuery = ordersQuery.eq("id", labOrderId);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      throw ordersError;
    }

    // Generate PDF content (simple text format, would use PDF library in production)
    const pdfContent = generatePDFContent(
      patient.party.party_name,
      orders || []
    );

    return new Response(pdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lab_results_${patientId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error exporting lab results:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

function generatePDFContent(patientName: string, orders: any[]): string {
  // In production, use a proper PDF library like 'jspdf' or 'pdfkit'
  let content = `LABORATORIO CLÍNICO - REPORTE DE RESULTADOS\n`;
  content += `================================================\n\n`;
  content += `Paciente: ${patientName}\n`;
  content += `Fecha de Generación: ${new Date().toLocaleDateString("es-ES")}\n\n`;

  orders.forEach((order) => {
    content += `\nOrden: ${order.id}\n`;
    content += `Fecha: ${new Date(order.order_date).toLocaleDateString("es-ES")}\n`;
    content += `Indicación: ${order.clinical_indication}\n`;
    content += `Prioridad: ${order.priority}\n`;
    content += `\nResultados:\n`;
    content += `-------------------------------------------\n`;

    order.lab_order_lines?.forEach((line: any) => {
      const result = line.lab_test_results?.[0];
      if (result) {
        content += `\n${line.laboratory_tests.test_name} (${line.laboratory_tests.test_code})\n`;
        content += `Valor: ${result.result_value} ${line.laboratory_tests.unit_of_measure}\n`;
        content += `Estado: ${result.interpretation}\n`;
        if (result.comments) {
          content += `Comentarios: ${result.comments}\n`;
        }
      }
    });
  });

  return content;
}
