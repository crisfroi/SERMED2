import { useCallback, useEffect, useState } from 'react';
import { supabase, executeSupabaseQuery } from '../../integrations/supabase/client';

export type Medicamento = {
  id: string;
  codigo?: string;
  nombre_comercial: string;
  principio_activo?: string;
  presentacion?: string;
  concentracion?: string;
  activo?: boolean;
};

export function useHosixMedicamentos(opts?: { pollingMs?: number }) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await executeSupabaseQuery(() => supabase.from('hosix_medicamentos').select('*').order('nombre_comercial'), 'hosix_medicamentos_fetch');
      if (res.error) setError(res.error);
      setMedicamentos(res.data as any);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);

  const create = useCallback(async (payload: Partial<Medicamento>) => {
    try {
      const res = await executeSupabaseQuery(() => supabase.from('hosix_medicamentos').insert([payload]).select().single(), 'hosix_medicamentos_create');
      if (res.error) throw res.error;
      await fetch();
      return { data: res.data, error: null };
    } catch (err) { return { data: null, error: err }; }
  }, [fetch]);

  useEffect(() => {
    fetch();
    if (opts?.pollingMs && opts.pollingMs > 0) {
      const id = setInterval(fetch, opts.pollingMs);
      return () => clearInterval(id);
    }
  }, [fetch, opts?.pollingMs]);

  return { medicamentos, loading, error, refresh: fetch, create } as const;
}

export default useHosixMedicamentos;
