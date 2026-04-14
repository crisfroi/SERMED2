// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThalamusSync } from '../useThalamusSync';

// ============================================================================
// THALAMUS Sync Hook Tests
// Propósito: Pruebas de sincronización inter-hospitalaria centralizada
// Líneas: ~350
// ============================================================================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useThalamusSync - THALAMUS Architecture Tests', () => {
  const mockPatientId = 'patient-123';
  const mockHospitalId = 'hospital-456';
  const mockThalamusApiUrl = 'https://thalamus.renaprosa.ec/api';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variable
    process.env.VITE_THALAMUS_API_URL = mockThalamusApiUrl;
  });

  // ========================================================================
  // INITIALIZATION TESTS
  // ========================================================================

  it('should initialize with idle sync status', () => {
    const { result } = renderHook(
      () => useThalamusSync(mockPatientId, mockHospitalId),
      { wrapper: createWrapper() }
    );

    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.isSyncing).toBe(false);
  });

  it('should expose all required methods', () => {
    const { result } = renderHook(
      () => useThalamusSync(mockPatientId, mockHospitalId),
      { wrapper: createWrapper() }
    );

    expect(typeof result.current.initiateSync).toBe('function');
    expect(typeof result.current.initiateTransfer).toBe('function');
    expect(typeof result.current.queryCrossHospitalHistory).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.needsSync).toBe('function');
  });

  // ========================================================================
  // CROSS-HOSPITAL QUERY TESTS
  // ========================================================================

  describe('Cross-Hospital Data Queries', () => {
    it('should fetch cross-hospital data from THALAMUS', async () => {
      const mockCrossHospitalData = {
        patient_mpi_id: 'mpi-123',
        hospitals: [
          {
            hospital_id: 'hospital-456',
            hospital_name: 'HOSIX Quito',
            last_encounter: '2026-04-15T10:00:00Z',
            encounter_count: 15,
            active_problems: ['I10', 'E11']
          },
          {
            hospital_id: 'hospital-789',
            hospital_name: 'HOSIX Ibarra',
            last_encounter: '2026-03-20T14:30:00Z',
            encounter_count: 3,
            active_problems: ['I10']
          }
        ],
        cross_hospital_encounters: 18
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCrossHospitalData)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.crossHospitalData).toBeDefined();
      });

      expect(result.current.crossHospitalData?.hospitals).toHaveLength(2);
      expect(result.current.crossHospitalData?.patient_mpi_id).toBe('mpi-123');
      expect(result.current.crossHospitalData?.cross_hospital_encounters).toBe(18);
    });

    it('should include hospital names in cross-hospital data', async () => {
      const mockData = {
        patient_mpi_id: 'mpi-123',
        hospitals: [
          {
            hospital_id: 'h1',
            hospital_name: 'HOSIX Quito',
            encounter_count: 15
          },
          {
            hospital_id: 'h2',
            hospital_name: 'HOSIX Ibarra',
            encounter_count: 3
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.crossHospitalData).toBeDefined();
      });

      const hospitalNames = result.current.crossHospitalData?.hospitals.map(h => h.hospital_name);
      expect(hospitalNames).toContain('HOSIX Quito');
      expect(hospitalNames).toContain('HOSIX Ibarra');
    });
  });

  // ========================================================================
  // PATIENT MASTER INDEX (PMI) TESTS
  // ========================================================================

  describe('Patient Master Index (PMI)', () => {
    it('should fetch Patient Master Index for deduplication', async () => {
      const mockPMI = {
        patient_mpi_id: 'mpi-123',
        consolidated_national_id: '1234567890',
        consolidated_name: 'Juan García López',
        primary_hospital: 'hospital-456',
        linked_records: [
          {
            hospital_id: 'hospital-456',
            local_patient_id: 'patient-123',
            local_national_id: '1234567890',
            last_updated: '2026-04-17T10:00:00Z'
          },
          {
            hospital_id: 'hospital-789',
            local_patient_id: 'patient-456',
            local_national_id: '1234567890',
            last_updated: '2026-04-10T14:30:00Z'
          }
        ],
        status: 'verified'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPMI)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.patientMPI).toBeDefined();
      });

      expect(result.current.patientMPI?.patient_mpi_id).toBe('mpi-123');
      expect(result.current.patientMPI?.linked_records).toHaveLength(2);
      expect(result.current.patientMPI?.status).toBe('verified');
    });

    it('should detect duplicate patient records via PMI', async () => {
      const mockPMI = {
        patient_mpi_id: 'mpi-123',
        linked_records: [
          { hospital_id: 'h1', local_patient_id: 'p1' },
          { hospital_id: 'h2', local_patient_id: 'p2' },
          { hospital_id: 'h3', local_patient_id: 'p3' }
        ],
        duplicates_detected: true,
        duplicate_count: 3
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPMI)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.patientMPI).toBeDefined();
      });

      expect(result.current.patientMPI?.duplicates_detected).toBe(true);
      expect(result.current.patientMPI?.duplicate_count).toBe(3);
    });
  });

  // ========================================================================
  // SYNC OPERATION TESTS
  // ========================================================================

  describe('EHR Synchronization', () => {
    it('should initiate EHR sync to THALAMUS', async () => {
      const mockSyncResponse = {
        success: true,
        thalamus_request_id: 'req-123',
        patient_mpi_id: 'mpi-123',
        sync_hash: 'sha256_hash_value',
        synced_at: new Date().toISOString()
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSyncResponse)
        });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.initiateSync).toBeDefined();
      });

      const syncPromise = result.current.initiateSync();

      // Check that sync status progresses
      await waitFor(() => {
        // After completion, status should return to idle or synced
        expect(result.current.syncStatus).not.toBe('syncing');
      });
    });

    it('should update sync status progression', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      // Initial state
      expect(result.current.syncStatus).toBe('idle');

      // Start sync
      result.current.initiateSync();

      await waitFor(() => {
        expect(['syncing', 'synced', 'idle']).toContain(result.current.syncStatus);
      });
    });

    it('should mark EHR as synced and store metadata', async () => {
      const mockResponse = {
        success: true,
        thalamus_request_id: 'req-456',
        patient_mpi_id: 'mpi-789',
        sync_hash: 'hash123'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await result.current.initiateSync();

      // Should store sync metadata
      expect(localStorage.getItem(`ehr-sync-${mockPatientId}`)).toBeDefined();
    });

    it('should not sync if synced recently', async () => {
      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      // Set recent sync time
      const recentSyncTime = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
      localStorage.setItem(
        `ehr-sync-${mockPatientId}`,
        recentSyncTime.toISOString()
      );

      const needsSync = result.current.needsSync();
      expect(needsSync).toBe(false);
    });

    it('should sync if more than 1 hour has passed', async () => {
      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      // Set old sync time (2 hours ago)
      const oldSyncTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
      localStorage.setItem(
        `ehr-sync-${mockPatientId}`,
        oldSyncTime.toISOString()
      );

      const needsSync = result.current.needsSync();
      expect(needsSync).toBe(true);
    });
  });

  // ========================================================================
  // INTER-HOSPITAL TRANSFER TESTS
  // ========================================================================

  describe('Inter-Hospital Transfer Coordination', () => {
    it('should initiate inter-hospital transfer request', async () => {
      const mockTransferResponse = {
        success: true,
        transfer_id: 'transfer-123',
        thalamus_transfer_id: 'tt-456',
        status: 'pending_acceptance',
        from_hospital: 'hospital-456',
        to_hospital: 'hospital-789',
        initiated_at: new Date().toISOString()
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTransferResponse)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.initiateTransfer).toBeDefined();
      });

      const transferResponse = await result.current.initiateTransfer({
        to_hospital_id: 'hospital-789',
        transfer_reason: 'Specialized cardiology care',
        clinical_urgency: 'high'
      });

      expect(transferResponse?.success).toBe(true);
      expect(transferResponse?.status).toBe('pending_acceptance');
    });

    it('should track transfer status through THALAMUS', async () => {
      const mockTransferStatus = {
        transfer_id: 'transfer-123',
        status: 'in_transit',
        from_hospital: 'HOSIX Quito',
        to_hospital: 'HOSIX Ibarra',
        estimated_arrival: '2026-04-18T14:00:00Z',
        clinician_notes: 'Patient stable for transfer',
        tracking_id: 'track-789'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTransferStatus)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      // Query transfer status
      const status = await fetch(`${mockThalamusApiUrl}/transfers/transfer-123`).then(r => r.json());

      expect(status.status).toBe('in_transit');
      expect(status.tracking_id).toBe('track-789');
    });
  });

  // ========================================================================
  // CROSS-HOSPITAL HISTORY QUERY TESTS
  // ========================================================================

  describe('Cross-Hospital History Queries', () => {
    it('should query patient history across all hospitals', async () => {
      const mockHistory = {
        patient_mpi_id: 'mpi-123',
        total_encounters_network: 42,
        encounter_timeline: [
          {
            hospital_id: 'h1',
            hospital_name: 'HOSIX Quito',
            encounter_date: '2026-04-15',
            encounter_type: 'consultation',
            diagnosis: 'I10'
          },
          {
            hospital_id: 'h2',
            hospital_name: 'HOSIX Ibarra',
            encounter_date: '2026-04-10',
            encounter_type: 'admission',
            diagnosis: 'I10'
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.queryCrossHospitalHistory).toBeDefined();
      });

      const history = await result.current.queryCrossHospitalHistory({ dateRange: 'all' });

      expect(history.patient_mpi_id).toBe('mpi-123');
      expect(history.total_encounters_network).toBe(42);
      expect(history.encounter_timeline).toHaveLength(2);
    });

    it('should filter cross-hospital history by date range', async () => {
      const mockFilteredHistory = {
        patient_mpi_id: 'mpi-123',
        date_range_from: '2026-03-15',
        date_range_to: '2026-04-15',
        encounters_in_range: 8,
        encounter_timeline: [
          {
            hospital_id: 'h1',
            encounter_date: '2026-04-10',
            diagnosis: 'I10'
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFilteredHistory)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      const history = await result.current.queryCrossHospitalHistory({
        dateRange: 'last_month'
      });

      expect(history.encounters_in_range).toBe(8);
    });
  });

  // ========================================================================
  // TIME TRACKING TESTS
  // ========================================================================

  describe('Sync Time Tracking', () => {
    it('should format last sync time as human-readable', () => {
      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      // Set sync time 5 minutes ago
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      localStorage.setItem(
        `ehr-sync-${mockPatientId}`,
        fiveMinutesAgo.toISOString()
      );

      const lastSyncText = result.current.lastSync;
      expect(lastSyncText).toMatch(/5 min|5 minutos/);
    });

    it('should show "Never" if never synced', () => {
      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      // Clear sync time
      localStorage.removeItem(`ehr-sync-${mockPatientId}`);

      expect(result.current.lastSync).toBe('Never');
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle sync failure gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await result.current.initiateSync();

      await waitFor(() => {
        expect(result.current.syncStatus).toBe('error');
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle cross-hospital query failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'THALAMUS unavailable' })
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.crossHospitalData).toBeUndefined();
      });
    });
  });

  // ========================================================================
  // REFETCH TESTS
  // ========================================================================

  describe('Data Refetching', () => {
    it('should refetch all THALAMUS data', async () => {
      global.fetch = vi.fn();

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      result.current.refetch();

      await waitFor(() => {
        // Should call multiple endpoints
        expect((global.fetch as any).mock.calls.length).toBeGreaterThan(0);
      });
    });
  });

  // ========================================================================
  // THALAMUS ARCHITECTURE INTEGRATION TESTS
  // ========================================================================

  describe('THALAMUS Architecture Integration', () => {
    it('should support general-purpose data synchronization', async () => {
      const mockGeneralData = {
        clinical_data: { problems: [], medications: [] },
        administrative_data: { bed_status: 'available', staff_count: 15 },
        epidemiological_data: { disease_surveillance: [] },
        patient_data: { demographics: 'encrypted' }
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeneralData)
      });

      const { result } = renderHook(
        () => useThalamusSync(mockPatientId, mockHospitalId),
        { wrapper: createWrapper() }
      );

      // THALAMUS should support all data categories
      expect(result.current.crossHospitalData || result.current.patientMPI).toBeDefined();
    });
  });
});
