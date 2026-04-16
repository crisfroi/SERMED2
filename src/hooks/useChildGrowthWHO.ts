/**
 * Hook: useChildGrowthWHO - Gráficas de crecimiento con estándares WHO
 * 
 * WHO Growth Charts:
 * - Utiliza estándares internacionales para niños 0-5 años
 * - Calcula percentiles (3, 10, 25, 50, 75, 90, 97)
 * - El 50 percentil = mediana (típico)
 * - El 3 percentil y 97 = límites normales (±2 SD)
 * 
 * Parámetros:
 * - Peso para edad, talla para edad, IMC
 * - Sexo: determina tablas diferentes
 * - Edad: 0-5 años (después usa tablas IMC)
 */

import { useState, useCallback } from 'react'

export interface GrowthMeasurement {
  date: string
  weight_kg: number
  length_cm: number
  age_months: number
}

export interface WHOPercentile {
  percentile: 3 | 10 | 25 | 50 | 75 | 90 | 97
  value: number
}

export interface GrowthStatus {
  weight_percentile: number
  length_percentile: number
  bmi_percentile?: number
  status: 'normal' | 'underweight' | 'overweight' | 'severely_stunted' | 'stunted'
}

// Datos simplificados WHO para demostración
// En producción, usar tablas completas de WHO (1000+ valores)
const WHO_WEIGHT_FOR_AGE_MALE = {
  0: { 3: 2.0, 10: 2.5, 25: 2.8, 50: 3.3, 75: 3.9, 90: 4.5, 97: 5.2 },
  3: { 3: 4.5, 10: 5.1, 25: 5.7, 50: 6.4, 75: 7.2, 90: 8.1, 97: 9.2 },
  6: { 3: 6.0, 10: 6.7, 25: 7.5, 50: 8.4, 75: 9.3, 90: 10.3, 97: 11.5 },
  12: { 3: 8.0, 10: 8.8, 25: 9.6, 50: 10.6, 75: 11.7, 90: 12.9, 97: 14.3 },
  18: { 3: 9.5, 10: 10.5, 25: 11.4, 50: 12.5, 75: 13.7, 90: 15.1, 97: 16.7 },
  24: { 3: 11.0, 10: 12.0, 25: 13.0, 50: 14.2, 75: 15.5, 90: 17.1, 97: 19.0 },
  36: { 3: 12.8, 10: 14.0, 25: 15.2, 50: 16.7, 75: 18.3, 90: 20.2, 97: 22.5 },
  48: { 3: 14.5, 10: 15.9, 25: 17.3, 50: 19.0, 75: 20.8, 90: 23.0, 97: 25.6 },
  60: { 3: 16.0, 10: 17.6, 25: 19.2, 50: 21.0, 75: 23.0, 90: 25.5, 97: 28.3 }
}

const WHO_LENGTH_FOR_AGE_MALE = {
  0: { 3: 46.1, 10: 46.8, 25: 47.6, 50: 48.9, 75: 50.1, 90: 51.3, 97: 52.2 },
  3: { 3: 52.4, 10: 53.3, 25: 54.4, 50: 55.9, 75: 57.3, 90: 58.7, 97: 59.8 },
  6: { 3: 57.5, 10: 58.6, 25: 59.9, 50: 61.7, 75: 63.4, 90: 65.0, 97: 66.3 },
  12: { 3: 66.0, 10: 67.3, 25: 68.8, 50: 71.0, 75: 73.1, 90: 75.0, 97: 76.8 },
  24: { 3: 76.5, 10: 78.0, 25: 79.8, 50: 82.5, 75: 85.1, 90: 87.4, 97: 89.2 },
  36: { 3: 85.0, 10: 86.7, 25: 88.7, 50: 91.6, 75: 94.4, 90: 97.0, 97: 99.3 },
  48: { 3: 92.0, 10: 94.0, 25: 96.3, 50: 99.5, 75: 102.7, 90: 105.6, 97: 108.3 },
  60: { 3: 98.0, 10: 100.3, 25: 102.8, 50: 106.3, 75: 109.8, 90: 113.1, 97: 116.1 }
}

// Femenino tiene valores levemente diferentes (más bajos generalmente)
const WHO_WEIGHT_FOR_AGE_FEMALE = {
  0: { 3: 1.9, 10: 2.4, 25: 2.7, 50: 3.2, 75: 3.7, 90: 4.3, 97: 5.0 },
  3: { 3: 4.2, 10: 4.8, 25: 5.4, 50: 6.1, 75: 6.9, 90: 7.8, 97: 8.8 },
  6: { 3: 5.6, 10: 6.3, 25: 7.0, 50: 7.9, 75: 8.8, 90: 9.8, 97: 11.0 },
  12: { 3: 7.6, 10: 8.4, 25: 9.1, 50: 10.1, 75: 11.1, 90: 12.2, 97: 13.6 },
  24: { 3: 10.4, 10: 11.3, 25: 12.3, 50: 13.5, 75: 14.8, 90: 16.2, 97: 18.1 },
  36: { 3: 12.0, 10: 13.2, 25: 14.4, 50: 15.9, 75: 17.4, 90: 19.2, 97: 21.4 },
  48: { 3: 13.3, 10: 14.8, 25: 16.2, 50: 18.0, 75: 19.9, 90: 22.0, 97: 24.5 },
  60: { 3: 14.8, 10: 16.3, 25: 17.9, 50: 19.8, 75: 21.8, 90: 24.1, 97: 27.0 }
}

interface UseChildGrowthWHOState {
  currentMeasurement: GrowthMeasurement | null
  percentiles: Partial<Record<number, WHOPercentile[]>>
  growthStatus: GrowthStatus | null
  growthChart: GrowthMeasurement[]
  calculatePercentile: (measurement: GrowthMeasurement, gender: 'M' | 'F') => GrowthStatus
  addMeasurement: (measurement: GrowthMeasurement) => void
}

export function useChildGrowthWHO(): UseChildGrowthWHOState {
  const [growthChart, setGrowthChart] = useState<GrowthMeasurement[]>([])
  const [growthStatus, setGrowthStatus] = useState<GrowthStatus | null>(null)

  const getWHOValue = (gender: 'M' | 'F', parameter: 'weight' | 'length', ageMonths: number, percentile: number) => {
    let table
    if (parameter === 'weight') {
      table = gender === 'M' ? WHO_WEIGHT_FOR_AGE_MALE : WHO_WEIGHT_FOR_AGE_FEMALE
    } else {
      table = gender === 'M' ? WHO_LENGTH_FOR_AGE_MALE : WHO_LENGTH_FOR_AGE_FEMALE
    }

    // Buscar edad más cercana
    const ages = Object.keys(table).map(Number)
    const closestAge = ages.reduce((prev, curr) => 
      Math.abs(curr - ageMonths) < Math.abs(prev - ageMonths) ? curr : prev
    )

    const data = table[closestAge as keyof typeof table]
    return data[percentile as keyof typeof data]
  }

  const calculatePercentile = useCallback((measurement: GrowthMeasurement, gender: 'M' | 'F'): GrowthStatus => {
    const weightPercentiles = [3, 10, 25, 50, 75, 90, 97].map(p => 
      getWHOValue(gender, 'weight', measurement.age_months, p)
    )
    
    const lengthPercentiles = [3, 10, 25, 50, 75, 90, 97].map(p => 
      getWHOValue(gender, 'length', measurement.age_months, p)
    )

    // Encontrar percentil actual
    let weight_percentile = 50
    if (measurement.weight_kg < weightPercentiles[0]) weight_percentile = 3
    else if (measurement.weight_kg < weightPercentiles[1]) weight_percentile = 10
    else if (measurement.weight_kg < weightPercentiles[2]) weight_percentile = 25
    else if (measurement.weight_kg < weightPercentiles[4]) weight_percentile = 50
    else if (measurement.weight_kg < weightPercentiles[5]) weight_percentile = 75
    else if (measurement.weight_kg < weightPercentiles[6]) weight_percentile = 90
    else weight_percentile = 97

    let length_percentile = 50
    if (measurement.length_cm < lengthPercentiles[0]) length_percentile = 3
    else if (measurement.length_cm < lengthPercentiles[1]) length_percentile = 10
    else if (measurement.length_cm < lengthPercentiles[2]) length_percentile = 25
    else if (measurement.length_cm < lengthPercentiles[4]) length_percentile = 50
    else if (measurement.length_cm < lengthPercentiles[5]) length_percentile = 75
    else if (measurement.length_cm < lengthPercentiles[6]) length_percentile = 90
    else length_percentile = 97

    // Determinar estado
    let status: GrowthStatus['status'] = 'normal'
    if (weight_percentile < 10 && length_percentile < 10) status = 'severely_stunted'
    else if (length_percentile < 10) status = 'stunted'
    else if (weight_percentile < 10) status = 'underweight'
    else if (weight_percentile > 90) status = 'overweight'

    const result: GrowthStatus = {
      weight_percentile,
      length_percentile,
      status
    }

    setGrowthStatus(result)
    return result
  }, [])

  const addMeasurement = useCallback((measurement: GrowthMeasurement) => {
    setGrowthChart(prev => [...prev, measurement].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
  }, [])

  return {
    currentMeasurement: growthChart.length > 0 ? growthChart[growthChart.length - 1] : null,
    percentiles: {},
    growthStatus,
    growthChart,
    calculatePercentile,
    addMeasurement
  }
}

/**
 * Evalúa si el crecimiento es esperado
 * Retorna: 'alert', 'warning', 'normal'
 */
export function evaluateGrowthStatus(status: GrowthStatus['status']): 'alert' | 'warning' | 'normal' {
  if (status === 'severely_stunted') return 'alert'
  if (status === 'stunted' || status === 'underweight') return 'warning'
  return 'normal'
}
