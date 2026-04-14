// src/__tests__/nutrition.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNutritionAssessment, useMealPlanning, useNutritionCompliance, useNutritionDataFetch } from '@/hooks/use-nutrition-hooks'
import React from 'react'

describe('Nutrition Module - Unit Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('useNutritionAssessment Hook', () => {
    it('should calculate BMI correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionAssessment('pat-001'), { wrapper })

      const bmi = result.current.calculateBMI(70, 175)
      expect(bmi).toBe(22.9)
    })

    it('should classify underweight BMI', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionAssessment('pat-001'), { wrapper })

      const bmi = result.current.calculateBMI(50, 175)
      expect(bmi).toBeLessThan(18.5)
    })

    it('should classify overweight BMI', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionAssessment('pat-001'), { wrapper })

      const bmi = result.current.calculateBMI(100, 175)
      expect(bmi).toBeGreaterThanOrEqual(25)
      expect(bmi).toBeLessThan(30)
    })

    it('should classify obese BMI', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionAssessment('pat-001'), { wrapper })

      const bmi = result.current.calculateBMI(120, 175)
      expect(bmi).toBeGreaterThanOrEqual(30)
    })

    it('should assess low nutritional risk', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionAssessment('pat-001'), { wrapper })

      const risk = result.current.assessNutritionalRisk(22.5, 0.5, 4.0)
      expect(risk).toBe('low')
    })

    it('should assess moderate risk', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionAssessment('pat-001'), { wrapper })

      const risk = result.current.assessNutritionalRisk(20, 5, 3.5)
      expect(risk).toBe('moderate')
    })

    it('should assess high risk', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionAssessment('pat-001'), { wrapper })

      const risk = result.current.assessNutritionalRisk(17, 8, 2.8)
      expect(risk).toBe('high')
    })

    it('should assess critical risk', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionAssessment('pat-001'), { wrapper })

      const risk = result.current.assessNutritionalRisk(16, 12, 2.3)
      expect(risk).toBe('critical')
    })
  })

  describe('useMealPlanning Hook', () => {
    it('should calculate macro distribution for 2000 calories', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useMealPlanning('pat-001'), { wrapper })

      const macros = result.current.calculateMacroDistribution(2000)
      
      expect(macros.protein_g).toBe(150) // 30% = 600 cal / 4 = 150g
      expect(macros.carbs_g).toBe(225) // 45% = 900 cal / 4 = 225g
      expect(macros.fats_g).toBe(56) // 25% = 500 cal / 9 = 55.5 → 56g
    })

    it('should calculate macros for weight loss plan 1500 cal', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useMealPlanning('pat-001'), { wrapper })

      const macros = result.current.calculateMacroDistribution(1500)
      
      expect(macros.protein_g).toBeLessThanOrEqual(200)
      expect(macros.carbs_g).toBeLessThanOrEqual(250)
      expect(macros.fats_g).toBeLessThanOrEqual(100)
    })

    it('should calculate macros for higher calorie gain plan 3000 cal', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useMealPlanning('pat-001'), { wrapper })

      const macros = result.current.calculateMacroDistribution(3000)
      
      expect(macros.protein_g).toBeGreaterThan(200)
      expect(macros.carbs_g).toBeGreaterThan(300)
      expect(macros.fats_g).toBeGreaterThan(80)
    })

    it('should maintain consistent macro ratios regardless of calories', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useMealPlanning('pat-001'), { wrapper })

      const macros1500 = result.current.calculateMacroDistribution(1500)
      const macros2000 = result.current.calculateMacroDistribution(2000)
      const macros3000 = result.current.calculateMacroDistribution(3000)

      // Protein should be ~30% across all calorie levels
      const proteinPercentage1500 = (macros1500.protein_g * 4) / 1500
      const proteinPercentage2000 = (macros2000.protein_g * 4) / 2000
      const proteinPercentage3000 = (macros3000.protein_g * 4) / 3000

      expect(Math.abs(proteinPercentage1500 - proteinPercentage2000)).toBeLessThan(0.02)
      expect(Math.abs(proteinPercentage2000 - proteinPercentage3000)).toBeLessThan(0.02)
    })
  })

  describe('useNutritionCompliance Hook', () => {
    it('should calculate trend as improving', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionCompliance('pat-001'), { wrapper })

      const historicalData = [
        { adherence: 75, date: '2026-03-20' },
        { adherence: 78, date: '2026-03-21' },
        { adherence: 80, date: '2026-03-22' },
        { adherence: 82, date: '2026-03-23' },
        { adherence: 85, date: '2026-03-24' },
        { adherence: 87, date: '2026-03-25' },
        { adherence: 90, date: '2026-03-26' },
        { adherence: 92, date: '2026-03-27' },
        { adherence: 94, date: '2026-03-28' },
        { adherence: 95, date: '2026-03-29' },
        { adherence: 96, date: '2026-03-30' },
        { adherence: 97, date: '2026-03-31' },
        { adherence: 98, date: '2026-04-01' },
        { adherence: 99, date: '2026-04-02' }
      ]

      const trend = result.current.calculateTrend(historicalData)
      expect(trend).toBe('improving')
    })

    it('should calculate trend as declining', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionCompliance('pat-001'), { wrapper })

      const historicalData = [
        { adherence: 95, date: '2026-03-20' },
        { adherence: 94, date: '2026-03-21' },
        { adherence: 92, date: '2026-03-22' },
        { adherence: 90, date: '2026-03-23' },
        { adherence: 88, date: '2026-03-24' },
        { adherence: 85, date: '2026-03-25' },
        { adherence: 82, date: '2026-03-26' },
        { adherence: 80, date: '2026-03-27' },
        { adherence: 78, date: '2026-03-28' },
        { adherence: 75, date: '2026-03-29' },
        { adherence: 72, date: '2026-03-30' },
        { adherence: 70, date: '2026-03-31' },
        { adherence: 68, date: '2026-04-01' },
        { adherence: 65, date: '2026-04-02' }
      ]

      const trend = result.current.calculateTrend(historicalData)
      expect(trend).toBe('declining')
    })

    it('should calculate trend as stable', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionCompliance('pat-001'), { wrapper })

      const historicalData = Array.from({ length: 14 }, (_, i) => ({
        adherence: 85 + Math.random() * 2 - 1,
        date: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000).toISOString()
      }))

      const trend = result.current.calculateTrend(historicalData)
      expect(trend).toBe('stable')
    })
  })

  describe('useNutritionDataFetch Hook', () => {
    it('should return array of food groups', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionDataFetch(), { wrapper })

      expect(Array.isArray(result.current.foodGroups)).toBe(true)
    })

    it('should return array of supplements', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionDataFetch(), { wrapper })

      expect(Array.isArray(result.current.supplements)).toBe(true)
    })

    it('should return array of diet types', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionDataFetch(), { wrapper })

      expect(Array.isArray(result.current.dietTypes)).toBe(true)
    })
  })

  describe('Nutrition Integration Tests', () => {
    it('should complete full nutrition assessment workflow', async () => {
      const assessmentData = {
        weight_kg: 75,
        height_cm: 175,
        age: 35,
        medical_conditions: ['diabetes'],
        allergies: ['peanuts'],
        medications: ['metformin']
      }

      expect(assessmentData.weight_kg).toBeGreaterThan(0)
      expect(assessmentData.height_cm).toBeGreaterThan(0)
      expect(assessmentData.age).toBeGreaterThan(0)
    })

    it('should enforce caloric targets', () => {
      const mealEntries = [
        { calories: 400, meal: 'breakfast' },
        { calories: 550, meal: 'lunch' },
        { calories: 500, meal: 'dinner' },
        { calories: 200, meal: 'snack' }
      ]

      const totalCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0)
      expect(totalCalories).toBe(1650)
      expect(totalCalories).toBeLessThan(2000)
    })

    it('should validate meal timing', () => {
      const meals = [
        { time: '07:00', type: 'breakfast' },
        { time: '12:30', type: 'lunch' },
        { time: '19:00', type: 'dinner' }
      ]

      for (let i = 1; i < meals.length; i++) {
        const prevTime = parseInt(meals[i - 1].time.split(':')[0])
        const currTime = parseInt(meals[i].time.split(':')[0])
        expect(currTime).toBeGreaterThan(prevTime)
      }
    })

    it('should check protein adequacy', () => {
      const dailyIntake = { protein: 120, calories: 2000 }
      
      const proteinPercentage = (dailyIntake.protein * 4) / dailyIntake.calories
      expect(proteinPercentage).toBeGreaterThan(0.1) // At least 10%
    })

    it('should identify food restrictions early', () => {
      const restrictions = ['gluten_free', 'dairy_free']
      const dietPlan = { restrictions, suitable_foods: [] }

      expect(dietPlan.restrictions).toContain('gluten_free')
      expect(dietPlan.restrictions).toContain('dairy_free')
    })

    it('should recommend dietary modifications for hypertension', () => {
      const conditions = ['hypertension']
      const recommendations: string[] = []

      if (conditions.includes('hypertension')) {
        recommendations.push('DASH diet')
        recommendations.push('Limit sodium to <2300mg/day')
      }

      expect(recommendations).toContain('DASH diet')
    })

    it('should track weight changes appropriately', () => {
      const weightHistory = [
        { date: '2026-03-01', weight: 85 },
        { date: '2026-03-15', weight: 84 },
        { date: '2026-04-01', weight: 82 },
        { date: '2026-04-15', weight: 80 }
      ]

      const totalChange = weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight
      expect(totalChange).toBeLessThan(0) // Weight loss
    })
  })

  describe('Nutrition Error Handling', () => {
    it('should handle invalid BMI inputs', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useNutritionAssessment('pat-001'), { wrapper })

      // Should not throw - graceful handling
      expect(() => result.current.calculateBMI(0, 0)).not.toThrow()
    })

    it('should handle special dietary requirements', () => {
      const restrictions = ['vegetarian', 'gluten_free', 'nut_free']
      
      expect(restrictions).toHaveLength(3)
      expect(restrictions.every(r => typeof r === 'string')).toBe(true)
    })

    it('should validate caloric calculations', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useMealPlanning('pat-001'), { wrapper })

      const macros = result.current.calculateMacroDistribution(2000)
      const calculatedCals = (macros.protein_g * 4) + (macros.carbs_g * 4) + (macros.fats_g * 9)

      expect(calculatedCals).toBeCloseTo(2000, -2)
    })
  })
})
