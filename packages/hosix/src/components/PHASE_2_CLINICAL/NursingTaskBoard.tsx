'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Clock, AlertCircle, Stethoscope, ClipboardList, Plus } from 'lucide-react';
import { useNursingManagement } from '@hosix/hooks/shared';

interface NursingTaskBoardProps {
  nurseId: string;
}

export const NursingTaskBoard: React.FC<NursingTaskBoardProps> = ({ nurseId }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [careOrders, setCareOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { getAssignedTasks } = useNursingManagement();

  useEffect(() => {
    loadTasks();
  }, [nurseId]);

  const loadTasks = async () => {
    setLoading(true);
    const data = await getAssignedTasks(nurseId);
    setTasks(data || []);
    setLoading(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const taskTypeLabel: Record<string, string> = {
    wound_care: '🩹 Cuidado de Heridas',
    catheter_care: '🚰 Cuidado de Catéter',
    medication_administration: '💊 Administración Medicamento',
    vital_signs_monitoring: '❤️ Monitoreo Signos Vitales',
    hygiene: '🧼 Higiene',
    patient_positioning: '🛏️ Posicionamiento Paciente',
    other: '📋 Otro',
  };

  if (loading) {
    return <div>Cargando tareas...</div>;
  }

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              Tareas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">{pendingTasks.length}</div>
            <p className="text-xs text-yellow-600 mt-1">Por completar hoy</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{inProgressTasks.length}</div>
            <p className="text-xs text-blue-600 mt-1">Tareas activas</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{completedTasks.length}</div>
            <p className="text-xs text-green-600 mt-1">Hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Mis Tareas de Enfermería</CardTitle>
              <CardDescription>Gestiona tus asignaciones del día</CardDescription>
            </div>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Tarea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pendientes ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                En Progreso ({inProgressTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completadas ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            {['pending', 'in_progress', 'completed'].map((status) => (
              <TabsContent key={status} value={status}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">✓</TableHead>
                      <TableHead>Tipo Tarea</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(status === 'pending'
                      ? pendingTasks
                      : status === 'in_progress'
                        ? inProgressTasks
                        : completedTasks
                    ).map((task, idx) => (
                      <TableRow key={idx} className={status === 'completed' ? 'opacity-60' : ''}>
                        <TableCell>
                          <Checkbox disabled={status === 'completed'} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {taskTypeLabel[task.task_type] || task.task_type}
                        </TableCell>
                        <TableCell>
                          {task.patient_name || `Paciente ${task.patient_id?.slice(0, 8)}`}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{task.frequency}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(task.due_date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColor(task.status)}>
                            {task.status === 'pending'
                              ? 'Pendiente'
                              : task.status === 'in_progress'
                                ? 'En Progreso'
                                : 'Completada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            {status === 'completed' ? 'Ver' : 'Actualizar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Care Orders Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Órdenes de Cuidado Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                type: 'Cuidado de Herida Quirúrgica',
                priority: 'urgent',
                patient: 'María Rodríguez',
                frequency: 'Cada 12 horas',
              },
              {
                type: 'Control de Dolor',
                priority: 'routine',
                patient: 'Juan García',
                frequency: 'Según sea necesario',
              },
            ].map((order, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                <div>
                  <p className="font-semibold">{order.type}</p>
                  <p className="text-sm text-gray-600">Paciente: {order.patient}</p>
                  <p className="text-sm text-gray-600">Frecuencia: {order.frequency}</p>
                </div>
                <Badge variant={order.priority === 'urgent' ? 'destructive' : 'secondary'}>
                  {order.priority === 'urgent' ? 'Urgente' : 'Rutina'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
