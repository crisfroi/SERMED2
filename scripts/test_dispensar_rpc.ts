/**
 * Test script to call the `dispensar_prescripcion` RPC on Supabase.
 *
 * Usage (PowerShell):
 *  $env:SUPABASE_URL = "https://xyz.supabase.co"
 *  $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role_key>" # or SUPABASE_ANON_KEY
 *  node ./dist/scripts/test_dispensar_rpc.js
 *
 * This script uses @supabase/supabase-js and is intended to be compiled with tsc
 * or run via ts-node if available.
 */

import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in env');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  try {
    console.log('Calling RPC dispensar_prescripcion with test payload...');

    const params: Record<string, any> = {
      p_prescripcion_id: 'TEST-PRESC-000',
      p_prescripcion_numero: 'TEST-000',
      p_medicamento_id: null,
      p_medicamento_texto: 'TEST MED',
      p_cantidad_dispensada: 1,
      p_unidad: null,
      p_lote: null,
      p_fecha_caducidad: null,
      p_dispensador_id: 'script-test',
      p_cantidad_a_facturar: 0,
      p_caja_id: null,
      p_forma_pago: null,
      p_registrado_por: 'script-test',
    };

    const res = await supabase.rpc('dispensar_prescripcion', params as any);

    if ((res as any).error) {
      console.error('RPC returned error:', (res as any).error);
      process.exit(2);
    }

    console.log('RPC result:', JSON.stringify(res.data, null, 2));
    console.log('If the RPC succeeded, verify DB rows for dispensaciones, stock movements and caja movements.');
  } catch (err) {
    console.error('Call failed:', err instanceof Error ? err.message : err);
    process.exit(3);
  }
}

main();
