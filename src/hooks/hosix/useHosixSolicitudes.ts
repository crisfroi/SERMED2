// @ts-nocheck
import { useEffect, useState, useCallback } from 'react';
import { supabase, executeSupabaseQuery } from '../../integrations/supabase/client';

export type Solicitud = {
  id: string;
  numero: string;
  paciente_id: string;
  tipo: string;
  estado: string;
  fecha_solicitud?: string;
};

export function useHosixSolicitudes(opts?: { filter?: Record<string, any>; pollingMs?: number }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = () => supabase.from('hosix_interconsultas').select('*');
      const res = await executeSupabaseQuery(query, 'hosix_solicitudes_fetch');
      if (res.error) setError(res.error);
      setSolicitudes(res.data as any);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    if (opts?.pollingMs && opts.pollingMs > 0) {
      const id = setInterval(fetch, opts.pollingMs);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch, opts?.pollingMs]);

  return { solicitudes, loading, error, refresh: fetch } as const;
}

export default useHosixSolicitudes;
