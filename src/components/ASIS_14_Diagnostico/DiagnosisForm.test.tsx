// @ts-nocheck
// ============================================================================
// DiagnosisForm.test.tsx - Diagnosis Component Tests
// ASIS 14.0 - Diagnóstico Unificado - Hito 5
// ============================================================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiagnosisForm } from '@/components/ASIS_14_Diagnostico/DiagnosisForm';
import { useDiagnosisForm } from '@/hooks/useDiagnosisForm';

jest.mock('@/hooks/useDiagnosisForm');

describe('DiagnosisForm', () => {
  const mockUseDiagnosisForm = useDiagnosisForm as jest.MockedFunction<
    typeof useDiagnosisForm
  >;

  const mockHookValue = {
    searchDiagnosis: jest.fn((query) => [
      {
        code: 'E11',
        description: 'Type 2 diabetes mellitus',
        category: 'Endocrine disease',
      },
      {
        code: 'I10',
        description: 'Essential (primary) hypertension',
        category: 'Circulatory disease',
      },
    ]),
    createDiagnosis: jest.fn(),
    getDiagnosisDetails: jest.fn(),
    checkSimilarDiagnoses: jest.fn(),
    getTreatmentGuidelines: jest.fn(),
    loadICD10Codes: jest.fn(),
    icd10Codes: [],
    loading: false,
    error: null,
  };

  beforeEach(() => {
    mockUseDiagnosisForm.mockReturnValue(mockHookValue);
  });

  describe('Rendering', () => {
    test('should render diagnosis form with all sections', () => {
      render(<DiagnosisForm patientId="patient123" />);
      expect(screen.getByText(/Búsqueda de Diagnóstico/i)).toBeInTheDocument();
      expect(screen.getByText(/Detalles del Diagnóstico/i)).toBeInTheDocument();
      expect(screen.getByText(/Contexto Clínico/i)).toBeInTheDocument();
    });

    test('should render ICD-10 search input', () => {
      render(<DiagnosisForm patientId="patient123" />);
      expect(
        screen.getByPlaceholderText(/Ej: diabetes, E11, hypertension/i)
      ).toBeInTheDocument();
    });

    test('should render severity and confirmation status selects', () => {
      render(<DiagnosisForm patientId="patient123" />);
      expect(screen.getByText(/Severidad/i)).toBeInTheDocument();
      expect(screen.getByText(/Estado de Confirmación/i)).toBeInTheDocument();
    });
  });

  describe('ICD-10 Code Search', () => {
    test('should show suggestions when typing', async () => {
      const user = userEvent.setup();
      render(<DiagnosisForm patientId="patient123" />);

      const searchInput = screen.getByPlaceholderText(/Ej: diabetes/i);
      await user.type(searchInput, 'diabetes');

      await waitFor(() => {
        expect(screen.getByText(/Type 2 diabetes mellitus/i)).toBeInTheDocument();
      });
    });

    test('should select diagnosis from suggestions', async () => {
      const user = userEvent.setup();
      render(<DiagnosisForm patientId="patient123" />);

      const searchInput = screen.getByPlaceholderText(/Ej: diabetes/i);
      await user.type(searchInput, 'dia');

      await waitFor(() => {
        const suggestion = screen.getByText(/Type 2 diabetes mellitus/i);
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText(/Type 2 diabetes mellitus/i);
      await user.click(suggestion);

      expect(screen.getByText(/E11/i)).toBeInTheDocument();
    });

    test('should not show suggestions for short queries', () => {
      render(<DiagnosisForm patientId="patient123" />);
      const searchInput = screen.getByPlaceholderText(/Ej: diabetes/i) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'd' } });

      expect(screen.queryByText(/Type 2 diabetes mellitus/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should show error when no diagnosis selected', async () => {
      const user = userEvent.setup();
      render(<DiagnosisForm patientId="patient123" />);

      const submitButton = screen.getByRole('button', { name: /Guardar Diagnóstico/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Seleccione un código ICD-10/i)).toBeInTheDocument();
      });
    });

    test('should show error when clinical context is empty', async () => {
      const user = userEvent.setup();
      mockHookValue.searchDiagnosis.mockReturnValue([
        { code: 'E11', description: 'Type 2 diabetes', category: 'Endocrine' },
      ]);

      render(<DiagnosisForm patientId="patient123" />);

      const searchInput = screen.getByPlaceholderText(/Ej: diabetes/i);
      await user.type(searchInput, 'E11');

      const suggestion = await screen.findByText(/Type 2 diabetes/i);
      await user.click(suggestion);

      const contextInput = screen.getByPlaceholderText(/contexto clínico/i);
      fireEvent.change(contextInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /Guardar Diagnóstico/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Proporcione contexto clínico/i)).toBeInTheDocument();
      });
    });

    test('should validate onset date range', async () => {
      const user = userEvent.setup();
      render(<DiagnosisForm patientId="patient123" />);

      const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
      await user.clear(dateInput);
      await user.type(dateInput, '2150-01-01'); // Future date

      const submitButton = screen.getByRole('button', { name: /Guardar Diagnóstico/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Fecha de inicio no puede ser en el futuro/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      mockHookValue.createDiagnosis.mockResolvedValue({
        id: 'diag123',
        status: 'active',
      });

      mockHookValue.searchDiagnosis.mockReturnValue([
        { code: 'E11', description: 'Type 2 diabetes', category: 'Endocrine' },
      ]);

      render(
        <DiagnosisForm patientId="patient123" onSuccess={mockOnSuccess} />
      );

      // Select diagnosis
      const searchInput = screen.getByPlaceholderText(/Ej: diabetes/i);
      await user.type(searchInput, 'E11');

      const suggestion = await screen.findByText(/Type 2 diabetes/i);
      await user.click(suggestion);

      // Fill clinical context
      const contextInput = screen.getByPlaceholderText(/contexto clínico/i);
      await user.type(contextInput, 'Patient presents with elevated fasting glucose and symptoms');

      // Submit
      const submitButton = screen.getByRole('button', { name: /Guardar Diagnóstico/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockHookValue.createDiagnosis).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('should disable submit button while loading', async () => {
      mockUseDiagnosisForm.mockReturnValue({
        ...mockHookValue,
        loading: true,
      });

      render(<DiagnosisForm patientId="patient123" />);
      const submitButton = screen.getByRole('button', { name: /Guardar Diagnóstico/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Severity & Confirmation Status', () => {
    test('should allow severity selection', async () => {
      const user = userEvent.setup();
      render(<DiagnosisForm patientId="patient123" />);

      const severitySelects = screen.getAllByDisplayValue(/Moderado/);
      expect(severitySelects.length).toBeGreaterThan(0);
    });

    test('should allow confirmation status selection', async () => {
      const user = userEvent.setup();
      render(<DiagnosisForm patientId="patient123" />);

      const statusSelects = screen.getAllByDisplayValue(/Sospechado/);
      expect(statusSelects.length).toBeGreaterThan(0);
    });
  });

  describe('Treatment Plan', () => {
    test('should include optional treatment plan field', () => {
      render(<DiagnosisForm patientId="patient123" />);
      expect(screen.getByPlaceholderText(/Plan de Tratamiento/i)).toBeInTheDocument();
    });

    test('should allow treatment plan input', async () => {
      const user = userEvent.setup();
      render(<DiagnosisForm patientId="patient123" />);

      const treatmentInput = screen.getByPlaceholderText(/Plan de Tratamiento/i);
      await user.type(treatmentInput, 'Start metformin 500mg daily');

      expect(treatmentInput).toHaveValue('Start metformin 500mg daily');
    });
  });
});
