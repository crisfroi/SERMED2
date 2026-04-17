// ============================================================================
// useMedicationOrder.test.ts - Hook Unit Tests
// ASIS 10.0 - Regímenes de Medicación - Hito 5
// ============================================================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMedicationOrder } from '@hosix/hooks/06-medications/useMedicationOrder';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useMedicationOrder Hook', () => {
  const mockSupabase = {
    from: jest.fn(),
    rpc: jest.fn(),
  };

  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    mockCreateClient.mockReturnValue(mockSupabase as any);
    jest.clearAllMocks();
  });

  describe('selectMedications', () => {
    test('should fetch available medications', async () => {
      const mockMeds = [
        { id: 'med1', name: 'Amoxicillin', active: true },
        { id: 'med2', name: 'Ibuprofen', active: true },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockMeds }),
          }),
        }),
      });

      const { result } = renderHook(() => useMedicationOrder('patient123'));

      await act(async () => {
        await result.current.selectMedications();
      });

      await waitFor(() => {
        expect(result.current.medications).toEqual(mockMeds);
      });
    });

    test('should handle error when fetching medications', async () => {
      const error = new Error('Database error');

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ error }),
          }),
        }),
      });

      const { result } = renderHook(() => useMedicationOrder('patient123'));

      await act(async () => {
        await result.current.selectMedications();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });
    });
  });

  describe('validateInteractions', () => {
    test('should check interactions between medications', async () => {
      const mockInteractions = [
        {
          medication1: 'Amoxicillin',
          medication2: 'Ibuprofen',
          severity: 'moderate',
          description: 'May increase GI bleeding risk',
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockInteractions,
        error: null,
      });

      const { result } = renderHook(() => useMedicationOrder('patient123'));

      await act(async () => {
        await result.current.validateInteractions(['med1', 'med2']);
      });

      await waitFor(() => {
        expect(result.current.interactions).toHaveLength(1);
        expect(result.current.interactions[0].severity).toBe('moderate');
      });
    });

    test('should return empty array for single medication', async () => {
      const { result } = renderHook(() => useMedicationOrder('patient123'));

      await act(async () => {
        const interactions = await result.current.validateInteractions(['med1']);
      });

      await waitFor(() => {
        expect(result.current.interactions).toEqual([]);
      });
    });
  });

  describe('createOrder', () => {
    test('should create medication order successfully', async () => {
      const mockOrder = {
        id: 'order123',
        patient_id: 'patient123',
        medications: ['med1'],
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null }); // No interactions

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockOrder }),
          }),
        }),
      });

      const { result } = renderHook(() => useMedicationOrder('patient123'));

      const orderData = {
        patient_id: 'patient123',
        medications: ['med1'],
        dose: '500',
        unit: 'mg',
        frequency: 'twice daily',
        duration: 7,
        indication: 'Bacterial infection',
        refills: 2,
      };

      let createdOrder;
      await act(async () => {
        createdOrder = await result.current.createOrder(orderData);
      });

      expect(createdOrder).toBeDefined();
      expect(createdOrder?.id).toBe('order123');
    });

    test('should prevent order creation with critical interactions', async () => {
      const mockInteractions = [
        {
          medication1: 'med1',
          medication2: 'med2',
          severity: 'critical',
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockInteractions,
        error: null,
      });

      const { result } = renderHook(() => useMedicationOrder('patient123'));

      const orderData = {
        patient_id: 'patient123',
        medications: ['med1', 'med2'],
        dose: '500',
        unit: 'mg',
        frequency: 'once daily',
        duration: 7,
        indication: 'Test',
        refills: 0,
      };

      let createdOrder;
      await act(async () => {
        createdOrder = await result.current.createOrder(orderData);
      });

      await waitFor(() => {
        expect(createdOrder).toBeNull();
        expect(result.current.error).toContain('critical');
      });
    });

    test('should validate required fields', async () => {
      const { result } = renderHook(() => useMedicationOrder('patient123'));

      const invalidOrder = {
        patient_id: 'patient123',
        medications: [],
        dose: '500',
        unit: 'mg',
        frequency: 'once daily',
        duration: 7,
        indication: 'Test',
        refills: 0,
      };

      let createdOrder;
      await act(async () => {
        createdOrder = await result.current.createOrder(invalidOrder as any);
      });

      await waitFor(() => {
        expect(createdOrder).toBeNull();
        expect(result.current.error).toContain('medication');
      });
    });
  });

  describe('checkAllergies', () => {
    test('should retrieve patient allergies', async () => {
      const mockAllergies = [
        { medication_id: 'med1', allergen: 'Penicillin' },
        { medication_id: 'med2', allergen: 'Sulfonamides' },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: mockAllergies }),
          }),
        }),
      });

      const { result } = renderHook(() => useMedicationOrder('patient123'));

      let allergies;
      await act(async () => {
        allergies = await result.current.checkAllergies();
      });

      expect(allergies).toHaveLength(2);
      expect(allergies[0].allergen).toBe('Penicillin');
    });
  });

  describe('Loading States', () => {
    test('should set loading to true during operation', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockImplementation(
              () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
            ),
          }),
        }),
      });

      const { result } = renderHook(() => useMedicationOrder('patient123'));

      act(() => {
        result.current.selectMedications();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
