// ============================================================================
// LabOrderForm.test.tsx - React Component Tests
// Laboratory Order Form Component
// ============================================================================

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabOrderForm } from './LabOrderForm';

// Mock hooks
jest.mock('../../hooks/useLabOrder', () => ({
  useLabOrder: jest.fn(),
}));

jest.mock('../../hooks/useNormalRanges', () => ({
  useNormalRanges: jest.fn(),
}));

import { useLabOrder } from '../../hooks/useLabOrder';
import { useNormalRanges } from '../../hooks/useNormalRanges';

describe('LabOrderForm', () => {
  const mockCreateOrder = jest.fn();
  const mockSelectTests = jest.fn();
  const mockFetchAvailableTests = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useLabOrder as jest.Mock).mockReturnValue({
      createOrder: mockCreateOrder,
      selectTests: mockSelectTests,
      fetchAvailableTests: mockFetchAvailableTests,
      availableTests: [
        { id: 'glucose', name: 'Glucose' },
        { id: 'hemoglobin', name: 'Hemoglobin' },
        { id: 'tsh', name: 'TSH' },
      ],
      selectedTests: [],
      loading: false,
      error: null,
    });

    (useNormalRanges as jest.Mock).mockReturnValue({});
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('should render form with all required fields', () => {
      render(<LabOrderForm patientId="p1" />);

      expect(screen.getByLabelText(/indication/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/clinical history/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    });

    it('should display test selection checkboxes', () => {
      render(<LabOrderForm patientId="p1" />);

      expect(screen.getByLabel Text('Glucose')).toBeInTheDocument();
      expect(screen.getByLabelText('Hemoglobin')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<LabOrderForm patientId="p1" />);

      expect(screen.getByRole('button', { name: /submit|create order/i })).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(<LabOrderForm patientId="p1" onCancel={jest.fn()} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  // ==================== INTERACTION TESTS ====================
  describe('User Interactions', () => {
    it('should enable form submission when valid data entered', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      const indicationInput = screen.getByLabelText(/indication/i);
      await user.type(indicationInput, 'Routine checkup');

      const checkbox = screen.getByLabelText('Glucose');
      await user.click(checkbox);

      const submitButton = screen.getByRole('button', { name: /submit|create order/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should call createOrder on submit', async () => {
      const user = userEvent.setup();
      mockCreateOrder.mockResolvedValue({ data: { id: 'order-1' } });

      render(<LabOrderForm patientId="p1" />);

      await user.type(screen.getByLabelText(/indication/i), 'Test');
      await user.click(screen.getByLabelText('Glucose'));
      await user.click(screen.getByRole('button', { name: /submit|create order/i }));

      await waitFor(() => {
        expect(mockCreateOrder).toHaveBeenCalled();
      });
    });

    it('should select/deselect tests when checkbox clicked', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      const checkbox = screen.getByLabelText('Glucose');
      await user.click(checkbox);

      expect(mockSelectTests).toHaveBeenCalledWith('glucose');
    });

    it('should disable submit with no tests selected', async () => {
      render(<LabOrderForm patientId="p1" />);

      const submitButton = screen.getByRole('button', { name: /submit|create order/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit with empty indication', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      await user.click(screen.getByLabelText('Glucose'));

      const indicationInput = screen.getByLabelText(/indication/i);
      expect(indicationInput).toHaveValue('');

      const submitButton = screen.getByRole('button', { name: /submit|create order/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ==================== VALIDATION TESTS ====================
  describe('Validation', () => {
    it('should show error for missing tests', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      await user.type(screen.getByLabelText(/indication/i), 'Checkup');
      await user.click(screen.getByRole('button', { name: /submit|create order/i }));

      expect(screen.getByText(/select at least one test/i)).toBeInTheDocument();
    });

    it('should show error for empty indication', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      await user.click(screen.getByLabelText('Glucose'));
      await user.click(screen.getByRole('button', { name: /submit|create order/i }));

      expect(screen.getByText(/indication is required/i)).toBeInTheDocument();
    });

    it('should enforce minimum indication length', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      const indicationInput = screen.getByLabelText(/indication/i);
      await user.type(indicationInput, 'A');

      expect(indicationInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should show error for exceeded test limit', async () => {
      const user = userEvent.setup();

      // Mock 25 tests
      (useLabOrder as jest.Mock).mockReturnValue({
        ...jest.requireActual('../../hooks/useLabOrder').useLabOrder(),
        availableTests: Array.from({ length: 25 }, (_, i) => ({
          id: `test-${i}`,
          name: `Test ${i}`,
        })),
      });

      render(<LabOrderForm patientId="p1" />);

      // Try to select 21 tests
      for (let i = 0; i < 21; i++) {
        const checkbox = screen.getByLabelText(`Test ${i}`);
        if (checkbox) await user.click(checkbox);
      }

      expect(screen.getByText(/maximum 20 tests/i)).toBeInTheDocument();
    });
  });

  // ==================== PRIORITY SELECTION TESTS ====================
  describe('Priority Selection', () => {
    it('should render priority dropdown', () => {
      render(<LabOrderForm patientId="p1" />);

      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    });

    it('should support routine priority', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, 'routine');

      expect((prioritySelect as HTMLSelectElement).value).toBe('routine');
    });

    it('should support urgent priority', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, 'urgent');

      expect((prioritySelect as HTMLSelectElement).value).toBe('urgent');
    });

    it('should support STAT priority', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, 'stat');

      expect((prioritySelect as HTMLSelectElement).value).toBe('stat');
    });
  });

  // ==================== LOADING STATE TESTS ====================
  describe('Loading States', () => {
    it('should show loading spinner during submission', async () => {
      mockCreateOrder.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { id: 'order-1' } }), 100)
          )
      );

      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      await user.type(screen.getByLabelText(/indication/i), 'Test');
      await user.click(screen.getByLabelText('Glucose'));
      await user.click(screen.getByRole('button', { name: /submit|create order/i }));

      expect(screen.getByText(/submitting|loading/i)).toBeInTheDocument();
    });

    it('should disable submit button while loading', async () => {
      (useLabOrder as jest.Mock).mockReturnValue({
        createOrder: mockCreateOrder,
        selectTests: mockSelectTests,
        availableTests: [{ id: 'glucose', name: 'Glucose' }],
        selectedTests: ['glucose'],
        loading: true,
        error: null,
      });

      render(<LabOrderForm patientId="p1" />);

      const submitButton = screen.getByRole('button', { name: /submit|create order/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling', () => {
    it('should display error message on submission failure', () => {
      (useLabOrder as jest.Mock).mockReturnValue({
        createOrder: mockCreateOrder,
        selectTests: mockSelectTests,
        availableTests: [{ id: 'glucose', name: 'Glucose' }],
        selectedTests: ['glucose'],
        loading: false,
        error: 'Network error occurred',
      });

      render(<LabOrderForm patientId="p1" />);

      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('should clear error after successful submission', async () => {
      const { rerender } = render(<LabOrderForm patientId="p1" />);

      // Simulate error state
      (useLabOrder as jest.Mock).mockReturnValue({
        createOrder: mockCreateOrder,
        selectTests: mockSelectTests,
        availableTests: [{ id: 'glucose', name: 'Glucose' }],
        selectedTests: ['glucose'],
        loading: false,
        error: 'Error message',
      });

      rerender(<LabOrderForm patientId="p1" />);
      expect(screen.getByText(/error message/i)).toBeInTheDocument();

      // Simulate success
      (useLabOrder as jest.Mock).mockReturnValue({
        createOrder: mockCreateOrder,
        selectTests: mockSelectTests,
        availableTests: [{ id: 'glucose', name: 'Glucose' }],
        selectedTests: ['glucose'],
        loading: false,
        error: null,
      });

      rerender(<LabOrderForm patientId="p1" />);
      expect(screen.queryByText(/error message/i)).not.toBeInTheDocument();
    });
  });

  // ==================== SUCCESS TESTS ====================
  describe('Success Handling', () => {
    it('should show success message after submission', async () => {
      mockCreateOrder.mockResolvedValue({ data: { id: 'order-1' } });

      const user = userEvent.setup();
      const onSuccess = jest.fn();

      render(<LabOrderForm patientId="p1" onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText(/indication/i), 'Checkup');
      await user.click(screen.getByLabelText('Glucose'));
      await user.click(screen.getByRole('button', { name: /submit|create order/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({ id: 'order-1' });
      });
    });

    it('should reset form after successful submission', async () => {
      mockCreateOrder.mockResolvedValue({ data: { id: 'order-1' } });

      const user = userEvent.setup();

      const { rerender } = render(<LabOrderForm patientId="p1" />);

      // Fill and submit
      await user.type(screen.getByLabelText(/indication/i), 'Checkup');
      await user.click(screen.getByLabelText('Glucose'));
      await user.click(screen.getByRole('button', { name: /submit|create order/i }));

      await waitFor(() => {
        mockSelectTests.mockClear();
      });

      // Mock reset state
      (useLabOrder as jest.Mock).mockReturnValue({
        createOrder: mockCreateOrder,
        selectTests: mockSelectTests,
        availableTests: [{ id: 'glucose', name: 'Glucose' }],
        selectedTests: [],
        loading: false,
        error: null,
      });

      rerender(<LabOrderForm patientId="p1" />);

      expect(screen.getByLabelText(/indication/i)).toHaveValue('');
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LabOrderForm patientId="p1" />);

      expect(screen.getByLabelText(/indication/i)).toHaveAttribute('id');
      expect(screen.getByLabelText(/priority/i)).toHaveAttribute('id');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<LabOrderForm patientId="p1" />);

      await user.tab();
      expect(screen.getByLabelText(/indication/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Glucose')).toHaveFocus();
    });
  });
});
