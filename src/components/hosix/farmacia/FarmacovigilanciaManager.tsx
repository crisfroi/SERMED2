// @ts-nocheck
import React, { useState } from 'react'
import { useHosixFarmacia } from '@/hooks/useHosixFarmacia'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  AlertTriangle, 
  Plus, 
  Eye,
  Shield,
  Activity,
  FileWarning,
  Calendar,
  User,
  Pill
} from 'lucide-react'
import { toast } from 'sonner'

export const FarmacovigilanciaManager: React.FC = () => {
  const { farmacovigilancia = [], reportarEvento, farmacovigilanciaLoading } = useHosixFarmacia()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroGravedad, setFiltroGravedad] = useState<string>('todos')
  const [isOpen, setIsOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any>(null)
  const [formData, setFormData] = useState({
    paciente_nombre: '',
    medicamento_sospechoso: '',
    tipo_reaccion: 'ram',
    gravedad: 'leve',
    descripcion_evento: '',
    fecha_inicio: '',
    fecha_fin: '',
    tratamiento_requerido: '',
    desenlace: 'en_recuperacion',
    causalidad: 'posible',
    reportante_nombre: '',
    reportante_cargo: ''
  })

  const filtered = farmacovigilancia.filter(e => {
    const matchSearch = searchTerm === '' || 
      e.medicamento_sospechoso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.paciente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.descripcion_evento?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchGravedad = filtroGravedad === 'todos' || e.gravedad === filtroGravedad
    return matchSearch && matchGravedad
  })

  const stats = {
    total: farmacovigilancia.length,
    graves: farmacovigilancia.filter(e => e.gravedad === 'grave' || e.gravedad === 'mortal').length,
    moderados: farmacovigilancia.filter(e => e.gravedad === 'moderada').length,
    leves: farmacovigilancia.filter(e => e.gravedad === 'leve').length,
    esteMes: farmacovigilancia.filter(e => {
      const fecha = new Date(e.fecha_evento)
      const ahora = new Date()
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
    }).length
  }

  const handleSubmit = () => {
    if (!formData.paciente_nombre || !formData.medicamento_sospechoso || !formData.descripcion_evento) {
      toast.error('Complete los campos requeridos: paciente, medicamento y descripción')
      return
    }

    reportarEvento({
      paciente_nombre: formData.paciente_nombre,
      medicamento_sospechoso: formData.medicamento_sospechoso,
      tipo_reaccion: formData.tipo_reaccion,
      gravedad: formData.gravedad,
      descripcion_evento: formData.descripcion_evento,
      fecha_evento: new Date().toISOString(),
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      tratamiento_requerido: formData.tratamiento_requerido || null,
      desenlace: formData.desenlace,
      causalidad: formData.causalidad,
      reportante_nombre: formData.reportante_nombre || null,
      reportante_cargo: formData.reportante_cargo || null,
      estado: 'pendiente'
    })

    setIsOpen(false)
    setFormData({
      paciente_nombre: '',
      medicamento_sospechoso: '',
      tipo_reaccion: 'ram',
      gravedad: 'leve',
      descripcion_evento: '',
      fecha_inicio: '',
      fecha_fin: '',
      tratamiento_requerido: '',
      desenlace: 'en_recuperacion',
      causalidad: 'posible',
      reportante_nombre: '',
      reportante_cargo: ''
    })
  }

  const handleVerDetalle = (evento: any) => {
    setEventoSeleccionado(evento)
    setIsDetailOpen(true)
  }

  const getGravedadBadge = (gravedad: string) => {
    const variants: Record<string, string> = {
      'leve': 'bg-green-100 text-green-800',
      'moderada': 'bg-yellow-100 text-yellow-800',
      'grave': 'bg-orange-100 text-orange-800',
      'mortal': 'bg-red-100 text-red-800'
    }
    return variants[gravedad] || 'bg-gray-100 text-gray-800'
  }

  const getTipoReaccionLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'ram': 'Reacción Adversa',
      'error_medicacion': 'Error de Medicación',
      'fallo_terapeutico': 'Fallo Terapéutico',
      'interaccion': 'Interacción',
      'otro': 'Otro'
    }
    return labels[tipo] || tipo
  }

  const getDesenlaceLabel = (desenlace: string) => {
    const labels: Record<string, string> = {
      'recuperado': 'Recuperado',
      'en_recuperacion': 'En Recuperación',
      'no_recuperado': 'No Recuperado',
      'secuelas': 'Con Secuelas',
      'muerte': 'Muerte',
      'desconocido': 'Desconocido'
    }
    return labels[desenlace] || desenlace
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Total Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Graves/Mortales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.graves}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-orange-500" />
              Moderados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.moderados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              Leves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.leves}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.esteMes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de eventos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Registro de Farmacovigilancia
              </CardTitle>
              <CardDescription>
                Reporte y seguimiento de reacciones adversas a medicamentos (RAM) y eventos adversos
              </CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Reportar Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Nuevo Reporte de Farmacovigilancia
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Información del paciente */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paciente">Nombre del Paciente *</Label>
                      <Input
                        id="paciente"
                        placeholder="Nombre completo del paciente"
                        value={formData.paciente_nombre}
                        onChange={(e) => setFormData({ ...formData, paciente_nombre: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="medicamento">Medicamento Sospechoso *</Label>
                      <Input
                        id="medicamento"
                        placeholder="Nombre del medicamento"
                        value={formData.medicamento_sospechoso}
                        onChange={(e) => setFormData({ ...formData, medicamento_sospechoso: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Reacción</Label>
                      <Select 
                        value={formData.tipo_reaccion} 
                        onValueChange={(v) => setFormData({ ...formData, tipo_reaccion: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ram">Reacción Adversa a Medicamento</SelectItem>
                          <SelectItem value="error_medicacion">Error de Medicación</SelectItem>
                          <SelectItem value="fallo_terapeutico">Fallo Terapéutico</SelectItem>
                          <SelectItem value="interaccion">Interacción Medicamentosa</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Gravedad</Label>
                      <Select 
                        value={formData.gravedad} 
                        onValueChange={(v) => setFormData({ ...formData, gravedad: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leve">Leve</SelectItem>
                          <SelectItem value="moderada">Moderada</SelectItem>
                          <SelectItem value="grave">Grave</SelectItem>
                          <SelectItem value="mortal">Mortal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción del Evento *</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Describa detalladamente el evento adverso..."
                      value={formData.descripcion_evento}
                      onChange={(e) => setFormData({ ...formData, descripcion_evento: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fecha_inicio">Fecha Inicio Síntomas</Label>
                      <Input
                        id="fecha_inicio"
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fecha_fin">Fecha Fin Síntomas</Label>
                      <Input
                        id="fecha_fin"
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tratamiento">Tratamiento Requerido</Label>
                    <Textarea
                      id="tratamiento"
                      placeholder="Tratamiento administrado para el evento adverso..."
                      value={formData.tratamiento_requerido}
                      onChange={(e) => setFormData({ ...formData, tratamiento_requerido: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Desenlace</Label>
                      <Select 
                        value={formData.desenlace} 
                        onValueChange={(v) => setFormData({ ...formData, desenlace: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recuperado">Recuperado</SelectItem>
                          <SelectItem value="en_recuperacion">En Recuperación</SelectItem>
                          <SelectItem value="no_recuperado">No Recuperado</SelectItem>
                          <SelectItem value="secuelas">Con Secuelas</SelectItem>
                          <SelectItem value="muerte">Muerte</SelectItem>
                          <SelectItem value="desconocido">Desconocido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Causalidad</Label>
                      <Select 
                        value={formData.causalidad} 
                        onValueChange={(v) => setFormData({ ...formData, causalidad: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="definitiva">Definitiva</SelectItem>
                          <SelectItem value="probable">Probable</SelectItem>
                          <SelectItem value="posible">Posible</SelectItem>
                          <SelectItem value="improbable">Improbable</SelectItem>
                          <SelectItem value="no_clasificable">No Clasificable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reportante_nombre">Nombre del Reportante</Label>
                      <Input
                        id="reportante_nombre"
                        placeholder="Quien reporta el evento"
                        value={formData.reportante_nombre}
                        onChange={(e) => setFormData({ ...formData, reportante_nombre: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reportante_cargo">Cargo</Label>
                      <Input
                        id="reportante_cargo"
                        placeholder="Cargo del reportante"
                        value={formData.reportante_cargo}
                        onChange={(e) => setFormData({ ...formData, reportante_cargo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Reportar Evento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar por paciente, medicamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filtroGravedad} onValueChange={setFiltroGravedad}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Gravedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="moderada">Moderada</SelectItem>
                <SelectItem value="grave">Grave</SelectItem>
                <SelectItem value="mortal">Mortal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {farmacovigilanciaLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando eventos...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay eventos de farmacovigilancia registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Gravedad</TableHead>
                  <TableHead>Desenlace</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {e.fecha_evento ? new Date(e.fecha_evento).toLocaleDateString('es-ES') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{e.paciente_nombre || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Pill className="w-3 h-3" />
                        {e.medicamento_sospechoso}
                      </div>
                    </TableCell>
                    <TableCell>{getTipoReaccionLabel(e.tipo_reaccion)}</TableCell>
                    <TableCell>
                      <Badge className={getGravedadBadge(e.gravedad)}>
                        {e.gravedad?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{getDesenlaceLabel(e.desenlace)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleVerDetalle(e)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ver detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Detalle del Evento de Farmacovigilancia
            </DialogTitle>
          </DialogHeader>

          {eventoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <span className="font-semibold">Paciente</span>
                    </div>
                    <p>{eventoSeleccionado.paciente_nombre}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4" />
                      <span className="font-semibold">Medicamento</span>
                    </div>
                    <p>{eventoSeleccionado.medicamento_sospechoso}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex gap-4">
                    <div>
                      <span className="font-semibold">Tipo:</span>{' '}
                      {getTipoReaccionLabel(eventoSeleccionado.tipo_reaccion)}
                    </div>
                    <Badge className={getGravedadBadge(eventoSeleccionado.gravedad)}>
                      {eventoSeleccionado.gravedad?.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="font-semibold">Descripción:</span>
                    <p className="mt-1">{eventoSeleccionado.descripcion_evento}</p>
                  </div>

                  {eventoSeleccionado.tratamiento_requerido && (
                    <div>
                      <span className="font-semibold">Tratamiento:</span>
                      <p className="mt-1">{eventoSeleccionado.tratamiento_requerido}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div>
                      <span className="font-semibold">Desenlace:</span>{' '}
                      {getDesenlaceLabel(eventoSeleccionado.desenlace)}
                    </div>
                    <div>
                      <span className="font-semibold">Causalidad:</span>{' '}
                      {eventoSeleccionado.causalidad}
                    </div>
                  </div>

                  {eventoSeleccionado.reportante_nombre && (
                    <div className="text-sm text-muted-foreground">
                      Reportado por: {eventoSeleccionado.reportante_nombre}
                      {eventoSeleccionado.reportante_cargo && ` (${eventoSeleccionado.reportante_cargo})`}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FarmacovigilanciaManager
