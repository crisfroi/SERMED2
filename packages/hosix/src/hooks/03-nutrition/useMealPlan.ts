// Nutrition stubs
import { useState } from 'react';

export const useMealPlan = (patientId: string) => {
  const [plans, setPlans] = useState([]);
  return { plans };
};

export const useNutritionCompliance = (patientId: string) => {
  const [compliance, setCompliance] = useState(null);
  return { compliance };
};

export const useNutritionAssessment = (patientId: string) => {
  const [assessment, setAssessment] = useState(null);
  return { assessment };
};
/**
 * Hook: useMealPlan
 * Gestiona planes de comidas: creación, edición, seguimiento
 */

import { useState, useCallback } from 'react'
import { useSupabase } from '@hosix/hooks/shared/useSupabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface MealPlan {
  id: string
  patient_id: string
  encounter_id?: string
  start_date: string
  end_date: string
  kcal_target: number
  protein_g: number
  fat_g: number
  carbs_g: number
  notes: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  hospital_id: string
  created_at: string
}

export interface MealPlanItem {
  id: string
  meal_plan_id: string
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner'
  food_item: string
  quantity: number
  unit: 'g' | 'ml' | 'portion'
  kcal_contributed: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

interface UseMealPlanState {
  mealPlans: MealPlan[]
  currentPlan: MealPlan | null
  mealItems: MealPlanItem[]
  loading: boolean
  error: PostgrestError | null
  createPlan: (plan: Omit<MealPlan, 'id' | 'hospital_id' | 'created_at'>) => Promise<MealPlan>
  updatePlan: (id: string, data: Partial<MealPlan>) => Promise<void>
  addMealItem: (item: Omit<MealPlanItem, 'id'>) => Promise<void>
  removeMealItem: (id: string) => Promise<void>
  getMealItems: (mealPlanId: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useMealPlan(patientId: string): UseMealPlanState {
  const { supabase, user } = useSupabase()
  const [state, setState] = useState<Partial<UseMealPlanState>>({
    mealPlans: [],
    currentPlan: null,
    mealItems: [],
    loading: true,
    error: null
  })

  const fetchPlans = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase
        .from('meal_plan')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_date', { ascending: false })

      if (error) throw error

      setState(prev => ({
        ...prev,
        mealPlans: data || [],
        currentPlan: data?.[0] || null,
        loading: false
      }))

      // Cargar items si hay plan
      if (data?.[0]) {
        await getMealItems(data[0].id)
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError,
        loading: false
      }))
    }
  }, [patientId, supabase])

  const createPlan = useCallback(async (plan: Omit<MealPlan, 'id' | 'hospital_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('meal_plan')
        .insert([{
          ...plan,
          hospital_id: user?.user_metadata?.hospital_id
        }])
        .select()
        .single()

      if (error) throw error
      await fetchPlans()
      return data
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      throw error
    }
  }, [supabase, user, fetchPlans])

  const updatePlan = useCallback(async (id: string, data: Partial<MealPlan>) => {
    try {
      const { error } = await supabase
        .from('meal_plan')
        .update(data)
        .eq('id', id)

      if (error) throw error
      await fetchPlans()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      throw error
    }
  }, [supabase, fetchPlans])

  const addMealItem = useCallback(async (item: Omit<MealPlanItem, 'id'>) => {
    try {
      const { error } = await supabase
        .from('meal_plan_item')
        .insert([item])

      if (error) throw error

      if (item.meal_plan_id) {
        await getMealItems(item.meal_plan_id)
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      throw error
    }
  }, [supabase])

  const removeMealItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('meal_plan_item')
        .delete()
        .eq('id', id)

      if (error) throw error

      setState(prev => ({
        ...prev,
        mealItems: (prev.mealItems || []).filter(item => item.id !== id)
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
      throw error
    }
  }, [supabase])

  const getMealItems = useCallback(async (mealPlanId: string) => {
    try {
      const { data, error } = await supabase
        .from('meal_plan_item')
        .select('*')
        .eq('meal_plan_id', mealPlanId)
        .order('meal_type')

      if (error) throw error

      setState(prev => ({
        ...prev,
        mealItems: data || []
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as PostgrestError
      }))
    }
  }, [supabase])

  return {
    ...state,
    mealPlans: state.mealPlans || [],
    currentPlan: state.currentPlan || null,
    mealItems: state.mealItems || [],
    loading: state.loading || false,
    error: state.error || null,
    createPlan,
    updatePlan,
    addMealItem,
    removeMealItem,
    getMealItems,
    refetch: fetchPlans
  } as UseMealPlanState
}

/**
 * Calcula macros totales de un plan
 */
export function calculateMealPlanMacros(items: MealPlanItem[]) {
  const totals = items.reduce(
    (sum, item) => ({
      kcals: sum.kcals + item.kcal_contributed,
      protein: sum.protein + item.protein_g,
      fat: sum.fat + item.fat_g,
      carbs: sum.carbs + item.carbs_g
    }),
    { kcals: 0, protein: 0, fat: 0, carbs: 0 }
  )

  return totals
}

/**
 * Tipos de comidas
 */
export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Desayuno', icon: '🌅' },
  { id: 'lunch', label: 'Almuerzo', icon: '🍽️' },
  { id: 'snack', label: 'Refrigerio', icon: '🍌' },
  { id: 'dinner', label: 'Cena', icon: '🌙' }
] as const
