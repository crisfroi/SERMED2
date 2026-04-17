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
import { useMedicationRegimen } from '@hosix/hooks/06-medications/useMedicationRegimen'
import { Plus, Check, X, Edit2 } from 'lucide-react'

interface RegimenFormData {
  medicationId: string
  dosageValue: number
  dosageUnit: string
  frequency: string
  route: string
  durationDays: number
  indication: string
  specialInstructions: string
}

export function RegimensBuilder() {
  const { regimens, loading, error, createRegimen, stopRegimen } = useMedicationRegimen()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<RegimenFormData>({
    medicationId: '',
    dosageValue: 0,
    dosageUnit: 'mg',
    frequency: 'OD',
    route: 'oral',
    durationDays: 30,
    indication: '',
    specialInstructions: '',
  })

  const frequencyOptions = [
    { value: 'OD', label: 'Una vez al día' },
    { value: 'BID', label: 'Dos veces al día' },
    { value: 'TID', label: 'Tres veces al día' },
    { value: 'QID', label: 'Cuatro veces al día' },
    { value: 'HS', label: 'Al acostarse' },
    { value: 'AC', label: 'Antes de comidas' },
    { value: 'PC', label: 'Después de comidas' },
    { value: 'SOS', label: 'Según sea necesario' },
  ]

  const routeOptions = [
    { value: 'oral', label: 'Oral' },
    { value: 'IV', label: 'Intravenosa' },
    { value: 'IM', label: 'Intramuscular' },
    { value: 'SC', label: 'Subcutánea' },
    { value: 'topical', label: 'Tópica' },
    { value: 'inhalation', label: 'Inhalación' },
    { value: 'suppository', label: 'Supositorio' },
  ]

  const dosageUnits = ['mg', 'g', 'mcg', 'IU', 'mL', '%', 'tsp', 'tbsp']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.medicationId || formData.dosageValue <= 0 || !formData.indication) {
      alert('Completa todos los campos requeridos')
      return
    }

    const success = await createRegimen({
      patient_id: 'TODO', // From parent component
      medication_id: formData.medicationId,
      dosage_value: formData.dosageValue,
      dosage_unit: formData.dosageUnit,
      frequency: formData.frequency as any,
      route: formData.route as any,
      indication: formData.indication,
      duration_days: formData.durationDays,
      special_instructions: formData.specialInstructions || undefined,
    })

    if (success) {
      setFormData({
        medicationId: '',
        dosageValue: 0,
        dosageUnit: 'mg',
        frequency: 'OD',
        route: 'oral',
        durationDays: 30,
        indication: '',
        specialInstructions: '',
      })
    }
  }

  const getFrequencyLabel = (freq: string) => {
    return frequencyOptions.find((o) => o.value === freq)?.label || freq
  }

  const getRouteLabel = (route: string) => {
    return routeOptions.find((o) => o.value === route)?.label || route
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">Crear Régimen</TabsTrigger>
          <TabsTrigger value="active">Regímenes Activos ({regimens.length})</TabsTrigger>
        </TabsList>

        {/* Create Tab */}
        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle>Nuevo Régimen de Medicamento</CardTitle>
              <CardDescription>Configura la prescripción del paciente</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Medication & Dosage */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medication">Medicamento *</Label>
                    <Input
                      id="medication"
                      value={formData.medicationId}
                      onChange={(e) => setFormData({ ...formData, medicationId: e.target.value })}
                      placeholder="ID del medicamento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosis *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="dosage"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formData.dosageValue}
                        onChange={(e) =>
                          setFormData({ ...formData, dosageValue: parseFloat(e.target.value) })
                        }
                        placeholder="Cantidad"
                        className="flex-1"
                      />
                      <Select value={formData.dosageUnit} onValueChange={(value) => setFormData({ ...formData, dosageUnit: value })}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dosageUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frecuencia *</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Route & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="route">Vía de Administración *</Label>
                    <Select value={formData.route} onValueChange={(value) => setFormData({ ...formData, route: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {routeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (días) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.durationDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationDays: parseInt(e.target.value) || 30,
                        })
                      }
                      placeholder="Días de tratamiento"
                    />
                  </div>
                </div>

                {/* Indication & Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="indication">Indicación Clínica *</Label>
                  <textarea
                    id="indication"
                    value={formData.indication}
                    onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                    placeholder="Diagnóstico o razón de la prescripción"
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instrucciones Especiales</Label>
                  <textarea
                    id="instructions"
                    value={formData.specialInstructions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialInstructions: e.target.value,
                      })
                    }
                    placeholder="Condiciones especiales, contraindicaciones, etc."
                    className="w-full p-2 border rounded-md"
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Guardando...' : 'Crear Régimen'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Regimens Tab */}
        <TabsContent value="active">
          <div className="space-y-4">
            {regimens.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No hay regímenes activos
                </CardContent>
              </Card>
            ) : (
              regimens.map((regimen) => (
                <Card key={regimen.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{regimen.medication_id}</h4>
                          <Badge>{regimen.is_active ? 'Activo' : 'Inactivo'}</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Dosis:</span>
                            <p className="font-medium">
                              {regimen.dosage_value} {regimen.dosage_unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Frecuencia:</span>
                            <p className="font-medium">{regimen.frequency_description}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Vía:</span>
                            <p className="font-medium text-capitalize">{regimen.route}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duración:</span>
                            <p className="font-medium">
                              {Math.ceil(
                                (new Date(regimen.end_date || '').getTime() -
                                  new Date(regimen.start_date).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}{' '}
                              días
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-muted-foreground">Indicación:</span>
                          <p className="text-sm">{regimen.indication}</p>
                        </div>

                        {regimen.special_instructions && (
                          <div>
                            <span className="text-sm text-muted-foreground">
                              Instrucciones:
                            </span>
                            <p className="text-sm">{regimen.special_instructions}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(regimen.id)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {regimen.is_active && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => stopRegimen(regimen.id, 'User stopped regimen')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}
