import { useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';

export default function useQuirofanos() {
  const listQuirofanos = useCallback(async () => {
    const { data, error } = await supabase.from('hosix_quirofanos').select('*');
    return { data, error };
  }, []);

  const listIntervenciones = useCallback(async (quirofanoId?: number) => {
    let q = supabase.from('hosix_quirofanos_intervenciones').select('*');
    if (quirofanoId) q = q.eq('quirofano_id', quirofanoId);
    const { data, error } = await q.order('fecha_programada', { ascending: true });
    return { data, error };
  }, []);

  const createIntervencion = useCallback(async (payload: any) => {
    const { data, error } = await supabase.from('hosix_quirofanos_intervenciones').insert(payload).select().single();
    return { data, error };
  }, []);

  const updateIntervencion = useCallback(async (id: number, changes: any) => {
    const { data, error } = await supabase.from('hosix_quirofanos_intervenciones').update(changes).eq('id', id).select().single();
    return { data, error };
  }, []);

  return { listQuirofanos, listIntervenciones, createIntervencion, updateIntervencion };
}
import { useCallback, useEffect, useState } from 'react';
import { supabase, executeSupabaseQuery } from '../../integrations/supabase/client';

export type Quirofano = {
  id: string;
  codigo: string;
  nombre: string;
  area_quirurgica?: string;
  tipo_quirofano?: string;
  activo?: boolean;
};

export type Intervencion = {
  id: string;
  quirofano_id: string;
  paciente_id: string;
  fecha_programada: string;
  procedimiento_principal: string;
  estado?: string;
};

export function useQuirofanos(opts?: { pollingMs?: number }) {
  const [quirofanos, setQuirofanos] = useState<Quirofano[] | null>(null);
  const [intervenciones, setIntervenciones] = useState<Intervencion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [qRes, iRes] = await Promise.all([
        executeSupabaseQuery(() => supabase.from('hosix_quirofanos').select('*').order('nombre'), 'quirofanos_fetch'),
        executeSupabaseQuery(() => supabase.from('hosix_quirofanos_intervenciones').select('*').order('fecha_programada', { ascending: false }), 'intervenciones_fetch')
      ]);
      if (qRes.error || iRes.error) setError({ q: qRes.error, i: iRes.error });
      setQuirofanos(qRes.data as any);
      setIntervenciones(iRes.data as any);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);

  const createIntervencion = useCallback(async (payload: Partial<Intervencion>) => {
    try {
      const res = await executeSupabaseQuery(() => supabase.from('hosix_quirofanos_intervenciones').insert([payload]).select().single(), 'intervenciones_create');
      if (res.error) throw res.error;
      await fetchAll();
      return { data: res.data, error: null };
    } catch (err) { return { data: null, error: err }; }
  }, [fetchAll]);

  const updateIntervencion = useCallback(async (id: string, payload: Partial<Intervencion>) => {
    try {
      const res = await executeSupabaseQuery(() => supabase.from('hosix_quirofanos_intervenciones').update(payload).eq('id', id).select().single(), 'intervenciones_update');
      if (res.error) throw res.error;
      await fetchAll();
      return { data: res.data, error: null };
    } catch (err) { return { data: null, error: err }; }
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
    if (opts?.pollingMs && opts.pollingMs > 0) {
      const id = setInterval(fetchAll, opts.pollingMs);
      return () => clearInterval(id);
    }
  }, [fetchAll, opts?.pollingMs]);

  return { quirofanos, intervenciones, loading, error, refresh: fetchAll, createIntervencion, updateIntervencion } as const;
}

export default useQuirofanos;
