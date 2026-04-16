import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDiagnosisExpanding } from '@/hooks/useDiagnosisExpanding'
import { Plus, Zap, BookOpen } from 'lucide-react'

interface ExpandedDiagnosisFormProps {
  patientId: string
  onDiagnosisAdded?: () => void
}

export function ExpandedDiagnosisForm({
  patientId,
  onDiagnosisAdded,
}: ExpandedDiagnosisFormProps) {
  const {
    expansions,
    loading,
    error,
    getExpansionForDiagnosis,
    expandPatientDiagnoses,
    getDifferentialDiagnosis,
  } = useDiagnosisExpanding()

  const [icdCode, setIcdCode] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('moderate')
  const [symptoms, setSymptoms] = useState<string[]>([''])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [expandCount, setExpandCount] = useState<number | null>(null)

  // Load differential diagnosis based on symptoms
  const handleGetDifferentialDiagnosis = async () => {
    const filledSymptoms = symptoms.filter((s) => s.trim())
    if (filledSymptoms.length === 0) {
      alert('Ingresa al menos un síntoma')
      return
    }

    const results = await getDifferentialDiagnosis(filledSymptoms)
    setSuggestions(results)
  }

  // Handle automatic expansion
  const handleAutoExpand = async () => {
    const count = await expandPatientDiagnoses(patientId)
    setExpandCount(count)
    if (count > 0) {
      onDiagnosisAdded?.()
    }
  }

  // Search for expansions
  const handleSearchExpansion = async () => {
    if (!icdCode) {
      alert('Ingresa un código ICD')
      return
    }

    const expansion = await getExpansionForDiagnosis(icdCode, description)
    if (expansion) {
      setSuggestions([expansion])
    }
  }

  return (
    <Tabs defaultValue="add" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="add">Agregar Diagnóstico</TabsTrigger>
        <TabsTrigger value="expand">Expansión Automática</TabsTrigger>
        <TabsTrigger value="differential">Diagnóstico Diferencial</TabsTrigger>
      </TabsList>

      {/* Add Diagnosis Tab */}
      <TabsContent value="add">
        <Card>
          <CardHeader>
            <CardTitle>Agregar Diagnóstico</CardTitle>
            <CardDescription>Registra un nuevo diagnóstico con búsqueda de expansiones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icdCode">Código ICD</Label>
                <Input
                  id="icdCode"
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value.toUpperCase())}
                  placeholder="Ej: E11 (ICD-10) o BA00 (ICD-11)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severidad</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Leve</SelectItem>
                    <SelectItem value="moderate">Moderada</SelectItem>
                    <SelectItem value="severe">Severa</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el diagnóstico..."
                className="w-full min-h-20 p-2 border rounded-lg"
              />
            </div>

            <Button onClick={handleSearchExpansion} disabled={loading} className="w-full">
              <BookOpen className="w-4 h-4 mr-2" />
              {loading ? 'Buscando...' : 'Buscar Expansiones'}
            </Button>
          </CardContent>
        </Card>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Diagnósticos Relacionados</CardTitle>
              <CardDescription>Expansiones sugeridas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">{suggestion.code}</span>
                    <Badge variant="secondary">{suggestion.system}</Badge>
                  </div>
                  <p className="text-sm">{suggestion.description}</p>

                  {suggestion.expanded_codes && suggestion.expanded_codes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">Código relacionados:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.expanded_codes.slice(0, 5).map((code: string) => (
                          <Badge key={code} variant="outline">
                            {code}
                          </Badge>
                        ))}
                        {suggestion.expanded_codes.length > 5 && (
                          <Badge variant="outline">
                            +{suggestion.expanded_codes.length - 5} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button size="sm" className="w-full mt-2">
                    <Plus className="w-3 h-3 mr-2" />
                    Agregar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Automatic Expansion Tab */}
      <TabsContent value="expand">
        <Card>
          <CardHeader>
            <CardTitle>Expansión Automática</CardTitle>
            <CardDescription>
              Expande automáticamente todos los diagnósticos primarios del paciente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
              <p className="font-medium mb-2">¿Qué hace esto?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Busca todos los diagnósticos primarios activos</li>
                <li>Añade diagnósticos secundarios relacionados automáticamente</li>
                <li>Helps identify hidden comorbidities</li>
              </ul>
            </div>

            <Button onClick={handleAutoExpand} disabled={loading} size="lg" className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              {loading ? 'Expandiendo...' : 'Expandir Todos los Diagnósticos'}
            </Button>

            {expandCount !== null && (
              <div className="p-4 bg-green-50 text-green-800 rounded-lg">
                <p className="font-medium">✅ Expansión Completada</p>
                <p className="text-sm mt-1">{expandCount} diagnósticos secundarios añadidos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Differential Diagnosis Tab */}
      <TabsContent value="differential">
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico Diferencial</CardTitle>
            <CardDescription>Sugiere diagnósticos basados en síntomas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Síntomas del Paciente</Label>
              <div className="space-y-2">
                {symptoms.map((symptom, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={symptom}
                      onChange={(e) => {
                        const newSymptoms = [...symptoms]
                        newSymptoms[idx] = e.target.value
                        setSymptoms(newSymptoms)
                      }}
                      placeholder={`Síntoma ${idx + 1}...`}
                    />
                    {symptoms.length > 1 && (
                      <Button
                        variant="ghost"
                        onClick={() => setSymptoms(symptoms.filter((_, i) => i !== idx))}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setSymptoms([...symptoms, ''])}
                className="w-full"
              >
                + Agregar Síntoma
              </Button>
            </div>

            <Button onClick={handleGetDifferentialDiagnosis} disabled={loading} className="w-full">
              {loading ? 'Analizando...' : 'Generar Diagnósticos Sugeridos'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {suggestions.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold">Diagnósticos Sugeridos</h3>
            {suggestions.map((suggestion, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold">{suggestion.code}</span>
                      <Badge>{suggestion.severity || 'standard'}</Badge>
                    </div>
                    <p className="text-sm">{suggestion.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Confianza: {suggestion.confidence || 'N/A'}%
                    </p>
                    <Button size="sm" className="w-full mt-2">
                      Seleccionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
      )}
    </Tabs>
  )
}
