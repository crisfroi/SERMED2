// @ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import { supabase, executeSupabaseQuery } from '../../integrations/supabase/client';

export type Prescripcion = {
  id: string;
  paciente_id: string;
  medicamento_id?: string;
  medicamento_texto?: string;
  dosis?: string;
  frecuencia?: string;
  duracion_dias?: number;
  instrucciones?: string;
  estado?: string;
};

export function useHosixPrescripciones(opts?: { pollingMs?: number }) {
  const [prescripciones, setPrescripciones] = useState<Prescripcion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await executeSupabaseQuery(() => supabase.from('hosix_prescripciones').select('*').order('fecha_prescripcion', { ascending: false }), 'hosix_prescripciones_fetch');
      if (res.error) setError(res.error);
      setPrescripciones(res.data as any);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);

  const create = useCallback(async (payload: Partial<Prescripcion>) => {
    try {
      const res = await executeSupabaseQuery(() => supabase.from('hosix_prescripciones').insert([payload]).select().single(), 'hosix_prescripciones_create');
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

  return { prescripciones, loading, error, refresh: fetch, create } as const;
}

export default useHosixPrescripciones;
