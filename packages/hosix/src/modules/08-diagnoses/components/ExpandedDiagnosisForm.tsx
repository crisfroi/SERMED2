import React, { useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDiagnosisExpanding } from '@hosix/hooks/08-diagnoses/useDiagnosisExpanding'
import { Plus, Lightbulb, Search, Expand } from 'lucide-react'

interface DiagnosisEntry {
  icdCode: string
  description: string
  expanded: boolean
  differentials?: string[]
}

export function ExpandedDiagnosisForm() {
  const {
    searchICDCodes,
    expandDiagnosis,
    generateDifferentials,
    loading,
    error,
  } = useDiagnosisExpanding()

  const [searchQuery, setSearchQuery] = useState('')
  const [diagnoses, setDiagnoses] = useState<DiagnosisEntry[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisEntry | null>(null)
  const [showDifferentials, setShowDifferentials] = useState(false)
  const [differentials, setDifferentials] = useState<string[]>([])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const results = await searchICDCodes(query)
    setSearchResults(results || [])
  }

  const handleAddDiagnosis = (icdCode: string, description: string) => {
    const newDiagnosis: DiagnosisEntry = {
      icdCode,
      description,
      expanded: false,
    }

    setDiagnoses([...diagnoses, newDiagnosis])
    setSearchQuery('')
    setSearchResults([])
  }

  const handleExpandDiagnosis = async (diagnosis: DiagnosisEntry, index: number) => {
    if (!diagnosis.expanded) {
      const expandedData = await expandDiagnosis(diagnosis.icdCode)

      if (expandedData) {
        const updatedDiagnoses = [...diagnoses]
        updatedDiagnoses[index] = {
          ...diagnosis,
          expanded: true,
          differentials: expandedData.relatedCodes || [],
        }
        setDiagnoses(updatedDiagnoses)
      }
    }
  }

  const handleGenerateDifferentials = async (diagnosis: DiagnosisEntry) => {
    const diffs = await generateDifferentials(diagnosis.icdCode, diagnosis.description)
    setDifferentials(diffs || [])
    setSelectedDiagnosis(diagnosis)
    setShowDifferentials(true)
  }

  const handleRemoveDiagnosis = (index: number) => {
    const updatedDiagnoses = diagnoses.filter((_, i) => i !== index)
    setDiagnoses(updatedDiagnoses)
  }

  const handleAutoExpandAll = async () => {
    const expandedDiagnoses = await Promise.all(
      diagnoses.map(async (diagnosis, index) => {
        if (!diagnosis.expanded) {
          const expandedData = await expandDiagnosis(diagnosis.icdCode)
          return {
            ...diagnosis,
            expanded: true,
            differentials: expandedData?.relatedCodes || [],
          }
        }
        return diagnosis
      })
    )

    setDiagnoses(expandedDiagnoses)
  }

  return (
    <div className="space-y-6">
      {/* ICD Code Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Búsqueda de Código ICD
          </CardTitle>
          <CardDescription>Busca diagnósticos por código o descripción</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="icdSearch">Buscar Diagnóstico</Label>
            <Input
              id="icdSearch"
              placeholder="Ej: E11, Diabetes, Hypertension..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
            />
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddDiagnosis(result.code, result.description)}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  <span className="font-mono font-semibold">{result.code}</span>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                </button>
              ))}
            </div>
          )}

          {loading && <p className="text-sm text-muted-foreground">Buscando...</p>}
        </CardContent>
      </Card>

      {/* Selected Diagnoses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Diagnósticos Agregados</CardTitle>
              <CardDescription>{diagnoses.length} diagnósticos seleccionados</CardDescription>
            </div>
            <Button
              onClick={handleAutoExpandAll}
              disabled={diagnoses.length === 0}
              size="sm"
              variant="outline"
            >
              <Expand className="w-4 h-4 mr-2" />
              Expandir Todo
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {diagnoses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay diagnósticos agregados. Busca uno arriba.
            </p>
          ) : (
            <div className="space-y-3">
              {diagnoses.map((diagnosis, index) => (
                <Card key={index} className="border">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono">
                              {diagnosis.icdCode}
                            </Badge>
                            {diagnosis.expanded && (
                              <Badge className="bg-green-100 text-green-800">Expandida</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm">{diagnosis.description}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveDiagnosis(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ✕
                        </button>
                      </div>

                      {diagnosis.differentials && diagnosis.differentials.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Diagnósticos Relacionados:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {diagnosis.differentials.map((diff, dIdx) => (
                              <Badge key={dIdx} variant="outline" className="text-xs">
                                {diff}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExpandDiagnosis(diagnosis, index)}
                          disabled={diagnosis.expanded}
                        >
                          <Expand className="w-3 h-3 mr-1" />
                          {diagnosis.expanded ? 'Expandida' : 'Expandir'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateDifferentials(diagnosis)}
                        >
                          <Lightbulb className="w-3 h-3 mr-1" />
                          Diferenciales
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Differential Diagnoses Modal/Card */}
      {showDifferentials && selectedDiagnosis && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Lightbulb className="w-5 h-5" />
              Diagnósticos Diferenciales
            </CardTitle>
            <CardDescription className="text-blue-800">
              Para: <span className="font-semibold">{selectedDiagnosis.icdCode}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-blue-900">{selectedDiagnosis.description}</p>

            <ScrollArea className="h-48 w-full border rounded-lg p-4">
              <div className="space-y-2">
                {differentials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin diagnósticos diferenciales disponibles
                  </p>
                ) : (
                  differentials.map((diff, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 font-semibold">•</span>
                      <span>{diff}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDifferentials(false)}
              className="w-full"
            >
              Cerrar
            </Button>
          </CardContent>
        </Card>
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
