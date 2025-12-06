<<<<<<< HEAD
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

=======
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// ============================================================================
// TIPOS
// ============================================================================

export interface DiagnosticoCatalogo {
  id: string
  codigo_cie10: string
  codigo_icd10: string
  codigo_snomed: string
  nombre_diagnostico: string
  descripcion?: string
  capitulo_cie10?: string
  categoria_snomed?: string
  es_cronica: boolean
  requiere_seguimiento: boolean
  es_notificable: boolean
  activo: boolean
}

export interface OrdenMedica {
  id: string
  paciente_id: string
  medico_asignado_id: string
  tipo_orden: string
  estado: 'pendiente' | 'en_atención' | 'completada' | 'cancelada'
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente'
  motivo_consulta: string
  servicio?: string
  fecha_creacion: string
  fecha_programada?: string
  fecha_inicio_atencion?: string
  fecha_completacion?: string
  notas_previas?: string
}

export interface DiagnosticoPaciente {
  id: string
  paciente_id: string
  diagnostico_id: string
  medico_id: string
  tipo_diagnostico: 'principal' | 'secundario' | 'complicación' | 'comorbilidad'
  estado: 'activo' | 'resuelto' | 'sospechoso'
  fecha_diagnostico: string
  fecha_resolucion?: string
  observaciones?: string
  severidad?: 'leve' | 'moderada' | 'grave' | 'crítica'
}

export interface ConsultaMedica {
  id: string
  orden_medica_id: string
  paciente_id: string
  medico_id: string
  antecedentes_relevantes?: string
  medicamentos_actuales?: any[]
  motivo_consulta: string
  historia_enfermedad_actual?: string
  examen_fisico?: string
  impresion_clinica?: string
  diagnosticos_iniciales?: string
  plan_manejo?: string
  diagnosticos_confirmados?: any[]
  prescripciones_creadas?: string[]
  requiere_hospitalizacion: boolean
  requiere_interconsulta: boolean
  especialidad_interconsulta?: string
  requiere_seguimiento: boolean
  dias_proximo_control?: number
  observaciones_seguimiento?: string
  fecha_inicio: string
  fecha_fin?: string
  duracion_minutos?: number
}

export interface DiarioClinicoEntrada {
  id: string
  paciente_id: string
  medico_id: string
  tipo_entrada: 'evolución' | 'nota_clínica' | 'revisión' | 'conclusión'
  contenido: string
  signos_vitales?: any
  firmada: boolean
  fecha_firma?: string
  created_at: string
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useHosixMedicos = () => {
  const queryClient = useQueryClient()

  // ===== CONSULTAS =====

  // Obtener todas las órdenes médicas del médico actual
  const useOrdenesMedicas = (estado?: string) => {
    return useQuery({
      queryKey: ['ordenes_medicas', estado],
      queryFn: async () => {
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser()

          if (authError || !user?.id) {
            console.warn('No authenticated user found for ordenes médicas query');
            return []
          }

          const { data: medico, error: medicoError } = await supabase
            .from('profesionales_sanitarios')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (medicoError) {
            console.error('Error fetching professional record:', {
              code: medicoError.code,
              message: medicoError.message,
              details: medicoError.details,
              hint: medicoError.hint
            })
            return []
          }

          if (!medico) {
            console.warn('No professional record found for user:', user.id)
            return []
          }

          let query = supabase
            .from('hosix_ordenes_medicas')
            .select('*')
            .eq('medico_asignado_id', medico.id)
            .order('fecha_creacion', { ascending: false })

          if (estado) {
            query = query.eq('estado', estado)
          }

          const { data, error } = await query

          if (error) {
            console.error('Error fetching medical orders:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            })
            throw error
          }

          return (data || []) as OrdenMedica[]
        } catch (err: any) {
          console.error('Exception in useOrdenesMedicas:', {
            message: err?.message,
            code: err?.code,
            details: err?.details,
            fullError: err
          })
          throw err
        }
      },
      retry: (failureCount, error: any) => {
        // Don't retry on auth or permission errors
        if (error?.code === 'PGRST301' || error?.code === 'PGRST116') return false
        return failureCount < 3
      }
    })
  }

  // Obtener diagnósticos del catálogo (búsqueda)
  const useDiagnosticosCatalogo = (busqueda?: string) => {
    return useQuery({
      queryKey: ['diagnosticos_catalogo', busqueda],
      queryFn: async () => {
        let query = supabase
          .from('hosix_diagnosticos_catalogo')
          .select('*')
          .eq('activo', true)
          .order('nombre_diagnostico')

        if (busqueda && busqueda.length > 0) {
          // Búsqueda por código o nombre
          query = query.or(
            `codigo_cie10.ilike.%${busqueda}%,codigo_snomed.ilike.%${busqueda}%,nombre_diagnostico.ilike.%${busqueda}%`
          )
        }

        const { data, error } = await query
        if (error) throw error
        return (data || []) as DiagnosticoCatalogo[]
      },
      enabled: !busqueda || busqueda.length > 0,
    })
  }

  // Obtener diagnósticos activos del paciente
  const useDiagnosticosPaciente = (pacienteId: string) => {
    return useQuery({
      queryKey: ['diagnosticos_paciente', pacienteId],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('obtener_diagnosticos_activos', {
          p_paciente_id: pacienteId,
        })
        if (error) throw error
        return (data || []) as DiagnosticoPaciente[]
      },
      enabled: !!pacienteId,
    })
  }

  // Obtener historial de consultas del paciente
  const useConsultasPaciente = (pacienteId: string) => {
    return useQuery({
      queryKey: ['consultas_medicas', pacienteId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_consultas_medicas')
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_inicio', { ascending: false })

        if (error) throw error
        return (data || []) as ConsultaMedica[]
      },
      enabled: !!pacienteId,
    })
  }

  // Obtener diario clínico del paciente
  const useDiarioClinico = (pacienteId: string) => {
    return useQuery({
      queryKey: ['diario_clinico', pacienteId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_diario_clinico_medico')
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('created_at', { ascending: false })

        if (error) throw error
        return (data || []) as DiarioClinicoEntrada[]
      },
      enabled: !!pacienteId,
    })
  }

  // ===== MUTACIONES =====

  // Cambiar estado de orden médica
  const actualizarEstadoOrdenMutation = useMutation({
    mutationFn: async ({ ordenId, nuevoEstado }: { ordenId: string; nuevoEstado: string }) => {
      const updateData: any = {
        estado: nuevoEstado,
      }

      if (nuevoEstado === 'en_atención') {
        updateData.fecha_inicio_atencion = new Date().toISOString()
      } else if (nuevoEstado === 'completada') {
        updateData.fecha_completacion = new Date().toISOString()
      }

      const { error } = await supabase
        .from('hosix_ordenes_medicas')
        .update(updateData)
        .eq('id', ordenId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes_medicas'] })
      toast.success('Estado de orden actualizado')
    },
    onError: () => {
      toast.error('Error al actualizar la orden')
    },
  })

  // Crear nueva consulta médica
  const crearConsultaMedication = useMutation({
    mutationFn: async (consulta: Omit<ConsultaMedica, 'id' | 'fecha_inicio'>) => {
      const { data, error } = await supabase
        .from('hosix_consultas_medicas')
        .insert([
          {
            ...consulta,
            fecha_inicio: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas_medicas'] })
      queryClient.invalidateQueries({ queryKey: ['diario_clinico'] })
      toast.success('Consulta médica registrada')
    },
    onError: (error) => {
      console.error('Error al crear consulta:', error)
      toast.error('Error al crear la consulta')
    },
  })

  // Registrar diagnóstico en el paciente
  const registrarDiagnosticoMutation = useMutation({
    mutationFn: async ({
      pacienteId,
      diagnosticoId,
      tipodiagnostico = 'principal',
      severidad,
      observaciones,
    }: {
      pacienteId: string
      diagnosticoId: string
      tipodiagnostico?: string
      severidad?: string
      observaciones?: string
    }) => {
      // Obtener ID del médico actual
      const { data: medico } = await supabase
        .from('profesionales_sanitarios')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (!medico) throw new Error('Médico no encontrado')

      const { data, error } = await supabase.rpc('registrar_diagnostico_paciente', {
        p_paciente_id: pacienteId,
        p_diagnostico_id: diagnosticoId,
        p_medico_id: medico.id,
        p_tipo_diagnostico: tipodiagnostico,
        p_severidad: severidad,
        p_observaciones: observaciones,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticos_paciente'] })
      toast.success('Diagnóstico registrado')
    },
    onError: () => {
      toast.error('Error al registrar diagnóstico')
    },
  })

  // Registrar entrada en diario clínico
  const registrarDiarioMutation = useMutation({
    mutationFn: async (entrada: Omit<DiarioClinicoEntrada, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('hosix_diario_clinico_medico')
        .insert([entrada])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario_clinico'] })
      toast.success('Nota agregada al diario clínico')
    },
    onError: () => {
      toast.error('Error al registrar la nota')
    },
  })

  // Actualizar consulta médica
  const actualizarConsultaMutation = useMutation({
    mutationFn: async ({
      consultaId,
      updates,
    }: {
      consultaId: string
      updates: Partial<ConsultaMedica>
    }) => {
      const { error } = await supabase
        .from('hosix_consultas_medicas')
        .update(updates)
        .eq('id', consultaId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas_medicas'] })
      toast.success('Consulta actualizada')
    },
    onError: () => {
      toast.error('Error al actualizar consulta')
    },
  })

  // Crear orden médica
  const crearOrdenMutation = useMutation({
    mutationFn: async (orden: Omit<OrdenMedica, 'id' | 'fecha_creacion'>) => {
      const { data, error } = await supabase
        .from('hosix_ordenes_medicas')
        .insert([
          {
            ...orden,
            fecha_creacion: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes_medicas'] })
      toast.success('Orden médica creada')
    },
    onError: () => {
      toast.error('Error al crear orden médica')
    },
  })

  // Resolver diagnóstico
  const resolverDiagnosticoMutation = useMutation({
    mutationFn: async (diagnosticoPacienteId: string) => {
      const { error } = await supabase
        .from('hosix_diagnosticos_pacientes')
        .update({
          estado: 'resuelto',
          fecha_resolucion: new Date().toISOString(),
        })
        .eq('id', diagnosticoPacienteId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticos_paciente'] })
      toast.success('Diagnóstico marcado como resuelto')
    },
    onError: () => {
      toast.error('Error al resolver diagnóstico')
    },
  })

  return {
    // Queries
    useOrdenesMedicas,
    useDiagnosticosCatalogo,
    useDiagnosticosPaciente,
    useConsultasPaciente,
    useDiarioClinico,

    // Mutations
    actualizarEstadoOrdenMutation,
    crearConsultaMedication,
    registrarDiagnosticoMutation,
    registrarDiarioMutation,
    actualizarConsultaMutation,
    crearOrdenMutation,
    resolverDiagnosticoMutation,
  }
}

export default useHosixMedicos
>>>>>>> 02b6dd4a8a1f68cb12af7584d9414105e9cf44fb
