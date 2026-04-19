/**
 * Component: WHOPercentileChart
 * Visualiza crecimiento del niño contra estándares WHO
 * Muestra: peso, talla, y percentiles (3, 50, 97)
 * 
 * Props:
 * - patientId: UUID del paciente
 * - gender: 'M' | 'F'
 * - measurements: Array de mediciones históricas
 */

import React, { useState } from 'react'
import { useChildGrowthWHO } from '@/hooks/useChildGrowthWHO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, AlertTriangle } from 'lucide-react'

interface WHOPercentileChartProps {
  patientId?: string
  gender: 'M' | 'F'
  currentAgeMonths: number
}

export function WHOPercentileChart({ patientId, gender, currentAgeMonths }: WHOPercentileChartProps) {
  const { growthChart, growthStatus, addMeasurement, calculatePercentile } = useChildGrowthWHO()
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [measurementDate, setMeasurementDate] = useState(new Date().toISOString().split('T')[0])

  const handleAddMeasurement = () => {
    if (!weight || !length) return

    const measurement = {
      date: measurementDate,
      weight_kg: parseFloat(weight),
      length_cm: parseFloat(length),
      age_months: currentAgeMonths
    }

    addMeasurement(measurement)
    const status = calculatePercentile(measurement, gender)

    // Reset form
    setWeight('')
    setLength('')
    setMeasurementDate(new Date().toISOString().split('T')[0])
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'severely_stunted':
        return 'text-red-600 bg-red-50'
      case 'stunted':
        return 'text-orange-600 bg-orange-50'
      case 'underweight':
        return 'text-yellow-600 bg-yellow-50'
      case 'overweight':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-green-600 bg-green-50'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'severely_stunted':
        return '🔴 Muy retraso en talla'
      case 'stunted':
        return '🟠 Retraso en talla'
      case 'underweight':
        return '🟡 Bajo peso'
      case 'overweight':
        return '🔵 Sobrepeso'
      default:
        return '✅ Crecimiento normal'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfico Simplificado */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Curvas de Crecimiento (WHO)</CardTitle>
          <CardDescription>
            Peso y talla vs estándares internacionales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Simulación de gráfico (en producción usar ApexCharts o Recharts) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Weight Chart */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Peso (kg)</h3>
              <div className="h-48 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg flex items-end justify-center p-4">
                <div className="text-center">
                  {growthChart.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-blue-600">
                        {growthChart[growthChart.length - 1].weight_kg}
                      </div>
                      <div className="text-xs text-gray-600">
                        P{growthStatus?.weight_percentile || '?'}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400">Sin datos</div>
                  )}
                </div>
              </div>
            </div>

            {/* Length Chart */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Talla (cm)</h3>
              <div className="h-48 bg-gradient-to-b from-green-50 to-green-100 rounded-lg flex items-end justify-center p-4">
                <div className="text-center">
                  {growthChart.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-green-600">
                        {growthChart[growthChart.length - 1].length_cm}
                      </div>
                      <div className="text-xs text-gray-600">
                        P{growthStatus?.length_percentile || '?'}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400">Sin datos</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status & Alerts */}
          {growthStatus && (
            <div className={`p-4 rounded-lg ${getStatusColor(growthStatus.status)}`}>
              <div className="flex items-center gap-2">
                {(['normal', 'overweight'].includes(growthStatus.status)) ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <div>
                  <div className="font-semibold">{getStatusLabel(growthStatus.status)}</div>
                  <div className="text-sm">
                    Peso P{growthStatus.weight_percentile} • Talla P{growthStatus.length_percentile}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Data */}
          {growthChart.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Historial de mediciones</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {growthChart.slice().reverse().map((m, i) => (
                  <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{new Date(m.date).toLocaleDateString()}</span>
                      <span className="font-medium">{m.weight_kg}kg / {m.length_cm}cm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de ingreso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nueva Medición</CardTitle>
          <CardDescription className="text-xs">
            Sexo: <Badge>{gender === 'M' ? '♂️ Masculino' : '♀️ Femenino'}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Fecha</label>
            <Input
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Peso (kg)</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder="Ej: 5.2"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Talla (cm)</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder="Ej: 48.5"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleAddMeasurement}
            disabled={!weight || !length}
            className="w-full"
          >
            Registrar medición
          </Button>

          {/* WHO info */}
          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Las mediciones se comparan con estándares WHO.
              <br />Percentil 50 = normal
              <br />Percentil &lt;10 = bajo
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
