import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedErrorHandler } from './useEnhancedErrorHandler';

export interface Guardia {
  id: string;
  centro_salud_id: string;
  profesional_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  estado: string;
  horas: number;
  validacion_estado: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  centro?: {
    id: string;
    nombre: string;
    categoria: string;
  };
  profesional?: {
    id: string;
    nombre: string;
    area: string;
  };
  
  // Campos calculados
  fechaInicio: Date;
  fechaFin: Date;
}

interface UseGuardiasParams {
  mes?: number;
  anio?: number;
  centroId?: string;
  estado?: string;
  profesionalId?: string;
}

export const useGuardias = (params: UseGuardiasParams = {}) => {
  const { handleQueryError } = useEnhancedErrorHandler('Guardias');

  return useQuery({
    queryKey: ['guardias', params],
    queryFn: async (): Promise<Guardia[]> => {
      console.log('🛡️ Cargando guardias con parámetros:', params);
      
      let query = supabase
        .from('guardias')
        .select(`
          *,
          centro:centros_salud(id, nombre, categoria),
          profesional:profesionales_sanitarios(id, nombre, area_profesional)
        `);

      // Aplicar filtros
      if (params.centroId) {
        query = query.eq('centro_salud_id', params.centroId);
      }
      
      if (params.estado) {
        query = query.eq('estado', params.estado);
      }
      
      if (params.profesionalId) {
        query = query.eq('profesional_id', params.profesionalId);
      }

      // Filtros de fecha
      if (params.mes && params.anio) {
        const startDate = new Date(params.anio, params.mes - 1, 1).toISOString();
        const endDate = new Date(params.anio, params.mes, 0, 23, 59, 59).toISOString();
        query = query.gte('fecha_inicio', startDate).lte('fecha_inicio', endDate);
      }

      const { data, error } = await query.order('fecha_inicio', { ascending: false });

      if (error) {
        handleQueryError(error);
        throw error;
      }

      // Transformar datos
      return (data || []).map(guardia => ({
        ...guardia,
        fechaInicio: new Date(guardia.fecha_inicio),
        fechaFin: new Date(guardia.fecha_fin),
        centro: guardia.centro ? {
          id: guardia.centro.id,
          nombre: guardia.centro.nombre,
          categoria: guardia.centro.categoria
        } : undefined,
        profesional: guardia.profesional ? {
          id: guardia.profesional.id,
          nombre: guardia.profesional.nombre,
          area: guardia.profesional.area_profesional
        } : undefined
      }));
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2
  });
};

export const useCreateGuardia = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useEnhancedErrorHandler('CrearGuardia');

  return useMutation({
    mutationFn: async (nuevaGuardia: Omit<Guardia, 'id' | 'created_at' | 'updated_at' | 'fechaInicio' | 'fechaFin'>) => {
      const { data, error } = await supabase
        .from('guardias')
        .insert(nuevaGuardia)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
    },
    onError: handleMutationError
  });
};

export const useUpdateGuardia = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useEnhancedErrorHandler('ActualizarGuardia');

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Guardia> & { id: string }) => {
      const { data, error } = await supabase
        .from('guardias')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
    },
    onError: handleMutationError
  });
};

// Configuration hooks
export const useConfiguracion = () => {
  const { handleQueryError } = useEnhancedErrorHandler('Configuracion');

  return useQuery({
    queryKey: ['configuracion'],
    queryFn: async () => {
      console.log('🛡️ Cargando configuración del sistema');

      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        handleQueryError(error);
        throw error;
      }

      return data || {
        fuenteBaremo: 'manual',
        limitesGuardias: { minimo: 1, maximo: 20 },
        duracionMinima: 8,
        duracionMaxima: 24,
        notificacionesActivas: true
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};

export const useUpdateConfiguracion = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useEnhancedErrorHandler('ActualizarConfiguracion');

  return useMutation({
    mutationFn: async (configuracion: any) => {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .upsert(configuracion)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion'] });
    },
    onError: handleMutationError
  });
};

// Baremos hooks
export const useBaremos = () => {
  const { handleQueryError } = useEnhancedErrorHandler('Baremos');

  return useQuery({
    queryKey: ['baremos'],
    queryFn: async () => {
      console.log('🛡️ Cargando baremos');

      const { data, error } = await supabase
        .from('ajuste_baremo')
        .select('*')
        .eq('activo', true)
        .order('vigente_desde', { ascending: false });

      if (error) {
        handleQueryError(error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};

export const useCreateBaremo = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useEnhancedErrorHandler('CrearBaremo');

  return useMutation({
    mutationFn: async (baremo: any) => {
      const { data, error } = await supabase
        .from('ajuste_baremo')
        .insert(baremo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baremos'] });
    },
    onError: handleMutationError
  });
};

export const useUpdateBaremo = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useEnhancedErrorHandler('ActualizarBaremo');

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('ajuste_baremo')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baremos'] });
    },
    onError: handleMutationError
  });
};

export const useCalculateBaremo = () => {
  return useMutation({
    mutationFn: async ({ categoria, tipo, tipoDia }: any) => {
      // Mock calculation - would need actual baremo logic
      const baseRate = 50;
      const multipliers = {
        especialista: 2.0,
        general_licenciado: 1.5,
        tecnico_diplomado: 1.2,
        auxiliar: 1.0,
        subalterno: 0.8,
        odepac: 1.3,
        secre_asist_pacientes: 0.9,
        caja: 0.9
      };

      const typeMultiplier = tipo === 'localizable' ? 0.7 : 1.0;
      const dayMultiplier = tipoDia === 'festivo' ? 1.5 : tipoDia === 'fin_semana' ? 1.3 : 1.0;

      return baseRate * multipliers[categoria] * typeMultiplier * dayMultiplier;
    }
  });
};

// Nominas hooks
export const useNominas = () => {
  const { handleQueryError } = useEnhancedErrorHandler('Nominas');

  return useQuery({
    queryKey: ['nominas'],
    queryFn: async () => {
      console.log('🛡️ Cargando nóminas');

      const { data, error } = await supabase
        .from('nominas')
        .select('*')
        .order('anio', { ascending: false })
        .order('mes', { ascending: false });

      if (error) {
        handleQueryError(error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};

// Pagos hooks
export const usePagos = () => {
  const { handleQueryError } = useEnhancedErrorHandler('Pagos');

  return useQuery({
    queryKey: ['pagos'],
    queryFn: async () => {
      console.log('🛡️ Cargando pagos');

      const { data, error } = await supabase
        .from('pagos')
        .select(`
          *,
          nomina:nominas(*),
          profesional:profesionales_sanitarios(*)
        `)
        .order('fecha', { ascending: false });

      if (error) {
        handleQueryError(error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};

export const useCreatePago = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useEnhancedErrorHandler('CrearPago');

  return useMutation({
    mutationFn: async (pago: any) => {
      const { data, error } = await supabase
        .from('pagos')
        .insert(pago)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
    },
    onError: handleMutationError
  });
};

// Validaciones hooks
export const useValidaciones = () => {
  const { handleQueryError } = useEnhancedErrorHandler('Validaciones');

  return useQuery({
    queryKey: ['validaciones'],
    queryFn: async () => {
      console.log('🛡️ Cargando validaciones');

      const { data, error } = await supabase
        .from('validaciones')
        .select(`
          *,
          guardia:guardias(*),
          usuario:usuarios(*)
        `)
        .order('fecha', { ascending: false });

      if (error) {
        handleQueryError(error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};

export const useCreateValidacion = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useEnhancedErrorHandler('CrearValidacion');

  return useMutation({
    mutationFn: async (validacion: any) => {
      const { data, error } = await supabase
        .from('validaciones')
        .insert(validacion)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validaciones'] });
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
    },
    onError: handleMutationError
  });
};
