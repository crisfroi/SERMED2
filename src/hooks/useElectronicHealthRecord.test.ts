import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useElectronicHealthRecord } from '../useElectronicHealthRecord';

// ============================================================================
// Custom Hook Tests: useElectronicHealthRecord
// Propósito: Pruebas de lógica de gestión de HME
// Líneas: ~220
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

describe('useElectronicHealthRecord', () => {
  const mockPatientId = 'patient-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // INITIALIZATION TESTS
  // ========================================================================

  it('should initialize with loading state', () => {
    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.ehr).toBeUndefined();
  });

  it('should expose refetch method', () => {
    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    expect(typeof result.current.refetch).toBe('function');
  });

  // ========================================================================
  // QUERY TESTS
  // ========================================================================

  it('should fetch EHR record', async () => {
    const mockEHR = {
      id: 'ehr-123',
      patient_id: mockPatientId,
      summary_note: 'Test summary',
      active_problems: ['I10', 'E11'],
      medications_active: ['Lisinopril 10mg'],
      allergies: ['Penicilina'],
      last_summary_updated: new Date().toISOString(),
      thalamus_synced_at: null,
      thalamus_sync_status: 'pending'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEHR)
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.ehr).toBeDefined();
    });

    expect(result.current.ehr?.id).toBe('ehr-123');
    expect(result.current.ehr?.active_problems).toContain('I10');
  });

  it('should fetch episodes linked to EHR', async () => {
    const mockEpisodes = [
      {
        id: 'episode-1',
        episode_type: 'consultation',
        episode_date: new Date().toISOString(),
        clinician_name: 'Dr. Smith',
        summary: 'Follow-up visit',
        primary_diagnosis: 'I10',
        secondary_diagnoses: []
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEpisodes)
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.episodes).toBeDefined();
    });

    expect(result.current.episodes?.[0]?.episode_type).toBe('consultation');
  });

  it('should fetch documents associated with EHR', async () => {
    const mockDocuments = [
      {
        id: 'doc-1',
        document_type: 'prescription',
        document_title: 'Prescription 2026',
        file_path: 's3://bucket/prescription-1.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
        created_at: new Date().toISOString(),
        uploaded_by: 'doctor-1',
        is_encrypted: true
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDocuments)
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.documents).toBeDefined();
    });

    expect(result.current.documents?.[0]?.document_type).toBe('prescription');
  });

  // ========================================================================
  // MUTATION TESTS
  // ========================================================================

  it('should update EHR record', async () => {
    const mockResponse = { success: true, updated: true };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.updateEHR).toBeDefined();
    });

    const updatePromise = result.current.updateEHR({
      summary_note: 'Updated summary',
      active_problems: ['I10', 'E11', 'F41'],
      medications_active: ['Lisinopril 10mg', 'Metformin 1000mg']
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Verify update call structure
    const lastCall = (global.fetch as any).mock.calls[(global.fetch as any).mock.calls.length - 1];
    expect(lastCall[0]).toContain('/api/ehr/');
    expect(lastCall[1]?.method).toBe('PATCH');
  });

  it('should generate PDF export', async () => {
    const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob)
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.generatePDF).toBeDefined();
    });

    const pdfPromise = result.current.generatePDF('pdf', true);

    await waitFor(() => {
      expect(result.current.isExporting).toBe(true);
    });

    // Verify export format
    const lastCall = (global.fetch as any).mock.calls[(global.fetch as any).mock.calls.length - 1];
    expect(lastCall[0]).toContain('generate_ehr_export');
  });

  it('should consolidate EHR summary', async () => {
    const mockResponse = {
      success: true,
      summary_note: 'Consolidated summary',
      active_problems: ['I10', 'E11'],
      episodes_analyzed: 5
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.consolidateSummary).toBeDefined();
    });

    const consolidatePromise = result.current.consolidateSummary();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  it('should handle fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.ehr).toBeUndefined();
  });

  it('should handle API error responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Unauthorized' })
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });

  // ========================================================================
  // HIPAA LOGGING TESTS
  // ========================================================================

  it('should log access when fetching EHR', async () => {
    const logAccessSpy = vi.fn().mockResolvedValue({ success: true });

    global.fetch = vi.fn((url: string) => {
      if (url.includes('log_ehr_access')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'ehr-123' })
      });
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      // Verify access logging occurred
      const calls = (global.fetch as any).mock.calls;
      const hasLogCall = calls.some((call: any[]) =>
        call[0].includes('log_ehr_access')
      );
      expect(hasLogCall).toBe(true);
    });
  });

  // ========================================================================
  // STATE MANAGEMENT TESTS
  // ========================================================================

  it('should toggle export state during PDF generation', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['PDF'], { type: 'application/pdf' }))
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    expect(result.current.isExporting).toBe(false);

    await waitFor(() => {
      expect(result.current.generatePDF).toBeDefined();
    });

    result.current.generatePDF('pdf');

    await waitFor(() => {
      expect(result.current.isExporting).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    }, { timeout: 5000 });
  });

  // ========================================================================
  // EXPORT FUNCTIONALITY TESTS
  // ========================================================================

  it('should support multiple export formats', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['content']))
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    const formats = ['pdf', 'hl7', 'fhir'] as const;

    for (const format of formats) {
      await result.current.generatePDF(format);

      // Verify format was passed to API
      const lastCall = (global.fetch as any).mock.calls[
        (global.fetch as any).mock.calls.length - 1
      ];
      expect(lastCall[1]?.body).toContain(format);
    }
  });

  it('should export EHR data', async () => {
    const mockExportData = {
      success: true,
      url: 's3://bucket/export-123.zip'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockExportData)
    });

    const { result } = renderHook(
      () => useElectronicHealthRecord(mockPatientId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.exportEHR).toBeDefined();
    });

    const exportPromise = result.current.exportEHR({
      include_episodes: true,
      include_documents: true,
      format: 'zip'
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
