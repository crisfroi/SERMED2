// ============================================================================
// useLabOrder.test.ts - Unit Tests
// Laboratory Order Management Hook
// ============================================================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { useLabOrder } from './useLabOrder';
import * as supabaseClient from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('useLabOrder', () => {
  const mockSupabase = {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseClient.createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  // ==================== CREATE ORDER TESTS ====================
  describe('createOrder()', () => {
    it('should create a lab order successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1', patient_id: 'p1', status: 'pending' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          indication: 'Routine checkup',
          priority: 'routine',
        });
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(result.current.order).toBeDefined();
    });

    it('should handle creation errors gracefully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          indication: 'Test',
          priority: 'routine',
        });
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should set loading state during creation', async () => {
      const mockInsert = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(() =>
              resolve({
                data: [{ id: 'order-1' }],
                error: null,
              }),
              100
            )
          )
      );

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      act(() => {
        result.current.createOrder({
          indication: 'Test',
          priority: 'routine',
        });
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('should validate required fields before creation', async () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        const response = await result.current.createOrder({
          indication: '',
          priority: 'routine',
        });
        expect(response.error).toBeDefined();
      });
    });

    it('should include patient ID in order', async () => {
      const mockInsert = jest
        .fn()
        .mockResolvedValue({
          data: [{ id: 'order-1', patient_id: 'p1' }],
          error: null,
        });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          indication: 'Test',
          priority: 'urgent',
        });
      });

      expect(result.current.order?.patient_id).toBe('p1');
    });

    it('should support STAT priority', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1', priority: 'stat' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          indication: 'Emergency',
          priority: 'stat',
        });
      });

      expect(result.current.order?.priority).toBe('stat');
    });
  });

  // ==================== SELECT TESTS ====================
  describe('selectTests()', () => {
    it('should add test to selected list', () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      act(() => {
        result.current.selectTests('glucose');
      });

      expect(result.current.selectedTests).toContain('glucose');
    });

    it('should allow multiple test selection', () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      act(() => {
        result.current.selectTests('glucose');
        result.current.selectTests('hemoglobin');
        result.current.selectTests('tsh');
      });

      expect(result.current.selectedTests.length).toBe(3);
    });

    it('should remove test when deselected', () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      act(() => {
        result.current.selectTests('glucose');
        result.current.selectTests('glucose'); // Toggle off
      });

      expect(result.current.selectedTests).not.toContain('glucose');
    });

    it('should not allow duplicate selections', () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      act(() => {
        result.current.selectTests('glucose');
        result.current.selectTests('glucose');
      });

      expect(result.current.selectedTests.filter((t) => t === 'glucose').length).toBe(0);
    });

    it('should limit to 20 tests per order', () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      act(() => {
        for (let i = 0; i < 25; i++) {
          result.current.selectTests(`test-${i}`);
        }
      });

      expect(result.current.selectedTests.length).toBeLessThanOrEqual(20);
    });

    it('should return error when selecting invalid test', () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      act(() => {
        const error = result.current.selectTests('invalid-test-9999');
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ==================== FETCH TESTS ====================
  describe('fetchAvailableTests()', () => {
    it('should fetch list of available tests', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        data: [
          { id: 'glucose', name: 'Glucose' },
          { id: 'hemoglobin', name: 'Hemoglobin' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockFetch,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.fetchAvailableTests();
      });

      expect(result.current.availableTests).toHaveLength(2);
    });

    it('should cache test results', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        data: [{ id: 'glucose', name: 'Glucose' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockFetch,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.fetchAvailableTests();
        await result.current.fetchAvailableTests();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1); // Cache prevents second call
    });
  });

  // ==================== SUBMIT ORDER TESTS ====================
  describe('submitOrder()', () => {
    it('should submit order with selected tests', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        result.current.selectTests('glucose');
        await result.current.submitOrder({
          indication: 'Test',
          priority: 'routine',
        });
      });

      expect(mockInsert).toHaveBeenCalled();
    });

    it('should fail if no tests selected', async () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        const response = await result.current.submitOrder({
          indication: 'Test',
          priority: 'routine',
        });
        expect(response.error).toBeDefined();
      });
    });

    it('should require indication text', async () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        result.current.selectTests('glucose');
        const response = await result.current.submitOrder({
          indication: '',
          priority: 'routine',
        });
        expect(response.error).toBeDefined();
      });
    });

    it('should set order status to pending after submit', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1', status: 'pending' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        result.current.selectTests('glucose');
        await result.current.submitOrder({
          indication: 'Test',
          priority: 'routine',
        });
      });

      expect(result.current.order?.status).toBe('pending');
    });

    it('should return order ID on successful submit', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-unique-123' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        result.current.selectTests('glucose');
        const submitResult = await result.current.submitOrder({
          indication: 'Test',
          priority: 'routine',
        });
      });

      expect(result.current.order?.id).toBe('order-unique-123');
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockInsert = jest.fn().mockRejectedValue(new Error('Network failure'));

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          indication: 'Test',
          priority: 'routine',
        });
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should retry failed requests', async () => {
      const mockInsert = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: [{ id: 'order-1' }],
          error: null,
        });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          indication: 'Test',
          priority: 'routine',
        });
        await result.current.createOrder({
          indication: 'Test Retry',
          priority: 'routine',
        });
      });

      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('should clear error state on successful retry', async () => {
      const mockInsert = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce({
          data: [{ id: 'order-1' }],
          error: null,
        });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          indication: 'Test',
          priority: 'routine',
        });
      });

      expect(result.current.error).toBeTruthy();

      await act(async () => {
        await result.current.createOrder({
          indication: 'Retry',
          priority: 'routine',
        });
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ==================== OFFLINE MODE TESTS ====================
  describe('Offline Mode', () => {
    it('should queue order when offline', async () => {
      // Mock navigator online status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          indication: 'Test',
          priority: 'routine',
        });
      });

      expect(result.current.offlineQueue).toHaveLength(1);

      navigator.onLine = true;
    });

    it('should sync queued orders when back online', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useLabOrder('p1'));

      // Simulate offline creation
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      await act(async () => {
        await result.current.createOrder({
          indication: 'Offline test',
          priority: 'routine',
        });
      });

      expect(result.current.offlineQueue).toHaveLength(1);

      // Go back online and sync
      navigator.onLine = true;

      await act(async () => {
        await result.current.syncOfflineQueue();
      });

      expect(result.current.offlineQueue).toHaveLength(0);
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  // ==================== STATE MANAGEMENT TESTS ====================
  describe('State Management', () => {
    it('should maintain order state across re-renders', () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1', patient_id: 'p1' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result, rerender } = renderHook(() => useLabOrder('p1'));

      act(() => {
        result.current.createOrder({
          indication: 'Test',
          priority: 'routine',
        });
      });

      const firstOrder = result.current.order;

      rerender();

      expect(result.current.order).toEqual(firstOrder);
    });

    it('should reset state on reset() call', () => {
      const { result } = renderHook(() => useLabOrder('p1'));

      act(() => {
        result.current.selectTests('glucose');
      });

      expect(result.current.selectedTests).toHaveLength(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedTests).toHaveLength(0);
      expect(result.current.order).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
