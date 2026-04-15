// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ============================================================================
// ASIS 13: useThalamusSync Hook
// Propósito: Gestionar sincronización de HME con THALAMUS central
// NEW: Integración general de datos (no solo epidemiología)
// Líneas: ~450
// ============================================================================

interface ThalamusSyncStatus {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSync: string | null;
  syncHash: string | null;
  errorMessage?: string;
}

interface CrossHospitalRecord {
  hospital_id: string;
  hospital_name: string;
  encounter_count: number;
  last_encounter_date: string;
  primary_diagnoses: string[];
}

interface ThalamusPatientMPI {
  id: string;
  name: string;
  birthdate: string;
  national_id: string;
  hospital_registrations: Array<{
    hospital: string;
    local_id: string;
    date_registered: string;
  }>;
  consolidated_problems: string[];
  consolidated_medications: string[];
}

export function useThalamusSync(patientId: string, hospitalId: string) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch cross-hospital data from THALAMUS
  const crossHospitalQuery = useQuery({
    queryKey: ['thalamus-cross-hospital', patientId],
    queryFn: async () => {
      try {
        const response = await fetch(
          `/api/thalamus/query-cross-hospital?patient_id=${patientId}&current_hospital=${hospitalId}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }
        );

        if (!response.ok) throw new Error('Query failed');
        const data = await response.json();
        return data as CrossHospitalRecord[];
      } catch (error) {
        console.error('Failed to query THALAMUS:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch Patient Master Index (PMI)
  const patientsQuery = useQuery({
    queryKey: ['thalamus-pmi', patientId],
    queryFn: async () => {
      try {
        const response = await fetch(
          `/api/thalamus/patient-mpi?patient_id=${patientId}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }
        );

        if (!response.ok) return null;
        return (await response.json()) as ThalamusPatientMPI;
      } catch (error) {
        console.error('Failed to fetch PMI:', error);
        return null;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Mutation: Sync EHR to THALAMUS
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      setSyncStatus('syncing');

      try {
        // Step 1: Prepare EHR for THALAMUS (ENCRYPT sensitive data)
        const prepareResponse = await fetch(`/api/ehr/${patientId}/prepare-thalamus-sync`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!prepareResponse.ok) throw new Error('Preparation failed');
        const { sync_hash } = await prepareResponse.json();

        // Step 2: Push to THALAMUS
        const pushResponse = await fetch(`/api/thalamus/sync-ehr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            ehr_id: patientId,
            sync_hash,
            hospital_source: hospitalId,
            sync_type: 'delta', // delta = only new/changed data
            timestamp: new Date().toISOString()
          })
        });

        if (!pushResponse.ok) throw new Error('Push to THALAMUS failed');

        const syncResult = await pushResponse.json();

        // Step 3: Update local EHR with THALAMUS metadata
        await supabase
          .from('electronic_health_record')
          .update({
            thalamus_synced_at: new Date().toISOString(),
            thalamus_sync_status: 'synced'
          })
          .eq('patient_id', patientId);

        setSyncStatus('synced');
        setLastSync(new Date().toLocaleString());
        setIsSyncing(false);

        return syncResult;
      } catch (error) {
        setSyncStatus('error');
        setIsSyncing(false);
        throw error;
      }
    }
  });

  // Mutation: Request transfer coordination
  const transferMutation = useMutation({
    mutationFn: async (toHospitalId: string, reason: string) => {
      const response = await fetch(`/api/thalamus/coordinate-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          patient_id: patientId,
          from_hospital: hospitalId,
          to_hospital: toHospitalId,
          reason,
          clinical_urgency: 'routine'
        })
      });

      if (!response.ok) throw new Error('Transfer coordination failed');
      return response.json();
    }
  });

  // Mutation: Query patient in THALAMUS
  const queryPatientMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/thalamus/query-patient?national_id=${patientId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Query failed');
      return response.json();
    }
  });

  // Auto-sync whenever EHR changes (optional - can be controlled)
  useEffect(() => {
    // Don't auto-sync by default, let user control it
    // This prevents excessive API calls
  }, [patientId, hospitalId]);

  // Helper: Get time since last sync
  const getTimeSinceLastSync = (): string | null => {
    if (!lastSync) return null;

    const now = new Date();
    const last = new Date(lastSync);
    const diffMs = now.getTime() - last.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) return `${diffDays} days ago`;
    if (diffHours > 0) return `${diffHours} hours ago`;
    if (diffMins > 0) return `${diffMins} minutes ago`;
    return 'just now';
  };

  const initiateSync = useCallback(async () => {
    return syncMutation.mutateAsync();
  }, []);

  const initiateTransfer = useCallback(async (toHospitalId: string, reason: string) => {
    return transferMutation.mutateAsync(toHospitalId, reason);
  }, []);

  const queryCrossHospitalHistory = useCallback(async () => {
    return queryPatientMutation.mutateAsync();
  }, []);

  return {
    // Sync status
    syncStatus,
    lastSync: getTimeSinceLastSync(),
    isSyncing,
    
    // Cross-hospital data
    crossHospitalData: crossHospitalQuery.data || [],
    patientMPI: patientsQuery.data,
    
    // Loading states
    isLoading: crossHospitalQuery.isLoading || patientsQuery.isLoading,
    error: syncMutation.error || crossHospitalQuery.error,
    
    // Methods
    initiateSync,
    initiateTransfer,
    queryCrossHospitalHistory,
    refetch: async () => {
      await crossHospitalQuery.refetch();
      await patientsQuery.refetch();
    },
    
    // Direct access for advanced use cases
    syncMutation,
    transferMutation,
    queryPatientMutation,
    
    // Helper: Check if needs sync
    needsSync: () => {
      if (!lastSync) return true;
      const lastSyncDate = new Date(lastSync);
      const now = new Date();
      const diffHours = (now.getTime() - lastSyncDate.getTime()) / 3600000;
      return diffHours > 1; // Recomendado cada hora
    }
  };
}
