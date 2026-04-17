import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface FederatedFacility {
  facility_id: string;
  facility_name: string;
  facility_code: string;
  federation_status: 'active' | 'pending' | 'suspended' | 'inactive';
  api_key_hash: string;
  last_sync: string;
  sync_frequency_hours: number;
  data_access_level: 'read_only' | 'read_write' | 'admin';
}

export interface PatientDataSync {
  sync_id: string;
  patient_id: string;
  source_facility_id: string;
  target_facility_id: string;
  sync_date: string;
  data_categories: string[];
  conflict_detected: boolean;
  conflict_resolution_status?: 'resolved' | 'pending' | 'escalated';
  sync_status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface FederationAudit {
  audit_id: string;
  event_type: 'patient_sync' | 'facility_connection' | 'data_access' | 'conflict_resolution' | 'policy_sync';
  source_facility_id: string;
  target_facility_id?: string;
  record_id: string;
  action: string;
  timestamp: string;
  user_id: string;
  ip_address?: string;
  status: 'success' | 'failure';
  details: Record<string, unknown>;
}

export interface DataConflict {
  conflict_id: string;
  patient_id: string;
  data_type: string;
  source_facility_id: string;
  target_facility_id: string;
  source_value: unknown;
  target_value: unknown;
  conflict_date: string;
  resolution_status: 'unresolved' | 'resolved_source' | 'resolved_target' | 'resolved_merge';
  resolved_value?: unknown;
  resolution_date?: string;
}

export const useFederation = () => {
  const registerFacility = async (
    facility: Omit<FederatedFacility, 'facility_id' | 'api_key_hash' | 'last_sync'>
  ): Promise<FederatedFacility | null> => {
    try {
      const federatedFacility: FederatedFacility = {
        facility_id: `FAC-${Date.now()}`,
        ...facility,
        api_key_hash: `hash_${Date.now()}`,
        last_sync: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('federated_facilities')
        .insert([federatedFacility])
        .select();

      if (error) throw error;

      await supabase.from('federation_audit_trail').insert([
        {
          audit_id: `AUD-${Date.now()}`,
          event_type: 'facility_connection',
          source_facility_id: 'SYSTEM',
          target_facility_id: data?.[0]?.facility_id,
          record_id: data?.[0]?.facility_id,
          action: `Registered facility: ${facility.facility_name}`,
          timestamp: new Date().toISOString(),
          user_id: 'system',
          status: 'success',
          details: { federation_status: facility.federation_status },
        },
      ]);

      return data?.[0] || federatedFacility;
    } catch (error) {
      console.error('Error registering facility:', error);
      return null;
    }
  };

  const syncPatientData = async (
    sync: Omit<PatientDataSync, 'sync_id' | 'sync_status'>
  ): Promise<PatientDataSync | null> => {
    try {
      const patientDataSync: PatientDataSync = {
        sync_id: `SYNC-${Date.now()}`,
        ...sync,
        sync_status: 'in_progress',
      };

      const { data, error } = await supabase
        .from('patient_data_syncs')
        .insert([patientDataSync])
        .select();

      if (error) throw error;

      // Simulate checking for conflicts
      const hasConflict = Math.random() > 0.8;

      if (hasConflict) {
        await supabase.from('data_conflicts').insert([
          {
            conflict_id: `CONF-${Date.now()}`,
            patient_id: sync.patient_id,
            data_type: 'medical_history',
            source_facility_id: sync.source_facility_id,
            target_facility_id: sync.target_facility_id,
            source_value: { visit_date: '2025-02-20' },
            target_value: { visit_date: '2025-02-21' },
            conflict_date: new Date().toISOString(),
            resolution_status: 'unresolved',
          },
        ]);
      }

      // Update sync status to completed
      await supabase
        .from('patient_data_syncs')
        .update({ sync_status: 'completed' })
        .eq('sync_id', data?.[0]?.sync_id);

      // Log in federation audit trail
      await supabase.from('federation_audit_trail').insert([
        {
          audit_id: `AUD-${Date.now()}`,
          event_type: 'patient_sync',
          source_facility_id: sync.source_facility_id,
          target_facility_id: sync.target_facility_id,
          record_id: sync.patient_id,
          action: `Patient data synced: ${sync.data_categories.join(', ')}`,
          timestamp: new Date().toISOString(),
          user_id: 'system',
          status: 'success',
          details: {
            conflict_detected: hasConflict,
            categories_count: sync.data_categories.length,
          },
        },
      ]);

      return data?.[0] || patientDataSync;
    } catch (error) {
      console.error('Error syncing patient data:', error);
      return null;
    }
  };

  const getFacilityList = async (
    filter?: 'active' | 'all'
  ): Promise<FederatedFacility[]> => {
    try {
      let query = supabase.from('federated_facilities').select('*');

      if (filter === 'active') {
        query = query.eq('federation_status', 'active');
      }

      const { data, error } = await query.order('facility_name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting facility list:', error);
      return [];
    }
  };

  const getDataConflicts = async (): Promise<DataConflict[]> => {
    try {
      const { data, error } = await supabase
        .from('data_conflicts')
        .select('*')
        .eq('resolution_status', 'unresolved')
        .order('conflict_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting data conflicts:', error);
      return [];
    }
  };

  const resolveConflict = async (
    conflictId: string,
    resolution: 'source' | 'target' | 'merge',
    mergedValue?: unknown
  ): Promise<boolean> => {
    try {
      const resolutionStatus =
        resolution === 'source'
          ? 'resolved_source'
          : resolution === 'target'
            ? 'resolved_target'
            : 'resolved_merge';

      const { error } = await supabase
        .from('data_conflicts')
        .update({
          resolution_status: resolutionStatus,
          resolved_value: mergedValue,
          resolution_date: new Date().toISOString(),
        })
        .eq('conflict_id', conflictId);

      if (error) throw error;

      // Get conflict details for audit
      const { data: conflict } = await supabase
        .from('data_conflicts')
        .select('*')
        .eq('conflict_id', conflictId)
        .single();

      if (conflict) {
        await supabase.from('federation_audit_trail').insert([
          {
            audit_id: `AUD-${Date.now()}`,
            event_type: 'conflict_resolution',
            source_facility_id: conflict.source_facility_id,
            target_facility_id: conflict.target_facility_id,
            record_id: conflictId,
            action: `Conflict resolved using ${resolution} value`,
            timestamp: new Date().toISOString(),
            user_id: 'system',
            status: 'success',
            details: { resolution_type: resolution },
          },
        ]);
      }

      return true;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return false;
    }
  };

  const syncRLSPolicies = async (sourceFacilityId: string): Promise<boolean> => {
    try {
      // Get current RLS policies from source facility
      const { data: policies, error: policyError } = await supabase
        .from('rls_policies')
        .select('*')
        .eq('facility_id', sourceFacilityId);

      if (policyError) throw policyError;

      // Get list of target facilities
      const { data: targetFacilities, error: facilityError } = await supabase
        .from('federated_facilities')
        .select('facility_id')
        .neq('facility_id', sourceFacilityId)
        .eq('federation_status', 'active');

      if (facilityError) throw facilityError;

      // Apply policies to each target facility
      for (const facility of targetFacilities || []) {
        // Simulate policy application
        await supabase.from('federation_audit_trail').insert([
          {
            audit_id: `AUD-${Date.now()}`,
            event_type: 'policy_sync',
            source_facility_id: sourceFacilityId,
            target_facility_id: facility.facility_id,
            record_id: `POL-${Date.now()}`,
            action: `RLS policies synced: ${policies?.length || 0} policies`,
            timestamp: new Date().toISOString(),
            user_id: 'system',
            status: 'success',
            details: { policy_count: policies?.length || 0 },
          },
        ]);
      }

      return true;
    } catch (error) {
      console.error('Error syncing RLS policies:', error);
      return false;
    }
  };

  const getFederationAudit = async (
    eventType?: string,
    daysBack?: number
  ): Promise<FederationAudit[]> => {
    try {
      const startDate =
        daysBack > 0
          ? new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

      let query = supabase.from('federation_audit_trail').select('*');

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      const { data, error } = await query.order('timestamp', { ascending: false }).limit(100);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting federation audit:', error);
      return [];
    }
  };

  const getFederationMetrics = async () => {
    try {
      const { data: facilities, error: facilityError } = await supabase
        .from('federated_facilities')
        .select('federation_status');

      const { data: syncs, error: syncError } = await supabase
        .from('patient_data_syncs')
        .select('sync_status');

      const { data: conflicts, error: conflictError } = await supabase
        .from('data_conflicts')
        .select('resolution_status');

      if (facilityError || syncError || conflictError) {
        throw facilityError || syncError || conflictError;
      }

      const facilitiesData = facilities || [];
      const syncsData = syncs || [];
      const conflictsData = conflicts || [];

      return {
        total_facilities: facilitiesData.length,
        active_facilities: facilitiesData.filter((f) => f.federation_status === 'active').length,
        pending_facilities: facilitiesData.filter(
          (f) => f.federation_status === 'pending'
        ).length,
        total_syncs: syncsData.length,
        completed_syncs: syncsData.filter((s) => s.sync_status === 'completed').length,
        failed_syncs: syncsData.filter((s) => s.sync_status === 'failed').length,
        total_conflicts: conflictsData.length,
        unresolved_conflicts: conflictsData.filter(
          (c) => c.resolution_status === 'unresolved'
        ).length,
        resolved_conflicts: conflictsData.filter(
          (c) => c.resolution_status !== 'unresolved'
        ).length,
      };
    } catch (error) {
      console.error('Error getting federation metrics:', error);
      return null;
    }
  };

  return {
    registerFacility,
    syncPatientData,
    getFacilityList,
    getDataConflicts,
    resolveConflict,
    syncRLSPolicies,
    getFederationAudit,
    getFederationMetrics,
  };
};
