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
import { useMedicationKit } from '@/hooks/useMedicationKit';
import { Plus, Copy, Trash2, Eye } from 'lucide-react'

interface KitFormData {
  name: string
  description: string
  kitType: 'emergency' | 'routine' | 'surgery' | 'specialty' | 'custom'
}

export function KitManager() {
  const { kits, loading, error, fetchKits, createKit, deactivateKit, cloneKit } =
    useMedicationKit()
  const [formData, setFormData] = useState<KitFormData>({
    name: '',
    description: '',
    kitType: 'routine',
  })
  const [selectedKit, setSelectedKit] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const kitTypeOptions = [
    { value: 'emergency', label: '🚨 Emergencia', color: 'bg-red-100 text-red-800' },
    { value: 'routine', label: '📋 Rutina', color: 'bg-blue-100 text-blue-800' },
    { value: 'surgery', label: '🔪 Cirugía', color: 'bg-purple-100 text-purple-800' },
    { value: 'specialty', label: '🏥 Especialidad', color: 'bg-green-100 text-green-800' },
    { value: 'custom', label: '⚙️ Personalizado', color: 'bg-gray-100 text-gray-800' },
  ]

  const getKitTypeBadge = (type: string) => {
    const option = kitTypeOptions.find((o) => o.value === type)
    return option
      ? { label: option.label, color: option.color }
      : { label: type, color: 'bg-gray-100' }
  }

  const handleCreateKit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description) {
      alert('Completa todos los campos')
      return
    }

    const success = await createKit({
      name: formData.name,
      description: formData.description,
      kit_type: formData.kitType,
      medications: [], // TODO: Add medications in separate step
    })

    if (success) {
      setFormData({
        name: '',
        description: '',
        kitType: 'routine',
      })
      setShowForm(false)
      await fetchKits()
    }
  }

  const handleCloneKit = async (kitId: string) => {
    const newName = prompt('Nombre del nuevo kit:')
    if (newName) {
      const success = await cloneKit(kitId, newName)
      if (success) {
        await fetchKits()
      }
    }
  }

  const selectedKitData = selectedKit ? kits.find((k) => k.id === selectedKit) : null

  return (
    <div className="space-y-6">
      <Tabs defaultValue="kits" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kits">Kits ({kits.length})</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
        </TabsList>

        {/* Kits List Tab */}
        <TabsContent value="kits">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kits de Medicamentos</CardTitle>
                <CardDescription>Gestiona kits predefinidos</CardDescription>
              </div>
              <Button onClick={() => setShowForm(!showForm)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Kit
              </Button>
            </CardHeader>

            {showForm && (
              <CardContent className="border-t pt-6">
                <form onSubmit={handleCreateKit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kitName">Nombre del Kit *</Label>
                      <Input
                        id="kitName"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Kit de Emergencia General"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kitType">Tipo de Kit *</Label>
                      <Select
                        value={formData.kitType}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            kitType: value as any,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {kitTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kitDescription">Descripción *</Label>
                    <textarea
                      id="kitDescription"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Describe los medicamentos y propósito de este kit"
                      className="w-full p-2 border rounded-md"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creando...' : 'Crear Kit'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}

            <CardContent className="space-y-3">
              {kits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay kits creados aún
                </p>
              ) : (
                kits.map((kit) => {
                  const badgeInfo = getKitTypeBadge(kit.kit_type)
                  return (
                    <div
                      key={kit.id}
                      className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => setSelectedKit(kit.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{kit.name}</h4>
                            <Badge className={badgeInfo.color}>{badgeInfo.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{kit.description}</p>
                          <div className="mt-2 text-sm">
                            <span className="font-medium">{kit.total_items_count}</span>
                            <span className="text-muted-foreground"> medicamentos</span>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedKit(kit.id)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCloneKit(kit.id)
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              deactivateKit(kit.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kit Details Tab */}
        <TabsContent value="details">
          {selectedKitData ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedKitData.name}</CardTitle>
                <CardDescription>{selectedKitData.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Tipo de Kit</div>
                      <div className="text-lg font-semibold">
                        {getKitTypeBadge(selectedKitData.kit_type).label}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total de Items</div>
                      <div className="text-lg font-semibold">
                        {selectedKitData.total_items_count}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Medicamentos</div>
                      <div className="text-lg font-semibold">{selectedKitData.medications.length}</div>
                    </div>
                  </div>

                  {selectedKitData.medications.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Medicamentos en el Kit</h4>
                      <div className="space-y-2">
                        {selectedKitData.medications.map((med) => (
                          <div
                            key={med.id}
                            className="p-3 border rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium">{med.medication?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {med.medication?.generic_name} - {med.medication?.strength}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{med.quantity_per_kit}</div>
                              <div className="text-sm text-muted-foreground">{med.unit}</div>
                              {med.is_critical && (
                                <Badge variant="destructive" className="mt-1">
                                  Crítico
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedKitData.medications.length === 0 && (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                      Este kit aún no tiene medicamentos asignados
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Selecciona un kit para ver los detalles
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
      )}
    </div>
  )
}
