/**
 * Hook: usePediatricInfo - Información del recién nacido y evaluación pediátrica
 * Gestiona: Datos apgar, peso/talla nacimiento, anomalías congénitas
 * 
 * Datos esperados de BD:
 * - newborn_info (apgar, peso, talla, anomalías)
 * - patient (demografía)
 */

import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface NewbornData {
  id: string
  patient_id: string
  birth_weight: number
  birth_length: number
  apgar_1min: number
  apgar_5min: number
  birth_date: string
  congenital_anomalies: string[] | null
  hospital_id: string
  created_at: string
}

interface UsePediatricInfoState {
  newborn: NewbornData | null
  loading: boolean
  error: PostgrestError | null
  refetch: () => Promise<void>
}

export function usePediatricInfo(patientId: string): UsePediatricInfoState {
  const { supabase } = useSupabase()
  const [state, setState] = useState<UsePediatricInfoState>({
    newborn: null,
    loading: true,
    error: null,
    refetch: async () => {}
  })

  const fetchNewbornInfo = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase
        .from('newborn_info')
        .select('*')
        .eq('patient_id', patientId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error
      }

      setState(prev => ({
        ...prev,
        newborn: data || null,
        loading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError,
        loading: false
      }))
    }
  }

  const refetch = async () => {
    await fetchNewbornInfo()
  }

  useEffect(() => {
    if (patientId) {
      fetchNewbornInfo()
    }
  }, [patientId, supabase])

  return { ...state, refetch }
}

/**
 * Salva nueva información de recién nacido
 */
export async function saveNewbornInfo(
  supabase: any,
  patientId: string,
  data: Omit<NewbornData, 'id' | 'created_at'>,
) {
  const { data: result, error } = await supabase
    .from('newborn_info')
    .upsert({
      patient_id: patientId,
      ...data
    })
    .select()
    .single()

  if (error) throw error
  return result
}

/**
 * Calcula estado Apgar
 * Scores: 0-3 (crítico), 4-6 (moderado), 7-10 (normal)
 */
export function getApgarStatus(score: number): string {
  if (score <= 3) return 'crítico'
  if (score <= 6) return 'moderado'
  return 'normal'
}

/**
 * Detecta anomalías congénitas comunes
 */
export const CONGENITAL_ANOMALIES = [
  'Labio leporino',
  'Paladar hendido',
  'Defecto septum ventricular (VSD)',
  'Tetrología de Fallot',
  'Down (Trisomía 21)',
  'Espina bífida',
  'Malformación renal',
  'Atresia intestinal',
  'Gastrosquisis',
  'Onfalocele'
] as const
