import React, { useState } from 'react';
import { useHosixMedicos, WorklistMedico } from '@/hooks/useHosixMedicos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, Clock, User, CheckCircle } from 'lucide-react';
import ConsultaMedica from './ConsultaMedica';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getPrioridadColor = (prioridad: string) => {
  switch (prioridad) {
    case 'critica': return 'bg-red-600 text-white';
    case 'alta': return 'bg-orange-600 text-white';
    case 'normal': return 'bg-blue-600 text-white';
    case 'baja': return 'bg-gray-600 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'en_consulta': return 'bg-green-600 text-white';
    case 'pendiente': return 'bg-yellow-600 text-white';
    case 'completado': return 'bg-gray-600 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

export default function WorklistMedico() {
  const { worklist, isLoadingWorklist, actualizarWorklistMutation } = useHosixMedicos();
  const [selectedPaciente, setSelectedPaciente] = useState<WorklistMedico | null>(null);
  const [showConsultaForm, setShowConsultaForm] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const calcularTiempoAsignacion = (fechaAsignacion: string) => {
    const asignacion = new Date(fechaAsignacion);
    const ahora = new Date();
    const minutos = Math.floor((ahora.getTime() - asignacion.getTime()) / 60000);
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    await actualizarWorklistMutation.mutateAsync({ id, estado: nuevoEstado });
  };

  const handleAbrirConsulta = (paciente: WorklistMedico) => {
    setSelectedPaciente(paciente);
    setShowConsultaForm(true);
  };

  const worklistFiltrada = worklist.filter((item) => {
    if (filtroEstado !== 'todos' && item.estado !== filtroEstado) return false;
    if (filtroPrioridad !== 'todos' && item.prioridad !== filtroPrioridad) return false;
    return true;
  });

  const estadisticas = {
    pendientes: worklist.filter((w) => w.estado === 'pendiente').length,
    enConsulta: worklist.filter((w) => w.estado === 'en_consulta').length,
    criticos: worklist.filter((w) => w.prioridad === 'critica').length,
    total: worklist.length,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Worklist Médico</h2>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{estadisticas.enConsulta}</p>
              <p className="text-sm text-gray-600">En Consulta</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{estadisticas.criticos}</p>
              <p className="text-sm text-gray-600">Críticos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{estadisticas.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_consulta">En Consulta</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Prioridad</label>
              <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes Asignados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingWorklist ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando worklist...</p>
            </div>
          ) : worklistFiltrada.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay pacientes asignados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Tipo Episodio</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worklistFiltrada.map((item) => {
                  const paciente = item.paciente as any;
                  const edad = paciente?.fecha_nacimiento ? calcularEdad(paciente.fecha_nacimiento) : '-';

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {paciente?.primer_nombre} {paciente?.primer_apellido}
                            </p>
                            <p className="text-sm text-gray-500">PPI: {paciente?.ppi}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{edad} años</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.tipo_episodio}</Badge>
                      </TableCell>
                      <TableCell>{(item.servicio as any)?.nombre || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getPrioridadColor(item.prioridad)}>
                          {item.prioridad.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(item.estado)}>
                          {item.estado.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.fecha_asignacion && (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {calcularTiempoAsignacion(item.fecha_asignacion)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAbrirConsulta(item)}
                          >
                            <Stethoscope className="h-4 w-4 mr-1" />
                            Consultar
                          </Button>
                          {item.estado === 'pendiente' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCambiarEstado(item.id, 'en_consulta')}
                            >
                              Iniciar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedPaciente && (
        <ConsultaMedica
          pacienteId={selectedPaciente.paciente_id}
          episodioId={selectedPaciente.episodio_id}
          tipoEpisodio={selectedPaciente.tipo_episodio}
          worklistId={selectedPaciente.id}
          onClose={() => {
            setShowConsultaForm(false);
            setSelectedPaciente(null);
          }}
        />
      )}
    </div>
  );
}

