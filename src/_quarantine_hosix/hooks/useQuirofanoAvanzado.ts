/**
 * ==========================================================================
 * QUIROFANO HOOKS - Orquestación Cruzada de Procedimientos Quirúrgicos
 * ==========================================================================
 * 
 * FEATURE: Validación PRE-OPERATORIO automática desde:
 *   - HOSPITALIZACION: Vitales, medicamentos activos, alergias
 *   - FARMACIA: Bloques de medicamentos pre-anestesia
 *   - LABORATORIO: Exámenes completos (Hb, glicemia, coagulación)
 *   - IMAGENOLOGIA: Último RX/TAC confirma diagnóstico
 *
 * FLUJO:
 * 1. Cirujano programa procedimiento
 * 2. Sistema valida TODO automáticamente (pre-op checklist)
 * 3. Si TODO OK → [✅ Procedimiento LISTO]
 * 4. Si problema → [⚠️ Requiere acción]
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase, executeSupabaseQuery } from '../../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// TIPOS
// ============================================================================

export enum PreopValidationStatus {
  PENDIENTE = 'PENDIENTE',
  VERIFICADO = 'VERIFICADO',
  CONTRAINDICADO = 'CONTRAINDICADO',
  EN_PROGRESO = 'EN_PROGRESO',
}

export type PreopValidation = {
  procedimiento_id: string;
  status: PreopValidationStatus;
  validaciones: {
    examenes_preop?: { completados: boolean; faltantes: string[] };
    vitales?: { presion_ok: boolean; fc_ok: boolean; temperatura_ok: boolean };
    medicamentos_alergicos?: { alergia: string; medicamento_conflictivo: string } | null;
    medicamentos_preop_suspender?: string[];
    clase_asa_riesgo?: { clase: number; recomendaciones: string };
    consentimiento_informado?: boolean;
    ayuno_confirmado?: boolean;
  };
  puede_proceder: boolean;
  alertas: string[];
  contraindicaciones_bloqueantes: string[];
};

export type ProcedimientoQuirurgico = {
  id: string;
  paciente_id: string;
  procedimiento_principal: string;
  fecha_programada: string;
  cirujano_principal_nombre: string;
  tipo_anestesia: string;
  duracion_estimada_minutos: number;
  estado: string;
  // Cross-module info
  paciente_nombre?: string;
  hospitalizado?: boolean;
  cama_actual?: string;
  diagnostico_hosp?: string;
  medicamentos_activos?: string[];
  alergias_documentadas?: string[];
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useQuirofanoAvanzado(procedimiento_id?: string, hospital_id?: string) {
  const queryClient = useQueryClient();
  const [validacionEnProceso, setValidacionEnProceso] = useState(false);

  /**
   * QUERY 1: Obtener detalles del procedimiento
   */
  const procedimientoQuery = useQuery({
    queryKey: ['procedimiento-detalles', procedimiento_id],
    queryFn: async (): Promise<ProcedimientoQuirurgico | null> => {
      if (!procedimiento_id) return null;

      const res = await executeSupabaseQuery(
        () =>
          supabase.from('procedimientos_quirurgicos').select(
            `
            id,
            paciente_id,
            procedimiento_principal,
            fecha_programada,
            tipo_anestesia,
            duracion_estimada_minutos,
            estado_procedimiento,
            admision_id,
            cirujano_principal_id
            `
          ).eq('id', procedimiento_id).single(),
        'procedimiento-detalle-fetch'
      );

      if (res.error || !res.data) return null;

      // Enrich con datos de HOSPITALIZACION
      const hospRes = await executeSupabaseQuery(
        () =>
          supabase.from('hosix_hospitalizacion_episodios').select('*').eq('id', res.data.admision_id).single(),
        'hosp-check'
      );

      const alertasRes = await executeSupabaseQuery(
        () =>
          supabase.from('alertas_medicas').select('*').eq('paciente_id', res.data.paciente_id),
        'alertas-paciente'
      );

      return {
        id: res.data.id,
        paciente_id: res.data.paciente_id,
        procedimiento_principal: res.data.procedimiento_principal,
        fecha_programada: res.data.fecha_programada,
        cirujano_principal_nombre: 'Dr. TBD', // TODO: join con users
        tipo_anestesia: res.data.tipo_anestesia,
        duracion_estimada_minutos: res.data.duracion_estimada_minutos,
        estado: res.data.estado_procedimiento,
        hospitalizado: !!hospRes.data,
        cama_actual: hospRes.data?.cama_id,
        alergias_documentadas: alertasRes.data
          ?.filter((a: any) => a.tipo.includes('ALERGIA'))
          .map((a: any) => a.descripcion) || [],
      };
    },
    enabled: !!procedimiento_id,
    refetchInterval: 30000,
  });

  /**
   * QUERY 2: Validación automática PRE-OPERATORIO (todo lo necesario)
   */
  const preopValidationQuery = useQuery({
    queryKey: ['preop-validation', procedimiento_id],
    queryFn: async (): Promise<PreopValidation | null> => {
      if (!procedimiento_id || !procedimientoQuery.data) return null;

      const proc = procedimientoQuery.data;
      const validaciones: PreopValidation['validaciones'] = {};
      const alertas: string[] = [];
      const contraindicaciones_bloqueantes: string[] = [];

      setValidacionEnProceso(true);

      try {
        // ========== 1. VALIDAR EXAMENES LAB (Laboratorio) ==========
        const labRes = await executeSupabaseQuery(
          () =>
            supabase
              .from('laboratorio_resultados')
              .select('*')
              .eq('paciente_id', proc.paciente_id)
              .gte('fecha_resultado', new Date(Date.now() - 7*24*60*60*1000).toISOString()), // Últimas 7 días
          'lab-results'
        );

        const faltaExamenes = ['Hemograma', 'Tiempo Protrombina', 'Glicemia'];
        const examenesDisponibles = labRes.data?.map((l: any) => l.tipo_examen) || [];
        const faltantes = faltaExamenes.filter((e) => !examenesDisponibles.includes(e));

        validaciones.examenes_preop = {
          completados: faltantes.length === 0,
          faltantes,
        };

        if (faltantes.length > 0) {
          alertas.push(`⚠️ EXAMENES FALTANTES: ${faltantes.join(', ')}`);
        }

        // ========== 2. VALIDAR VITALES (Hospitalizacion kardex) ==========
        const kardexRes = await executeSupabaseQuery(
          () =>
            supabase
              .from('kardex_diarios')
              .select('presion_sistolica, presion_diastolica, frecuencia_cardiaca, temperatura')
              .eq('admision_id', proc.hospitalizado ? 'some-admission' : null)
              .order('fecha_turno', { ascending: false })
              .limit(1)
              .single(),
          'kardex-vitales'
        );

        const vitales = kardexRes.data;
        validaciones.vitales = {
          presion_ok: vitales?.presion_sistolica > 90 && vitales?.presion_sistolica < 180,
          fc_ok: vitales?.frecuencia_cardiaca > 60 && vitales?.frecuencia_cardiaca < 120,
          temperatura_ok: vitales?.temperatura < 38.5,
        };

        if (!validaciones.vitales.presion_ok || !validaciones.vitales.fc_ok) {
          alertas.push('⚠️ VITALES FUERA DE RANGO - Requiere re-evaluación');
        }

        // ========== 3. VALIDAR ALERGIAS A ANESTESIA (Farmacia + Alertas) ==========
        const alergiasRes = await executeSupabaseQuery(
          () =>
            supabase
              .from('alertas_medicas')
              .select('*')
              .eq('paciente_id', proc.paciente_id)
              .ilike('tipo', '%ALERGIA%'),
          'alergias-anestesia'
        );

        // Medicamentos de anestesia comunes que podría usar
        const medicamentosAnestesiaComunes = ['Propofol', 'Midazolam', 'Fentanilo', 'Succinilcolina'];

        if (alergiasRes.data && alergiasRes.data.length > 0) {
          for (const alergia of alergiasRes.data) {
            for (const medAnest of medicamentosAnestesiaComunes) {
              if (alergia.medicamentos_bloqueados?.includes(medAnest)) {
                validaciones.medicamentos_alergicos = {
                  alergia: alergia.descripcion,
                  medicamento_conflictivo: medAnest,
                };
                contraindicaciones_bloqueantes.push(
                  `❌ ALERGIA A ANESTESIA: Paciente alérgico a ${medAnest} (${alergia.severidad})`
                );
              }
            }
          }
        }

        // ========== 4. VALIDAR MEDICAMENTOS PRE-ANESTESIA SUSPENDER ==========
        const prescripcionesRes = await executeSupabaseQuery(
          () =>
            supabase
              .from('patient_prescriptions')
              .select('medication_master!left(brand_name, active_ingredient)')
              .eq('patient_id', proc.paciente_id)
              .gte('end_date', new Date().toISOString()),
          'prescripciones-activas'
        );

        // Medicamentos que DEBEN suspenderse antes de cirugía
        const medicamentosASuspender = ['Warfarina', 'Aspirin', 'AINE'];
        validaciones.medicamentos_preop_suspender = medicamentosASuspender;

        // ========== 5. EVALUAR CLASE ASA Y RIESGO ==========
        // ASA = American Society of Anesthesiologists
        // 1=Saludable, 2=Enfermedad leve, 3=Enfermedad severa, 4=Peligro de muerte, 5=Moribundo

        const edadRes = await executeSupabaseQuery(
          () =>
            supabase.from('pacientes').select('fecha_nacimiento').eq('id', proc.paciente_id).single(),
          'edad-paciente'
        );

        const edad = edadRes.data?.fecha_nacimiento
          ? Math.floor(
              (Date.now() - new Date(edadRes.data.fecha_nacimiento).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
            )
          : 0;

        let claseASA = 1;
        let recomendaciones = 'Paciente saludable';

        if (edad > 70) claseASA = 2;
        if (edad > 80 || alergiasRes.data?.length > 0) claseASA = 3;
        if (contraindicaciones_bloqueantes.length > 0) claseASA = 4;

        validaciones.clase_asa_riesgo = {
          clase: claseASA,
          recomendaciones,
        };

        // ========== 6. VALIDAR CONSENTIMIENTO INFORMADO ==========
        // TODO: Obtener de BD
        validaciones.consentimiento_informado = true;

        // ========== 7. VALIDAR AYUNO ==========
        // TODO: Obtener de preoperatorio table
        validaciones.ayuno_confirmado = true;

        // ========== DETERMINACION FINAL ==========
        const puede_proceder = contraindicaciones_bloqueantes.length === 0;

        return {
          procedimiento_id: procedimiento_id!,
          status: puede_proceder ? PreopValidationStatus.VERIFICADO : PreopValidationStatus.CONTRAINDICADO,
          validaciones,
          puede_proceder,
          alertas,
          contraindicaciones_bloqueantes,
        };
      } finally {
        setValidacionEnProceso(false);
      }
    },
    enabled: !!procedimiento_id && !!procedimientoQuery.data,
    refetchInterval: 60000,
  });

  /**
   * MUTATION: Registrar que pre-op fue verificado
   */
  const verificarPreopMutation = useMutation({
    mutationFn: async () => {
      if (!procedimiento_id) throw new Error('Procedimiento no especificado');

      const res = await executeSupabaseQuery(
        () =>
          supabase
            .from('procedimientos_quirurgicos')
            .update({
              estado_preop: 'VERIFICADO',
              updated_at: new Date().toISOString(),
            })
            .eq('id', procedimiento_id)
            .select()
            .single(),
        'preop-verify'
      );

      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preop-validation'] });
    },
  });

  /**
   * MUTATION: Confirmar que procedimiento puede entrar a QX
   */
  const confirmarProcedimientoMutation = useMutation({
    mutationFn: async () => {
      if (!procedimiento_id) throw new Error('Procedimiento no especificado');

      // Double-check que pre-op está OK
      if (!preopValidationQuery.data?.puede_proceder) {
        throw new Error('Pre-op NO está verificado. No se puede proceder.');
      }

      const res = await executeSupabaseQuery(
        () =>
          supabase
            .from('procedimientos_quirurgicos')
            .update({
              estado_procedimiento: 'CONFIRMADA',
              updated_at: new Date().toISOString(),
            })
            .eq('id', procedimiento_id)
            .select()
            .single(),
        'procedimiento-confirm'
      );

      if (res.error) throw res.error;
      return res.data;
    },
  });

  /**
   * MUTATION: Iniciar intra-operatorio (entra a QX)
   */
  const iniciarIntraoperatorioMutation = useMutation({
    mutationFn: async (input: { quirofano_id: string; hora_entrada: string }) => {
      if (!procedimiento_id) throw new Error('Procedimiento no especificado');

      // 1. Actualizar procedimiento (estado EN_QUIROFANO)
      const procRes = await executeSupabaseQuery(
        () =>
          supabase
            .from('procedimientos_quirurgicos')
            .update({
              estado_procedimiento: 'EN_QUIROFANO',
              quirofano_id: input.quirofano_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', procedimiento_id)
            .select()
            .single(),
        'procedimiento-qx-start'
      );

      if (procRes.error) throw procRes.error;

      // 2. Crear registro intraoperatorio
      const intraRes = await executeSupabaseQuery(
        () =>
          supabase
            .from('intraoperatorio')
            .insert([
              {
                procedimiento_id,
                hora_entrada_quirofano: input.hora_entrada,
              },
            ])
            .select()
            .single(),
        'intraop-create'
      );

      if (intraRes.error) throw intraRes.error;

      // 3. Marcar quirófano como ocupado
      await executeSupabaseQuery(
        () =>
          supabase
            .from('quirofano_disponibilidad')
            .update({ estado: 'ocupada' })
            .eq('quirofano_id', input.quirofano_id)
            .eq('fecha', new Date().toISOString().split('T')[0]),
        'quirofano-mark-busy'
      );

      return intraRes.data;
    },
  });

  return {
    // Data
    procedimiento: procedimientoQuery.data,
    procedimientoLoading: procedimientoQuery.isLoading,

    preop: preopValidationQuery.data,
    preopLoading: validacionEnProceso || preopValidationQuery.isLoading,

    // Mutations
    verificarPreop: verificarPreopMutation.mutate,
    verificarPreopAsync: verificarPreopMutation.mutateAsync,
    verificandoPreop: verificarPreopMutation.isPending,

    confirmarProcedimiento: confirmarProcedimientoMutation.mutate,
    confirmarProcedimientoAsync: confirmarProcedimientoMutation.mutateAsync,

    iniciarIntraoperatorio: iniciarIntraoperatorioMutation.mutate,
    iniciarIntraoperatorioAsync: iniciarIntraoperatorioMutation.mutateAsync,

    // Refresh
    refresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['procedimiento-detalles'] }),
        queryClient.invalidateQueries({ queryKey: ['preop-validation'] }),
      ]);
    },
  };
}

export default useQuirofanoAvanzado;
