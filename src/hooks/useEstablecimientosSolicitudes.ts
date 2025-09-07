import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SolicitudEstablecimiento = {
  id: string;
  numero_solicitud: string | null;
  nombre_establecimiento: string;
  tipo_establecimiento: string;
  categoria: string;
  sector: string;
  provincia: string;
  distrito: string;
  distrito_sanitario: string | null;
  direccion_completa: string;
  telefono: string | null;
  email_contacto: string | null;
  nombre_responsable: string;
  cargo_responsable: string;
  documento_responsable: string | null;
  servicios_ofrecidos: string[] | null;
  especialidades: string[] | null;
  numero_camas: number | null;
  numero_consultorios: number | null;
  equipamiento_basico: string[] | null;
  justificacion: string;
  poblacion_beneficiada: number | null;
  documentos_adjuntos: string[] | null;
  estado_solicitud: string | null;
  motivo_rechazo: string | null;
  notas_revision: string | null;
  fecha_solicitud: string | null;
  fecha_revision: string | null;
  fecha_aprobacion: string | null;
  revisor_id: string | null;
  aprobado_por: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function generarNumeroSolicitud(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SE-${y}${m}${d}-${rand}`;
}

export const useSolicitudesEstablecimientos = (status?: string) => {
  return useQuery({
    queryKey: ['solicitudes-establecimientos', status],
    queryFn: async () => {
      let query = supabase.from('solicitudes_establecimientos').select('*').order('created_at', { ascending: false });
      if (status && status !== 'all') query = query.eq('estado_solicitud', status);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SolicitudEstablecimiento[];
    }
  });
};

export const useCreateSolicitudEstablecimiento = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<SolicitudEstablecimiento, 'id' | 'created_at' | 'updated_at' | 'fecha_aprobacion' | 'fecha_revision' | 'numero_solicitud' | 'estado_solicitud' | 'aprobado_por' | 'revisor_id'>) => {
      const numero = generarNumeroSolicitud();
      const { data, error } = await supabase
        .from('solicitudes_establecimientos')
        .insert([{ ...payload, numero_solicitud: numero, estado_solicitud: 'Recibida' }])
        .select()
        .single();
      if (error) throw error;
      return data as SolicitudEstablecimiento;
    },
    onSuccess: (data) => {
      toast({ title: 'Solicitud enviada', description: `Número: ${data.numero_solicitud}` });
      qc.invalidateQueries({ queryKey: ['solicitudes-establecimientos'] });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  });
};

export const useUpdateEstadoEstablecimiento = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nuevoEstado, notas }: { id: string; nuevoEstado: 'Revisando Expediente' | 'Pendiente de Firma' | 'Aprobada' | 'Rechazada'; notas?: string }) => {
      const updates: any = { estado_solicitud: nuevoEstado };
      if (nuevoEstado === 'Revisando Expediente') updates.fecha_revision = new Date().toISOString();
      if (nuevoEstado === 'Aprobada') updates.fecha_aprobacion = new Date().toISOString();
      if (notas) updates.notas_revision = notas;
      const { error } = await supabase.from('solicitudes_establecimientos').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solicitudes-establecimientos'] });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  });
};

export const useAprobarEstablecimiento = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ solicitud, aprobadorId }: { solicitud: SolicitudEstablecimiento; aprobadorId: string }) => {
      // Insertar en centros_salud
      const centro = {
        nombre: solicitud.nombre_establecimiento,
        categoria: solicitud.categoria,
        provincia: solicitud.provincia,
        distrito: solicitud.distrito,
        distrito_sanitario: solicitud.distrito_sanitario,
        sector: solicitud.sector || 'Público',
      };
      const { error: centroErr } = await supabase.from('centros_salud').insert([centro]);
      if (centroErr) throw centroErr;

      // Actualizar solicitud con aprobación
      const { error: solErr } = await supabase.from('solicitudes_establecimientos').update({ estado_solicitud: 'Aprobada', fecha_aprobacion: new Date().toISOString(), aprobado_por: aprobadorId }).eq('id', solicitud.id);
      if (solErr) throw solErr;
    },
    onSuccess: () => {
      toast({ title: 'Establecimiento aprobado' });
      qc.invalidateQueries({ queryKey: ['solicitudes-establecimientos'] });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  });
};
