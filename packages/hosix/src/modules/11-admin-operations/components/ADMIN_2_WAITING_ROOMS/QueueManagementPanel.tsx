// WEEK 12 ADMIN 2: Waiting Rooms
// Component: QueueManagementPanel.tsx
// Purpose: Staff control panel for queue management
// Status: Production-ready

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PhoneCall,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  RotateCw,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QueueEntry {
  id: string;
  queue_number: string;
  patient_name: string;
  patient_id: string;
  phone: string;
  priority_level: 'critical' | 'high' | 'normal' | 'low';
  queued_at: string;
  actual_wait_minutes: number;
  consultation_type: string;
  clinic_id: string;
  clinic_name: string;
}

interface QueueManagementPanelProps {
  roomId: string;
  roomName?: string;
}

type FilterType = 'all' | 'critical' | 'high' | 'normal' | 'low';

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'normal':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🟠';
    case 'normal':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
};

export const QueueManagementPanel: React.FC<QueueManagementPanelProps> = ({
  roomId,
  roomName = 'Queue Management',
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedPatient, setSelectedPatient] = useState<QueueEntry | null>(null);
  const [actionType, setActionType] = useState<'call' | 'no-show' | 'reschedule' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch queue data
  const { data: queueList = [], isLoading, isFetching } = useQuery<QueueEntry[]>({
    queryKey: ['queue-management', roomId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/waiting-rooms/${roomId}/queue-full`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch queue');
      return response.json();
    },
    refetchInterval: 2000,
    staleTime: 1500,
  });

  // Call next patient mutation
  const callNextMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await fetch(`/api/v1/waiting-queue/${patientId}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'called',
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to call patient');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-management', roomId] });
      setSuccessMessage('Paciente llamado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsDialogOpen(false);
      setSelectedPatient(null);
    },
  });

  // Mark no-show mutation
  const noShowMutation = useMutation({
    mutationFn: async (data: { patientId: string; reason: string }) => {
      const response = await fetch(`/api/v1/waiting-queue/${data.patientId}/no-show`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: data.reason,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to mark no-show');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-management', roomId] });
      setSuccessMessage('Paciente marcado como ausente');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsDialogOpen(false);
      setSelectedPatient(null);
      setNoShowReason('');
    },
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: async (data: { patientId: string; newDate: string }) => {
      const response = await fetch(`/api/v1/waiting-queue/${data.patientId}/reschedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_date: data.newDate,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to reschedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-management', roomId] });
      setSuccessMessage('Paciente reprogramado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsDialogOpen(false);
      setSelectedPatient(null);
      setRescheduleDate('');
    },
  });

  // Filter and search queue
  const filteredQueue = useMemo(() => {
    return queueList.filter((entry) => {
      const matchesSearch =
        entry.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.queue_number.includes(searchTerm) ||
        entry.phone.includes(searchTerm);

      const matchesFilter = filter === 'all' || entry.priority_level === filter;

      return matchesSearch && matchesFilter;
    });
  }, [queueList, searchTerm, filter]);

  const handleCallNext = async () => {
    if (selectedPatient) {
      callNextMutation.mutate(selectedPatient.id);
    }
  };

  const handleNoShow = async () => {
    if (selectedPatient && noShowReason) {
      noShowMutation.mutate({ patientId: selectedPatient.id, reason: noShowReason });
    }
  };

  const handleReschedule = async () => {
    if (selectedPatient && rescheduleDate) {
      rescheduleMutation.mutate({ patientId: selectedPatient.id, newDate: rescheduleDate });
    }
  };

  const handleAction = (patient: QueueEntry, action: 'call' | 'no-show' | 'reschedule') => {
    setSelectedPatient(patient);
    setActionType(action);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{roomName}</h1>
        <p className="text-gray-600">Panel de Control de Cola</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-80">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, número de cola o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="critical">🔴 Crítico</SelectItem>
                <SelectItem value="high">🟠 Alto</SelectItem>
                <SelectItem value="normal">🟡 Normal</SelectItem>
                <SelectItem value="low">🟢 Bajo</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['queue-management', roomId] })}
              disabled={isFetching}
              variant="outline"
            >
              <RotateCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Cola de Pacientes ({filteredQueue.length}/{queueList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando cola...</div>
          ) : filteredQueue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {queueList.length === 0 ? 'No hay pacientes en espera' : 'No hay pacientes que coincidan con los filtros'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>No. Cita</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Consultorio</TableHead>
                    <TableHead>Espera (min)</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueue.map((entry, index) => (
                    <TableRow key={entry.id} className={index === 0 ? 'bg-blue-50' : ''}>
                      <TableCell className="font-bold text-lg">
                        {entry.queue_number}
                        {index === 0 && <Badge className="ml-2 bg-blue-600">SIGUIENTE</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{entry.patient_name}</div>
                        <div className="text-sm text-gray-500">ID: {entry.patient_id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadgeColor(entry.priority_level)}>
                          {getPriorityIcon(entry.priority_level)} {entry.priority_level.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.phone}</TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.clinic_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {entry.actual_wait_minutes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => handleAction(entry, 'call')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <PhoneCall className="h-4 w-4 mr-1" />
                            Llamar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(entry, 'no-show')}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            No Presentó
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(entry, 'reschedule')}
                            variant="outline"
                          >
                            <RotateCw className="h-4 w-4 mr-1" />
                            Reprogramar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {actionType === 'call' && (
              <>
                <AlertDialogTitle>Llamar Paciente</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Desea llamar a {selectedPatient?.patient_name} ({selectedPatient?.queue_number})?
                  Se enviará notificación al consultorio {selectedPatient?.clinic_name}.
                </AlertDialogDescription>
              </>
            )}

            {actionType === 'no-show' && (
              <>
                <AlertDialogTitle>Marcar como No Presentado</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Paciente {selectedPatient?.patient_name} no tomó la llamada?
                  Indique el motivo:
                </AlertDialogDescription>
                <div className="mt-4">
                  <Select value={noShowReason} onValueChange={setNoShowReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_answer">No Respondió Llamada</SelectItem>
                      <SelectItem value="patient_left">Paciente se fue</SelectItem>
                      <SelectItem value="phone_unavailable">Teléfono no disponible</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {actionType === 'reschedule' && (
              <>
                <AlertDialogTitle>Reprogramar Paciente</AlertDialogTitle>
                <AlertDialogDescription>
                  Reprogramar a {selectedPatient?.patient_name} para:
                </AlertDialogDescription>
                <div className="mt-4">
                  <Input
                    type="datetime-local"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </AlertDialogHeader>

          <div className="flex gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                actionType === 'call'
                  ? handleCallNext
                  : actionType === 'no-show'
                    ? handleNoShow
                    : handleReschedule
              }
              disabled={
                actionType === 'no-show'
                  ? !noShowReason
                  : actionType === 'reschedule'
                    ? !rescheduleDate
                    : false
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QueueManagementPanel;
