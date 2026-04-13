// supabase/functions/generate_ehr_export/index.ts
// Propósito: Generar exportaciones de EHR en múltiples formatos
// Formatos: PDF, HL7v2, FHIR JSON
// Líneas: ~400

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const { ehr_id, format = "pdf", include_episodes = true } = await req.json();

    if (!ehr_id || !["pdf", "hl7", "fhir"].includes(format)) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters: ehr_id and format required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch EHR data
    const { data: ehr, error: ehrError } = await supabase
      .from("electronic_health_record")
      .select("*")
      .eq("id", ehr_id)
      .single();

    if (ehrError || !ehr) {
      return new Response(
        JSON.stringify({ error: "EHR not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch associated patient
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", ehr.patient_id)
      .single();

    if (patientError || !patient) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch episodes if needed
    let episodes = [];
    if (include_episodes) {
      const { data: ep, error: epError } = await supabase
        .from("ehr_episode_links")
        .select("*")
        .eq("ehr_id", ehr_id)
        .order("episode_date", { ascending: false })
        .limit(50);

      if (!epError && ep) {
        episodes = ep;
      }
    }

    // Generate export based on format
    let exportContent: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case "pdf":
        // Note: Real PDF generation would use a library like pdfkit
        exportContent = generatePDFContent(ehr, patient, episodes);
        contentType = "application/pdf";
        filename = `ehr-${patient.national_id}-${new Date().toISOString().split('T')[0]}.pdf`;
        break;

      case "hl7":
        exportContent = generateHL7v2Content(ehr, patient, episodes);
        contentType = "text/plain";
        filename = `ehr-${patient.national_id}-${new Date().toISOString().split('T')[0]}.hl7`;
        break;

      case "fhir":
        exportContent = generateFHIRContent(ehr, patient, episodes);
        contentType = "application/fhir+json";
        filename = `ehr-${patient.national_id}-${new Date().toISOString().split('T')[0]}.json`;
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Log the export
    const { error: logError } = await supabase
      .from("ehr_access_log")
      .insert({
        ehr_id,
        accessed_by: (await supabase.auth.getUser()).data.user?.id,
        access_type: "export",
        reason: "clinical_care",
        status: "completed",
        data_accessed: { export: true, format }
      });

    if (logError) {
      console.error("Failed to log export:", logError);
    }

    return new Response(exportContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Format": format,
        "X-Export-Date": new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error in generate_ehr_export:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
});

// Content Generation Functions

function generatePDFContent(ehr: any, patient: any, episodes: any[]): string {
  // Simplified PDF as text (real implementation would use PDF library)
  const content = `
HISTORIA MÉDICA ELECTRÓNICA (HME)
==================================
Generated: ${new Date().toISOString()}

INFORMACIÓN DEL PACIENTE
------------------------
Nombre: ${patient.first_name} ${patient.last_name}
Cédula: ${patient.national_id}
Fecha de Nacimiento: ${patient.birthdate}
Género: ${patient.gender}
Edad: ${calculateAge(patient.birthdate)}

RESUMEN CONSOLIDADO
-------------------
${ehr.summary_note || "No summary available"}

PROBLEMAS ACTIVOS (ICD-10)
--------------------------
${ehr.active_problems?.map((p: string) => `- ${p}`).join("\n") || "No active problems"}

MEDICAMENTOS VIGENTES
---------------------
${ehr.medications_active?.map((m: string) => `- ${m}`).join("\n") || "No active medications"}

ALERGIAS DOCUMENTADAS
---------------------
${ehr.allergies?.map((a: string) => `⚠️ ${a}`).join("\n") || "No allergies documented"}

EPISODIOS CLÍNICOS (Últimos 50)
--------------------------------
${episodes.map((ep: any, idx: number) => `
${idx + 1}. ${ep.episode_type.toUpperCase()}
   Fecha: ${new Date(ep.episode_date).toLocaleDateString()}
   Clínico: ${ep.clinician_name || "N/A"}
   Diagnóstico: ${ep.primary_diagnosis || "N/A"}
   Resumen: ${ep.summary || "N/A"}
`).join("\n")}

DECLARACIÓN DE PRIVACIDAD
--------------------------
Este documento contiene información confidencial protegida por HIPAA.
El acceso no autorizado es un delito federal.

Firma Digital: ${generateSignature(ehr.id)}
Timestamp: ${new Date().toISOString()}
  `.trim();

  return content;
}

function generateHL7v2Content(ehr: any, patient: any, episodes: any[]): string {
  // HL7v2 format (simplified)
  const content = `
MSH|^~\\&|HOSIX|RENAPROSA|||${new Date().toISOString()}||ADT^A01|${generateMessageId()}|P|2.3.1
PID|||${patient.national_id}||${patient.last_name}^${patient.first_name}||${patient.birthdate}|${patient.gender}
OBX|1|TX|SUMMARY||${ehr.summary_note || "N/A"}
OBX|2|TX|ACTIVE_PROBLEMS||${(ehr.active_problems || []).join(";")}
OBX|3|TX|MEDICATIONS||${(ehr.medications_active || []).join(";")}
OBX|4|TX|ALLERGIES||${(ehr.allergies || []).join(";")}
${episodes.map((ep: any) => `
OBR|1|${ep.id}||${ep.episode_type}||${new Date(ep.episode_date).toISOString()}
OBX|1|TX|DIAGNOSIS||${ep.primary_diagnosis}
OBX|2|TX|SUMMARY||${ep.summary}`).join("\n")}
  `.trim();

  return content;
}

function generateFHIRContent(ehr: any, patient: any, episodes: any[]): string {
  // FHIR JSON format
  const fhirBundle: any = {
    resourceType: "Bundle",
    type: "document",
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: "Composition",
          status: "final",
          type: {
            coding: [{
              system: "http://loinc.org",
              code: "60866-4",
              display: "Clinical Summary"
            }]
          },
          section: [
            {
              title: "Problems",
              entry: (ehr.active_problems || []).map((p: string) => ({ reference: `Condition/${p}` }))
            },
            {
              title: "Medications",
              entry: (ehr.medications_active || []).map((m: string) => ({ reference: `Medication/${m}` }))
            },
            {
              title: "Allergies",
              entry: (ehr.allergies || []).map((a: string) => ({ reference: `AllergyIntolerance/${a}` }))
            }
          ]
        }
      }
    ]
  };

  return JSON.stringify(fhirBundle, null, 2);
}

// Utility Functions

function calculateAge(birthdate: string): number {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function generateMessageId(): string {
  return `MSG${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
}

function generateSignature(id: string): string {
  // Placeholder for actual digital signature
  return btoa(id + new Date().toISOString()).substring(0, 32);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
