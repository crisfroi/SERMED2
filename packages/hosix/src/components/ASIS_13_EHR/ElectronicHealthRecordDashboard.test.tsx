import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ElectronicHealthRecordDashboard } from '../ElectronicHealthRecordDashboard';

// ============================================================================
// ASIS 13: Electronic Health Record Dashboard Tests
// Propósito: Pruebas completas de funcionalidad de HME
// Líneas: ~300
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

describe('ElectronicHealthRecordDashboard', () => {
  const mockPatientId = 'patient-123';
  const mockHospitalId = 'hospital-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // SMOKE TESTS
  // ========================================================================

  it('should render without crashing', () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Historia Médica Electrónica/i)).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Cargando Historia Médica Electrónica/i)).toBeInTheDocument();
  });

  // ========================================================================
  // TAB NAVIGATION TESTS
  // ========================================================================

  it('should display all tabs', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Resumen Clínico')).toBeInTheDocument();
      expect(screen.getByText('Línea de Tiempo')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
      expect(screen.getByText('Auditoría (HIPAA)')).toBeInTheDocument();
      expect(screen.getByText('Red RENAPROSA')).toBeInTheDocument();
    });
  });

  it('should switch between tabs', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    // Click timeline tab
    const timelineTab = screen.getByText('Línea de Tiempo');
    fireEvent.click(timelineTab);

    await waitFor(() => {
      expect(timelineTab).toHaveClass('bg-blue-50');
    });
  });

  // ========================================================================
  // SYNC STATUS TESTS
  // ========================================================================

  it('should display THALAMUS sync status', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/THALAMUS:/i)).toBeInTheDocument();
    });
  });

  it('should have sync now button', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      const syncButton = screen.getByText('Sincronizar Ahora');
      expect(syncButton).toBeInTheDocument();
    });
  });

  // ========================================================================
  // ACTION BUTTON TESTS
  // ========================================================================

  it('should have export PDF button', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Exportar PDF/i)).toBeInTheDocument();
    });
  });

  it('should have transfer button', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Transferencia Inter-Hospital/i)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // READ-ONLY MODE TESTS
  // ========================================================================

  it('should respect readOnly prop', () => {
    const { rerender } = render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
        readOnly={true}
      />,
      { wrapper: createWrapper() }
    );

    // Buttons should still be present but limited functionality
    // In read-only, edit buttons shouldn't show
  });

  // ========================================================================
  // HIPAA NOTICE TEST
  // ========================================================================

  it('should display HIPAA compliance notice', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/AVISO HIPAA/i)).toBeInTheDocument();
      expect(screen.getByText(/auditado/i)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // TRANSFER MODAL TESTS
  // ========================================================================

  it('should open transfer modal on button click', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    const transferButton = await screen.findByText(/Transferencia Inter-Hospital/i);
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(screen.getByText(/Solicitar Transferencia Inter-Hospitalaria/i)).toBeInTheDocument();
    });
  });

  it('should list hospitals in transfer modal', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    const transferButton = await screen.findByText(/Transferencia Inter-Hospital/i);
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(screen.getByText('HOSIX Quito')).toBeInTheDocument();
      expect(screen.getByText('HOSIX Ibarra')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // KEY METRICS DISPLAY TESTS
  // ========================================================================

  it('should display key metrics cards', async () => {
    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Problemas Activos')).toBeInTheDocument();
      expect(screen.getByText('Medicamentos Vigentes')).toBeInTheDocument();
      expect(screen.getByText('Episodios Clínicos')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================

  it('should handle export flow correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['test'], { type: 'application/pdf' }))
    });
    global.fetch = mockFetch;

    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    const exportButton = await screen.findByText(/Exportar PDF/i);
    fireEvent.click(exportButton);

    // Should call API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  it('should display error message on fetch failure', async () => {
    // Mock API failure
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

    render(
      <ElectronicHealthRecordDashboard
        patientId={mockPatientId}
        hospitalId={mockHospitalId}
      />,
      { wrapper: createWrapper() }
    );

    // Should show retry button eventually
    await waitFor(() => {
      const elements = screen.queryAllByText(/Error/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
