// @ts-nocheck
// WEEK 12 ADMIN 2: Waiting Rooms
// Hook: useRoomConfiguration
// Purpose: Room management - CRUD, status, configuration
// Status: Production-ready

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

export type RoomType = 'emergency' | 'consultation' | 'lab' | 'imaging' | 'other';
export type RoomStatus = 'active' | 'paused' | 'inactive';

export interface WaitingRoom {
  id: string;
  hospital_id: string;
  room_name: string;
  room_code: string;
  room_type: RoomType;
  max_capacity: number;
  current_count: number;
  is_active: boolean;
  is_paused: boolean;
  pause_reason?: string;
  location_floor?: string;
  location_area?: string;
  location_sub_area?: string;
  manager_staff_id?: string;
  manager_name?: string;
  assigned_clinic_id?: string;
  assigned_clinic_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomInput {
  room_name: string;
  room_code: string;
  room_type: RoomType;
  max_capacity: number;
  location_floor: string;
  location_area: string;
  location_sub_area?: string;
  assigned_clinic_id?: string;
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {
  id: string;
}

export interface UseRoomConfigurationOptions {
  hospitalId?: string;
  autoRefresh?: number;
  enabled?: boolean;
}

/**
 * Hook for managing waiting room configuration
 * - Fetch rooms with status
 * - Create new rooms
 * - Edit existing rooms
 * - Delete rooms
 * - Pause/Resume rooms
 * - Manage room assignments
 */
export const useRoomConfiguration = ({
  hospitalId,
  autoRefresh = 30000,
  enabled = true,
}: UseRoomConfigurationOptions) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all rooms
  const { data: rooms = [], isLoading, isFetching } = useQuery<WaitingRoom[]>({
    queryKey: ['waiting-rooms', hospitalId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          ...(hospitalId && { hospital_id: hospitalId }),
        });
        const response = await fetch(`/api/v1/waiting-rooms?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch rooms');
        return response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    enabled,
    refetchInterval: autoRefresh,
    staleTime: autoRefresh - 5000,
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomInput) => {
      // Validate room code uniqueness
      const codeExists = rooms.some((r) => r.room_code === data.room_code.toUpperCase());
      if (codeExists) {
        throw new Error('Room code already exists');
      }

      const response = await fetch('/api/v1/waiting-rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          room_code: data.room_code.toUpperCase(),
          hospital_id: hospitalId,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create room');
      }
      return response.json();
    },
    onSuccess: (newRoom) => {
      queryClient.setQueryData(['waiting-rooms', hospitalId], (old: WaitingRoom[]) => [...old, newRoom]);
      setSuccessMessage('Sala creada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setTimeout(() => setError(null), 5000);
    },
  });

  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: async (data: UpdateRoomInput) => {
      const response = await fetch(`/api/v1/waiting-rooms/${data.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          room_code: data.room_code?.toUpperCase(),
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to update room');
      return response.json();
    },
    onSuccess: (updatedRoom) => {
      queryClient.setQueryData(['waiting-rooms', hospitalId], (old: WaitingRoom[]) =>
        old.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
      );
      setSuccessMessage('Sala actualizada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
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
    onSuccess: (_, deletedRoomId) => {
      queryClient.setQueryData(['waiting-rooms', hospitalId], (old: WaitingRoom[]) =>
        old.filter((r) => r.id !== deletedRoomId)
      );
      setSuccessMessage('Sala eliminada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  // Pause room mutation
  const pauseRoomMutation = useMutation({
    mutationFn: async (data: { roomId: string; reason?: string }) => {
      const response = await fetch(`/api/v1/waiting-rooms/${data.roomId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pause_reason: data.reason,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to pause room');
      return response.json();
    },
    onSuccess: (updatedRoom) => {
      queryClient.setQueryData(['waiting-rooms', hospitalId], (old: WaitingRoom[]) =>
        old.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
      );
      setSuccessMessage('Sala pausada');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  // Resume room mutation
  const resumeRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetch(`/api/v1/waiting-rooms/${roomId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to resume room');
      return response.json();
    },
    onSuccess: (updatedRoom) => {
      queryClient.setQueryData(['waiting-rooms', hospitalId], (old: WaitingRoom[]) =>
        old.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
      );
      setSuccessMessage('Sala reactivada');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  // Assign clinic to room
  const assignClinicMutation = useMutation({
    mutationFn: async (data: { roomId: string; clinicId: string }) => {
      const response = await fetch(`/api/v1/waiting-rooms/${data.roomId}/assign-clinic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinic_id: data.clinicId,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to assign clinic');
      return response.json();
    },
    onSuccess: (updatedRoom) => {
      queryClient.setQueryData(['waiting-rooms', hospitalId], (old: WaitingRoom[]) =>
        old.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
      );
      setSuccessMessage('Consultorio asignado');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  // Get room by ID
  const getRoomById = useCallback(
    (roomId: string): WaitingRoom | undefined => {
      return rooms.find((r) => r.id === roomId);
    },
    [rooms]
  );

  // Get occupancy percentage
  const getRoomOccupancyPercent = useCallback(
    (roomId: string): number => {
      const room = getRoomById(roomId);
      if (!room) return 0;
      return Math.round((room.current_count / room.max_capacity) * 100);
    },
    [getRoomById]
  );

  // Get room status
  const getRoomStatus = useCallback(
    (roomId: string): RoomStatus => {
      const room = getRoomById(roomId);
      if (!room) return 'inactive';
      if (!room.is_active) return 'inactive';
      if (room.is_paused) return 'paused';
      return 'active';
    },
    [getRoomById]
  );

  // Get rooms by type
  const getRoomsByType = useCallback(
    (type: RoomType): WaitingRoom[] => {
      return rooms.filter((r) => r.room_type === type);
    },
    [rooms]
  );

  // Get available rooms (not at capacity)
  const getAvailableRooms = useCallback((): WaitingRoom[] => {
    return rooms.filter((r) => r.is_active && !r.is_paused && r.current_count < r.max_capacity);
  }, [rooms]);

  // Get full rooms (at capacity)
  const getFullRooms = useCallback((): WaitingRoom[] => {
    return rooms.filter((r) => r.current_count >= r.max_capacity);
  }, [rooms]);

  return {
    // Data
    rooms,

    // Loading/Error states
    isLoading,
    isFetching,
    error,
    successMessage,

    // Mutations
    createRoom: createRoomMutation.mutate,
    updateRoom: updateRoomMutation.mutate,
    deleteRoom: deleteRoomMutation.mutate,
    pauseRoom: pauseRoomMutation.mutate,
    resumeRoom: resumeRoomMutation.mutate,
    assignClinic: assignClinicMutation.mutate,

    // Mutation states
    isCreating: createRoomMutation.isPending,
    isUpdating: updateRoomMutation.isPending,
    isDeleting: deleteRoomMutation.isPending,
    isPausing: pauseRoomMutation.isPending,
    isResuming: resumeRoomMutation.isPending,
    isAssigning: assignClinicMutation.isPending,

    // Helper functions
    getRoomById,
    getRoomOccupancyPercent,
    getRoomStatus,
    getRoomsByType,
    getAvailableRooms,
    getFullRooms,
  };
};
