/**
 * Hook: useMilestoneTracking - Hitos developmentales del niño
 * Gestiona: Rastreo de logros del desarrollo según WHO standards
 * 
 * Hitos WHO:
 * - 2 meses: sonrisa social
 * - 4 meses: control cabeza
 * - 6 meses: sentarse con apoyo
 * - 12 meses: caminar con ayuda
 * - 18 meses: caminar sin ayuda
 * - 24 meses: vocabulario de 50 palabras
 */

import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface PediatricMilestone {
  id: string
  patient_id: string
  milestone_type: MilestoneType
  expected_age_months: number
  achieved_date: string | null
  notes: string | null
  status: 'pending' | 'achieved' | 'delayed'
}

export type MilestoneType =
  | 'head_control'
  | 'social_smile'
  | 'rolling'
  | 'sitting'
  | 'crawling'
  | 'standing'
  | 'walking'
  | 'first_word'
  | 'vocabulary_50'
  | 'toilet_training'

interface MilestoneDefinition {
  type: MilestoneType
  label: string
  expected_months: number
  description: string
}

// WHO developmental milestones (standard)
export const WHO_MILESTONES: MilestoneDefinition[] = [
  { type: 'social_smile', label: 'Sonrisa social', expected_months: 2, description: 'Sonríe en respuesta a interacción' },
  { type: 'head_control', label: 'Control de cabeza', expected_months: 3, description: 'Sostiene cabeza erguida por 30 seg' },
  { type: 'rolling', label: 'Rodarse', expected_months: 5, description: 'Rueda de espalda a costado' },
  { type: 'sitting', label: 'Sentarse', expected_months: 6, description: 'Se sienta con apoyo breve' },
  { type: 'crawling', label: 'Gatear', expected_months: 8, description: 'Coordina manos y rodillas' },
  { type: 'standing', label: 'Pararse', expected_months: 10, description: 'Se para sostenido de algo' },
  { type: 'walking', label: 'Caminar', expected_months: 12, description: 'Camina con ayuda o solo' },
  { type: 'first_word', label: 'Primera palabra', expected_months: 12, description: 'Pronuncia palabra clara aislada' },
  { type: 'vocabulary_50', label: '50 palabras', expected_months: 18, description: 'Vocabulario de ~50 palabras' },
  { type: 'toilet_training', label: 'Entrenamiento baño', expected_months: 24, description: 'Control esfínteres día/noche' }
]

interface UseMilestoneTrackingState {
  milestones: PediatricMilestone[]
  loading: boolean
  error: PostgrestError | null
  addMilestone: (milestone: Omit<PediatricMilestone, 'id'>) => Promise<void>
  updateMilestone: (id: string, data: Partial<PediatricMilestone>) => Promise<void>
  refetch: () => Promise<void>
}

export function useMilestoneTracking(patientId: string): UseMilestoneTrackingState {
  const { supabase } = useSupabase()
  const [state, setState] = useState<UseMilestoneTrackingState>({
    milestones: [],
    loading: true,
    error: null,
    addMilestone: async () => {},
    updateMilestone: async () => {},
    refetch: async () => {}
  })

  const fetchMilestones = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase
        .from('pediatric_milestone')
        .select('*')
        .eq('patient_id', patientId)
        .order('expected_age_months', { ascending: true })

      if (error) throw error

      setState(prev => ({
        ...prev,
        milestones: data || [],
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

  const addMilestone = async (milestone: Omit<PediatricMilestone, 'id'>) => {
    try {
      const { error } = await supabase
        .from('pediatric_milestone')
        .insert([milestone])

      if (error) throw error
      await fetchMilestones()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      throw error
    }
  }

  const updateMilestone = async (id: string, data: Partial<PediatricMilestone>) => {
    try {
      const { error } = await supabase
        .from('pediatric_milestone')
        .update(data)
        .eq('id', id)

      if (error) throw error
      await fetchMilestones()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      throw error
    }
  }

  const refetch = async () => {
    await fetchMilestones()
  }

  useEffect(() => {
    if (patientId) {
      fetchMilestones()
    }
  }, [patientId, supabase])

  return {
    ...state,
    addMilestone,
    updateMilestone,
    refetch
  }
}

/**
 * Evalúa si un hito está:
 * - 'on_track': logrado en tiempo esperado ±1 mes
 * - 'ahead': logrado antes de lo esperado
 * - 'delayed': logrado después de lo esperado
 * - 'pending': no logrado aún
 */
export function evaluateMilestoneStatus(
  achieved_date: string | null,
  expected_months: number,
  current_age_months: number
): 'on_track' | 'ahead' | 'delayed' | 'pending' {
  if (!achieved_date) {
    if (current_age_months > expected_months + 2) return 'delayed'
    if (current_age_months < expected_months + 1) return 'pending'
    return 'pending'
  }

  // Calcular meses en que fue logrado
  const achievedMonths = achieved_date ? Math.floor((new Date(achieved_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0

  const diff = achievedMonths - expected_months
  if (diff >= -1 && diff <= 1) return 'on_track'
  if (diff < -1) return 'ahead'
  return 'delayed'
}
