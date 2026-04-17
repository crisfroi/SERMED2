/**
 * useSyncStatus - Hook for real-time sync queue status
 * FASE A3: Show sync progress in UI (toast, badge, dashboard)
 *
 * Usage:
 * ```tsx
 * const { pending, processing, errors, conflicts, lastSync } = useSyncStatus(hospitalId);
 *
 * return (
 *   <div>
 *     <SyncBadge pending={pending} errors={errors} conflicts={conflicts} />
 *     {pending > 0 && <span>Syncing {pending} items...</span>}
 *   </div>
 * );
 * ```
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SyncStatusSnapshot } from '@/types/sync';

export const useSyncStatus = (hospital_id: string) => {
  const queryClient = useQueryClient();

  /**
   * Query: Get current sync status (count of items by estado)
   * Refetches every 10 seconds
   */
  const { data: status, isLoading } = useQuery({
    queryKey: ['sync_status', hospital_id],
    queryFn: async (): Promise<SyncStatusSnapshot> => {
      try {
        // Get counts by estado
        const { data: counts, error: countError } = await supabase
          .from('sync_queue')
          .select('estado, count', { count: 'exact' })
          .eq('hospital_id', hospital_id)
          .in('estado', ['PENDING', 'PROCESSING', 'ERROR', 'CONFLICT']);

        if (countError) throw countError;

        // Get last successful sync
        const { data: logs, error: logError } = await supabase
          .from('sync_log')
          .select('created_at, duracion_ms')
          .eq('hospital_id', hospital_id)
          .eq('operacion', 'PROCESS_QUEUE')
          .order('created_at', { ascending: false })
          .limit(1);

        if (logError) throw logError;

        // Structure response
        const countMap = new Map();
        counts?.forEach((row: any) => {
          countMap.set(row.estado, row.count);
        });

        return {
          pending: countMap.get('PENDING') || 0,
          processing: countMap.get('PROCESSING') || 0,
          errors: countMap.get('ERROR') || 0,
          conflicts: countMap.get('CONFLICT') || 0,
          lastSync: logs?.[0]?.created_at,
          hospital_id,
        };
      } catch (err) {
        console.error('Error fetching sync status:', err);
        return {
          pending: 0,
          processing: 0,
          errors: 0,
          conflicts: 0,
          hospital_id,
        };
      }
    },
    refetchInterval: 10000,  // Refetch every 10 seconds
    enabled: !!hospital_id,
  });

  /**
   * Subscribe to real-time updates via Supabase
   * (More efficient than polling)
   */
  useEffect(() => {
    if (!hospital_id) return;

    const subscription = supabase
      .channel(`sync_queue:hospital_id=eq.${hospital_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_queue',
          filter: `hospital_id=eq.${hospital_id}`,
        },
        (payload) => {
          // Refetch status immediately on change
          queryClient.invalidateQueries({
            queryKey: ['sync_status', hospital_id],
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [hospital_id, queryClient]);

  /**
   * Listen for hospital changes
   */
  useEffect(() => {
    const handleHospitalChange = () => {
      queryClient.invalidateQueries({
        queryKey: ['sync_status', hospital_id],
      });
    };

    window.addEventListener('hospital-changed', handleHospitalChange);
    return () => {
      window.removeEventListener('hospital-changed', handleHospitalChange);
    };
  }, [hospital_id, queryClient]);

  /**
   * Computed values
   */
  const isOnline = !status || (status.pending === 0 && status.processing === 0);
  const totalPending = (status?.pending || 0) + (status?.processing || 0);
  const hasErrors = (status?.errors || 0) > 0;
  const hasConflicts = (status?.conflicts || 0) > 0;
  const isHealthy = !hasErrors && !hasConflicts;

  /**
   * Status badge color
   */
  const statusColor = (): 'green' | 'yellow' | 'red' | 'orange' => {
    if (hasErrors) return 'red';
    if (hasConflicts) return 'orange';
    if (totalPending > 0) return 'yellow';
    return 'green';
  };

  /**
   * Status label
   */
  const statusLabel = (): string => {
    if (!status) return 'Initializing...';
    if (hasErrors) return `${status.errors} sync error${status.errors > 1 ? 's' : ''}`;
    if (hasConflicts) return `${status.conflicts} conflict${status.conflicts > 1 ? 's' : ''}`;
    if (totalPending > 0) return `Syncing ${totalPending} item${totalPending > 1 ? 's' : ''}...`;
    return 'Synced';
  };

  return {
    // Status numbers
    pending: status?.pending || 0,
    processing: status?.processing || 0,
    errors: status?.errors || 0,
    conflicts: status?.conflicts || 0,
    totalPending,

    // Timestamps
    lastSync: status?.lastSync,

    // Computed states
    isOnline,
    isHealthy,
    isSyncing: totalPending > 0,
    hasErrors,
    hasConflicts,

    // UI helpers
    statusColor,
    statusLabel,

    // Loading
    isLoading,

    // Full status object
    status,
  };
};

/**
 * SyncStatusBadge - Component to display sync status visually
 * Can be placed in header/sidebar for at-a-glance status
 */
export const SyncStatusBadge: React.FC<{ hospital_id: string }> = ({
  hospital_id,
}) => {
  const { statusColor, statusLabel, hasErrors } = useSyncStatus(hospital_id);

  const colorMap = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    red: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
        border ${colorMap[statusColor()]}
        ${hasErrors ? 'animate-pulse' : ''}
      `}
    >
      <span className="w-2 h-2 bg-current rounded-full"></span>
      {statusLabel()}
    </div>
  );
};

export default useSyncStatus;
