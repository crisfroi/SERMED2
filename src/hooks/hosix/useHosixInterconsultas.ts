import { useEffect, useState, useCallback } from 'react';
import { supabase, executeSupabaseQuery } from '../../integrations/supabase/client';

export type Interconsulta = {
  id: string;
  numero: string;
  paciente_id: string;
  especialidad_id?: string;
  estado?: string;
  created_at?: string;
};

export type Respuesta = {
  id: string;
  interconsulta_id: string;
  texto: string;
  especialista_id?: string;
  created_at?: string;
};

export type Seguimiento = {
  id: string;
  interconsulta_id: string;
  notas: string;
  created_at?: string;
};

export type Comunicacion = {
  id: string;
  interconsulta_id: string;
  from_user_id: string;
  to_user_id?: string;
  message: string;
  created_at?: string;
};

export function useHosixInterconsultas(opts?: { pollingMs?: number }) {
  const [solicitudes, setSolicitudes] = useState<Interconsulta[] | null>(null);
  const [respuestas, setRespuestas] = useState<Respuesta[] | null>(null);
  const [seguimiento, setSeguimiento] = useState<Seguimiento[] | null>(null);
  const [comunicaciones, setComunicaciones] = useState<Comunicacion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [solRes, respRes, segRes, comRes] = await Promise.all([
        executeSupabaseQuery(() => supabase.from('hosix_interconsultas').select('*'), 'fetch_solicitudes'),
        executeSupabaseQuery(() => supabase.from('hosix_interconsultas_respuestas').select('*'), 'fetch_respuestas'),
        executeSupabaseQuery(() => supabase.from('hosix_interconsultas_seguimiento').select('*'), 'fetch_seguimiento'),
        executeSupabaseQuery(() => supabase.from('hosix_interconsultas_comunicaciones').select('*'), 'fetch_comunicaciones'),
      ]);

      if (solRes.error || respRes.error || segRes.error || comRes.error) {
        setError({ sol: solRes.error, resp: respRes.error, seg: segRes.error, com: comRes.error });
      }

      setSolicitudes(solRes.data as any);
      setRespuestas(respRes.data as any);
      setSeguimiento(segRes.data as any);
      setComunicaciones(comRes.data as any);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    if (opts?.pollingMs && opts.pollingMs > 0) {
      const id = setInterval(fetchAll, opts.pollingMs);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAll, opts?.pollingMs]);

  return {
    solicitudes,
    respuestas,
    seguimiento,
    comunicaciones,
    loading,
    error,
    refresh: fetchAll,
    // Creation helpers
    createSolicitud: async (payload: Partial<Interconsulta>) => {
      try {
        const res = await executeSupabaseQuery(
          () => supabase.from('hosix_interconsultas').insert([{ ...payload }]).select().single(),
          'create_solicitud'
        );
        if (res.error) throw res.error;
        // refresh local cache
        await fetchAll();
        return { data: res.data, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
    createRespuesta: async (payload: Partial<Respuesta>) => {
      try {
        const res = await executeSupabaseQuery(
          () => supabase.from('hosix_interconsultas_respuestas').insert([{ ...payload }]).select().single(),
          'create_respuesta'
        );
        if (res.error) throw res.error;
        await fetchAll();
        return { data: res.data, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
    addSeguimiento: async (payload: Partial<Seguimiento>) => {
      try {
        const res = await executeSupabaseQuery(
          () => supabase.from('hosix_interconsultas_seguimiento').insert([{ ...payload }]).select().single(),
          'create_seguimiento'
        );
        if (res.error) throw res.error;
        await fetchAll();
        return { data: res.data, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
    sendComunicacion: async (payload: Partial<Comunicacion>) => {
      try {
        const res = await executeSupabaseQuery(
          () => supabase.from('hosix_interconsultas_comunicaciones').insert([{ ...payload }]).select().single(),
          'create_comunicacion'
        );
        if (res.error) throw res.error;
        await fetchAll();
        return { data: res.data, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
    updateSolicitudStatus: async (id: string, status: string) => {
      try {
        const res = await executeSupabaseQuery(
          () => supabase.from('hosix_interconsultas').update({ estado: status }).eq('id', id).select().single(),
          'update_solicitud_status'
        );
        if (res.error) throw res.error;
        await fetchAll();
        return { data: res.data, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
  } as const;
}

export default useHosixInterconsultas;
