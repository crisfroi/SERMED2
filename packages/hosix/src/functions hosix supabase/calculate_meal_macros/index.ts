/**
 * Supabase Edge Function: calculate_meal_macros
 * Calcula macronutrientes para items de comida
 * 
 * POST /calculate_meal_macros
 * Body: {
 *   "food_item": "Arroz blanco",
 *   "quantity": 150,
 *   "unit": "g"
 * }
 * 
 * Response: {
 *   "food_item": "Arroz blanco",
 *   "quantity": 150,
 *   "unit": "g",
 *   "kcal": 195,
 *   "protein_g": 4.3,
 *   "fat_g": 0.3,
 *   "carbs_g": 43.3
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Base de datos simplificada de alimentos (formato: alimento -> macros por 100g)
// En producción, usar base de datos completa (USDA, INFOODS, etc.)
const FOOD_DATABASE: Record<string, { kcal: number; protein_g: number; fat_g: number; carbs_g: number }> = {
  // Granos
  'Arroz blanco': { kcal: 130, protein_g: 2.7, fat_g: 0.3, carbs_g: 28.7 },
  'Arroz integral': { kcal: 111, protein_g: 2.6, fat_g: 0.9, carbs_g: 23 },
  'Pan blanco': { kcal: 265, protein_g: 9, fat_g: 3.2, carbs_g: 49 },
  'Pasta integral': { kcal: 124, protein_g: 5.3, fat_g: 1.1, carbs_g: 25 },
  
  // Proteínas
  'Pechuga de pollo': { kcal: 165, protein_g: 31, fat_g: 3.6, carbs_g: 0 },
  'Res magra': { kcal: 250, protein_g: 26, fat_g: 15, carbs_g: 0 },
  'Huevo': { kcal: 155, protein_g: 13, fat_g: 11, carbs_g: 1.1 },
  'Atún en agua': { kcal: 96, protein_g: 22, fat_g: 0.8, carbs_g: 0 },
  'Tofu': { kcal: 76, protein_g: 8, fat_g: 4.8, carbs_g: 1.9 },
  
  // Vegetales
  'Brécol': { kcal: 34, protein_g: 2.8, fat_g: 0.4, carbs_g: 7 },
  'Zanahoria': { kcal: 41, protein_g: 0.9, fat_g: 0.2, carbs_g: 10 },
  'Espinaca': { kcal: 23, protein_g: 2.9, fat_g: 0.4, carbs_g: 3.6 },
  'Tomate': { kcal: 18, protein_g: 0.9, fat_g: 0.2, carbs_g: 3.9 },
  'Cebolla': { kcal: 40, protein_g: 1.1, fat_g: 0.1, carbs_g: 9 },
  
  // Frutas
  'Plátano': { kcal: 89, protein_g: 1.1, fat_g: 0.3, carbs_g: 23 },
  'Manzana': { kcal: 52, protein_g: 0.3, fat_g: 0.2, carbs_g: 14 },
  'Naranja': { kcal: 47, protein_g: 0.9, fat_g: 0.1, carbs_g: 12 },
  'Fresa': { kcal: 32, protein_g: 0.8, fat_g: 0.3, carbs_g: 8 },
  
  // Lácteos
  'Leche descremada': { kcal: 34, protein_g: 3.4, fat_g: 0.1, carbs_g: 4.8 },
  'Yogurt natural': { kcal: 59, protein_g: 10, fat_g: 0.1, carbs_g: 3.3 },
  'Queso blanco': { kcal: 110, protein_g: 14, fat_g: 5.6, carbs_g: 3.7 },
  
  // Aceites y grasas
  'Aceite de oliva': { kcal: 884, protein_g: 0, fat_g: 100, carbs_g: 0 },
  'Mantequilla': { kcal: 717, protein_g: 0.9, fat_g: 81, carbs_g: 0.1 },
  
  // Bebidas
  'Agua': { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 },
  'Jugo de naranja': { kcal: 45, protein_g: 0.7, fat_g: 0.2, carbs_g: 11 }
}

interface MacroCalculationRequest {
  food_item: string
  quantity: number
  unit: 'g' | 'ml' | 'portion'
}

interface MacroCalculationResponse {
  food_item: string
  quantity: number
  unit: string
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  found: boolean
  note?: string
}

function findClosestMatch(foodName: string): string | null {
  const name = foodName.toLowerCase().trim()
  
  // Búsqueda exacta
  for (const [key] of Object.entries(FOOD_DATABASE)) {
    if (key.toLowerCase() === name) {
      return key
    }
  }
  
  // Búsqueda parcial
  for (const [key] of Object.entries(FOOD_DATABASE)) {
    if (key.toLowerCase().includes(name) || name.includes(key.toLowerCase())) {
      return key
    }
  }
  
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const body: MacroCalculationRequest = await req.json()

    const { food_item, quantity, unit } = body

    if (!food_item || !quantity || quantity <= 0) {
      return new Response(
        JSON.stringify({ error: 'food_item, quantity requeridos y válidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Buscar alimento
    const foundFood = findClosestMatch(food_item)

    if (!foundFood) {
      // Retornar estimación genérica
      return new Response(
        JSON.stringify({
          food_item,
          quantity,
          unit,
          kcal: 0,
          protein_g: 0,
          fat_g: 0,
          carbs_g: 0,
          found: false,
          note: `Alimento "${food_item}" no encontrado. Use valores manuales.`
        } as MacroCalculationResponse),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const macros = FOOD_DATABASE[foundFood]

    // Ajustar por cantidad
    let quantity_factor = quantity / 100 // asumir base de datos en 100g
    if (unit === 'ml' && foundFood.includes('Leche') || foundFood.includes('Jugo')) {
      quantity_factor = quantity / 100
    } else if (unit === 'portion') {
      // Estimar 150g por porción promedio
      quantity_factor = (quantity * 150) / 100
    }

    const result: MacroCalculationResponse = {
      food_item: foundFood,
      quantity,
      unit: unit || 'g',
      kcal: Math.round(macros.kcal * quantity_factor),
      protein_g: parseFloat((macros.protein_g * quantity_factor).toFixed(1)),
      fat_g: parseFloat((macros.fat_g * quantity_factor).toFixed(1)),
      carbs_g: parseFloat((macros.carbs_g * quantity_factor).toFixed(1)),
      found: true
    }

    return new Response(
      JSON.stringify(result),
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
