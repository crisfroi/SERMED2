// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SpDireccion { id: string; codigo: string; nombre: string; responsable?: string | null; email?: string | null; telefono?: string | null; activo: boolean }
export interface SpCampo { name: string; label: string; type: "text" | "textarea" | "number" | "date" | "select"; required?: boolean; options?: string[] }
export interface SpServicio {
  id: string; codigo: string; nombre: string; descripcion?: string | null; direccion_id?: string | null; categoria?: string | null;
  requiere_pago: boolean; monto: number; moneda: string; cuenta_bancaria_id?: string | null; plazo_dias: number;
  formulario_schema: SpCampo[]; documentos_requeridos: string[]; plantilla_resolucion?: string | null; vigencia_meses?: number | null;
  activo: boolean; orden: number;
}
export interface SpEstado { id: string; servicio_id: string | null; codigo: string; nombre: string; color: string; orden: number; es_inicial: boolean; es_final: boolean; es_aprobacion: boolean }
export interface SpTransicion { id: string; servicio_id: string | null; estado_origen: string; estado_destino: string; accion_label: string; rol_requerido?: string | null; requiere_motivo: boolean; genera_nota_ingreso: boolean; genera_resolucion: boolean }
export interface SpSolicitud {
  id: string; numero_solicitud: string; servicio_id: string; direccion_id?: string | null; solicitante_nombre: string;
  solicitante_documento?: string | null; solicitante_email?: string | null; solicitante_telefono?: string | null;
  datos: Record<string, any>; documentos: any[]; estado: string; monto: number; moneda: string;
  cuenta_bancaria_id?: string | null; resolucion_url?: string | null; resolucion_texto?: string | null;
  token_verificacion: string; hash_auditoria?: string | null; motivo_rechazo?: string | null; created_at: string;
}

const table = (name: string) => (supabase as any).from(name);

export const useSpDirecciones = () =>
  useQuery({
    queryKey: ["sp_direcciones"],
    queryFn: async () => {
      const { data, error } = await table("sp_direcciones").select("*").order("nombre");
      if (error) throw error;
      return (data || []) as SpDireccion[];
    },
  });

export const useSpServicios = (soloActivos = false) =>
  useQuery({
    queryKey: ["sp_servicios", soloActivos],
    queryFn: async () => {
      let q = table("sp_servicios").select("*").order("orden").order("nombre");
      if (soloActivos) q = q.eq("activo", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as SpServicio[];
    },
  });

export const useSpEstados = () =>
  useQuery({
    queryKey: ["sp_estados"],
    queryFn: async () => {
      const { data, error } = await table("sp_estados").select("*").order("orden");
      if (error) throw error;
      return (data || []) as SpEstado[];
    },
  });

export const useSpTransiciones = () =>
  useQuery({
    queryKey: ["sp_transiciones"],
    queryFn: async () => {
      const { data, error } = await table("sp_transiciones").select("*").order("created_at");
      if (error) throw error;
      return (data || []) as SpTransicion[];
    },
  });

export const useSpSolicitudes = (estado?: string) =>
  useQuery({
    queryKey: ["sp_solicitudes", estado || "todos"],
    queryFn: async () => {
      let q = table("sp_solicitudes").select("*").order("created_at", { ascending: false }).limit(500);
      if (estado && estado !== "todos") q = q.eq("estado", estado);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as SpSolicitud[];
    },
    refetchInterval: 20000,
  });

export const useSpHistorial = (solicitudId?: string) =>
  useQuery({
    enabled: !!solicitudId,
    queryKey: ["sp_historial", solicitudId],
    queryFn: async () => {
      const { data, error } = await table("sp_solicitud_historial").select("*").eq("solicitud_id", solicitudId).order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

/** CRUD genérico sobre cualquier catálogo del módulo. */
export const useSpUpsert = (tableName: string, queryKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: any) => {
      const { id, ...rest } = row;
      const query = id ? table(tableName).update(rest).eq("id", id) : table(tableName).insert(rest);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });
};

export const useSpDelete = (tableName: string, queryKey: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table(tableName).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });
};

export const useSpCambiarEstado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ solicitud, transicion, motivo, resolucion }: { solicitud: SpSolicitud; transicion: SpTransicion; motivo?: string; resolucion?: string }) => {
      const updates: any = { estado: transicion.estado_destino };
      if (motivo) updates.motivo_rechazo = motivo;
      if (transicion.genera_resolucion) {
        updates.resolucion_texto = resolucion || null;
        updates.fecha_resolucion = new Date().toISOString();
      }
      const { data, error } = await table("sp_solicitudes").update(updates).eq("id", solicitud.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sp_solicitudes"] });
      qc.invalidateQueries({ queryKey: ["sp_historial"] });
    },
  });
};

export const crearSpSolicitud = async (payload: any) => {
  const { data, error } = await table("sp_solicitudes").insert(payload).select().single();
  if (error) throw error;
  return data as SpSolicitud;
};

export const verificarSpSolicitud = async (token: string) => {
  const { data, error } = await (supabase as any).rpc("sp_verificar_solicitud", { p_token: token });
  if (error) throw error;
  return (data || [])[0] || null;
};

/** Renderiza la plantilla de resolución sustituyendo variables {{campo}}. */
export const renderPlantilla = (plantilla: string, vars: Record<string, any>) =>
  String(plantilla || "").replace(/{{\s*(\w+)\s*}}/g, (_, key) => String(vars[key] ?? ""));
