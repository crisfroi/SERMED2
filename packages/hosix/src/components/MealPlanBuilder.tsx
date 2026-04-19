/**
 * Component: MealPlanBuilder
 * Constructor visual de planes de comidas con visualización de macros
 */

import React, { useState } from 'react'
import { useMealPlan, calculateMealPlanMacros, MEAL_TYPES } from '@/hooks/useMealPlan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'

interface MealPlanBuilderProps {
  patientId: string
  onPlanCreated?: () => void
}

export function MealPlanBuilder({ patientId, onPlanCreated }: MealPlanBuilderProps) {
  const { createPlan, mealItems } = useMealPlan(patientId)
  const [planName] = useState('')
  const [kcalTarget, setKcalTarget] = useState('2000')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')

  const handleCreatePlan = async () => {
    try {
      await createPlan({
        patient_id: patientId,
        start_date: startDate,
        end_date: endDate,
        kcal_target: parseInt(kcalTarget),
        protein_g: 50,
        fat_g: 65,
        carbs_g: 250,
        notes: planName,
        status: 'draft'
      })
      onPlanCreated?.()
    } catch (err) {
      console.error('Error creating plan:', err)
    }
  }

  const macros = calculateMealPlanMacros(mealItems)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Plan de Comidas</CardTitle>
        <CardDescription>Objetivo calórico y distribución de macros diaria</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Inicio</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">Calorías Objetivo (kcal)</label>
            <Input
              type="number"
              value={kcalTarget}
              onChange={(e) => setKcalTarget(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Resumen de macros */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 bg-blue-50 rounded text-center">
            <div className="text-lg font-bold text-blue-600">{macros.kcals}</div>
            <div className="text-xs text-gray-600">kcal</div>
          </div>
          <div className="p-3 bg-red-50 rounded text-center">
            <div className="text-lg font-bold text-red-600">{macros.protein}g</div>
            <div className="text-xs text-gray-600">Proteína</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded text-center">
            <div className="text-lg font-bold text-yellow-600">{macros.fat}g</div>
            <div className="text-xs text-gray-600">Grasas</div>
          </div>
          <div className="p-3 bg-green-50 rounded text-center">
            <div className="text-lg font-bold text-green-600">{macros.carbs}g</div>
            <div className="text-xs text-gray-600">Carbos</div>
          </div>
        </div>

        {/* Items por comida */}
        <div className="space-y-3">
          {MEAL_TYPES.map(mealType => {
            const mealItems = mealItems.filter(item => item.meal_type === mealType.id)
            return (
              <div key={mealType.id} className="border rounded-lg p-3">
                <div className="font-semibold flex items-center gap-2">
                  <span>{mealType.icon}</span> {mealType.label}
                  <Badge variant="outline">{mealItems.length} items</Badge>
                </div>
              </div>
            )
          })}
        </div>

        <Button onClick={handleCreatePlan} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Crear Plan
        </Button>
      </CardContent>
    </Card>
  )
}
