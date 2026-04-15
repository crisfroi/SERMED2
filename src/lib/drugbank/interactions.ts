// @ts-nocheck
/**
 * Drug Interaction Checker
 * Verifica interacciones medicamentosas usando DrugBank
 */

import { drugBankService, DrugInteraction } from './service';
import { supabase } from '@/integrations/supabase/client';

export interface InteractionCheckResult {
  medicamento1_id: string;
  medicamento1_nombre: string;
  medicamento2_id: string;
  medicamento2_nombre: string;
  severidad: 'leve' | 'moderada' | 'grave' | 'critica';
  descripcion: string;
  recomendacion?: string;
  fuente: 'drugbank' | 'local';
}

/**
 * Verifica interacciones entre medicamentos prescritos a un paciente
 */
export async function checkPatientDrugInteractions(
  pacienteId: string,
  nuevoMedicamentoId?: string,
  nuevoMedicamentoNombre?: string
): Promise<InteractionCheckResult[]> {
  // 1. Obtener medicamentos activos del paciente
  const { data: prescripcionesActivas, error } = await (supabase
    .from('hosix_prescripciones' as any)
    .select('medicamento_id, medicamento_texto')
    .eq('paciente_id', pacienteId)
    .eq('estado', 'activa') as any);

  if (error) {
    console.error('Error fetching active prescriptions:', error);
    return [];
  }

  const medicamentosActivos = prescripcionesActivas || [];

  // 2. Si hay un nuevo medicamento, agregarlo a la lista
  if (nuevoMedicamentoId || nuevoMedicamentoNombre) {
    medicamentosActivos.push({
      medicamento_id: nuevoMedicamentoId,
      medicamento_texto: nuevoMedicamentoNombre,
    });
  }

  if (medicamentosActivos.length < 2) {
    return []; // Se necesitan al menos 2 medicamentos para interacciones
  }

  // 3. Verificar interacciones en la base de datos local primero
  const interaccionesLocales = await checkLocalInteractions(medicamentosActivos);

  // 4. Si hay DrugBank IDs, verificar también con DrugBank
  const drugBankIds = await getDrugBankIds(medicamentosActivos);
  let interaccionesDrugBank: InteractionCheckResult[] = [];

  if (drugBankIds.length >= 2) {
    const drugBankInteractions = await drugBankService.checkInteractions(drugBankIds);
    interaccionesDrugBank = mapDrugBankInteractionsToResult(
      drugBankInteractions,
      medicamentosActivos
    );
  }

  // 5. Combinar y deduplicar resultados
  return [...interaccionesLocales, ...interaccionesDrugBank];
}

/**
 * Verifica interacciones en la base de datos local
 */
async function checkLocalInteractions(
  medicamentos: Array<{ medicamento_id?: string; medicamento_texto?: string }>
): Promise<InteractionCheckResult[]> {
  const medicamentoIds = medicamentos
    .map((m) => m.medicamento_id)
    .filter(Boolean) as string[];

  if (medicamentoIds.length < 2) {
    return [];
  }

  // Buscar interacciones conocidas en la BD
  const { data: interacciones, error } = await (supabase
    .from('hosix_drug_interactions' as any)
    .select('*')
    .in('medicamento1_id', medicamentoIds)
    .in('medicamento2_id', medicamentoIds) as any);

  if (error || !interacciones) {
    return [];
  }

  return interacciones.map((inter: any) => ({
    medicamento1_id: inter.medicamento1_id,
    medicamento1_nombre: inter.medicamento1_nombre || 'Medicamento 1',
    medicamento2_id: inter.medicamento2_id,
    medicamento2_nombre: inter.medicamento2_nombre || 'Medicamento 2',
    severidad: inter.severidad || 'moderada',
    descripcion: inter.descripcion || 'Interacción medicamentosa',
    recomendacion: inter.recomendacion,
    fuente: 'local',
  }));
}

/**
 * Obtiene DrugBank IDs de los medicamentos
 */
async function getDrugBankIds(
  medicamentos: Array<{ medicamento_id?: string; medicamento_texto?: string }>
): Promise<string[]> {
  const ids: string[] = [];

  for (const med of medicamentos) {
    if (med.medicamento_id) {
      // Buscar DrugBank ID en la tabla de medicamentos
      const { data: medicamento } = await (supabase
        .from('hosix_medicamentos' as any)
        .select('drugbank_id')
        .eq('id', med.medicamento_id)
        .single() as any);

      if (medicamento?.drugbank_id) {
        ids.push(medicamento.drugbank_id);
      }
    }
  }

  return ids;
}

/**
 * Mapea interacciones de DrugBank al formato de resultado
 */
function mapDrugBankInteractionsToResult(
  interactions: DrugInteraction[],
  medicamentos: Array<{ medicamento_id?: string; medicamento_texto?: string }>
): InteractionCheckResult[] {
  return interactions.map((interaction) => {
    const severidadMap: Record<string, InteractionCheckResult['severidad']> = {
      mild: 'leve',
      moderate: 'moderada',
      severe: 'grave',
      contraindicated: 'critica',
    };

    return {
      medicamento1_id: '',
      medicamento1_nombre: medicamentos[0]?.medicamento_texto || 'Medicamento 1',
      medicamento2_id: '',
      medicamento2_nombre: interaction.name,
      severidad: severidadMap[interaction.severity || 'moderate'] || 'moderada',
      descripcion: interaction.description,
      fuente: 'drugbank',
    };
  });
}

/**
 * Guarda una interacción en la base de datos local
 */
export async function saveInteractionToLocal(
  medicamento1Id: string,
  medicamento2Id: string,
  severidad: InteractionCheckResult['severidad'],
  descripcion: string,
  recomendacion?: string
): Promise<void> {
  await (supabase.from('hosix_drug_interactions' as any).insert([
    {
      medicamento1_id: medicamento1Id,
      medicamento2_id: medicamento2Id,
      severidad,
      descripcion,
      recomendacion,
      fuente: 'drugbank',
    },
  ]) as any);
}

