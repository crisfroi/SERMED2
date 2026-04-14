import { useCallback, useState } from 'react';
import { supabase, executeSupabaseQuery } from '../../integrations/supabase/client';

export type StockMedicamento = {
  id: string;
  medicamento_id: string;
  cantidad_disponible: number;
  cantidad_minima?: number;
  cantidad_maxima?: number;
  lote_actual?: string;
  fecha_caducidad?: string;
};

export function useHosixStock() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const getStockForMedicamento = useCallback(async (medicamentoId: string) => {
    setLoading(true); setError(null);
    try {
      const res = await executeSupabaseQuery(() => supabase.from('hosix_stock_medicamentos').select('*').eq('medicamento_id', medicamentoId).single(), 'stock_fetch');
      if (res.error) throw res.error;
      return { data: res.data as StockMedicamento | null, error: null };
    } catch (err) {
      setError(err); return { data: null, error: err };
    } finally { setLoading(false); }
  }, []);

  const createStockMovement = useCallback(async (payload: { medicamento_id: string; tipo_movimiento: string; cantidad: number; referencia_documento?: string; usuario_id?: string; observaciones?: string }) => {
    try {
      const { medicamento_id, tipo_movimiento, cantidad, referencia_documento, usuario_id, observaciones } = payload;
      // Fetch current stock
      const stockRes = await executeSupabaseQuery(() => supabase.from('hosix_stock_medicamentos').select('*').eq('medicamento_id', medicamento_id).single(), 'stock_fetch_for_move');
      if (stockRes.error) throw stockRes.error;
      const current = stockRes.data as any;
      const cantidad_anterior = Number(current?.cantidad_disponible || 0);
      const cantidad_nueva = cantidad_anterior + Number(cantidad);

      // Insert movimiento
      const movRes = await executeSupabaseQuery(() => supabase.from('hosix_stock_movimientos').insert([{ medicamento_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, referencia_documento, usuario_id, observaciones }]).select().single(), 'stock_mov_create');
      if (movRes.error) throw movRes.error;

      // Update stock table
      const updRes = await executeSupabaseQuery(() => supabase.from('hosix_stock_medicamentos').update({ cantidad_disponible: cantidad_nueva }).eq('medicamento_id', medicamento_id), 'stock_update');
      if (updRes.error) throw updRes.error;

      return { data: movRes.data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, []);

  return { getStockForMedicamento, createStockMovement, loading, error } as const;
}

export default useHosixStock;
