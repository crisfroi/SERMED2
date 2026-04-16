/**
 * Supabase Edge Function: calculate_who_percentile
 * URL: https://dfqefbkxounzmtggnfsc.functions.supabase.co/calculate_who_percentile
 * 
 * POST /calculate_who_percentile
 * Body: {
 *   "patient_id": "uuid",
 *   "weight_kg": number,
 *   "length_cm": number,
 *   "age_months": number,
 *   "gender": "M" | "F"
 * }
 * 
 * Response: {
 *   "weight_percentile": number (3-97),
 *   "length_percentile": number (3-97),
 *   "bmi": number,
 *   "status": "normal" | "stunted" | "underweight" | "overweight",
 *   "alerts": string[]
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

// WHO Reference values for weight-for-age (kg) by gender and age (months)
// Simplified dataset - production should use complete WHO tables (9000+ rows)
const WHO_DATA = {
  weight_for_age: {
    M: {
      0: { p3: 2.0, p10: 2.5, p25: 2.8, p50: 3.3, p75: 3.9, p90: 4.5, p97: 5.2 },
      3: { p3: 4.5, p10: 5.1, p25: 5.7, p50: 6.4, p75: 7.2, p90: 8.1, p97: 9.2 },
      6: { p3: 6.0, p10: 6.7, p25: 7.5, p50: 8.4, p75: 9.3, p90: 10.3, p97: 11.5 },
      12: { p3: 8.0, p10: 8.8, p25: 9.6, p50: 10.6, p75: 11.7, p90: 12.9, p97: 14.3 },
      24: { p3: 11.0, p10: 12.0, p25: 13.0, p50: 14.2, p75: 15.5, p90: 17.1, p97: 19.0 },
      36: { p3: 12.8, p10: 14.0, p25: 15.2, p50: 16.7, p75: 18.3, p90: 20.2, p97: 22.5 },
      60: { p3: 16.0, p10: 17.6, p25: 19.2, p50: 21.0, p75: 23.0, p90: 25.5, p97: 28.3 }
    },
    F: {
      0: { p3: 1.9, p10: 2.4, p25: 2.7, p50: 3.2, p75: 3.7, p90: 4.3, p97: 5.0 },
      3: { p3: 4.2, p10: 4.8, p25: 5.4, p50: 6.1, p75: 6.9, p90: 7.8, p97: 8.8 },
      6: { p3: 5.6, p10: 6.3, p25: 7.0, p50: 7.9, p75: 8.8, p90: 9.8, p97: 11.0 },
      12: { p3: 7.6, p10: 8.4, p25: 9.1, p50: 10.1, p75: 11.1, p90: 12.2, p97: 13.6 },
      24: { p3: 10.4, p10: 11.3, p25: 12.3, p50: 13.5, p75: 14.8, p90: 16.2, p97: 18.1 },
      36: { p3: 12.0, p10: 13.2, p25: 14.4, p50: 15.9, p75: 17.4, p90: 19.2, p97: 21.4 },
      60: { p3: 14.8, p10: 16.3, p25: 17.9, p50: 19.8, p75: 21.8, p90: 24.1, p97: 27.0 }
    }
  },
  length_for_age: {
    M: {
      0: { p3: 46.1, p10: 46.8, p25: 47.6, p50: 48.9, p75: 50.1, p90: 51.3, p97: 52.2 },
      3: { p3: 52.4, p10: 53.3, p25: 54.4, p50: 55.9, p75: 57.3, p90: 58.7, p97: 59.8 },
      6: { p3: 57.5, p10: 58.6, p25: 59.9, p50: 61.7, p75: 63.4, p90: 65.0, p97: 66.3 },
      12: { p3: 66.0, p10: 67.3, p25: 68.8, p50: 71.0, p75: 73.1, p90: 75.0, p97: 76.8 },
      24: { p3: 76.5, p10: 78.0, p25: 79.8, p50: 82.5, p75: 85.1, p90: 87.4, p97: 89.2 },
      60: { p3: 98.0, p10: 100.3, p25: 102.8, p50: 106.3, p75: 109.8, p90: 113.1, p97: 116.1 }
    },
    F: {
      0: { p3: 45.3, p10: 46.0, p25: 46.7, p50: 48.0, p75: 49.2, p90: 50.4, p97: 51.3 },
      3: { p3: 50.8, p10: 51.7, p25: 52.7, p50: 54.2, p75: 55.6, p90: 57.0, p97: 58.1 },
      6: { p3: 56.0, p10: 57.0, p25: 58.2, p50: 60.0, p75: 61.7, p90: 63.3, p97: 64.6 },
      12: { p3: 63.2, p10: 64.5, p25: 66.0, p50: 68.1, p75: 70.2, p90: 72.1, p97: 73.9 },
      24: { p3: 74.0, p10: 75.4, p25: 77.0, p50: 79.6, p75: 82.2, p90: 84.5, p97: 86.5 },
      60: { p3: 95.0, p10: 97.3, p25: 99.8, p50: 103.2, p75: 106.6, p90: 109.9, p97: 113.0 }
    }
  }
}

interface PercentileRequest {
  patient_id?: string
  weight_kg: number
  length_cm: number
  age_months: number
  gender: 'M' | 'F'
}

interface PercentileResponse {
  weight_percentile: number
  length_percentile: number
  bmi: number
  status: string
  alerts: string[]
  timestamp: string
}

function getClosestAgeData(ageMonths: number, genderData: any) {
  const availableAges = Object.keys(genderData).map(Number).sort((a, b) => a - b)

  // Find closest age
  let closestAge = availableAges[0]
  for (const age of availableAges) {
    if (Math.abs(age - ageMonths) < Math.abs(closestAge - ageMonths)) {
      closestAge = age
    }
  }

  return genderData[closestAge]
}

function calculatePercentile(value: number, ageData: any): number {
  const percentiles = ['p3', 'p10', 'p25', 'p50', 'p75', 'p90', 'p97'] as const
  const values = percentiles.map(p => ageData[p])

  for (let i = 0; i < values.length; i++) {
    if (value < values[i]) {
      return parseInt(percentiles[i].replace('p', ''))
    }
  }

  return 97
}

function getStatus(weightP: number, lengthP: number): string {
  if (weightP < 10 && lengthP < 10) return 'severely_stunted'
  if (lengthP < 10) return 'stunted'
  if (weightP < 10) return 'underweight'
  if (weightP > 90) return 'overweight'
  return 'normal'
}

function generateAlerts(weightP: number, lengthP: number, bmi: number): string[] {
  const alerts: string[] = []

  if (weightP < 3) alerts.push('⚠️ Peso muy bajo - derivar pediatra urgente')
  if (lengthP < 3) alerts.push('⚠️ Talla muy baja - evaluar malnutrición')
  if (weightP < 10) alerts.push('Peso bajo - monitorear más frecuentemente')
  if (lengthP < 10) alerts.push('Talla baja - considerar suplementación')
  if (weightP > 95) alerts.push('💡 Sobrepeso - recomendaciones dietéticas')

  return alerts
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const body: PercentileRequest = await req.json()

    // Validar inputs
    const errors: string[] = []
    if (!body.weight_kg || body.weight_kg <= 0) errors.push('weight_kg inválido')
    if (!body.length_cm || body.length_cm <= 0) errors.push('length_cm inválido')
    if (!body.age_months || body.age_months < 0) errors.push('age_months inválido')
    if (!['M', 'F'].includes(body.gender)) errors.push('gender debe ser M o F')

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: errors.join('; ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { weight_kg, length_cm, age_months, gender } = body

    // Obtener datos WHO más cercanos a la edad
    const weightData = getClosestAgeData(age_months, WHO_DATA.weight_for_age[gender])
    const lengthData = getClosestAgeData(age_months, WHO_DATA.length_for_age[gender])

    // Calcular percentiles
    const weight_percentile = calculatePercentile(weight_kg, weightData)
    const length_percentile = calculatePercentile(length_cm, lengthData)

    // Calcular BMI
    const bmi = weight_kg / ((length_cm / 100) ** 2)

    // Determinar estado
    const status = getStatus(weight_percentile, length_percentile)

    // Generar alertas
    const alerts = generateAlerts(weight_percentile, length_percentile, bmi)

    const response: PercentileResponse = {
      weight_percentile,
      length_percentile,
      bmi: parseFloat(bmi.toFixed(1)),
      status,
      alerts,
      timestamp: new Date().toISOString()
    }

    // Guardar en BD si patient_id está disponible
    if (body.patient_id) {
      try {
        await supabase
          .from('child_growth')
          .insert({
            patient_id: body.patient_id,
            weight_kg,
            length_cm,
            age_months,
            weight_percentile,
            length_percentile,
            bmi,
            gender,
            status
          })
      } catch (dbError) {
        console.error('DB error:', dbError)
        // No fallar si no se guarda - retornar resultado igual
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: 'Error procesando request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
