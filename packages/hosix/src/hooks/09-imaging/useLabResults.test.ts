// ============================================================================
// useLabResults.test.ts - Unit Tests
// Laboratory Results Fetching and Management
// ============================================================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { useLabResults } from './useLabResults';
import * as supabaseClient from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useLabResults', () => {
  const mockSupabase = {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseClient.createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  // ==================== FETCH RESULTS TESTS ====================
  describe('fetchResults()', () => {
    it('should fetch results for an order', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: 'result-1', test_name: 'Glucose', value: 95 },
          { id: 'result-2', test_name: 'Hemoglobin', value: 14.2 },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results[0].test_name).toBe('Glucose');
    });

    it('should handle empty results gracefully', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      expect(result.current.results).toHaveLength(0);
    });

    it('should set loading state while fetching', async () => {
      const mockSelect = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: [{ id: 'result-1' }],
                  error: null,
                }),
              50
            )
          )
      );

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      act(() => {
        result.current.fetchResults('order-1');
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('should handle fetch errors', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should fetch results for specific patient', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'result-1', patient_id: 'patient-1' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      expect(result.current.results[0].patient_id).toBe('patient-1');
    });
  });

  // ==================== REALTIME SUBSCRIPTION TESTS ====================
  describe('subscribeToResults()', () => {
    it('should subscribe to real-time updates', async () => {
      const mockOn = jest.fn();
      const mockSubscription = { unsubscribe: jest.fn() };

      mockSupabase.from.mockReturnValue({
        on: mockOn.mockReturnValue(mockSubscription),
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        result.current.subscribeToResults('order-1');
      });

      expect(mockOn).toHaveBeenCalledWith('*', expect.any(Function));
    });

    it('should add new results from real-time events', async () => {
      const mockOn = jest.fn((event, callback) => {
        setTimeout(() => {
          callback({
            eventType: 'INSERT',
            new: { id: 'result-new', test_name: 'TSH', value: 2.5 },
          });
        }, 0);
        return { unsubscribe: jest.fn() };
      });

      mockSupabase.from.mockReturnValue({
        on: mockOn,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        result.current.subscribeToResults('order-1');
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });
    });

    it('should update results on UPDATE events', async () => {
      const mockOn = jest.fn((event, callback) => {
        setTimeout(() => {
          callback({
            eventType: 'UPDATE',
            new: { id: 'result-1', test_name: 'Glucose', value: 105 },
          });
        }, 0);
        return { unsubscribe: jest.fn() };
      });

      mockSupabase.from.mockReturnValue({
        on: mockOn,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        result.current.subscribeToResults('order-1');
      });

      await waitFor(() => {
        const updated = result.current.results.find((r) => r.id === 'result-1');
        expect(updated?.value).toBe(105);
      });
    });

    it('should unsubscribe on cleanup', () => {
      const mockUnsubscribe = jest.fn();
      const mockOn = jest.fn(() => ({
        unsubscribe: mockUnsubscribe,
      }));

      mockSupabase.from.mockReturnValue({
        on: mockOn,
      });

      const { result, unmount } = renderHook(() => useLabResults('patient-1'));

      act(() => {
        result.current.subscribeToResults('order-1');
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // ==================== FILTERING TESTS ====================
  describe('getFilteredResults()', () => {
    beforeEach(() => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: 'r1', test_name: 'Glucose', value: 95, interpretation: 'normal' },
          { id: 'r2', test_name: 'Hemoglobin', value: 20, interpretation: 'high' },
          { id: 'r3', test_name: 'TSH', value: 0.5, interpretation: 'normal' },
          { id: 'r4', test_name: 'Creatinine', value: 2.2, interpretation: 'critical' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });
    });

    it('should filter by test type', async () => {
      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      const filtered = result.current.getFilteredResults({
        testType: 'Glucose',
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].test_name).toBe('Glucose');
    });

    it('should filter by interpretation level', async () => {
      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      const abnormal = result.current.getFilteredResults({
        interpretation: ['high', 'critical'],
      });

      expect(abnormal.length).toBeGreaterThan(0);
      expect(abnormal.every((r) => ['high', 'critical'].includes(r.interpretation))).toBe(true);
    });

    it('should filter by date range', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: 'r1', created_at: '2026-04-10', value: 95 },
          { id: 'r2', created_at: '2026-04-15', value: 100 },
          { id: 'r3', created_at: '2026-04-20', value: 105 },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      const filtered = result.current.getFilteredResults({
        dateFrom: '2026-04-12',
        dateTo: '2026-04-18',
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].created_at).toBe('2026-04-15');
    });

    it('should combine multiple filters', async () => {
      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      const filtered = result.current.getFilteredResults({
        testType: 'Glucose',
        interpretation: ['normal'],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].test_name).toBe('Glucose');
    });

    it('should return all results when no filter applied', async () => {
      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      const filtered = result.current.getFilteredResults({});

      expect(filtered).toHaveLength(result.current.results.length);
    });

    it('should sort results by date', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: 'r1', created_at: '2026-04-20' },
          { id: 'r2', created_at: '2026-04-10' },
          { id: 'r3', created_at: '2026-04-15' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      const sorted = result.current.getFilteredResults(
        {},
        { sortBy: 'date', sortOrder: 'asc' }
      );

      expect(sorted[0].created_at).toBe('2026-04-10');
      expect(sorted[2].created_at).toBe('2026-04-20');
    });
  });

  // ==================== EXPORT TESTS ====================
  describe('exportToPDF()', () => {
    it('should generate PDF export', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'r1', test_name: 'Glucose', value: 95 }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const mockFunctionCall = jest.fn().mockResolvedValue({
        data: { file_url: 'https://example.com/export.pdf' },
      });

      mockSupabase.functions = {
        invoke: mockFunctionCall,
      };

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
        await result.current.exportToPDF('order-1');
      });

      expect(mockFunctionCall).toHaveBeenCalledWith('export_lab_results', expect.any(Object));
    });

    it('should include all results in PDF', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: 'r1', test_name: 'Glucose', value: 95 },
          { id: 'r2', test_name: 'Hemoglobin', value: 14 },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const mockFunctionCall = jest.fn().mockResolvedValue({
        data: { file_url: 'https://example.com/export.pdf' },
      });

      mockSupabase.functions = {
        invoke: mockFunctionCall,
      };

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
        await result.current.exportToPDF('order-1');
      });

      const call = mockFunctionCall.mock.calls[0][1];
      expect(call.body.dataLength).toBe(2);
    });
  });

  // ==================== CACHING TESTS ====================
  describe('Caching', () => {
    it('should cache results for 1 hour', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'r1' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result, rerender } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      rerender();

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      // Should only call once due to caching
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it('should refetch after cache expires', async () => {
      jest.useFakeTimers();

      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'r1' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      expect(mockSelect).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(61 * 60 * 1000); // Advance 61 minutes

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      expect(mockSelect).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should clear cache on manual refresh', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'r1' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      expect(mockSelect).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refreshResults();
      });

      expect(mockSelect).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockSelect = jest.fn().mockRejectedValue(new Error('Network error'));

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      expect(result.current.error).toContain('Network error');
    });

    it('should handle permission errors', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1');
      });

      expect(result.current.error).toContain('Permission');
    });
  });

  // ==================== PAGINATION TESTS ====================
  describe('Pagination', () => {
    it('should support pagination for large result sets', async () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: `r${i}`,
        value: i,
      }));

      const mockSelect = jest.fn().mockResolvedValue({
        data: data.slice(0, 20),
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1', { limit: 20, offset: 0 });
      });

      expect(result.current.results).toHaveLength(20);
    });

    it('should fetch next page of results', async () => {
      const mockSelect = jest
        .fn()
        .mockResolvedValueOnce({
          data: Array.from({ length: 20 }, (_, i) => ({ id: `r${i}` })),
          error: null,
        })
        .mockResolvedValueOnce({
          data: Array.from({ length: 20 }, (_, i) => ({ id: `r${i + 20}` })),
          error: null,
        });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useLabResults('patient-1'));

      await act(async () => {
        await result.current.fetchResults('order-1', { limit: 20, offset: 0 });
      });

      expect(result.current.results).toHaveLength(20);

      await act(async () => {
        await result.current.fetchNextPage();
      });

      expect(result.current.results).toHaveLength(40);
    });
  });
});
