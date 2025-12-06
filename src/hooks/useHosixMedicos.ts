import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WorklistMedico {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio: string;
  servicio_id?: string;
  medico_asignado_id?: string;
  fecha_asignacion?: string;
  estado: string;
  prioridad: string;
  motivo_consulta?: string;
  observaciones?: string;
  requiere_seguimiento: boolean;
}

export interface Diagnostico {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  consulta_id?: string;
  codigo_cie10?: string;
  descripcion_diagnostico: string;
  tipo_diagnostico: string;
  certeza: string;
  fecha_diagnostico: string;
  medico_id?: string;
  observaciones?: string;
}

export interface Tratamiento {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  diagnostico_id?: string;
  tipo_tratamiento: string;
  descripcion: string;
  indicaciones?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  duracion_dias?: number;
  medico_id?: string;
  estado: string;
  resultado?: string;
  efectividad?: string;
}

export interface Interconsulta {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  servicio_solicitante_id?: string;
  servicio_destino_id: string;
  medico_solicitante_id?: string;
  medico_destino_id?: string;
  motivo_interconsulta: string;
  pregunta_clinica?: string;
  antecedentes_relevantes?: string;
  urgencia: string;
  fecha_solicitud: string;
  fecha_limite_respuesta?: string;
  fecha_respuesta?: string;
  respuesta_medica?: string;
  recomendaciones?: string;
  requiere_seguimiento: boolean;
  estado: string;
}

export interface ConsultaMedica {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  cita_id?: string;
  fecha_consulta: string;
  medico_id: string;
  servicio_id?: string;
  motivo_consulta?: string;
  enfermedad_actual?: string;
  antecedentes_personales?: string;
  antecedentes_familiares?: string;
  alergias?: string[];
  medicamentos_actuales?: any[];
  exploracion_fisica?: Record<string, any>;
  diagnosticos_principales?: string[];
  diagnosticos_secundarios?: string[];
  plan_terapeutico?: string;
  tratamientos_prescritos?: string[];
  prescripciones?: string[];
  ordenes_laboratorio?: any[];
  ordenes_imagenologia?: any[];
  ordenes_otros?: any[];
  requiere_control: boolean;
  fecha_proximo_control?: string;
  observaciones?: string;
  firmado: boolean;
  fecha_firma?: string;
}

export const useHosixMedicos = () => {
  const queryClient = useQueryClient();

  const { data: worklist = [], isLoading: isLoadingWorklist } = useQuery({
    queryKey: ['medicos-worklist'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('hosix_medicos_worklist' as any)
        .select(`
          *,
          paciente:hosix_pacientes(id, ppi, primer_nombre, primer_apellido, fecha_nacimiento),
          servicio:hosix_servicios(id, nombre)
        `)
        .in('estado', ['pendiente', 'en_consulta'])
        .order('prioridad', { ascending: false })
        .order('created_at', { ascending: true }) as any);

      if (error) throw error;
      return data || [];
    },
  });

  const crearWorklistMutation = useMutation({
    mutationFn: async (data: Partial<WorklistMedico>) => {
      const { data: result, error } = await (supabase
        .from('hosix_medicos_worklist' as any)
        .insert([data])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicos-worklist'] });
    },
  });

  const actualizarWorklistMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<WorklistMedico> & { id: string }) => {
      const { data: result, error } = await (supabase
        .from('hosix_medicos_worklist' as any)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicos-worklist'] });
    },
  });

  const obtenerDiagnosticos = (pacienteId: string, episodioId?: string) => {
    return useQuery({
      queryKey: ['medicos-diagnosticos', pacienteId, episodioId],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_diagnosticos' as any)
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_diagnostico', { ascending: false }) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const crearDiagnosticoMutation = useMutation({
    mutationFn: async (data: Partial<Diagnostico>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_diagnosticos' as any)
        .insert([
          {
            ...data,
            medico_id: user.user?.id,
            fecha_diagnostico: new Date().toISOString(),
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['medicos-diagnosticos', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  const obtenerTratamientos = (pacienteId: string, episodioId?: string) => {
    return useQuery({
      queryKey: ['medicos-tratamientos', pacienteId, episodioId],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_tratamientos' as any)
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_inicio', { ascending: false }) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const crearTratamientoMutation = useMutation({
    mutationFn: async (data: Partial<Tratamiento>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_tratamientos' as any)
        .insert([
          {
            ...data,
            medico_id: user.user?.id,
            fecha_inicio: new Date().toISOString(),
            estado: 'activo',
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['medicos-tratamientos', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  const obtenerInterconsultas = (pacienteId: string, episodioId?: string) => {
    return useQuery({
      queryKey: ['medicos-interconsultas', pacienteId, episodioId],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_interconsultas' as any)
          .select(`
            *,
            servicio_destino:hosix_servicios(id, nombre),
            servicio_solicitante:hosix_servicios(id, nombre)
          `)
          .eq('paciente_id', pacienteId)
          .order('fecha_solicitud', { ascending: false }) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const crearInterconsultaMutation = useMutation({
    mutationFn: async (data: Partial<Interconsulta>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_interconsultas' as any)
        .insert([
          {
            ...data,
            medico_solicitante_id: user.user?.id,
            fecha_solicitud: new Date().toISOString(),
            estado: 'pendiente',
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['medicos-interconsultas', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  const responderInterconsultaMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Interconsulta> & { id: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_interconsultas' as any)
        .update({
          ...data,
          medico_destino_id: user.user?.id,
          fecha_respuesta: new Date().toISOString(),
          estado: 'respondida',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['medicos-interconsultas', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  const obtenerConsultas = (pacienteId: string, episodioId?: string) => {
    return useQuery({
      queryKey: ['medicos-consultas', pacienteId, episodioId],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_consultas_medicas' as any)
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_consulta', { ascending: false }) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const crearConsultaMutation = useMutation({
    mutationFn: async (data: Partial<ConsultaMedica>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_consultas_medicas' as any)
        .insert([
          {
            ...data,
            medico_id: user.user?.id || data.medico_id,
            fecha_consulta: new Date().toISOString(),
            firmado: false,
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      
      // Registrar en historia clínica
      await (supabase
        .from('hosix_historia_clinica' as any)
        .insert([
          {
            paciente_id: data.paciente_id,
            tipo_entrada: 'consulta_medica',
            episodio_id: data.episodio_id,
            fecha_entrada: new Date().toISOString(),
            titulo: 'Consulta Médica',
            contenido: data.motivo_consulta || data.enfermedad_actual || 'Consulta médica',
            datos_estructurados: {
              consulta_id: result.id,
              diagnosticos: data.diagnosticos_principales,
            },
          },
        ]) as any);

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['medicos-consultas', variables.paciente_id, variables.episodio_id] 
      });
      queryClient.invalidateQueries({ queryKey: ['medicos-worklist'] });
    },
  });

  return {
    worklist,
    isLoadingWorklist,
    crearWorklistMutation,
    actualizarWorklistMutation,
    obtenerDiagnosticos,
    crearDiagnosticoMutation,
    obtenerTratamientos,
    crearTratamientoMutation,
    obtenerInterconsultas,
    crearInterconsultaMutation,
    responderInterconsultaMutation,
    obtenerConsultas,
    crearConsultaMutation,
  };
};

