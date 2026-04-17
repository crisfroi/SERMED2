import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useComorbidityMatrix } from '@hosix/hooks/08-diagnoses/useComorbidityMatrix'
import { Grid3X3, AlertTriangle, TrendingUp } from 'lucide-react'

interface ComorbidityData {
  diagnosis1: string
  diagnosis2: string
  riskScore: number
  prevalence: number
  clinical_interactions?: string
}

export function ComorbidityMatrixEditor() {
  const {
    getPatientComorbidities,
    updateComorbidityMatrix,
    generateRiskReport,
    loading,
    error,
  } = useComorbidityMatrix()

  const [patientId, setPatientId] = useState('')
  const [comorbidities, setComorbidities] = useState<ComorbidityData[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [riskLevel, setRiskLevel] = useState<'low' | 'moderate' | 'high' | 'critical'>('low')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMatrix, setShowMatrix] = useState(false)

  const loadPatientComorbidities = async () => {
    if (!patientId.trim()) {
      alert('Ingresa un ID de paciente')
      return
    }

    setIsLoading(true)
    try {
      const data = await getPatientComorbidities(patientId)
      if (data) {
        setComorbidities(data.comorbidities || [])
        setRiskScore(data.risk_score || 0)
        setRiskLevel(data.risk_level || 'low')
        setClinicalNotes(data.clinical_notes || '')
        setShowMatrix(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveComorbidities = async () => {
    const success = await updateComorbidityMatrix(patientId, {
      risk_score: riskScore,
      risk_level: riskLevel,
      comorbidities: comorbidities,
      clinical_notes: clinicalNotes,
    })

    if (success) {
      alert('Matriz de comorbilidades guardada exitosamente')
    }
  }

  const handleGenerateReport = async () => {
    const report = await generateRiskReport(patientId, riskScore)
    if (report) {
      console.log('Risk Report:', report)
      alert('Reporte generado - Ver consola')
    }
  }

  const getRiskLevelColor = (level: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    }
    return colors[level] || colors.low
  }

  const getRiskLevelLabel = (level: string) => {
    const labels = {
      low: '✓ Bajo',
      moderate: '⚠ Moderado',
      high: '⚠️ Alto',
      critical: '🚨 Crítico',
    }
    return labels[level] || level
  }

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Matriz de Comorbilidades
          </CardTitle>
          <CardDescription>Visualiza y edita interacciones de diagnósticos</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="ID del Paciente"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') loadPatientComorbidities()
              }}
            />
            <Button onClick={loadPatientComorbidities} disabled={isLoading}>
              {isLoading ? 'Cargando...' : 'Cargar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showMatrix && (
        <>
          {/* Risk Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground mb-1">Puntuación Riesgo</p>
                <p className="text-3xl font-bold text-blue-600">{riskScore}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground mb-1">Diagnósticos</p>
                <p className="text-3xl font-bold">{comorbidities.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground mb-1">Nivel Riesgo</p>
                <Badge className={`mt-1 ${getRiskLevelColor(riskLevel)}`}>
                  {getRiskLevelLabel(riskLevel)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground mb-1">Interacciones</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.floor((comorbidities.length * (comorbidities.length - 1)) / 2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Level Adjustment */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Ajuste de Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="riskScore">Puntuación (0-100)</Label>
                  <Input
                    id="riskScore"
                    type="number"
                    min="0"
                    max="100"
                    value={riskScore}
                    onChange={(e) => setRiskScore(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskLevel">Nivel Riesgo</Label>
                  <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as any)}>
                    <SelectTrigger id="riskLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bajo</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comorbidities Table */}
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Interacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Diagnóstico 1</TableHead>
                      <TableHead>Diagnóstico 2</TableHead>
                      <TableHead>Puntuación Riesgo</TableHead>
                      <TableHead>Prevalencia</TableHead>
                      <TableHead>Interacciones Clínicas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comorbidities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Sin comorbilidades registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      comorbidities.map((comorb, idx) => {
                        const riskColor =
                          comorb.riskScore > 70
                            ? 'text-red-600'
                            : comorb.riskScore > 40
                              ? 'text-yellow-600'
                              : 'text-green-600'

                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">
                              {comorb.diagnosis1}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {comorb.diagnosis2}
                            </TableCell>
                            <TableCell className={riskColor}>
                              <span className="font-bold">{comorb.riskScore}</span>
                            </TableCell>
                            <TableCell>{(comorb.prevalence * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-sm max-w-xs truncate">
                              {comorb.clinical_interactions || 'No especificadas'}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Clínicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Notas sobre comorbilidades y consideraciones clínicas"
                rows={4}
                className="w-full p-2 border rounded-md"
              />

              <div className="flex gap-2">
                <Button onClick={handleSaveComorbidities} disabled={loading} className="flex-1">
                  Guardar Cambios
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  Generar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Risk Summary */}
          {riskScore > 60 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Alerta de Riesgo Elevado</h4>
                    <p className="text-sm text-orange-800 mt-1">
                      Las comorbilidades identificadas requieren monitoreo cercano. Considera
                      consultas especializadas o ajustes en el tratamiento.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
