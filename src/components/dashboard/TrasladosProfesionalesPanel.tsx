import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { UserRole } from '@/types/roles';
import { useAdvancedRoleManagement } from '@/hooks/useAdvancedRoleManagement';
import { useBuscarCentros, useProfesionalesPorCentro } from '@/hooks/useCentrosSalud';
import { useProfesionales, type Profesional } from '@/hooks/useProfesionales';

interface TrasladosProfesionalesPanelProps {
  userRole: UserRole;
  centroAsignado?: string;
}

const TrasladosProfesionalesPanel: React.FC<TrasladosProfesionalesPanelProps> = ({
  userRole,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [newTraslado, setNewTraslado] = useState({
    centroDestinoId: '',
    motivo: '',
    observaciones: ''
  });
  const [viewFilter, setViewFilter] = useState<'pendientes' | 'historial'>('pendientes');

  // Filtros UI
  const [centerFilterId, setCenterFilterId] = useState<string>('all');
  const [professionalQuery, setProfessionalQuery] = useState<string>('');
  const [professionalCenterFilterId, setProfessionalCenterFilterId] = useState<string>('all');

  // Hooks de datos reales
  const {
    traslados,
    loading,
    createTrasladoSolicitud,
    processTrasladoSolicitud,
    hasApproveTrasladosPermission,
    hasCreateTrasladosPermission,
  } = useAdvancedRoleManagement();

  const { data: centros = [] } = useBuscarCentros({});

  // Profesionales aprobados y de función pública (para búsqueda global)
  const { data: approvedFuncionarios = [], isLoading: loadingApproved } = useProfesionales({
    estado_solicitud: 'Aprobado',
    funcion_publica: true,
    search: professionalQuery || undefined,
  });

  // Profesionales por centro (para filtrar por centro en el selector)
  const { data: professionalsFromCenter = [], isLoading: loadingByCenter } = useProfesionalesPorCentro(
    professionalCenterFilterId === 'all' ? '' : professionalCenterFilterId,
    undefined,
    'Aprobado'
  );

  const professionalsFromCenterFiltered: Profesional[] = useMemo(() => {
    const base = (professionalsFromCenter || []) as Profesional[];
    const filteredByFuncion = base.filter((p) => (p as any).funcion_publica === true);
    if (!professionalQuery.trim()) return filteredByFuncion;
    const q = professionalQuery.trim().toLowerCase();
    return filteredByFuncion.filter((p) =>
      (p.nombre_completo || '').toLowerCase().includes(q) ||
      (p.area_profesional || '').toLowerCase().includes(q) ||
      (p.id_profesional_unico || '').toLowerCase().includes(q)
    );
  }, [professionalsFromCenter, professionalQuery]);

  const availableProfessionals: Profesional[] = useMemo(() => {
    if (professionalCenterFilterId && professionalCenterFilterId !== 'all') return professionalsFromCenterFiltered;
    return (approvedFuncionarios || []) as Profesional[];
  }, [approvedFuncionarios, professionalsFromCenterFiltered, professionalCenterFilterId]);

  // Filtrar solicitudes por centro (origen o destino) y estado (pendientes/historial)
  const filteredTraslados = useMemo(() => {
    let base = (traslados || []) as any[];
    if (centerFilterId && centerFilterId !== 'all') {
      base = base.filter((t) => t.centro_origen_id === centerFilterId || t.centro_destino_id === centerFilterId);
    }
    if (viewFilter === 'pendientes') base = base.filter((t) => t.estado === 'pendiente');
    else base = base.filter((t) => t.estado !== 'pendiente');
    return base;
  }, [traslados, centerFilterId, viewFilter]);

  const pendingCount = useMemo(() => (filteredTraslados || []).filter((s: any) => s.estado === 'pendiente').length, [filteredTraslados]);

  const canCreateTraslado = hasCreateTrasladosPermission();
  const canApproveTraslado = hasApproveTrasladosPermission();

  const toggleProfessional = (id: string) => {
    setSelectedProfessionals((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreateSolicitud = async () => {
    if (selectedProfessionals.length === 0 || !newTraslado.centroDestinoId || !newTraslado.motivo.trim()) return;

    const results = await Promise.allSettled(
      selectedProfessionals.map((profId) =>
        createTrasladoSolicitud({
          profesional_id: profId,
          centro_destino_id: newTraslado.centroDestinoId,
          motivo: newTraslado.motivo,
          observaciones: newTraslado.observaciones || undefined,
        })
      )
    );

    const anySuccess = results.some((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value?.success);
    if (anySuccess) {
      setIsCreateOpen(false);
      setNewTraslado({ centroDestinoId: '', motivo: '', observaciones: '' });
      setSelectedProfessionals([]);
      setProfessionalQuery('');
      setProfessionalCenterFilterId('');
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'aprobado':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'rechazado':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              Traslados de Profesionales
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pendingCount} pendientes</Badge>

              <div className="flex rounded-md border overflow-hidden">
                <Button variant={viewFilter === 'pendientes' ? 'default' : 'ghost'} size="sm" onClick={() => setViewFilter('pendientes')}>Pendientes</Button>
                <Button variant={viewFilter === 'historial' ? 'default' : 'ghost'} size="sm" onClick={() => setViewFilter('historial')}>Historial</Button>
              </div>

              {/* Filtro por centro para la lista */}
              <Select value={centerFilterId} onValueChange={setCenterFilterId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filtrar por centro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los centros</SelectItem>
                  {centros.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {canCreateTraslado && (
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Solicitar Traslado
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Solicitar Traslado de Profesionales</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* Selector y buscador de profesionales */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium block">Seleccionar Profesionales</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Buscar profesional aprobado (función pública)"
                              value={professionalQuery}
                              onChange={(e) => setProfessionalQuery(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                          <Select value={professionalCenterFilterId} onValueChange={setProfessionalCenterFilterId}>
                            <SelectTrigger className="w-[240px]">
                              <SelectValue placeholder="Filtrar por centro actual" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los centros</SelectItem>
                              {centros.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="max-h-56 overflow-y-auto border rounded p-2 space-y-2">
                          {((professionalCenterFilterId && professionalCenterFilterId !== 'all') ? loadingByCenter : loadingApproved) && (
                            <div className="text-sm text-gray-500 p-2 flex items-center gap-2"><Filter className="w-4 h-4" />Cargando profesionales...</div>
                          )}
                          {(availableProfessionals || []).map((prof) => (
                            <label key={prof.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedProfessionals.includes(prof.id)}
                                onChange={() => toggleProfessional(prof.id)}
                              />
                              <span className="flex-1 truncate">{prof.nombre_completo} • {prof.area_profesional || 'Sin área'}</span>
                            </label>
                          ))}
                          {(availableProfessionals || []).length === 0 && !loadingApproved && !loadingByCenter && (
                            <div className="text-sm text-gray-500 p-2">Sin resultados</div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedProfessionals.length} profesionales seleccionados
                        </p>
                      </div>

                      {/* Centro de destino */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">Centro de Destino</label>
                        <Select
                          value={newTraslado.centroDestinoId}
                          onValueChange={(value) => setNewTraslado({ ...newTraslado, centroDestinoId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar centro destino" />
                          </SelectTrigger>
                          <SelectContent>
                            {centros.map((centro: any) => (
                              <SelectItem key={centro.id} value={centro.id}>
                                {centro.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Motivo del Traslado</label>
                        <Textarea
                          value={newTraslado.motivo}
                          onChange={(e) => setNewTraslado({ ...newTraslado, motivo: e.target.value })}
                          placeholder="Explique el motivo del traslado..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Observaciones (Opcional)</label>
                        <Textarea
                          value={newTraslado.observaciones}
                          onChange={(e) => setNewTraslado({ ...newTraslado, observaciones: e.target.value })}
                          placeholder="Observaciones adicionales..."
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleCreateSolicitud}
                          disabled={selectedProfessionals.length === 0 || !newTraslado.centroDestinoId || !newTraslado.motivo.trim()}
                        >
                          Enviar Solicitud
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Centro Origen</TableHead>
                  <TableHead>Centro Destino</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  {canApproveTraslado && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!filteredTraslados || filteredTraslados.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={canApproveTraslado ? 7 : 6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <ArrowRight className="w-12 h-12 mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No hay solicitudes de traslado</p>
                        <p className="text-sm">
                          {canCreateTraslado
                            ? 'Crea una nueva solicitud para comenzar'
                            : 'Las solicitudes aparecerán aquí cuando sean creadas'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTraslados.map((solicitud: any) => (
                    <TableRow key={solicitud.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{solicitud.profesional?.nombre_completo || 'Profesional'}</div>
                          <div className="text-sm text-gray-500">{solicitud.profesional?.area_profesional || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {solicitud.centro_origen?.nombre || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400" />
                          {solicitud.centro_destino?.nombre || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={solicitud.motivo}>
                          {solicitud.motivo}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(solicitud.estado)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Sol: {new Date(solicitud.fecha_solicitud).toLocaleDateString()}</div>
                          {solicitud.fecha_aprobacion && (
                            <div className="text-gray-500">
                              Resp: {new Date(solicitud.fecha_aprobacion).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {canApproveTraslado && (
                        <TableCell>
                          {solicitud.estado === 'pendiente' && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => processTrasladoSolicitud(solicitud.id, 'aprobado')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => processTrasladoSolicitud(solicitud.id, 'rechazado')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">¿Cómo funciona el sistema de traslados?</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Los administradores de centros pueden solicitar traslados de sus profesionales</li>
                <li>• RRHH del Ministerio revisa y aprueba/rechaza las solicitudes</li>
                <li>• Una vez aprobado, el sistema actualiza automáticamente la asignación del profesional</li>
                <li>• Todos los cambios quedan registrados para auditoría</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrasladosProfesionalesPanel;
