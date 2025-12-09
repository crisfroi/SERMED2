import React, { useState } from 'react'
import { useHosixInterconsultas } from '@/hooks/useHosixInterconsultas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ClipboardList, 
  Plus, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Activity,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface Seguimiento {
  id: string
  interconsulta_id: string
  tipo_seguimiento: 'virtual' | 'presencial' | 'llamada' | 'nota'
  fecha_seguimiento: string
  resultado_clinico: string
  complicaciones: string | null
  requiere_nueva_interconsulta: boolean
  observaciones: string | null
  created_at: string
}

export const SeguimientoManager: React.FC = () => {
  const { solicitudes = [], respuestas = [], crearSeguimiento, seguimientos = [] } = useHosixInterconsultas()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null)
  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState<any>(null)
  const [formData, setFormData] = useState({
    tipo_seguimiento: 'presencial',
    resultado_clinico: '',
    complicaciones: '',
    requiere_nueva_interconsulta: false,
    observaciones: ''
  })

  // Filtrar solo solicitudes respondidas que requieren seguimiento
  const solicitudesConSeguimiento = solicitudes.filter(s => {
    const respuesta = respuestas.find(r => r.solicitud_id === s.id)
    return s.estado_solicitud === 'respondida' && respuesta?.requiere_seguimiento
  })

  const solicitudesSinSeguimiento = solicitudesConSeguimiento.filter(s => {
    return !seguimientos.some(seg => seg.interconsulta_id === s.id)
  })

  const filtered = solicitudesConSeguimiento.filter(s => {
    return searchTerm === '' || 
      s.numero_solicitud?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.especialidad_solicitada?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleNuevoSeguimiento = (solicitud: any) => {
    setSolicitudSeleccionada(solicitud)
    setFormData({
      tipo_seguimiento: 'presencial',
      resultado_clinico: '',
      complicaciones: '',
      requiere_nueva_interconsulta: false,
      observaciones: ''
    })
    setIsOpen(true)
  }

  const handleVerDetalle = (solicitud: any) => {
    setSolicitudSeleccionada(solicitud)
    const seguimientosDeSolicitud = seguimientos.filter(s => s.interconsulta_id === solicitud.id)
    setSeguimientoSeleccionado(seguimientosDeSolicitud)
    setIsDetailOpen(true)
  }

  const handleSubmit = () => {
    if (!solicitudSeleccionada) return
    if (!formData.resultado_clinico) {
      toast.error('El resultado clínico es requerido')
      return
    }

    crearSeguimiento?.({
      interconsulta_id: solicitudSeleccionada.id,
      tipo_seguimiento: formData.tipo_seguimiento,
      fecha_seguimiento: new Date().toISOString(),
      resultado_clinico: formData.resultado_clinico,
      complicaciones: formData.complicaciones || null,
      requiere_nueva_interconsulta: formData.requiere_nueva_interconsulta,
      observaciones: formData.observaciones || null
    })

    setIsOpen(false)
    setSolicitudSeleccionada(null)
    toast.success('Seguimiento registrado correctamente')
  }

  const getTipoSeguimientoBadge = (tipo: string) => {
    const variants: Record<string, string> = {
      'presencial': 'bg-green-100 text-green-800',
      'virtual': 'bg-blue-100 text-blue-800',
      'llamada': 'bg-purple-100 text-purple-800',
      'nota': 'bg-gray-100 text-gray-800'
    }
    return variants[tipo] || 'bg-gray-100 text-gray-800'
  }

  const getSeguimientosCount = (solicitudId: string) => {
    return seguimientos.filter(s => s.interconsulta_id === solicitudId).length
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              Requieren Seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{solicitudesConSeguimiento.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{solicitudesSinSeguimiento.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              Total Seguimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{seguimientos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {seguimientos.filter(s => {
                const fecha = new Date(s.fecha_seguimiento)
                const ahora = new Date()
                return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de seguimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Seguimiento de Interconsultas
          </CardTitle>
          <CardDescription>
            Registre el seguimiento de las recomendaciones de interconsultas respondidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar por número o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay interconsultas que requieran seguimiento
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nro. Solicitud</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Fecha Respuesta</TableHead>
                  <TableHead>Seguimientos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s: any) => {
                  const respuesta = respuestas.find(r => r.solicitud_id === s.id)
                  const numSeguimientos = getSeguimientosCount(s.id)
                  const tieneSeguimiento = numSeguimientos > 0
                  
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-semibold">{s.numero_solicitud || 'N/A'}</TableCell>
                      <TableCell>{s.especialidad_solicitada}</TableCell>
                      <TableCell>
                        {respuesta?.fecha_respuesta 
                          ? new Date(respuesta.fecha_respuesta).toLocaleDateString('es-ES') 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Activity className="w-3 h-3" />
                          {numSeguimientos}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tieneSeguimiento ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Con seguimiento
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleNuevoSeguimiento(s)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Nuevo
                          </Button>
                          {tieneSeguimiento && (
                            <Button size="sm" variant="outline" onClick={() => handleVerDetalle(s)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para nuevo seguimiento */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nuevo Seguimiento: {solicitudSeleccionada?.numero_solicitud}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tipo">Tipo de Seguimiento</Label>
              <Select 
                value={formData.tipo_seguimiento} 
                onValueChange={(v) => setFormData({ ...formData, tipo_seguimiento: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="llamada">Llamada telefónica</SelectItem>
                  <SelectItem value="nota">Nota de evolución</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resultado">Resultado Clínico *</Label>
              <Textarea
                id="resultado"
                placeholder="Describa el resultado de la evaluación de seguimiento..."
                value={formData.resultado_clinico}
                onChange={(e) => setFormData({ ...formData, resultado_clinico: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="complicaciones">Complicaciones</Label>
              <Textarea
                id="complicaciones"
                placeholder="Describa complicaciones si las hubiera..."
                value={formData.complicaciones}
                onChange={(e) => setFormData({ ...formData, complicaciones: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="nuevaInterconsulta"
                checked={formData.requiere_nueva_interconsulta}
                onChange={(e) => setFormData({ ...formData, requiere_nueva_interconsulta: e.target.checked })}
              />
              <Label htmlFor="nuevaInterconsulta">Requiere nueva interconsulta</Label>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones Adicionales</Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones adicionales..."
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Guardar Seguimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalle de seguimientos */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Historial de Seguimientos: {solicitudSeleccionada?.numero_solicitud}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {seguimientoSeleccionado && seguimientoSeleccionado.length > 0 ? (
              seguimientoSeleccionado.map((seg: any, idx: number) => (
                <Card key={seg.id || idx} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getTipoSeguimientoBadge(seg.tipo_seguimiento)}>
                        {seg.tipo_seguimiento?.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(seg.fecha_seguimiento).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold">Resultado:</span> {seg.resultado_clinico}
                      </div>
                      {seg.complicaciones && (
                        <div className="text-orange-600">
                          <span className="font-semibold">Complicaciones:</span> {seg.complicaciones}
                        </div>
                      )}
                      {seg.observaciones && (
                        <div>
                          <span className="font-semibold">Observaciones:</span> {seg.observaciones}
                        </div>
                      )}
                      {seg.requiere_nueva_interconsulta && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Requiere nueva interconsulta
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No hay seguimientos registrados
              </p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SeguimientoManager
