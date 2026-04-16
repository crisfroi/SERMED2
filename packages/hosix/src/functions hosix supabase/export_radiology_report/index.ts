// ============================================================================
// Edge Function: export_radiology_report
// Generate PDF export of radiology report with findings and recommendations
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface ExportPayload {
  imagingOrderId: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { imagingOrderId } = (await req.json()) as ExportPayload;

    // Fetch imaging order and report
    const { data: order, error: orderError } = await supabase
      .from("imaging_orders")
      .select(
        `
        id,
        order_date,
        clinical_indication,
        imaging_reports(
          id,
          report_date,
          report_status,
          clinical_history,
          technique,
          findings_text,
          impression,
          recommendations,
          radiologist:radiologist_id(party_name),
          signed_at,
          signed_by:signed_by_id(party_name),
          imaging_findings(
            finding_type,
            finding_location,
            finding_size_mm,
            finding_description,
            severity_score,
            benign_likelihood_percentage,
            requires_followup,
            followup_interval_days
          )
        ),
        patient:patient_id(party_id, party(party_name)),
        study_type:study_type_id(study_name),
        modality:modality_id(modality_name)
      `
      )
      .eq("id", imagingOrderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Imaging order not found" }),
        { status: 404 }
      );
    }

    const report = order.imaging_reports?.[0];
    if (!report) {
      return new Response(
        JSON.stringify({ error: "Report not found" }),
        { status: 404 }
      );
    }

    // Generate PDF content
    const pdfContent = generatePDFContent(order, report);

    return new Response(pdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="radiology_report_${imagingOrderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error exporting radiology report:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

function generatePDFContent(order: any, report: any): string {
  // In production, use a proper PDF library
  let content = `REPORTE RADIOLÓGICO\n`;
  content += `================================================\n\n`;
  content += `Paciente: ${order.patient.party?.party_name}\n`;
  content += `Tipo de Estudio: ${order.study_type?.study_name}\n`;
  content += `Modalidad: ${order.modality?.modality_name}\n`;
  content += `Fecha de Orden: ${new Date(order.order_date).toLocaleDateString("es-ES")}\n`;
  content += `Indicación Clínica: ${order.clinical_indication}\n\n`;

  content += `INFORMACIÓN DEL REPORTE\n`;
  content += `================================================\n`;
  content += `Radiólogo: ${report.radiologist?.party_name || "N/A"}\n`;
  content += `Fecha del Reporte: ${new Date(report.report_date).toLocaleDateString("es-ES")}\n`;
  content += `Estado: ${report.report_status}\n\n`;

  if (report.clinical_history) {
    content += `HISTORIA CLÍNICA\n`;
    content += `${report.clinical_history}\n\n`;
  }

  if (report.technique) {
    content += `TÉCNICA\n`;
    content += `${report.technique}\n\n`;
  }

  content += `HALLAZGOS\n`;
  content += `================================================\n`;
  content += `${report.findings_text}\n\n`;

  if (report.imaging_findings && report.imaging_findings.length > 0) {
    content += `DETALLE DE HALLAZGOS\n`;
    report.imaging_findings.forEach((finding: any, idx: number) => {
      content += `\n${idx + 1}. ${finding.finding_type} en ${finding.finding_location}\n`;
      content += `   Severidad: ${finding.severity_score}/5\n`;
      if (finding.finding_size_mm) {
        content += `   Tamaño: ${finding.finding_size_mm}mm\n`;
      }
      content += `   Descripción: ${finding.finding_description}\n`;
      content += `   Probabilidad de benignidad: ${finding.benign_likelihood_percentage}%\n`;
      if (finding.requires_followup) {
        content += `   Seguimiento: requerido en ${finding.followup_interval_days} días\n`;
      }
    });
    content += `\n`;
  }

  content += `IMPRESIÓN\n`;
  content += `================================================\n`;
  content += `${report.impression}\n\n`;

  if (report.recommendations) {
    content += `RECOMENDACIONES\n`;
    content += `${report.recommendations}\n\n`;
  }

  if (report.signed_at) {
    content += `\nFirmado por: ${report.signed_by?.party_name}\n`;
    content += `Fecha de Firma: ${new Date(report.signed_at).toLocaleDateString("es-ES")}\n`;
  }

  return content;
}
