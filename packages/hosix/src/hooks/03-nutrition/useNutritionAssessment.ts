/**
 * Hook: useNutritionAssessment
 * Gestiona evaluación nutricional: BMI, estado nutricional, alergias, suplementos
 */

import { useEffect, useState } from 'react'
import { useSupabase } from '@hosix/hooks/shared/useSupabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface NutritionAssessment {
  id: string
  patient_id: string
  assessment_date: string
  bmi: number
  nutritional_status: 'normal' | 'overweight' | 'underweight' | 'obese'
  dietary_habits: string
  allergies: string[]
  supplements: string[]
  hospital_id: string
  created_by: string
}

interface UseNutritionAssessmentState {
  assessment: NutritionAssessment | null
  loading: boolean
  error: PostgrestError | null
  save: (data: Omit<NutritionAssessment, 'id' | 'hospital_id' | 'created_by'>) => Promise<void>
  refetch: () => Promise<void>
}

export function useNutritionAssessment(patientId: string): UseNutritionAssessmentState {
  const { supabase, user } = useSupabase()
  const [state, setState] = useState<UseNutritionAssessmentState>({
    assessment: null,
    loading: true,
    error: null,
    save: async () => {},
    refetch: async () => {}
  })

  const fetchAssessment = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase
        .from('nutrition_assessment')
        .select('*')
        .eq('patient_id', patientId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setState(prev => ({
        ...prev,
        assessment: data || null,
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

  const save = async (assessmentData: Omit<NutritionAssessment, 'id' | 'hospital_id' | 'created_by'>) => {
    try {
      const { error } = await supabase
        .from('nutrition_assessment')
        .insert([{
          ...assessmentData,
          hospital_id: user?.user_metadata?.hospital_id,
          created_by: user?.id
        }])

      if (error) throw error
      await fetchAssessment()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      throw error
    }
  }

  useEffect(() => {
    if (patientId) {
      fetchAssessment()
    }
  }, [patientId, supabase])

  return {
    ...state,
    save,
    refetch: fetchAssessment
  }
}

/**
 * Calcula BMI y categoría
 */
export function calculateBMI(weight_kg: number, height_m: number) {
  const bmi = weight_kg / (height_m * height_m)
  
  let category: NutritionAssessment['nutritional_status']
  if (bmi < 18.5) category = 'underweight'
  else if (bmi < 25) category = 'normal'
  else if (bmi < 30) category = 'overweight'
  else category = 'obese'

  return { bmi: parseFloat(bmi.toFixed(1)), category }
}

/**
 * Alergias alimentarias comunes
 */
export const COMMON_ALLERGIES = [
  'Maní/Cacahuate',
  'Frutos secos',
  'Leche',
  'Huevos',
  'Trigo',
  'Pescado/Mariscos',
  'Soya',
  'Sesamo',
  'Sulfitos',
  'Gluten'
] as const
