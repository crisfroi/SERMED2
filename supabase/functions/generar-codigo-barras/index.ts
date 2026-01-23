import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Función para generar barcode usando JsBarcode en cliente o una API externa
async function generarBarcodeImage(
  codigo: string,
  color: string = "000000",
  ancho: number = 300,
  alto: number = 100
): Promise<Uint8Array | null> {
  try {
    // Usar una API externa de barcode generation que retorna PNG
    // Opción 1: barcode.tec-it.com (libre, sin autenticación)
    const url = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(codigo)}&code=Code128&translate-esc=false&width=${ancho}&height=${alto}&format=png`;
    
    console.log(`Generando barcode desde: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error al generar barcode: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error(`Error en generación de barcode: ${error.message}`);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    // Permitir CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        },
      });
    }

    if (req.method !== "GET") {
      return json({ error: "Solo se permite GET" }, 405);
    }

    const url = new URL(req.url);
    const codigo = url.searchParams.get("codigo") || "";
    const color = url.searchParams.get("color") || "000000";
    const ancho = parseInt(url.searchParams.get("ancho") || "300");
    const alto = parseInt(url.searchParams.get("alto") || "100");

    if (!codigo) {
      return json({ error: "Parámetro 'codigo' es requerido" }, 400);
    }

    console.log(`Generando barcode para: ${codigo}, color: ${color}, size: ${ancho}x${alto}`);

    // Generar la imagen del barcode
    const barcodeImage = await generarBarcodeImage(codigo, color, ancho, alto);

    if (!barcodeImage) {
      return json({ error: "No se pudo generar el barcode" }, 500);
    }

    // Retornar como PNG
    return new Response(barcodeImage, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000", // 1 año de caché
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error en generar-codigo-barras:", error);
    return json(
      { error: "Error interno del servidor", details: error.message },
      500
    );
  }
});
