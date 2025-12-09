import React, { useState } from 'react'
import { useHosixInterconsultas } from '@/hooks/useHosixInterconsultas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageSquare, Clock, CheckCircle, AlertCircle, FileText, User } from 'lucide-react'
import { toast } from 'sonner'

export const RespuestasManager: React.FC = () => {
  const { solicitudes = [], respuestas = [], crearRespuesta, solicitudesLoading } = useHosixInterconsultas()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('pendientes')
  const [isOpen, setIsOpen] = useState(false)
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null)
  const [formData, setFormData] = useState({
    hallazgos_clinicos: '',
    interpretacion_diagnostica: '',
    recomendaciones: '',
    plan_manejo: '',
    medicamentos_recomendados: '',
    procedimientos_recomendados: '',
    requiere_seguimiento: false,
    fecha_proximo_control: ''
  })

  const solicitudesPendientes = solicitudes.filter(s => 
    s.estado_solicitud === 'pendiente' || s.estado_solicitud === 'en_evaluacion'
  )
  const solicitudesRespondidas = solicitudes.filter(s => s.estado_solicitud === 'respondida')

  const solicitudesFiltradas = filtroEstado === 'pendientes' 
    ? solicitudesPendientes 
    : solicitudesRespondidas

  const filtered = solicitudesFiltradas.filter(s => {
    const matchSearch = searchTerm === '' || 
      s.numero_solicitud?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.especialidad_solicitada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.motivo_solicitud?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const handleResponder = (solicitud: any) => {
    setSolicitudSeleccionada(solicitud)
    setFormData({
      hallazgos_clinicos: '',
      interpretacion_diagnostica: '',
      recomendaciones: '',
      plan_manejo: '',
      medicamentos_recomendados: '',
      procedimientos_recomendados: '',
      requiere_seguimiento: false,
      fecha_proximo_control: ''
    })
    setIsOpen(true)
  }

  const handleSubmit = () => {
    if (!solicitudSeleccionada) return
    if (!formData.hallazgos_clinicos || !formData.recomendaciones) {
      toast.error('Hallazgos clínicos y recomendaciones son requeridos')
      return
    }

    crearRespuesta({
      solicitud_id: solicitudSeleccionada.id,
      especialista_id: null,
      hallazgos_clinicos: formData.hallazgos_clinicos,
      interpretacion_diagnostica: formData.interpretacion_diagnostica,
      recomendaciones: formData.recomendaciones,
      plan_manejo: formData.plan_manejo,
      medicamentos_recomendados: formData.medicamentos_recomendados ? formData.medicamentos_recomendados.split(',').map(m => m.trim()) : [],
      procedimientos_recomendados: formData.procedimientos_recomendados ? formData.procedimientos_recomendados.split(',').map(p => p.trim()) : [],
      requiere_seguimiento: formData.requiere_seguimiento,
      fecha_proximo_control: formData.fecha_proximo_control || null,
      fecha_respuesta: new Date().toISOString()
    })

    setIsOpen(false)
    setSolicitudSeleccionada(null)
  }

  const getUrgenciaBadge = (urgencia: string) => {
    const variants: Record<string, string> = {
      'critica': 'bg-red-500 text-white',
      'urgente': 'bg-orange-500 text-white',
      'alta': 'bg-yellow-500 text-black',
      'normal': 'bg-blue-500 text-white',
      'baja': 'bg-gray-500 text-white'
    }
    return variants[urgencia] || 'bg-gray-500 text-white'
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'en_evaluacion': 'bg-blue-100 text-blue-800',
      'respondida': 'bg-green-100 text-green-800',
      'cerrada': 'bg-gray-100 text-gray-800'
    }
    return variants[estado] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pendientes de Respuesta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{solicitudesPendientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Respondidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{solicitudesRespondidas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {solicitudesPendientes.filter(s => s.urgencia === 'urgente' || s.urgencia === 'critica').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Total Respuestas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{respuestas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Gestión de Respuestas de Interconsulta
          </CardTitle>
          <CardDescription>
            Responda las solicitudes de interconsulta pendientes con hallazgos, diagnóstico y recomendaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar por número, especialidad o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendientes">Pendientes</SelectItem>
                <SelectItem value="respondidas">Respondidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {solicitudesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando solicitudes...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay solicitudes {filtroEstado === 'pendientes' ? 'pendientes' : 'respondidas'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nro. Solicitud</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Urgencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-semibold">{s.numero_solicitud || 'N/A'}</TableCell>
                    <TableCell>{s.especialidad_solicitada}</TableCell>
                    <TableCell className="max-w-xs truncate">{s.motivo_solicitud}</TableCell>
                    <TableCell>
                      <Badge className={getUrgenciaBadge(s.urgencia)}>
                        {s.urgencia?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoBadge(s.estado_solicitud)}>
                        {s.estado_solicitud?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleDateString('es-ES') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {s.estado_solicitud !== 'respondida' ? (
                        <Button size="sm" onClick={() => handleResponder(s)}>
                          <FileText className="w-4 h-4 mr-1" />
                          Responder
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Respondida
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para responder */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Responder Interconsulta: {solicitudSeleccionada?.numero_solicitud}
            </DialogTitle>
          </DialogHeader>

          {solicitudSeleccionada && (
            <div className="space-y-4">
              {/* Info de la solicitud */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Especialidad:</span> {solicitudSeleccionada.especialidad_solicitada}
                    </div>
                    <div>
                      <span className="font-semibold">Urgencia:</span> 
                      <Badge className={`ml-2 ${getUrgenciaBadge(solicitudSeleccionada.urgencia)}`}>
                        {solicitudSeleccionada.urgencia}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold">Motivo:</span> {solicitudSeleccionada.motivo_solicitud}
                    </div>
                    {solicitudSeleccionada.pregunta_clinica && (
                      <div className="col-span-2">
                        <span className="font-semibold">Pregunta clínica:</span> {solicitudSeleccionada.pregunta_clinica}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Formulario de respuesta */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="hallazgos">Hallazgos Clínicos *</Label>
                  <Textarea
                    id="hallazgos"
                    placeholder="Describa los hallazgos de su evaluación..."
                    value={formData.hallazgos_clinicos}
                    onChange={(e) => setFormData({ ...formData, hallazgos_clinicos: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="interpretacion">Interpretación Diagnóstica</Label>
                  <Textarea
                    id="interpretacion"
                    placeholder="Análisis e interpretación de los hallazgos..."
                    value={formData.interpretacion_diagnostica}
                    onChange={(e) => setFormData({ ...formData, interpretacion_diagnostica: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="recomendaciones">Recomendaciones *</Label>
                  <Textarea
                    id="recomendaciones"
                    placeholder="Recomendaciones para el manejo del paciente..."
                    value={formData.recomendaciones}
                    onChange={(e) => setFormData({ ...formData, recomendaciones: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="plan">Plan de Manejo</Label>
                  <Textarea
                    id="plan"
                    placeholder="Plan de manejo sugerido..."
                    value={formData.plan_manejo}
                    onChange={(e) => setFormData({ ...formData, plan_manejo: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="medicamentos">Medicamentos Recomendados</Label>
                    <Input
                      id="medicamentos"
                      placeholder="Separados por coma..."
                      value={formData.medicamentos_recomendados}
                      onChange={(e) => setFormData({ ...formData, medicamentos_recomendados: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="procedimientos">Procedimientos Recomendados</Label>
                    <Input
                      id="procedimientos"
                      placeholder="Separados por coma..."
                      value={formData.procedimientos_recomendados}
                      onChange={(e) => setFormData({ ...formData, procedimientos_recomendados: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="seguimiento"
                      checked={formData.requiere_seguimiento}
                      onChange={(e) => setFormData({ ...formData, requiere_seguimiento: e.target.checked })}
                    />
                    <Label htmlFor="seguimiento">Requiere seguimiento</Label>
                  </div>
                  {formData.requiere_seguimiento && (
                    <div>
                      <Label htmlFor="fecha_control">Fecha próximo control</Label>
                      <Input
                        id="fecha_control"
                        type="date"
                        value={formData.fecha_proximo_control}
                        onChange={(e) => setFormData({ ...formData, fecha_proximo_control: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Enviar Respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RespuestasManager
