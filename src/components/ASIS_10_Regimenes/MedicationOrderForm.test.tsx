// @ts-nocheck
// ============================================================================
// MedicationOrderForm.test.tsx - Unit & Component Tests
// ASIS 10.0 - Regímenes de Medicación - Hito 5
// ============================================================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicationOrderForm } from '@/components/ASIS_10_Regimenes/MedicationOrderForm';
import { useMedicationOrder } from '@/hooks/useMedicationOrder';

jest.mock('@/hooks/useMedicationOrder');

describe('MedicationOrderForm', () => {
  const mockUseMedicationOrder = useMedicationOrder as jest.MockedFunction<
    typeof useMedicationOrder
  >;

  const mockHookValue = {
    selectMedications: jest.fn(),
    validateInteractions: jest.fn(),
    createOrder: jest.fn(),
    checkAllergies: jest.fn(),
    medications: [
      { id: 'med1', name: 'Amoxicillin', strength: '500mg' },
      { id: 'med2', name: 'Ibuprofen', strength: '400mg' },
      { id: 'med3', name: 'Lisinopril', strength: '10mg' },
    ],
    interactions: [],
    loading: false,
    error: null,
  };

  beforeEach(() => {
    mockUseMedicationOrder.mockReturnValue(mockHookValue);
  });

  describe('Rendering', () => {
    test('should render form with all required fields', () => {
      render(<MedicationOrderForm patientId="patient123" />);
      expect(screen.getByText(/Orden de Medicación/i)).toBeInTheDocument();
      expect(screen.getByText(/Seleccione medicamentos/i)).toBeInTheDocument();
      expect(screen.getByText(/Indicación/i)).toBeInTheDocument();
    });

    test('should render medication checkboxes', () => {
      render(<MedicationOrderForm patientId="patient123" />);
      expect(screen.getByLabelText(/Amoxicillin/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ibuprofen/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lisinopril/i)).toBeInTheDocument();
    });

    test('should render dose and frequency inputs', () => {
      render(<MedicationOrderForm patientId="patient123" />);
      expect(screen.getByPlaceholderText(/Dosis/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Una vez al día/i)).toBeInTheDocument();
    });
  });

  describe('Medication Selection', () => {
    test('should select medication on checkbox click', async () => {
      const user = userEvent.setup();
      render(<MedicationOrderForm patientId="patient123" />);

      const checkbox = screen.getByLabelText(/Amoxicillin/i);
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    test('should enforce maximum 10 medications', async () => {
      const user = userEvent.setup();
      const manyMeds = Array.from({ length: 15 }, (_, i) => ({
        id: `med${i}`,
        name: `Medication ${i}`,
        strength: '100mg',
      }));

      mockUseMedicationOrder.mockReturnValue({
        ...mockHookValue,
        medications: manyMeds,
      });

      render(<MedicationOrderForm patientId="patient123" />);

      for (let i = 0; i < 12; i++) {
        await user.click(screen.getByLabelText(new RegExp(`Medication ${i}`, 'i')));
      }

      // 11th medication should not be selectable (max 10)
      const inputs = screen.getAllByRole('checkbox');
      const selectedCount = inputs.filter((input: any) => input.checked).length;
      expect(selectedCount).toBeLessThanOrEqual(10);
    });

    test('should deselect medication on second click', async () => {
      const user = userEvent.setup();
      render(<MedicationOrderForm patientId="patient123" />);

      const checkbox = screen.getByLabelText(/Amoxicillin/i);
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Form Validation', () => {
    test('should show error when no medication selected', async () => {
      const user = userEvent.setup();
      render(<MedicationOrderForm patientId="patient123" />);

      const submitButton = screen.getByRole('button', { name: /Enviar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Seleccione al menos un medicamento/i)).toBeInTheDocument();
      });
    });

    test('should show error when dose is empty', async () => {
      const user = userEvent.setup();
      render(<MedicationOrderForm patientId="patient123" />);

      await user.click(screen.getByLabelText(/Amoxicillin/i));
      const doseInput = screen.getByPlaceholderText(/Dosis/i);
      await user.clear(doseInput);

      const submitButton = screen.getByRole('button', { name: /Enviar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Dosis requerida/i)).toBeInTheDocument();
      });
    });

    test('should show error when indication is empty', async () => {
      const user = userEvent.setup();
      render(<MedicationOrderForm patientId="patient123" />);

      await user.click(screen.getByLabelText(/Amoxicillin/i));
      const indicationInput = screen.getByPlaceholderText(/Indicación/i);
      await user.clear(indicationInput);

      const submitButton = screen.getByRole('button', { name: /Enviar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Indicación requerida/i)).toBeInTheDocument();
      });
    });
  });

  describe('Interaction Checking', () => {
    test('should call validateInteractions on button click', async () => {
      const user = userEvent.setup();
      render(<MedicationOrderForm patientId="patient123" />);

      await user.click(screen.getByLabelText(/Amoxicillin/i));
      await user.click(screen.getByRole('button', { name: /Verificar Interacciones/i }));

      await waitFor(() => {
        expect(mockHookValue.validateInteractions).toHaveBeenCalled();
      });
    });

    test('should display interaction warnings', async () => {
      mockUseMedicationOrder.mockReturnValue({
        ...mockHookValue,
        interactions: [
          {
            id: 'int1',
            severity: 'moderate',
            description: 'Possible interaction between medications',
          },
        ],
      });

      render(<MedicationOrderForm patientId="patient123" />);
      expect(screen.getByText(/Possible interaction between medications/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      mockHookValue.createOrder.mockResolvedValue({
        id: 'order123',
        status: 'pending',
        medications: ['med1'],
        interactions: [],
      });

      render(
        <MedicationOrderForm patientId="patient123" onSuccess={mockOnSuccess} />
      );

      // Fill form
      await user.click(screen.getByLabelText(/Amoxicillin/i));
      await user.type(screen.getByPlaceholderText(/Dosis/i), '500');
      await user.type(screen.getByDisplayValue(/Una vez al día/i), 'dos');
      await user.type(screen.getByPlaceholderText(/Indicación/i), 'Infección bacteriana');

      // Submit
      const submitButton = screen.getByRole('button', { name: /Enviar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockHookValue.createOrder).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('should disable submit button while loading', async () => {
      mockUseMedicationOrder.mockReturnValue({
        ...mockHookValue,
        loading: true,
      });

      render(<MedicationOrderForm patientId="patient123" />);
      const submitButton = screen.getByRole('button', { name: /Enviar/i });
      expect(submitButton).toBeDisabled();
    });

    test('should display error message on submission failure', async () => {
      const user = userEvent.setup();

      mockHookValue.createOrder.mockRejectedValue(
        new Error('Failed to create order')
      );

      render(<MedicationOrderForm patientId="patient123" />);

      await user.click(screen.getByLabelText(/Amoxicillin/i));
      await user.type(screen.getByPlaceholderText(/Dosis/i), '500');
      await user.type(screen.getByPlaceholderText(/Indicación/i), 'Infección bacteriana');

      const submitButton = screen.getByRole('button', { name: /Enviar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create order/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Handler', () => {
    test('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      render(
        <MedicationOrderForm patientId="patient123" onCancel={mockOnCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Refill Management', () => {
    test('should update refill counter', async () => {
      const user = userEvent.setup();
      render(<MedicationOrderForm patientId="patient123" />);

      const refillInput = screen.getByDisplayValue('0') as HTMLInputElement;
      const incrementButton = screen.getByRole('button', { name: /\+/ });

      await user.click(incrementButton);
      expect(refillInput.value).toBe('1');
    });

    test('should not allow negative refills', async () => {
      const user = userEvent.setup();
      render(<MedicationOrderForm patientId="patient123" />);

      const refillInput = screen.getByDisplayValue('0') as HTMLInputElement;
      const decrementButton = screen.getByRole('button', { name: /-/ });

      // Try to go below 0
      await user.click(decrementButton);
      expect(refillInput.value).toBe('0'); // Should stay at 0
    });
  });
});
