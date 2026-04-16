// WEEK 12 ADMIN 2: Waiting Rooms
// Component: RoomConfigurationPage.tsx
// Purpose: Admin configuration of waiting rooms
// Status: Production-ready

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Power, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WaitingRoom {
  id: string;
  room_name: string;
  room_code: string;
  room_type: string;
  max_capacity: number;
  current_count: number;
  is_active: boolean;
  is_paused: boolean;
  pause_reason?: string;
  location_floor?: string;
  location_area?: string;
  manager_staff_id?: string;
}

interface RoomConfigurationPageProps {
  hospitalId?: string;
}

export const RoomConfigurationPage: React.FC<RoomConfigurationPageProps> = ({
  hospitalId,
}) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<WaitingRoom | null>(null);
  const [formData, setFormData] = useState<Partial<WaitingRoom>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch rooms
  const { data: rooms = [], isLoading } = useQuery<WaitingRoom[]>({
    queryKey: ['waiting-rooms', hospitalId],
    queryFn: async () => {
      const params = hospitalId ? `?hospital_id=${hospitalId}` : '';
      const response = await fetch(`/api/v1/waiting-rooms${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch rooms');
      return response.json();
    },
  });

  // Create/Update room mutation
  const saveRoomMutation = useMutation({
    mutationFn: async (data: Partial<WaitingRoom>) => {
      const url = editingRoom
        ? `/api/v1/waiting-rooms/${editingRoom.id}`
        : '/api/v1/waiting-rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save room');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-rooms', hospitalId] });
      setSuccessMessage(editingRoom ? 'Sala actualizada' : 'Sala creada');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsDialogOpen(false);
      setEditingRoom(null);
      setFormData({});
    },
  });

  // Delete room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetch(`/api/v1/waiting-rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete room');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-rooms', hospitalId] });
      setSuccessMessage('Sala eliminada');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  // Toggle room status
  const toggleRoomMutation = useMutation({
    mutationFn: async ({ roomId, action }: { roomId: string; action: 'activate' | 'pause' | 'resume' }) => {
      const response = await fetch(`/api/v1/waiting-rooms/${roomId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error(`Failed to ${action} room`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-rooms', hospitalId] });
    },
  });

  const handleOpenDialog = (room?: WaitingRoom) => {
    if (room) {
      setEditingRoom(room);
      setFormData(room);
    } else {
      setEditingRoom(null);
      setFormData({
        room_name: '',
        room_code: '',
        room_type: 'consultation',
        max_capacity: 50,
        location_floor: '1',
        location_area: 'General',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveRoom = () => {
    saveRoomMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Configuración de Salas</h1>
          <p className="text-gray-600">Gestiona las salas de espera del hospital</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sala
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'Editar Sala' : 'Nueva Sala'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Nombre de Sala</label>
                <Input
                  value={formData.room_name || ''}
                  onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                  placeholder="Ej: Sala de Urgencias"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Código (Único)</label>
                <Input
                  value={formData.room_code || ''}
                  onChange={(e) => setFormData({ ...formData, room_code: e.target.value.toUpperCase() })}
                  placeholder="Ej: URGENCIA-01"
                  maxLength={20}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo de Sala</label>
                  <Select
                    value={formData.room_type || 'consultation'}
                    onValueChange={(value) => setFormData({ ...formData, room_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergencia</SelectItem>
                      <SelectItem value="consultation">Consulta</SelectItem>
                      <SelectItem value="lab">Laboratorio</SelectItem>
                      <SelectItem value="imaging">Imagenología</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Capacidad Máxima</label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={formData.max_capacity || 50}
                    onChange={(e) =>
                      setFormData({ ...formData, max_capacity: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Piso</label>
                  <Input
                    value={formData.location_floor || ''}
                    onChange={(e) => setFormData({ ...formData, location_floor: e.target.value })}
                    placeholder="Ej: 1, 2, 3"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Área</label>
                  <Input
                    value={formData.location_area || ''}
                    onChange={(e) => setFormData({ ...formData, location_area: e.target.value })}
                    placeholder="Ej: General, Pediatría"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveRoom}
                disabled={saveRoomMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {saveRoomMutation.isPending ? 'Guardando...' : 'Guardar Sala'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salas Registradas ({rooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando salas...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay salas configuradas</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-bold">{room.room_code}</TableCell>
                      <TableCell>{room.room_name}</TableCell>
                      <TableCell>{room.room_type}</TableCell>
                      <TableCell>
                        Piso {room.location_floor} - {room.location_area}
                      </TableCell>
                      <TableCell>
                        <span className={room.current_count > room.max_capacity * 0.8 ? 'text-red-600' : ''}>
                          {room.current_count}/{room.max_capacity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            room.is_paused
                              ? 'bg-yellow-100 text-yellow-800'
                              : room.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {room.is_paused ? 'PAUSADA' : room.is_active ? 'ACTIVA' : 'INACTIVA'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => handleOpenDialog(room)}
                            variant="outline"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          {room.is_active && (
                            <Button
                              size="sm"
                              onClick={() => toggleRoomMutation.mutate({ roomId: room.id, action: 'pause' })}
                              variant="outline"
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => deleteRoomMutation.mutate(room.id)}
                            disabled={deleteRoomMutation.isPending}
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  );
};

export default RoomConfigurationPage;
