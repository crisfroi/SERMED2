import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useICDSystemSwitch } from '@hosix/hooks/08-diagnoses/useICDSystemSwitch'
import { ArrowRight, AlertCircle } from 'lucide-react'

interface ICDSystemSelectorProps {
  onSystemChange?: (system: 'ICD-9' | 'ICD-10' | 'ICD-11') => void
}

export function ICDSystemSelector({ onSystemChange }: ICDSystemSelectorProps) {
  const {
    currentSystem,
    getAvailableSystems,
    switchSystem,
    convertPatientDiagnoses,
  } = useICDSystemSwitch()

  const [targetSystem, setTargetSystem] = useState<'ICD-9' | 'ICD-10' | 'ICD-11'>('ICD-11')
  const [isConverting, setIsConverting] = useState(false)
  const [conversionResult, setConversionResult] = useState<number | null>(null)

  const availableSystems = getAvailableSystems()

  const systemInfo: Record<string, { description: string; year: number; codes: number }> = {
    'ICD-9': {
      description: 'International Classification of Diseases, 9th Revision',
      year: 1978,
      codes: 14400,
    },
    'ICD-10': {
      description: 'International Classification of Diseases, 10th Revision',
      year: 1994,
      codes: 70000,
    },
    'ICD-11': {
      description: 'International Classification of Diseases, 11th Revision',
      year: 2019,
      codes: 55000,
    },
  }

  const handleSystemSwitch = (system: 'ICD-9' | 'ICD-10' | 'ICD-11') => {
    switchSystem(system)
    onSystemChange?.(system)
  }

  const handleConvert = async (patientId: string) => {
    setIsConverting(true)
    try {
      const result = await convertPatientDiagnoses(patientId, currentSystem, targetSystem)
      setConversionResult(result)
    } finally {
      setIsConverting(false)
    }
  }

  const getSystemColor = (system: 'ICD-9' | 'ICD-10' | 'ICD-11') => {
    const colors = {
      'ICD-9': 'bg-purple-100 text-purple-800',
      'ICD-10': 'bg-blue-100 text-blue-800',
      'ICD-11': 'bg-green-100 text-green-800',
    }
    return colors[system]
  }

  return (
    <div className="space-y-6">
      {/* Current System Info */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sistema ICD Actual</CardTitle>
              <CardDescription>Sistema de clasificación en uso</CardDescription>
            </div>
            <Badge className={getSystemColor(currentSystem)} variant="outline">
              {currentSystem}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold">{currentSystem}</h4>
              <p className="text-sm text-muted-foreground">
                {systemInfo[currentSystem]?.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Año de Publicación:</span>
                <p className="font-medium">{systemInfo[currentSystem]?.year}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Aproxim. de Códigos:</span>
                <p className="font-medium">{systemInfo[currentSystem]?.codes.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Systems */}
      <div className="space-y-4">
        <h3 className="font-semibold">Sistemas Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableSystems.map((system) => (
            <Card
              key={system}
              className={`cursor-pointer transition-colors ${
                currentSystem === system ? 'border-2 border-primary' : 'hover:border-primary'
              }`}
              onClick={() => handleSystemSwitch(system)}
            >
              <CardContent className="pt-6 text-center">
                <Badge className={getSystemColor(system)} variant="outline">
                  {system}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {systemInfo[system]?.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {systemInfo[system]?.year}
                </p>
                {currentSystem === system && (
                  <Button size="sm" className="mt-3 w-full" disabled>
                    Actual
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Conversion Section */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Convertir Diagnósticos
          </CardTitle>
          <CardDescription>Migrar diagnósticos de un sistema a otro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sistema Destino</label>
            <Select value={targetSystem} onValueChange={(value) => setTargetSystem(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSystems
                  .filter((s) => s !== currentSystem)
                  .map((system) => (
                    <SelectItem key={system} value={system}>
                      {system}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Badge className={getSystemColor(currentSystem)} variant="outline">
              {currentSystem}
            </Badge>
            <ArrowRight className="w-4 h-4" />
            <Badge className={getSystemColor(targetSystem)} variant="outline">
              {targetSystem}
            </Badge>
          </div>

          {conversionResult !== null && (
            <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm">
              ✅ {conversionResult} diagnósticos convertidos exitosamente
            </div>
          )}

          <Button
            onClick={() => handleConvert('patient-id-here')}
            disabled={isConverting || currentSystem === targetSystem}
            className="w-full"
          >
            {isConverting ? 'Convirtiendo...' : 'Convertir Diagnósticos'}
          </Button>
        </CardContent>
      </Card>

      {/* System Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación de Sistemas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableSystems.map((system) => (
              <div key={system} className="border-b last:border-0 pb-4 last:pb-0">
                <h4 className="font-semibold mb-2">{system}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {systemInfo[system]?.description}
                </p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Año:</span>
                    <p className="font-medium">{systemInfo[system]?.year}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Códigos:</span>
                    <p className="font-medium">{systemInfo[system]?.codes.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
