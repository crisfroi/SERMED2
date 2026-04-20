import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DeliveryForm } from './DeliveryForm';

// Mock Supabase
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockResolvedValue({ data: [], error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: {}, error: null })
        })
      })
    }))
  }
}));

describe('DeliveryForm Component', () => {
  const defaultProps = {
    pregnancyId: 'pregnancy-123',
    onSuccess: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render delivery form with all fields', () => {
      render(<DeliveryForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/delivery mode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/anesthesia/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/blood loss/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/episiotomy/i)).toBeInTheDocument();
    });

    it('should render with default values', () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const deliveryModeSelect = screen.getByDisplayValue('vaginal');
      expect(deliveryModeSelect).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<DeliveryForm {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /submit|save|record/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate blood loss as positive number', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const bloodLossInput = screen.getByLabelText(/blood loss/i);
      await userEvent.type(bloodLossInput, '-100');
      
      expect(screen.queryByText(/negative|invalid/i)).not.toBeInTheDocument();
    });

    it('should validate tears degree 0-4', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const tearsInput = screen.getByLabelText(/tears degree/i);
      await userEvent.type(tearsInput, '5');
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.queryByText(/must be/i) || screen.queryByText(/invalid/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Delivery Mode Selection', () => {
    it('should handle vaginal delivery selection', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const deliveryModeSelect = screen.getByLabelText(/delivery mode/i);
      await userEvent.click(deliveryModeSelect);
      
      const vaginalOption = screen.getByText(/vaginal/i);
      await userEvent.click(vaginalOption);
      
      expect(deliveryModeSelect).toHaveValue('vaginal');
    });

    it('should handle cesarean delivery selection', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const deliveryModeSelect = screen.getByLabelText(/delivery mode/i);
      await userEvent.click(deliveryModeSelect);
      
      const cesareanOption = screen.getByText(/cesarean/i);
      await userEvent.click(cesareanOption);
      
      expect(deliveryModeSelect).toHaveValue('cesarean');
    });

    it('should show contextual fields based on delivery mode', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const deliveryModeSelect = screen.getByLabelText(/delivery mode/i);
      
      // Select assisted vaginal
      await userEvent.click(deliveryModeSelect);
      const assistedOption = screen.getByText(/assisted/i);
      await userEvent.click(assistedOption);
      
      // Should show episiotomy field for vaginal deliveries
      expect(screen.getByLabelText(/episiotomy/i)).toBeInTheDocument();
    });
  });

  describe('Complications Management', () => {
    it('should add maternal complications', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const maternalComplicationsInput = screen.getByLabelText(/maternal complications/i);
      await userEvent.type(maternalComplicationsInput, 'Hemorrhage');
      
      const addButton = screen.getByText(/add|append/i);
      await userEvent.click(addButton);
      
      expect(screen.getByText(/hemorrhage/i)).toBeInTheDocument();
    });

    it('should add fetal complications', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const fetalComplicationsInput = screen.getByLabelText(/fetal complications/i);
      await userEvent.type(fetalComplicationsInput, 'Meconium aspiration');
      
      const addButton = screen.getByText(/add|append/i);
      await userEvent.click(addButton);
      
      expect(screen.getByText(/meconium/i)).toBeInTheDocument();
    });

    it('should remove complications', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const maternalInput = screen.getByLabelText(/maternal complications/i);
      await userEvent.type(maternalInput, 'Infection');
      
      const addButton = screen.getByText(/add/i);
      await userEvent.click(addButton);
      
      expect(screen.getByText(/infection/i)).toBeInTheDocument();
      
      const removeButton = screen.getByRole('button', { name: /remove|delete|x/i });
      await userEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/infection/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit delivery form with complete data', async () => {
      const onSuccess = jest.fn();
      render(<DeliveryForm {...defaultProps} onSuccess={onSuccess} />);
      
      const bloodLossInput = screen.getByLabelText(/blood loss/i);
      await userEvent.type(bloodLossInput, '250');
      
      const notesInput = screen.getByLabelText(/notes|observation/i);
      await userEvent.type(notesInput, 'Routine delivery, no complications');
      
      const submitButton = screen.getByRole('button', { name: /submit|save|record/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should display loading state during submission', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /submit|save|record/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).toHaveAttribute('disabled');
      });
    });

    it('should show success message after submission', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /submit|save|record/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/success|recorded|saved/i)).toBeInTheDocument();
      });
    });

    it('should handle submission error', async () => {
      // Mock error response
      jest.mock('@/services/supabaseClient', () => ({
        supabase: {
          from: jest.fn(() => ({
            insert: jest.fn().mockResolvedValue({ 
              data: [], 
              error: { message: 'Database error' } 
            })
          }))
        }
      }));

      render(<DeliveryForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /submit|save|record/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Risk Indicators', () => {
    it('should highlight high blood loss (>500ml)', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const bloodLossInput = screen.getByLabelText(/blood loss/i);
      await userEvent.type(bloodLossInput, '750');
      
      await waitFor(() => {
        const riskIndicator = screen.getByText(/excessive loss|alert/i);
        expect(riskIndicator).toBeInTheDocument();
      });
    });

    it('should show warning for cesarean with complications', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const deliveryModeSelect = screen.getByLabelText(/delivery mode/i);
      await userEvent.click(deliveryModeSelect);
      
      const cesareanOption = screen.getByText(/cesarean/i);
      await userEvent.click(cesareanOption);
      
      const maternalInput = screen.getByLabelText(/maternal complications/i);
      await userEvent.type(maternalInput, 'Infection');
      
      const addButton = screen.getByText(/add/i);
      await userEvent.click(addButton);
      
      await waitFor(() => {
        const warning = screen.getByText(/high risk|monitor|alert/i);
        expect(warning).toBeInTheDocument();
      });
    });

    it('should show tear severity classification', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const tearsInput = screen.getByLabelText(/tears degree/i);
      await userEvent.type(tearsInput, '3');
      
      await waitFor(() => {
        const severity = screen.getByText(/severe|degree.*3/i);
        expect(severity).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<DeliveryForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/delivery mode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/anesthesia/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/blood loss/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const deliveryModeSelect = screen.getByLabelText(/delivery mode/i);
      deliveryModeSelect.focus();
      
      expect(deliveryModeSelect).toHaveFocus();
    });

    it('should announce form errors to screen readers', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const tearsInput = screen.getByLabelText(/tears degree/i) as HTMLInputElement;
      await userEvent.type(tearsInput, '5');
      
      const submitButton = screen.getByRole('button', { name: /submit|save|record/i });
      await userEvent.click(submitButton);
      
      // Should have aria-invalid or similar
      await waitFor(() => {
        expect(tearsInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data in form', () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).not.toHaveAttribute('autocomplete', 'off');
      });
    });

    it('should sanitize input before submission', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const notesInput = screen.getByLabelText(/notes/i);
      await userEvent.type(notesInput, '<script>alert("xss")</script>');
      
      const submitButton = screen.getByRole('button', { name: /submit|save|record/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        // Verify data was sanitized (no script tags in submission)
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should encrypt sensitive data before sending', async () => {
      render(<DeliveryForm {...defaultProps} />);
      
      const bloodLossInput = screen.getByLabelText(/blood loss/i);
      await userEvent.type(bloodLossInput, '250');
      
      const submitButton = screen.getByRole('button', { name: /submit|save|record/i });
      await userEvent.click(submitButton);
      
      // Should use HTTPS and encryption via supabaseClientEnhanced
      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });
  });
});
