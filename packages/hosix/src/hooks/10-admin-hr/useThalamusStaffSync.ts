// WEEK 11 ADMIN 1: Custom Hooks
// Hook: useThalamusStaffSync
// Purpose: [OPTIONAL] Sync staff data to THALAMUS (cross-hospital visibility)
// Note: NO BLOCKING - system works independently without this

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export interface ThalamusSyncStatus {
  last_sync: string | null;
  sync_status: 'never' | 'synced' | 'syncing' | 'error';
  last_error?: string;
  hospitals_synced: number;
}

export interface CrossHospitalStaff {
  id: string;
  hospital_id: string;
  hospital_name: string;
  full_name: string;
  position: string;
  department: string;
  is_available: boolean;
  specialties?: string[];
}

interface UseThalamusSyncReturn {
  // Query
  syncStatus: ThalamusSyncStatus | undefined;
  syncLoading: boolean;
  syncError: Error | null;
  crossHospitalStaff: CrossHospitalStaff[] | undefined;
  crossHospitalLoading: boolean;

  // Mutations
  syncStaffToThalamus: () => Promise<{ success: boolean; message: string }>;
  queryCrossHospitalStaff: (department?: string) => Promise<CrossHospitalStaff[]>;
  getStaffAvailabilityBySpecialty: (specialty: string) => Promise<CrossHospitalStaff[]>;

  // State
  isSyncing: boolean;
  syncError: Error | null;
}

export const useThalamusStaffSync = (): UseThalamusSyncReturn => {
  const queryClient = useQueryClient();
  const [manualSyncStatus, setManualSyncStatus] = useState<'idle' | 'syncing' | 'error'>(
    'idle'
  );

  // Fetch THALAMUS sync status
  const { data: syncStatus, isLoading: syncLoading, error: syncError } = useQuery<
    ThalamusSyncStatus
  >({
    queryKey: ['thalamus-sync-status'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/hr/thalamus/sync-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (!response.ok) {
          // If THALAMUS is unavailable, return graceful degradation
          return {
            last_sync: null,
            sync_status: 'error' as const,
            hospitals_synced: 0,
            last_error: 'THALAMUS unavailable (system operates independently)',
          };
        }
        return response.json();
      } catch (err) {
        // NO BLOCKING - system works without THALAMUS
        return {
          last_sync: null,
          sync_status: 'error' as const,
          hospitals_synced: 0,
          last_error: 'THALAMUS connection failed (non-critical)',
        };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry - this is optional
  });

  // Fetch cross-hospital staff
  const { data: crossHospitalStaff, isLoading: crossHospitalLoading } = useQuery<
    CrossHospitalStaff[]
  >({
    queryKey: ['cross-hospital-staff'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/hr/thalamus/cross-hospital-staff', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (!response.ok) return [];
        return response.json();
      } catch (err) {
        // Graceful degradation - return empty if THALAMUS unavailable
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
    enabled: syncStatus?.sync_status !== 'error', // Only enable if sync is working
  });

  // Sync Staff to THALAMUS
  const syncMutation = useMutation({
    mutationFn: async () => {
      setManualSyncStatus('syncing');
      try {
        const response = await fetch('/api/v1/hr/thalamus/sync-staff', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to sync staff to THALAMUS');
        }

        setManualSyncStatus('idle');
        return response.json();
      } catch (error) {
        setManualSyncStatus('error');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thalamus-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['cross-hospital-staff'] });
    },
  });

  // Query Cross-Hospital Staff by Department
  const queryMutation = useMutation({
    mutationFn: async (department?: string) => {
      try {
        const params = department ? `?department=${department}` : '';
        const response = await fetch(`/api/v1/hr/thalamus/staff-by-department${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (!response.ok) return [];
        return response.json();
      } catch (err) {
        return [];
      }
    },
    retry: false,
  });

  // Query Availability by Specialty
  const specialtyMutation = useMutation({
    mutationFn: async (specialty: string) => {
      try {
        const response = await fetch(`/api/v1/hr/thalamus/staff-by-specialty?specialty=${specialty}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (!response.ok) return [];
        return response.json();
      } catch (err) {
        return [];
      }
    },
    retry: false,
  });

  return {
    // Query
    syncStatus,
    syncLoading,
    syncError: syncError as Error | null,
    crossHospitalStaff: crossHospitalStaff || [],
    crossHospitalLoading,

    // Mutations
    syncStaffToThalamus: async () => {
      const result = await syncMutation.mutateAsync();
      return result;
    },

    queryCrossHospitalStaff: async (department?: string) => {
      const result = await queryMutation.mutateAsync(department);
      return result;
    },

    getStaffAvailabilityBySpecialty: async (specialty: string) => {
      const result = await specialtyMutation.mutateAsync(specialty);
      return result;
    },

    // State
    isSyncing: syncMutation.isPending || manualSyncStatus === 'syncing',
    syncError: syncMutation.error as Error | null,
  };
};

export default useThalamusStaffSync;
