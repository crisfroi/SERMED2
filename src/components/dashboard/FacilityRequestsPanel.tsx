import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building, CheckCircle, FileText, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAprobarEstablecimiento, useSolicitudesEstablecimientos, useUpdateEstadoEstablecimiento } from '@/hooks/useEstablecimientosSolicitudes';

const statusMap = {
  recibida: 'Recibida',
  revisando: 'Revisando Expediente',
  firma: 'Pendiente de Firma',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
} as const;

export default function FacilityRequestsPanel() {
  const [view, setView] = useState<'todas'|'pendientes'|'firma'|'aprobadas'|'rechazadas'>('todas');
  const { data: solicitudes = [], isLoading } = useSolicitudesEstablecimientos();
  const updateEstado = useUpdateEstadoEstablecimiento();
  const { user } = useAuth();
  const aprobar = useAprobarEstablecimiento();

  const filtered = useMemo(() => {
    if (view === 'todas') return solicitudes;
    if (view === 'pendientes') return solicitudes.filter(s => (s.estado_solicitud || '') === statusMap.revisando || (s.estado_solicitud || '') === statusMap.recibida);
    if (view === 'firma') return solicitudes.filter(s => (s.estado_solicitud || '') === statusMap.firma);
    if (view === 'aprobadas') return solicitudes.filter(s => (s.estado_solicitud || '') === statusMap.aprobada);
    if (view === 'rechazadas') return solicitudes.filter(s => (s.estado_solicitud || '') === statusMap.rechazada);
    return solicitudes;
  }, [solicitudes, view]);

  const badge = (estado?: string | null) => {
    switch (estado) {
      case statusMap.recibida: return <Badge className="bg-gray-100 text-gray-800">Recibida</Badge>;
      case statusMap.revisando: return <Badge className="bg-yellow-100 text-yellow-800">Revisando</Badge>;
      case statusMap.firma: return <Badge className="bg-blue-100 text-blue-800">Pendiente de Firma</Badge>;
      case statusMap.aprobada: return <Badge className="bg-green-100 text-green-800">Aprobada</Badge>;
      case statusMap.rechazada: return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      default: return <Badge variant="outline">N/D</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-blue-600" /> Solicitudes de Establecimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button size="sm" variant={view==='todas'?'default':'outline'} onClick={() => setView('todas')}>Todas</Button>
            <Button size="sm" variant={view==='pendientes'?'default':'outline'} onClick={() => setView('pendientes')}>Revisión</Button>
            <Button size="sm" variant={view==='firma'?'default':'outline'} onClick={() => setView('firma')}>Pendiente de Firma</Button>
            <Button size="sm" variant={view==='aprobadas'?'default':'outline'} onClick={() => setView('aprobadas')}>Aprobadas</Button>
            <Button size="sm" variant={view==='rechazadas'?'default':'outline'} onClick={() => setView('rechazadas')}>Rechazadas</Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Establecimiento</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-sm text-gray-500">Cargando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-gray-500 text-sm flex items-center justify-center gap-2"><FileText className="w-5 h-5"/> Sin solicitudes</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.numero_solicitud || '—'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s.nombre_establecimiento}</div>
                        <div className="text-xs text-gray-500">{s.categoria} • {s.sector}</div>
                      </TableCell>
                      <TableCell className="text-sm">{s.distrito}, {s.provincia}</TableCell>
                      <TableCell>{badge(s.estado_solicitud)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(s.estado_solicitud === statusMap.recibida) && (
                            <Button size="sm" variant="outline" onClick={() => updateEstado.mutate({ id: s.id, nuevoEstado: statusMap.revisando })}>Marcar Revisando</Button>
                          )}
                          {(s.estado_solicitud === statusMap.revisando) && (
                            <Button size="sm" variant="outline" onClick={() => updateEstado.mutate({ id: s.id, nuevoEstado: statusMap.firma })}>Pasar a Firma</Button>
                          )}
                          {(s.estado_solicitud === statusMap.firma) && (
                            <Button size="sm" className="text-green-700 border-green-200" variant="outline" onClick={() => aprobar.mutate({ solicitud: s as any, aprobadorId: user?.id || '' })}><CheckCircle className="w-4 h-4" /></Button>
                          )}
                          {(s.estado_solicitud !== statusMap.aprobada) && (
                            <Button size="sm" className="text-red-700 border-red-200" variant="outline" onClick={() => updateEstado.mutate({ id: s.id, nuevoEstado: statusMap.rechazada })}><XCircle className="w-4 h-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
