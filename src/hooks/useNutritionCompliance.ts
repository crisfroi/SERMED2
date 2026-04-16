/**
 * Hook: useNutritionCompliance
 * Rastra adherencia del paciente al plan de nutrición
 */

import { useState, useCallback } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface NutritionCompliance {
  id: string
  patient_id: string
  meal_plan_id: string
  compliance_date: string
  meals_completed: number
  meals_planned: number
  compliance_pct: number
  notes: string
  hospital_id: string
}

interface UseNutritionComplianceState {
  records: NutritionCompliance[]
  compliance_pct_avg: number
  loading: boolean
  error: PostgrestError | null
  addRecord: (record: Omit<NutritionCompliance, 'id' | 'compliance_pct' | 'hospital_id'>) => Promise<void>
  getCompliance: (mealPlanId: string, days?: number) => Promise<number>
  getTrend: (mealPlanId: string) => Promise<NutritionCompliance[]>
}

export function useNutritionCompliance(patientId: string, mealPlanId?: string): UseNutritionComplianceState {
  const { supabase, user } = useSupabase()
  const [state, setState] = useState<Partial<UseNutritionComplianceState>>({
    records: [],
    compliance_pct_avg: 0,
    loading: true,
    error: null
  })

  const addRecord = useCallback(async (record: Omit<NutritionCompliance, 'id' | 'compliance_pct' | 'hospital_id'>) => {
    try {
      const compliance_pct = (record.meals_completed / record.meals_planned) * 100

      const { error } = await supabase
        .from('nutrition_compliance')
        .insert([{
          ...record,
          compliance_pct,
          hospital_id: user?.user_metadata?.hospital_id
        }])

      if (error) throw error

      if (mealPlanId) {
        await getCompliance(mealPlanId)
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      throw error
    }
  }, [supabase, user, mealPlanId])

  const getCompliance = useCallback(async (planId: string, days = 30) => {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('nutrition_compliance')
        .select('*')
        .eq('meal_plan_id', planId)
        .gte('compliance_date', startDate.toISOString().split('T')[0])
        .order('compliance_date', { ascending: false })

      if (error) throw error

      const records = data || []
      const avg_compliance = records.length > 0
        ? records.reduce((sum, r) => sum + r.compliance_pct, 0) / records.length
        : 0

      setState(prev => ({
        ...prev,
        records,
        compliance_pct_avg: parseFloat(avg_compliance.toFixed(1))
      }))

      return avg_compliance
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      return 0
    }
  }, [supabase])

  const getTrend = useCallback(async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('nutrition_compliance')
        .select('*')
        .eq('meal_plan_id', planId)
        .order('compliance_date', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      return []
    }
  }, [supabase])

  return {
    ...state,
    records: state.records || [],
    compliance_pct_avg: state.compliance_pct_avg || 0,
    loading: state.loading || false,
    error: state.error || null,
    addRecord,
    getCompliance,
    getTrend
  } as UseNutritionComplianceState
}

/**
 * Evalúa cumplimiento
 */
export function evaluateCompliance(compliance_pct: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (compliance_pct >= 90) return 'excellent'
  if (compliance_pct >= 70) return 'good'
  if (compliance_pct >= 50) return 'fair'
  return 'poor'
}

/**
 * Genera recomendación basada en cumplimiento
 */
export function getComplianceRecommendation(compliance_pct: number): string {
  const status = evaluateCompliance(compliance_pct)

  switch (status) {
    case 'excellent':
      return '✅ Excelente adherencia al plan. Continuar!'
    case 'good':
      return '👍 Buen cumplimiento. Reforzar en comidas débiles.'
    case 'fair':
      return '⚠️ Algunas dificultades. Revisar obstáculos.'
    case 'poor':
      return '🔴 Bajo cumplimiento. Necesita intervención dietética.'
  }
}
