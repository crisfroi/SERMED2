/**
 * ==========================================================================
 * HOOK: Gestión de Inventario Quirúrgico en Tiempo Real
 * ==========================================================================
 * 
 * FEATURES:
 * - Obtener disponibilidad de materiales para un procedimiento
 * - Validar stock antes de intraoperatorio
 * - Auto-descuento cuando se dispensan materiales
 * - Alertas de stock bajo
 * - Reorden automático cuando llega a mínimo
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, executeSupabaseQuery } from '../../integrations/supabase/client';

export type MaterialQuirurgico = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'MATERIAL' | 'INSTRUMENTAL' | 'SUTURA' | 'PROTESIS';
  cantidad_disponible: number;
  cantidad_minima: number;
  cantidad_reorder: number;
  costo_unitario: number;
  fecha_vencimiento: string | null;
  ubicacion_almacen: string;
  estante: string;
};

export type InventarioAlertaQX = {
  tipo: 'STOCK_BAJO' | 'VENCIMIENTO_PROXIMO' | 'AGOTADO' | 'REQUIERE_REORDEN';
  material_id: string;
  material_nombre: string;
  mensaje: string;
  urgencia: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
};

export type DispensacionMaterialQX = {
  id: string;
  procedimiento_id: string;
  material_id: string;
  cantidad_dispensada: number;
  costo_total: number;
  timestamp: string;
};

export function useInventarioQuirurgico(procedimiento_id?: string, especialidad?: string) {
  const queryClient = useQueryClient();

  /**
   * QUERY 1: Materiales recomendados por especialidad + disponibilidad
   */
  const materialesRecomendadosQuery = useQuery({
    queryKey: ['materiales-recomendados', especialidad],
    queryFn: async (): Promise<MaterialQuirurgico[]> => {
      if (!especialidad) return [];

      // Obtener materiales típicos para esta especialidad
      // TODO: Tabla separada con recomendaciones por especialidad
      const commonMatsBySpecialty: Record<string, string[]> = {
        CIRUGIA_GENERAL: [
          'Gasa 10x10 estéril',
          'Paños verdes',
          'Hilo quirúrgico 2.0',
          'Catgut cromado',
          'Antiséptico quirúrgico',
        ],
        TRAUMATOLOGIA: [
          'Férulas',
          'Tornillos trauma',
          'Placas metálicas',
          'Vendaje elástico',
          'Cemento óseo',
        ],
        GINECOLOGIA: [
          'Espéculos',
          'Pinzas uterinas',
          'Hilo de seda',
          'Apósitos gineco',
        ],
      };

      const materialesNombresPara = commonMatsBySpecialty[especialidad] || [];

      if (materialesNombresPara.length === 0) return [];

      const res = await executeSupabaseQuery(
        () =>
          supabase
            .from('inventario_quirurgico')
            .select('*')
            .in('nombre', materialesNombresPara),
        'materiales-recomendados'
      );

      return res.data || [];
    },
    enabled: !!especialidad,
  });

  /**
   * QUERY 2: Alertas de inventario actualmente
   */
  const alertasInventarioQuery = useQuery({
    queryKey: ['alertas-inventario-qx'],
    queryFn: async (): Promise<InventarioAlertaQX[]> => {
      const alertas: InventarioAlertaQX[] = [];

      const res = await executeSupabaseQuery(
        () => supabase.from('inventario_quirurgico').select('*'),
        'inventario-check'
      );

      const materiales = res.data || [];

      for (const mat of materiales) {
        // Alerta 1: Stock bajo
        if (mat.cantidad_disponible < mat.cantidad_minima && mat.cantidad_disponible > 0) {
          alertas.push({
            tipo: 'STOCK_BAJO',
            material_id: mat.id,
            material_nombre: mat.nombre,
            mensaje: `Stock bajo: ${mat.cantidad_disponible}/${mat.cantidad_minima}`,
            urgencia: 'ALTA',
          });
        }

        // Alerta 2: Agotado
        if (mat.cantidad_disponible <= 0) {
          alertas.push({
            tipo: 'AGOTADO',
            material_id: mat.id,
            material_nombre: mat.nombre,
            mensaje: `⛔ AGOTADO - Requiere reorden inmediato`,
            urgencia: 'CRITICA',
          });
        }

        // Alerta 3: Vencimiento próximo (< 30 días)
        if (mat.fecha_vencimiento) {
          const diasHastaVencimiento = Math.floor(
            (new Date(mat.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          if (diasHastaVencimiento < 30 && diasHastaVencimiento > 0) {
            alertas.push({
              tipo: 'VENCIMIENTO_PROXIMO',
              material_id: mat.id,
              material_nombre: mat.nombre,
              mensaje: `Vence en ${diasHastaVencimiento} días`,
              urgencia: 'MEDIA',
            });
          }
        }

        // Alerta 4: Requiere reorden automático
        if (
          mat.cantidad_disponible < mat.cantidad_reorder &&
          mat.cantidad_disponible < mat.cantidad_minima * 2
        ) {
          alertas.push({
            tipo: 'REQUIERE_REORDEN',
            material_id: mat.id,
            material_nombre: mat.nombre,
            mensaje: `Requiere compra: ${mat.cantidad_reorder} unidades`,
            urgencia: 'ALTA',
          });
        }
      }

      return alertas;
    },
    refetchInterval: 120000, // 2 minutos
  });

  /**
   * MUTATION: Dispensar materiales para procedimiento
   * (consume del inventario, crea registro en intraoperatorio)
   */
  const dispensarMaterialesMutation = useMutation({
    mutationFn: async (input: {
      procedimiento_id: string;
      materiales: { material_id: string; cantidad: number; costo_unitario: number }[];
    }) => {
      const dispensaciones: DispensacionMaterialQX[] = [];

      for (const mat of input.materiales) {
        // 1. Verificar disponibilidad
        const checkRes = await executeSupabaseQuery(
          () =>
            supabase
              .from('inventario_quirurgico')
              .select('cantidad_disponible')
              .eq('id', mat.material_id)
              .single(),
          'mat-check'
        );

        if (!checkRes.data || checkRes.data.cantidad_disponible < mat.cantidad) {
          throw new Error(`Material ${mat.material_id} tiene stock insuficiente`);
        }

        // 2. DESCUENTO del inventario (FIFO)
        const updateRes = await executeSupabaseQuery(
          () =>
            supabase
              .from('inventario_quirurgico')
              .update({
                cantidad_disponible: checkRes.data.cantidad_disponible - mat.cantidad,
              })
              .eq('id', mat.material_id)
              .select()
              .single(),
          'mat-update'
        );

        // 3. Registrar dispensación
        const dispRes = await executeSupabaseQuery(
          () =>
            supabase
              .from('intraoperatorio_materiales')
              .insert([
                {
                  procedimiento_id: input.procedimiento_id,
                  material_id: mat.material_id,
                  cantidad_dispensada: mat.cantidad,
                  costo_total: mat.cantidad * mat.costo_unitario,
                  timestamp: new Date().toISOString(),
                },
              ])
              .select()
              .single(),
          'disp-create'
        );

        if (dispRes.data) {
          dispensaciones.push({
            id: dispRes.data.id,
            procedimiento_id: input.procedimiento_id,
            material_id: mat.material_id,
            cantidad_dispensada: mat.cantidad,
            costo_total: mat.cantidad * mat.costo_unitario,
            timestamp: dispRes.data.timestamp,
          });
        }

        // 4. Si stock llegó a mínimo, generar alerta + crear orden
        if (
          updateRes.data.cantidad_disponible <= updateRes.data.cantidad_minima
        ) {
          const ordenRes = await executeSupabaseQuery(
            () =>
              supabase.from('almacen_ordenes_compra').insert([
                {
                  material_id: mat.material_id,
                  cantidad_solicita: updateRes.data.cantidad_reorder,
                  razon: 'Reorden automático por stock bajo',
                  estado: 'PENDIENTE',
                },
              ]),
            'reorder-auto-create'
          );
        }
      }

      return dispensaciones;
    },
  });

  /**
   * MUTATION: Registrar devolución de materiales no usados
   */
  const devolverMaterialesMutation = useMutation({
    mutationFn: async (input: {
      material_id: string;
      cantidad_devuelta: number;
      razon: string;
    }) => {
      // 1. Incrementar inventario
      const updateRes = await executeSupabaseQuery(
        () =>
          supabase
            .from('inventario_quirurgico')
            .update({
              cantidad_disponible:
                supabase.rpc('increment_inventory', {
                  mat_id: input.material_id,
                  cantidad: input.cantidad_devuelta,
                }),
            })
            .eq('id', input.material_id)
            .select()
            .single(),
        'mat-devolver'
      );

      return updateRes.data;
    },
  });

  /**
   * MUTATION: Procesar reorden automático
   */
  const procesarReordenMutation = useMutation({
    mutationFn: async (material_id: string) => {
      const res = await executeSupabaseQuery(
        () =>
          supabase
            .from('almacen_ordenes_compra')
            .insert([
              {
                material_id,
                razon: 'Reorden manual por stock bajo',
                estado: 'PENDIENTE',
              },
            ])
            .select()
            .single(),
        'reorder-manual'
      );

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-inventario-qx'] });
    },
  });

  return {
    // Data
    materialesRecomendados: materialesRecomendadosQuery.data || [],
    materialesLoading: materialesRecomendadosQuery.isLoading,

    alertas: alertasInventarioQuery.data || [],
    alertasLoading: alertasInventarioQuery.isLoading,

    // Critical alerts (AGOTADO, STOCK_BAJO)
    alertasCriticas: (alertasInventarioQuery.data || []).filter(
      (a) => a.urgencia === 'CRITICA' || a.urgencia === 'ALTA'
    ),

    // Mutations
    dispensarMateriales: dispensarMaterialesMutation.mutate,
    dispensarMaterialesAsync: dispensarMaterialesMutation.mutateAsync,
    dispensandoMateriales: dispensarMaterialesMutation.isPending,

    devolverMateriales: devolverMaterialesMutation.mutate,
    devolverMaterialesAsync: devolverMaterialesMutation.mutateAsync,

    procesarReorden: procesarReordenMutation.mutate,
    procesarReordenAsync: procesarReordenMutation.mutateAsync,

    // Refresh
    refresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['materiales-recomendados'] }),
        queryClient.invalidateQueries({ queryKey: ['alertas-inventario-qx'] }),
      ]);
    },
  };
}

export default useInventarioQuirurgico;
