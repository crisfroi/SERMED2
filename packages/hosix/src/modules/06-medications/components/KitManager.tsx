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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMedicationKit } from '@/hooks/useMedicationKit'
import { Plus, Trash2, Edit2, Package } from 'lucide-react'

interface KitFormData {
  name: string
  kitType: 'emergency' | 'routine' | 'surgery' | 'pediatric' | 'obstetric'
  description: string
  notes: string
  medications: string[]
}

export function KitManager() {
  const { kits, loading, error, createKit, updateKit, deleteKit, getMedicationsInKit } =
    useMedicationKit()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<KitFormData>({
    name: '',
    kitType: 'routine',
    description: '',
    notes: '',
    medications: [],
  })
  const [medicationInput, setMedicationInput] = useState('')
  const [selectedKitMeds, setSelectedKitMeds] = useState<any[]>([])

  const kitTypes = {
    emergency: { label: '🚨 Emergencia', color: 'bg-red-50 text-red-900 border-red-200' },
    routine: { label: '📋 Rutina', color: 'bg-blue-50 text-blue-900 border-blue-200' },
    surgery: { label: '🏥 Cirugía', color: 'bg-purple-50 text-purple-900 border-purple-200' },
    pediatric: { label: '👶 Pediátrica', color: 'bg-green-50 text-green-900 border-green-200' },
    obstetric: {
      label: '🤰 Obstétrica',
      color: 'bg-pink-50 text-pink-900 border-pink-200',
    },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.kitType) {
      alert('Completa los campos requeridos')
      return
    }

    if (editingId) {
      await updateKit(editingId, formData)
      setEditingId(null)
    } else {
      await createKit({
        name: formData.name,
        kit_type: formData.kitType,
        description: formData.description,
        notes: formData.notes,
        medications: formData.medications,
      })
    }

    setFormData({
      name: '',
      kitType: 'routine',
      description: '',
      notes: '',
      medications: [],
    })
    setShowForm(false)
  }

  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      setFormData({
        ...formData,
        medications: [...formData.medications, medicationInput],
      })
      setMedicationInput('')
    }
  }

  const handleRemoveMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    })
  }

  const handleEditKit = (kit: any) => {
    setFormData({
      name: kit.name,
      kitType: kit.kit_type,
      description: kit.description || '',
      notes: kit.notes || '',
      medications: [],
    })
    setEditingId(kit.id)
    setShowForm(true)
  }

  const handleViewMedications = async (kitId: string) => {
    const meds = await getMedicationsInKit(kitId)
    setSelectedKitMeds(meds || [])
  }

  const handleDeleteKit = async (kitId: string) => {
    if (window.confirm('¿Eliminar este kit?')) {
      await deleteKit(kitId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {showForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Kit' : 'Nuevo Kit de Medicamentos'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Kit *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Kit de Emergencia Cardiaca"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kitType">Tipo de Kit *</Label>
                  <Select value={formData.kitType} onValueChange={(value) => setFormData({ ...formData, kitType: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(kitTypes).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Breve descripción del kit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas especiales"
                  rows={2}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              {/* Medications */}
              <div className="space-y-2">
                <Label>Medicamentos</Label>
                <div className="flex gap-2">
                  <Input
                    value={medicationInput}
                    onChange={(e) => setMedicationInput(e.target.value)}
                    placeholder="Agregar medicamento"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddMedication()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddMedication}
                    variant="outline"
                  >
                    Agregar
                  </Button>
                </div>

                {formData.medications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.medications.map((med, idx) => (
                      <Badge key={idx} variant="secondary">
                        {med}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="ml-1 hover:text-destructive"
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Kit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Kits List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Kits de Medicamentos ({kits.length})</h3>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Kit
          </Button>
        </div>

        {kits.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              No hay kits creados
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kits.map((kit) => (
              <Card key={kit.id} className={`border-l-4 ${kitTypes[kit.kit_type || 'routine'].color}`}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold">{kit.name}</h4>
                        <Badge className="mt-1">
                          {kitTypes[kit.kit_type || 'routine'].label}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditKit(kit)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteKit(kit.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {kit.description && (
                      <p className="text-sm text-muted-foreground">{kit.description}</p>
                    )}

                    {kit.notes && <p className="text-xs italic text-muted-foreground">{kit.notes}</p>}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewMedications(kit.id)}
                    >
                      Ver Medicamentos ({kit.medication_count || 0})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Medications in Selected Kit */}
      {selectedKitMeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Medicamentos del Kit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Dosis</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedKitMeds.map((med, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{med.name}</TableCell>
                      <TableCell>{med.dosage}</TableCell>
                      <TableCell>{med.quantity}</TableCell>
                      <TableCell>{med.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
