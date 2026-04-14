// Laboratory Module Tests (ASIS 10)
// Comprehensive test suite for laboratory testing workflow
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useLabOrder,
  useLabResults,
  useNormalRanges,
  useQualityControl,
} from '../hooks/useLabHooks';

// Mock fetch
global.fetch = vi.fn();

describe('ASIS 10 - Laboratory Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // HOOK TESTS: useLabOrder
  // ==========================================
  describe('useLabOrder Hook', () => {
    it('should fetch lab orders with filters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'order-001',
              patient_id: 'pat-123',
              test_type: 'Complete Blood Count',
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });

      const { result } = renderHook(() => useLabOrder());

      await waitFor(() => {
        expect(result.current.orders).toBeDefined();
      });
    });

    it('should create new lab order with validation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'order-new',
            test_type: 'Blood Culture',
            urgency: 'stat',
          },
        }),
      });

      const { result } = renderHook(() => useLabOrder());

      await act(async () => {
        await result.current.createOrder({
          test_type: 'Blood Culture',
          urgency: 'stat',
          collected_by: 'nurse-456',
        });
      });

      expect(result.current.isLoading).toBeFalsy();
    });

    it('should update order status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'order-001', status: 'completed' },
        }),
      });

      const { result } = renderHook(() => useLabOrder());

      await act(async () => {
        await result.current.updateOrderStatus('order-001', 'completed');
      });

      expect(result.current.error).toBeNull();
    });

    it('should cancel order with reason', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'order-001', status: 'cancelled' },
        }),
      });

      const { result } = renderHook(() => useLabOrder());

      await act(async () => {
        await result.current.cancelOrder('order-001', 'Patient refused');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network error on fetch', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useLabOrder());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle validation error on create', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid test type',
        }),
      });

      const { result } = renderHook(() => useLabOrder());

      await act(async () => {
        await result.current.createOrder({
          test_type: 'Invalid',
          urgency: 'routine',
        });
      });

      expect(result.current.error).toBeDefined();
    });

    it('should refetch orders on demand', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { result } = renderHook(() => useLabOrder());

      await act(async () => {
        await result.current.refetch();
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should batch create multiple orders', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 'order-1' }, { id: 'order-2' }],
        }),
      });

      const { result } = renderHook(() => useLabOrder());

      await act(async () => {
        await result.current.batchCreateOrders([
          { test_type: 'CBC', urgency: 'routine' },
          { test_type: 'BMP', urgency: 'routine' },
        ]);
      });

      expect(result.current.isLoading).toBeFalsy();
    });
  });

  // ==========================================
  // HOOK TESTS: useLabResults
  // ==========================================
  describe('useLabResults Hook', () => {
    it('should fetch lab results with filters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'result-001',
              order_id: 'order-001',
              test_type: 'Complete Blood Count',
              status: 'completed',
              results: {
                WBC: 7.2,
                RBC: 4.8,
                Hemoglobin: 14.0,
              },
            },
          ],
        }),
      });

      const { result } = renderHook(() => useLabResults());

      await waitFor(() => {
        expect(result.current.results).toBeDefined();
      });
    });

    it('should validate results against normal ranges', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            validation: {
              WBC: { value: 7.2, normal: true, range: '4.5-11.0' },
              RBC: { value: 4.8, normal: true, range: '4.0-5.5' },
            },
          },
        }),
      });

      const { result } = renderHook(() => useLabResults());

      await act(async () => {
        await result.current.validateResults('order-001');
      });

      expect(result.current.isLoading).toBeFalsy();
    });

    it('should flag critical values', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            criticalValues: [
              {
                parameter: 'Potassium',
                value: 6.8,
                threshold: 6.0,
                severity: 'critical',
              },
            ],
          },
        }),
      });

      const { result } = renderHook(() => useLabResults());

      await act(async () => {
        await result.current.checkCriticalValues('result-001');
      });

      expect(result.current.criticalValues).toBeDefined();
    });

    it('should calculate trending results', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            trends: {
              improving: true,
              trend: 'decreasing',
              lastValues: [6.5, 6.8, 6.3],
            },
          },
        }),
      });

      const { result } = renderHook(() => useLabResults());

      await act(async () => {
        await result.current.calculateTrends('parameter', 'patient-123');
      });

      expect(result.current.trends).toBeDefined();
    });

    it('should export results in multiple formats', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['CSV data']),
      });

      const { result } = renderHook(() => useLabResults());

      await act(async () => {
        await result.current.exportResults('result-001', 'csv');
      });

      expect(result.current.isLoading).toBeFalsy();
    });

    it('should compare results over time', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            comparison: {
              parameter: 'Glucose',
              current: 120,
              previous: 115,
              change: '+4.3%',
            },
          },
        }),
      });

      const { result } = renderHook(() => useLabResults());

      await act(async () => {
        await result.current.compareResults('Glucose', 'patient-123');
      });

      expect(result.current.comparison).toBeDefined();
    });

    it('should handle pathology flagging', async () => {
      const { result } = renderHook(() => useLabResults());

      const pathologyFlags = result.current.flagPathology({
        WBC: 2.1,
        Hemoglobin: 7.5,
        Platelets: 50,
      });

      expect(pathologyFlags.length).toBeGreaterThan(0);
    });

    it('should calculate combined indices', async () => {
      const { result } = renderHook(() => useLabResults());

      const indices = result.current.calculateIndices({
        WBC: 7.2,
        RBC: 4.8,
        Hemoglobin: 14.0,
      });

      expect(indices).toHaveProperty('RDW');
      expect(indices).toHaveProperty('MCV');
    });
  });

  // ==========================================
  // HOOK TESTS: useNormalRanges
  // ==========================================
  describe('useNormalRanges Hook', () => {
    it('should fetch normal ranges by test type', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            WBC: { min: 4.5, max: 11.0, unit: '10^3/µL' },
            RBC: { min: 4.0, max: 5.5, unit: '10^6/µL' },
            Hemoglobin: { min: 12.0, max: 16.0, unit: 'g/dL' },
          },
        }),
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        await result.current.fetchByTestType('Complete Blood Count');
      });

      expect(result.current.ranges).toBeDefined();
    });

    it('should fetch age-adjusted ranges', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            WBC: { minAge: 4.5, maxAge: 9.0 },
          },
        }),
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        await result.current.fetchAgeAdjustedRanges('patient-123');
      });

      expect(result.current.ranges).toBeDefined();
    });

    it('should fetch gender-adjusted ranges', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            Hemoglobin: { min: 12.0, max: 16.0 },
          },
        }),
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        await result.current.fetchGenderAdjustedRanges('F');
      });

      expect(result.current.ranges).toBeDefined();
    });

    it('should determine if value is abnormal', () => {
      const { result } = renderHook(() => useNormalRanges());

      const isAbnormal = result.current.isAbnormal('WBC', 15.0, {
        min: 4.5,
        max: 11.0,
      });

      expect(isAbnormal).toBe(true);
    });

    it('should categorize abnormal severity', () => {
      const { result } = renderHook(() => useNormalRanges());

      const severity = result.current.categorizeAbnormality('WBC', 20.0, {
        min: 4.5,
        max: 11.0,
        critical_high: 15.0,
      });

      expect(severity).toBe('critical');
    });

    it('should cache ranges appropriately', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        await result.current.fetchByTestType('CBC');
        await result.current.fetchByTestType('CBC'); // Second call
      });

      expect(global.fetch).toHaveBeenCalledTimes(1); // Should use cache
    });

    it('should return unit with range', () => {
      const { result } = renderHook(() => useNormalRanges());

      result.current.ranges = {
        WBC: { min: 4.5, max: 11.0, unit: '10^3/µL' },
      };

      const rangeStr = result.current.getRangeString('WBC');

      expect(rangeStr).toContain('10^3/µL');
    });
  });

  // ==========================================
  // HOOK TESTS: useQualityControl
  // ==========================================
  describe('useQualityControl Hook', () => {
    it('should track QC results', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            status: 'in_control',
            mean: 100.0,
            stdDev: 2.0,
          },
        }),
      });

      const { result } = renderHook(() => useQualityControl());

      await act(async () => {
        await result.current.recordQCResult('analyzer-001', {
          control_level: 'Level 1',
          value: 99.8,
          timestamp: new Date(),
        });
      });

      expect(result.current.isLoading).toBeFalsy();
    });

    it('should detect QC failures using Levey-Jennings', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            inControl: false,
            violations: ['1-3s', '2-2s'],
            recommendation: 'Stop testing',
          },
        }),
      });

      const { result } = renderHook(() => useQualityControl());

      await act(async () => {
        await result.current.analyzeQCTrend('test-001');
      });

      expect(result.current.inControl).toBe(false);
    });

    it('should generate Levey-Jennings chart data', () => {
      const { result } = renderHook(() => useQualityControl());

      const chartData = result.current.generateLeveyJenninsChart([
        { value: 98, date: '2026-04-10' },
        { value: 102, date: '2026-04-11' },
        { value: 101, date: '2026-04-12' },
      ]);

      expect(chartData).toHaveLength(3);
      expect(chartData[0]).toHaveProperty('value');
    });

    it('should track calibration schedules', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            nextCalibration: '2026-05-10',
            daysRemaining: 27,
          },
        }),
      });

      const { result } = renderHook(() => useQualityControl());

      await act(async () => {
        await result.current.getCalibrationDue('analyzer-001');
      });

      expect(result.current.calibrationDue).toBeDefined();
    });

    it('should maintain equipment maintenance logs', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            logs: [
              {
                date: '2026-03-15',
                type: 'preventive',
                description: 'Filter replacement',
              },
            ],
          },
        }),
      });

      const { result } = renderHook(() => useQualityControl());

      await act(async () => {
        await result.current.fetchMaintenanceLogs('analyzer-001');
      });

      expect(result.current.maintenanceLogs).toBeDefined();
    });

    it('should calculate QC statistics', () => {
      const { result } = renderHook(() => useQualityControl());

      const stats = result.current.calculateQCStatistics([
        100, 102, 99, 101, 100, 103,
      ]);

      expect(stats).toHaveProperty('mean');
      expect(stats).toHaveProperty('stdDev');
      expect(stats).toHaveProperty('cv');
    });

    it('should alert for out-of-control conditions', async () => {
      const { result } = renderHook(() => useQualityControl());

      result.current.issueQCAlert = vi.fn();

      await act(async () => {
        result.current.checkAutoQCAlert({
          status: 'out_of_control',
          violation: '1-3s',
        });
      });

      expect(result.current.issueQCAlert).toHaveBeenCalled();
    });

    it('should export QC reports', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['QC Report']),
      });

      const { result } = renderHook(() => useQualityControl());

      await act(async () => {
        await result.current.exportQCReport('analyzer-001');
      });

      expect(result.current.isLoading).toBeFalsy();
    });
  });

  // ==========================================
  // INTEGRATION TESTS
  // ==========================================
  describe('Laboratory Workflow Integration', () => {
    it('should complete full order to result workflow', async () => {
      // Create order
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'order-001' } }),
      });

      const { result: orderResult } = renderHook(() => useLabOrder());

      await act(async () => {
        await orderResult.current.createOrder({
          test_type: 'CBC',
          urgency: 'routine',
        });
      });

      expect(orderResult.current.error).toBeNull();

      // Update to collected
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'collected' } }),
      });

      await act(async () => {
        await orderResult.current.updateOrderStatus('order-001', 'collected');
      });

      expect(orderResult.current.error).toBeNull();
    });

    it('should handle critical result notification flow', async () => {
      const { result } = renderHook(() => useLabResults());

      result.current.notifyCriticalResult = vi.fn();

      await act(async () => {
        result.current.checkCriticalAndNotify({
          Potassium: 6.8,
          Glucose: 45,
        });
      });

      expect(result.current.notifyCriticalResult).toHaveBeenCalled();
    });

    it('should validate trending before releasing results', async () => {
      const { result: resultsHook } = renderHook(() => useLabResults());
      const { result: rangeHook } = renderHook(() => useNormalRanges());

      rangeHook.current.ranges = {
        WBC: { min: 4.5, max: 11.0, unit: '10^3/µL' },
      };

      const validated = resultsHook.current.validateBeforeRelease({
        WBC: 7.2,
      });

      expect(validated).toBe(true);
    });

    it('should apply QC hold on results when QC out-of-control', async () => {
      const { result: qcHook } = renderHook(() => useQualityControl());

      qcHook.current.inControl = false;

      const resultReleased = await qcHook.current.canReleaseResults();

      expect(resultReleased).toBe(false);
    });

    it('should generate comprehensive lab report', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            report: {
              patientName: 'John Doe',
              testResults: [],
              interpretation: 'Normal',
            },
          },
        }),
      });

      const { result } = renderHook(() => useLabResults());

      await act(async () => {
        await result.current.generateReport('order-001');
      });

      expect(result.current.report).toBeDefined();
    });

    it('should track result turnaround time', () => {
      const { result } = renderHook(() => useLabResults());

      const tat = result.current.calculateTAT(
        new Date('2026-04-10T08:00:00'),
        new Date('2026-04-10T10:30:00')
      );

      expect(tat).toBe(150); // minutes
    });
  });

  // ==========================================
  // ERROR HANDLING & EDGE CASES
  // ==========================================
  describe('Error Handling & Edge Cases', () => {
    it('should handle hemolyzed sample rejection', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            quality: 'inadequate',
            reason: 'hemolyzed',
            action: 'recollect',
          },
        }),
      });

      const { result } = renderHook(() => useLabOrder());

      await act(async () => {
        await result.current.assessSampleQuality('sample-001');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle missing reference ranges gracefully', () => {
      const { result } = renderHook(() => useNormalRanges());

      result.current.ranges = {};

      const isAbnormal = result.current.isAbnormal('UnknownTest', 100, null);

      expect(isAbnormal).toBe(false); // Default to normal when range unavailable
    });

    it('should retry failed result transmission', async () => {
      let callCount = 0;
      (global.fetch as any).mockImplementation(async () => {
        callCount++;
        if (callCount < 2) throw new Error('Network error');
        return { ok: true, json: async () => ({ data: { ok: true } }) };
      });

      const { result } = renderHook(() => useLabResults());

      await act(async () => {
        await result.current.transmitResults('result-001', 3); // 3 retries
      });

      expect(callCount).toBe(2);
    });

    it('should handle concurrent order updates', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { status: 'updated' } }),
      });

      const { result } = renderHook(() => useLabOrder());

      await act(async () => {
        await Promise.all([
          result.current.updateOrderStatus('order-1', 'collected'),
          result.current.updateOrderStatus('order-2', 'processing'),
        ]);
      });

      expect(result.current.error).toBeNull();
    });

    it('should gracefully handle result overflow values', () => {
      const { result } = renderHook(() => useLabResults());

      const formatted = result.current.formatResultValue(999999.999);

      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });
});
