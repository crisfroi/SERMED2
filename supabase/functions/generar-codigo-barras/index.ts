import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Generar código de barras usando SVG (sin dependencias externas)
function generarBarcodeSVG(
  codigo: string,
  color: string = "000000",
  ancho: number = 316,
  alto: number = 69
): string {
  // Code 128 patterns (simplified - using subset B for alphanumeric)
  const CODE128_PATTERNS: { [key: string]: string } = {
    ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
    '$': '10010001100', '%': '10001001100', '&': '10011001000', "'": '10011000100',
    '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
    ',': '10110011100', '-': '10011011100', '.': '10011001110', '/': '10111001100',
    '0': '10011101100', '1': '10011100110', '2': '11001110010', '3': '11001011100',
    '4': '11001001110', '5': '11011100100', '6': '11001110100', '7': '11101101110',
    '8': '11101001100', '9': '11100101100', ':': '11100100110', ';': '11101100100',
    '<': '11100110100', '=': '11100110010', '>': '11011011000', '?': '11011000110',
    '@': '11000110110', 'A': '10100011000', 'B': '10001011000', 'C': '10001000110',
    'D': '10110001000', 'E': '10001101000', 'F': '10001100010', 'G': '11010001000',
    'H': '11000101000', 'I': '11000100010', 'J': '10110111000', 'K': '10110001110',
    'L': '10001101110', 'M': '10111011000', 'N': '10111000110', 'O': '10001110110',
    'P': '11101110110', 'Q': '11010001110', 'R': '11000101110', 'S': '11011101000',
    'T': '11011100010', 'U': '11011101110', 'V': '11101011000', 'W': '11101000110',
    'X': '11100010110', 'Y': '11101101000', 'Z': '11101100010', '[': '11100011010',
    '\\': '11101111010', ']': '11001000010', '^': '11110001010', '_': '10100110000',
    '`': '10100001100', 'a': '10010110000', 'b': '10010000110', 'c': '10000101100',
    'd': '10000100110', 'e': '10110010000', 'f': '10110000100', 'g': '10011010000',
    'h': '10011000010', 'i': '10000110100', 'j': '10000110010', 'k': '11000010010',
    'l': '11001010000', 'm': '11110111010', 'n': '11000010100', 'o': '10001111010',
    'p': '10100111100', 'q': '10010111100', 'r': '10010011110', 's': '10111100100',
    't': '10011110100', 'u': '10011110010', 'v': '11110100100', 'w': '11110010100',
    'x': '11110010010', 'y': '11011011110', 'z': '11011110110', '{': '11110110110',
    '|': '10101111000', '}': '10100011110', '~': '10001011110',
    'START_B': '11010010000',
    'STOP': '1100011101011',
  };

  // Build pattern string
  let pattern = CODE128_PATTERNS['START_B'];
  let checksum = 104; // Start B code value

  for (let i = 0; i < codigo.length; i++) {
    const char = codigo[i];
    const charPattern = CODE128_PATTERNS[char];
    if (charPattern) {
      pattern += charPattern;
      // Calculate checksum (simplified)
      const charValue = char.charCodeAt(0) - 32;
      checksum += charValue * (i + 1);
    }
  }

  // Add checksum character (simplified)
  const checksumChar = String.fromCharCode((checksum % 103) + 32);
  const checksumPattern = CODE128_PATTERNS[checksumChar];
  if (checksumPattern) {
    pattern += checksumPattern;
  }

  pattern += CODE128_PATTERNS['STOP'];

  // Calculate bar width
  const totalBars = pattern.length;
  const barWidth = ancho / totalBars;
  const barHeight = alto - 15; // Leave space for text

  // Generate SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">`;
  svg += `<rect width="100%" height="100%" fill="white"/>`;

  let x = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      svg += `<rect x="${x}" y="0" width="${barWidth}" height="${barHeight}" fill="#${color}"/>`;
    }
    x += barWidth;
  }

  // Add text below barcode
  svg += `<text x="${ancho / 2}" y="${alto - 2}" text-anchor="middle" font-family="monospace" font-size="10" fill="#${color}">${codigo}</text>`;
  svg += `</svg>`;

  return svg;
}

// Convert SVG to PNG using Canvas API (Deno compatible)
async function svgToPng(svgString: string, width: number, height: number): Promise<Uint8Array> {
  // For edge functions, we'll return SVG as-is or use a simpler approach
  // Since we can't use Canvas in Deno edge functions easily, 
  // we'll return the SVG with proper MIME type
  const encoder = new TextEncoder();
  return encoder.encode(svgString);
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "GET") {
      return json({ error: "Solo se permite GET" }, 405);
    }

    const url = new URL(req.url);
    const codigo = url.searchParams.get("codigo") || "";
    const color = (url.searchParams.get("color") || "000000").replace('#', '');
    const ancho = parseInt(url.searchParams.get("ancho") || "316");
    const alto = parseInt(url.searchParams.get("alto") || "69");
    const format = url.searchParams.get("format") || "svg";

    if (!codigo) {
      return json({ error: "Parámetro 'codigo' es requerido" }, 400);
    }

    console.log(`Generando barcode SVG para: ${codigo}, color: #${color}, size: ${ancho}x${alto}`);

    // Generar el SVG del código de barras
    const svgContent = generarBarcodeSVG(codigo, color, ancho, alto);

    // Retornar como SVG (más eficiente y sin dependencias externas)
    return new Response(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000",
        ...corsHeaders,
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