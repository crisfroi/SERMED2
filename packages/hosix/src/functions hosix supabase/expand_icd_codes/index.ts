import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

interface ICDSearchResult {
  code: string;
  description: string;
  system: "ICD-9" | "ICD-10" | "ICD-11";
  category: string;
  available_in_systems: ("ICD-9" | "ICD-10" | "ICD-11")[];
}

// Simplified ICD-11 reference (in production, use external API)
const ICD_11_CODES: Record<string, string> = {
  "BA00": "Cholera",
  "BA01": "Typhoid fever",
  "1B05": "Malaria due to Plasmodium falciparum",
  "1B06": "Malaria due to Plasmodium vivax",
  "1B07": "Malaria due to Plasmodium ovale",
  "1B08": "Malaria due to Plasmodium malariae",
  "1C30": "Tuberculosis of lung",
  "1C31": "Tuberculosis of other sites",
  "CA00": "Malignant neoplasm of colon",
  "CA01": "Malignant neoplasm of rectosigmoidjunction",
  "DB90": "Type 1 diabetes mellitus",
  "DB91": "Type 2 diabetes mellitus",
  "BA42": "Diarrhoea and gastroenteritis",
  "CD2Z": "Hypertension, unspecified",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  try {
    const { search_term, icd_system } = await req.json();

    if (!search_term || !icd_system) {
      return new Response(
        JSON.stringify({
          error: "search_term and icd_system are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const results: ICDSearchResult[] = [];
    const term = search_term.toLowerCase();

    // Search logic based on system
    if (icd_system === "ICD-11") {
      for (const [code, description] of Object.entries(ICD_11_CODES)) {
        if (
          code.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term)
        ) {
          results.push({
            code,
            description,
            system: "ICD-11",
            category: code.substring(0, 2),
            available_in_systems: ["ICD-11"],
          });
        }
      }
    }

    // ICD-10 examples (simplified)
    if (icd_system === "ICD-10") {
      const icd10Codes: Record<string, string> = {
        "A00": "Cholera",
        "A01": "Typhoid fever",
        "B50": "Plasmodium falciparum malaria",
        "B51": "Plasmodium vivax malaria",
        "B52": "Plasmodium ovale malaria",
        "B53": "Plasmodium malariae malaria",
        "A15": "Respiratory tuberculosis",
        "A19": "Miliary tuberculosis",
        "C18": "Malignant neoplasm of colon",
        "C19": "Malignant neoplasm of rectosigmoid junction",
        "E10": "Type 1 diabetes mellitus",
        "E11": "Type 2 diabetes mellitus",
        "A09": "Diarrhea and gastroenteritis",
        "I10": "Essential (primary) hypertension",
      };

      for (const [code, description] of Object.entries(icd10Codes)) {
        if (
          code.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term)
        ) {
          results.push({
            code,
            description,
            system: "ICD-10",
            category: code.substring(0, 1),
            available_in_systems: ["ICD-10"],
          });
        }
      }
    }

    // ICD-9 examples (simplified)
    if (icd_system === "ICD-9") {
      const icd9Codes: Record<string, string> = {
        "001": "Cholera",
        "002": "Typhoid and paratyphoid fevers",
        "084": "Malaria",
        "010": "Primary tuberculosis infection",
        "011": "Tuberculosis of lung",
        "162": "Malignant neoplasm of trachea, bronchus, and lung",
        "162.9": "Malignant neoplasm of unspecified part of lung",
        "250": "Diabetes mellitus",
        "250.0": "Diabetes mellitus without mention of complication",
        "250.2": "Diabetes mellitus with hyperosmolarity",
        "787": "Symptoms involving digestive system",
        "787.02": "Nausea and vomiting",
        "401": "Essential hypertension",
        "401.9": "Unspecified essential hypertension",
      };

      for (const [code, description] of Object.entries(icd9Codes)) {
        if (
          code.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term)
        ) {
          results.push({
            code,
            description,
            system: "ICD-9",
            category: code.substring(0, 3),
            available_in_systems: ["ICD-9"],
          });
        }
      }
    }

    // Sort by relevance (exact matches first)
    results.sort((a, b) => {
      const aExact = a.code.toLowerCase() === term ? 1 : 0;
      const bExact = b.code.toLowerCase() === term ? 1 : 0;
      return bExact - aExact;
    });

    return new Response(JSON.stringify({ results: results.slice(0, 20) }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in expand_icd_codes:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
