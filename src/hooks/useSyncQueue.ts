/**
 * useSyncQueue - Hook for managing sync queue operations
 * FASE A3: Allow components to add/track items in sync queue
 * 
 * Usage:
 * ```tsx
 * const { pending, addToQueue, syncNow } = useSyncQueue(hospitalId);
 * 
 * // Add change to sync queue
 * await addToQueue({
 *   tabla: 'admisiones',
 *   accion: 'INSERT',
 *   datos: { nombre: 'Juan PÃ©rez' }
 * });
 * 
 * // Check pending items
 * console.log(pending); // Array of SyncQueueItem
 * 
 * // Trigger immediate sync
 * await syncNow();
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import {
  SyncQueueItem,
  SyncStatus,
  SyncResult,
} from '@/types/sync';

interface AddToQueueParams {
  tabla: string;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  registro_id?: string;  // Optional for INSERT (can be generated)
  datos: Record<string, any>;
}

export const useSyncQueue = (hospital_id: string) => {
  const queryClient = useQueryClient();

  /**
   * Query: Get all PENDING items from sync_queue
   * Refetches every 5 seconds to stay current
   */
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['sync_queue_pending', hospital_id],
    queryFn: async (): Promise<SyncQueueItem[]> => {
      try {
        const { data, error } = await supabase
          .from('sync_queue')
          .select('*')
          .eq('hospital_id', hospital_id)
          .eq('estado', 'PENDING')
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) {
          console.error('Error fetching sync queue:', error);
          return [];
        }

        return data || [];
      } catch (err) {
        console.error('Error in useSyncQueue query:', err);
        return [];
      }
    },
    refetchInterval: 5000,  // Refetch every 5 seconds
    enabled: !!hospital_id,
  });

  /**
   * Mutation: Add item to sync queue
   * Called when user creates/updates/deletes a record
   */
  const addToQueueMutation = useMutation({
    mutationFn: async (params: AddToQueueParams) => {
      const { tabla, accion, registro_id, datos } = params;

      const newItem: Omit<SyncQueueItem, 'created_at' | 'updated_at'> = {
        id: crypto.randomUUID(),
        hospital_id,
        tabla,
        accion,
        registro_id: registro_id || crypto.randomUUID(),
        datos,
        estado: 'PENDING',
        intento: 0,
      };

      const { error } = await supabase
        .from('sync_queue')
        .insert([newItem]);

      if (error) throw error;
      return newItem;
    },
    onSuccess: () => {
      // Invalidate pending items query to refetch immediately
      queryClient.invalidateQueries({
        queryKey: ['sync_queue_pending', hospital_id],
      });
      
      // Invalidate status query
      queryClient.invalidateQueries({
        queryKey: ['sync_status', hospital_id],
      });
    },
    onError: (error) => {
      console.error('Error adding to sync queue:', error);
    },
  });

  /**
   * Mutation: Mark item as synced
   * Called after Edge Function successfully processes it
   */
  const markSyncedMutation = useMutation({
    mutationFn: async (queueId: string) => {
      const { error } = await supabase
        .from('sync_queue')
        .update({
          estado: 'SYNCED' as SyncStatus,
          synced_at: new Date().toISOString(),
        })
        .eq('id', queueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sync_queue_pending', hospital_id],
      });
    },
  });

  /**
   * Mutation: Mark item as error
   * Called if sync fails
   */
  const markErrorMutation = useMutation({
    mutationFn: async (queueId: string, errorMsg: string) => {
      const { data: currentItem } = await supabase
        .from('sync_queue')
        .select('intento')
        .eq('id', queueId)
        .single();

      const nextIntento = (currentItem?.intento || 0) + 1;

      const { error } = await supabase
        .from('sync_queue')
        .update({
          estado: 'ERROR' as SyncStatus,
          intento: nextIntento,
          error_mensaje: errorMsg,
        })
        .eq('id', queueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sync_queue_pending', hospital_id],
      });
    },
  });

  /**
   * Function: Trigger manual sync
   * Calls Edge Function to process queue
   */
  const syncNow = async (): Promise<SyncResult> => {
    try {
      const response = await fetch('/api/sync_process_queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status ${response.status}`);
      }

      const result: SyncResult = await response.json();

      // Refetch after successful sync
      queryClient.invalidateQueries({
        queryKey: ['sync_queue_pending', hospital_id],
      });

      return result;
    } catch (error) {
      console.error('Error in syncNow:', error);
      throw error;
    }
  };

  /**
   * Listen for hospital changes and invalidate
   */
  useEffect(() => {
    const handleHospitalChange = () => {
      queryClient.invalidateQueries({
        queryKey: ['sync_queue_pending', hospital_id],
      });
    };

    window.addEventListener('hospital-changed', handleHospitalChange);
    return () => {
      window.removeEventListener('hospital-changed', handleHospitalChange);
    };
  }, [hospital_id, queryClient]);

  return {
    // Query state
    pending,
    isLoading,
    pendingCount: pending.length,

    // Mutations
    addToQueue: addToQueueMutation.mutate,
    addToQueueAsync: addToQueueMutation.mutateAsync,
    markSynced: markSyncedMutation.mutate,
    markSyncedAsync: markSyncedMutation.mutateAsync,
    markError: markErrorMutation.mutate,
    markErrorAsync: markErrorMutation.mutateAsync,

    // Manual sync
    syncNow,
    isSyncing: addToQueueMutation.isPending,

    // Status
    isError: addToQueueMutation.isError,
    error: addToQueueMutation.error,
  };
};

export default useSyncQueue;

