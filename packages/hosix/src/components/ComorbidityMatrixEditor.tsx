import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useComorbidityMatrix } from '@/hooks/useComorbidityMatrix'
import { AlertTriangle, Activity } from 'lucide-react'

interface ComorbidityMatrixEditorProps {
  patientId: string
}

export function ComorbidityMatrixEditor({ patientId }: ComorbidityMatrixEditorProps) {
  const {
    matrix,
    loading,
    error,
    fetchPatientComorbidities,
    getRiskStratification,
    updateClinicalNotes,
  } = useComorbidityMatrix()

  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadMatrix()
  }, [patientId])

  const loadMatrix = async () => {
    const data = await fetchPatientComorbidities(patientId)
    if (data?.clinical_notes) {
      setNotes(data.clinical_notes)
    }
  }

  const handleSaveNotes = async () => {
    setIsSaving(true)
    const success = await updateClinicalNotes(patientId, notes)
    setIsSaving(false)

    if (success) {
      alert('Notas guardadas exitosamente')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando matriz de comorbilidades...</div>
  }

  if (!matrix) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No hay diagnósticos activos para este paciente
        </CardContent>
      </Card>
    )
  }

  const riskLevel = getRiskStratification(matrix.risk_score)
  const riskColor =
    riskLevel === 'Low Risk'
      ? 'bg-green-100 text-green-800'
      : riskLevel === 'Moderate Risk'
        ? 'bg-yellow-100 text-yellow-800'
        : riskLevel === 'High Risk'
          ? 'bg-orange-100 text-orange-800'
          : 'bg-red-100 text-red-800'

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diagnósticos Activos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matrix.comorbidity_count}</div>
            <p className="text-xs text-muted-foreground">Total de condiciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matrix.risk_score.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Escala 0-100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={riskColor}>{riskLevel}</Badge>
            <p className="text-xs text-muted-foreground mt-2">Estratificación</p>
          </CardContent>
        </Card>
      </div>

      {/* Diagnoses List */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnósticos</CardTitle>
          <CardDescription>Lista de comorbilidades activas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {matrix.comorbidity_list && matrix.comorbidity_list.length > 0 ? (
              matrix.comorbidity_list.map((icdCode, index) => (
                <div key={index} className="p-3 border rounded-lg flex items-center justify-between">
                  <span className="font-mono">{icdCode}</span>
                  <Badge variant="secondary">ICD-11</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin diagnósticos registrados</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clinical Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Clínicas</CardTitle>
          <CardDescription>Observaciones sobre la matriz de comorbilidades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registra observaciones clínicas relevantes..."
            className="w-full min-h-24 p-3 border rounded-lg"
          />
          <Button onClick={handleSaveNotes} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Notas'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
      )}
    </div>
  )
}
