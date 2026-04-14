// WEEK 12 ADMIN 2: Waiting Rooms
// Hook: useWaitingQueue
// Purpose: Queue operations - CRUD, position, wait calculations
// Status: Production-ready

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';

export interface QueueEntry {
  id: string;
  queue_number: string;
  patient_id: string;
  patient_name: string;
  room_id: string;
  priority_level: 'critical' | 'high' | 'normal' | 'low';
  queued_at: string;
  called_at: string | null;
  attended_at: string | null;
  completed_at: string | null;
  estimated_wait_minutes: number;
  actual_wait_minutes: number | null;
  clinic_id: string;
  clinic_name: string;
  consultation_type: string;
  no_show?: boolean;
  no_show_reason?: string;
}

export interface QueueStats {
  total_in_queue: number;
  total_critical: number;
  total_high: number;
  total_normal: number;
  total_low: number;
  avg_wait_time: number;
  max_wait_time: number;
  min_wait_time: number;
  next_patient?: QueueEntry | null;
}

export interface UseWaitingQueueOptions {
  roomId: string;
  autoRefresh?: number;
  enabled?: boolean;
}

/**
 * Hook for managing waiting queue operations
 * - Fetch queue data with auto-refresh
 * - Calculate position and wait times
 * - Add/remove/update entries
 * - Mark attended/no-show
 * - Get next patient
 */
export const useWaitingQueue = ({
  roomId,
  autoRefresh = 2000,
  enabled = true,
}: UseWaitingQueueOptions) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch queue data
  const { data: queue = [], isLoading, isFetching } = useQuery<QueueEntry[]>({
    queryKey: ['waiting-queue', roomId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/v1/waiting-rooms/${roomId}/queue`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch queue');
        return response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    enabled,
    refetchInterval: autoRefresh,
    staleTime: autoRefresh - 500,
  });

  // Fetch stats
  const { data: stats } = useQuery<QueueStats>({
    queryKey: ['waiting-stats', roomId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/waiting-rooms/${roomId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled,
    refetchInterval: autoRefresh,
    staleTime: autoRefresh - 500,
  });

  // Calculate position in queue for specific patient
  const getPositionInQueue = useCallback(
    (patientId: string): number => {
      const index = queue.findIndex((entry) => entry.patient_id === patientId && !entry.completed_at);
      return index === -1 ? -1 : index + 1;
    },
    [queue]
  );

  // Get next patient
  const getNextPatient = useCallback((): QueueEntry | null => {
    const sortedQueue = [...queue]
      .filter((entry) => !entry.called_at && !entry.completed_at && !entry.no_show)
      .sort((a, b) => {
        // Sort by priority
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority_level] - priorityOrder[b.priority_level];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by queued_at (FIFO within priority)
        return new Date(a.queued_at).getTime() - new Date(b.queued_at).getTime();
      });

    return sortedQueue.length > 0 ? sortedQueue[0] : null;
  }, [queue]);

  // Calculate wait time
  const calculateWaitTime = useCallback((entry: QueueEntry): number => {
    const now = new Date();
    const queuedTime = new Date(entry.queued_at);
    return Math.floor((now.getTime() - queuedTime.getTime()) / 60000); // minutes
  }, []);

  // Queue entry mutations
  const addToQueueMutation = useMutation({
    mutationFn: async (data: Omit<QueueEntry, 'id'>) => {
      const response = await fetch(`/api/v1/waiting-rooms/${roomId}/queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add patient to queue');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', roomId] });
      queryClient.invalidateQueries({ queryKey: ['waiting-stats', roomId] });
    },
  });

  const callNextMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await fetch(`/api/v1/waiting-queue/${patientId}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Failed to call patient');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', roomId] });
      queryClient.invalidateQueries({ queryKey: ['waiting-stats', roomId] });
    },
  });

  const markAttendedMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await fetch(`/api/v1/waiting-queue/${patientId}/attended`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Failed to mark attended');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', roomId] });
      queryClient.invalidateQueries({ queryKey: ['waiting-stats', roomId] });
    },
  });

  const markNoShowMutation = useMutation({
    mutationFn: async (data: { patientId: string; reason: string }) => {
      const response = await fetch(`/api/v1/waiting-queue/${data.patientId}/no-show`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: data.reason, timestamp: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Failed to mark no-show');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', roomId] });
      queryClient.invalidateQueries({ queryKey: ['waiting-stats', roomId] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await fetch(`/api/v1/waiting-queue/${patientId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Failed to complete entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', roomId] });
      queryClient.invalidateQueries({ queryKey: ['waiting-stats', roomId] });
    },
  });

  const escalatePriorityMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await fetch(`/api/v1/waiting-queue/${patientId}/escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to escalate priority');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-queue', roomId] });
      queryClient.invalidateQueries({ queryKey: ['waiting-stats', roomId] });
    },
  });

  // Compute derived data
  const queueStats = useMemo(() => {
    const activeQueue = queue.filter((e) => !e.completed_at && !e.no_show);
    const criticalCount = activeQueue.filter((e) => e.priority_level === 'critical').length;
    const highCount = activeQueue.filter((e) => e.priority_level === 'high').length;
    const normalCount = activeQueue.filter((e) => e.priority_level === 'normal').length;
    const lowCount = activeQueue.filter((e) => e.priority_level === 'low').length;
    const avgWait =
      activeQueue.length > 0
        ? Math.round(activeQueue.reduce((sum, e) => sum + calculateWaitTime(e), 0) / activeQueue.length)
        : 0;

    return {
      totalActive: activeQueue.length,
      criticalCount,
      highCount,
      normalCount,
      lowCount,
      avgWait,
    };
  }, [queue, calculateWaitTime]);

  return {
    // Data
    queue,
    stats,
    queueStats,

    // Loading states
    isLoading,
    isFetching,
    error,

    // Calculations
    getPositionInQueue,
    getNextPatient,
    calculateWaitTime,

    // Mutations
    addToQueue: addToQueueMutation.mutate,
    callNext: callNextMutation.mutate,
    markAttended: markAttendedMutation.mutate,
    markNoShow: markNoShowMutation.mutate,
    complete: completeMutation.mutate,
    escalatePriority: escalatePriorityMutation.mutate,

    // Mutation states
    isAdding: addToQueueMutation.isPending,
    isCalling: callNextMutation.isPending,
    isMarkingAttended: markAttendedMutation.isPending,
    isMarkingNoShow: markNoShowMutation.isPending,
  };
};
