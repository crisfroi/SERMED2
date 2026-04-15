// @ts-nocheck
import { useCallback } from 'react';
import { supabase, executeSupabaseQuery } from '../../integrations/supabase/client';
import useHosixStock from './useHosixStock';

export function useDispensaciones() {
  const { createStockMovement } = useHosixStock();

  const createDispensacion = useCallback(async (payload: {
    prescripcion_id: string;
    prescriptor_id?: string;
    prescripcion_numero?: string;
    medicamento_id?: string;
    medicamento_texto?: string;
    cantidad_dispensada: number;
    unidad?: string;
    lote?: string;
    fecha_caducidad?: string;
    dispensador_id?: string;
    cantidad_a_facturar?: number; // monto total a cobrar
    caja_id?: string;
    forma_pago?: string;
  }) => {
    // Only use the server-side atomic RPC in production to ensure consistency
    try {
      const rpcRes = await supabase.rpc('dispensar_prescripcion', {
        p_prescripcion_id: payload.prescripcion_id,
        p_prescripcion_numero: payload.prescripcion_numero || null,
        p_medicamento_id: payload.medicamento_id || null,
        p_medicamento_texto: payload.medicamento_texto || null,
        p_cantidad_dispensada: payload.cantidad_dispensada,
        p_unidad: payload.unidad || null,
        p_lote: payload.lote || null,
        p_fecha_caducidad: payload.fecha_caducidad || null,
        p_dispensador_id: payload.dispensador_id || null,
        p_cantidad_a_facturar: payload.cantidad_a_facturar || null,
        p_caja_id: payload.caja_id || null,
        p_forma_pago: payload.forma_pago || null,
        p_registrado_por: payload.dispensador_id || null,
      });

      if ((rpcRes as any).error) {
        return { data: null, error: (rpcRes as any).error };
      }

      return { data: rpcRes.data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [createStockMovement]);

  return { createDispensacion } as const;
}

export default useDispensaciones;
