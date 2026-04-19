/**
 * Component: NutritionComplianceTracker
 * Visualiza adherencia al plan nutricional
 */

import React, { useEffect, useState } from 'react'
import { useNutritionCompliance, evaluateCompliance, getComplianceRecommendation } from '@/hooks/useNutritionCompliance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'

interface NutritionComplianceTrackerProps {
  patientId: string
  mealPlanId: string
}

export function NutritionComplianceTracker({ patientId, mealPlanId }: NutritionComplianceTrackerProps) {
  const { records, compliance_pct_avg, addRecord, getTrend } = useNutritionCompliance(patientId, mealPlanId)
  const [trendData, setTrendData] = useState<any[]>([])
  const [mealsCompleted, setMealsCompleted] = useState('3')
  const [mealsPlanned, setMealsPlanned] = useState('4')

  const status = evaluateCompliance(compliance_pct_avg)

  useEffect(() => {
    const loadTrend = async () => {
      const data = await getTrend(mealPlanId)
      setTrendData(data)
    }
    loadTrend()
  }, [mealPlanId, getTrend])

  const handleAddRecord = async () => {
    try {
      await addRecord({
        patient_id: patientId,
        meal_plan_id: mealPlanId,
        compliance_date: new Date().toISOString().split('T')[0],
        meals_completed: parseInt(mealsCompleted),
        meals_planned: parseInt(mealsPlanned),
        notes: ''
      })
      setMealsCompleted('3')
      setMealsPlanned('4')
    } catch (err) {
      console.error('Error adding record:', err)
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'excellent': return 'bg-green-50 border-green-200'
      case 'good': return 'bg-blue-50 border-blue-200'
      case 'fair': return 'bg-yellow-50 border-yellow-200'
      case 'poor': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Resumen */}
      <Card className={`lg:col-span-2 border-2 ${getStatusColor(status)}`}>
        <CardHeader>
          <CardTitle>Cumplimiento Actual</CardTitle>
          <CardDescription>Última semana: {records.length} registros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Big number */}
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600">{compliance_pct_avg}%</div>
            <div className="text-lg font-semibold mt-2">{getComplianceRecommendation(compliance_pct_avg)}</div>
            <div className="text-sm text-gray-600 mt-2">Promedio de cumplimiento</div>
          </div>

          {/* Chart */}
          {trendData.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="compliance_date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="compliance_pct"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Status badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant={compliance_pct_avg >= 90 ? 'default' : 'secondary'}>
              Total: {records.length} días
            </Badge>
            <Badge variant={status === 'excellent' ? 'default' : 'secondary'}>
              {status.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Agregar registro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hoy registró</CardTitle>
          <CardDescription className="text-xs">{new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Comidas completadas</label>
            <Input
              type="number"
              min="0"
              value={mealsCompleted}
              onChange={(e) => setMealsCompleted(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Comidas planeadas</label>
            <Input
              type="number"
              min="1"
              value={mealsPlanned}
              onChange={(e) => setMealsPlanned(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button onClick={handleAddRecord} className="w-full">
            Guardar
          </Button>

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded text-xs text-blue-700 flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              Se sugiere ≥90% cumplimiento para resultados óptimos.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
