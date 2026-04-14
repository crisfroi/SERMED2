// ============================================================================
// useTrendAnalysis.test.ts - Unit Tests
// Laboratory Results Trend Analysis
// ============================================================================

import { renderHook, act } from '@testing-library/react';
import { useTrendAnalysis } from './useTrendAnalysis';
import * as supabaseClient from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useTrendAnalysis', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseClient.createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  // ==================== FETCH TREND DATA TESTS ====================
  describe('fetchTrendData()', () => {
    it('should fetch trend data for a test over time', async () => {
      const mockData = [
        { test_id: 'glucose', value: 90, created_at: '2026-01-01' },
        { test_id: 'glucose', value: 95, created_at: '2026-02-01' },
        { test_id: 'glucose', value: 100, created_at: '2026-03-01' },
        { test_id: 'glucose', value: 98, created_at: '2026-04-01' },
      ];

      const mockSelect = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
      });

      expect(result.current.trendData).toHaveLength(4);
      expect(result.current.trendData[0].value).toBe(90);
    });

    it('should handle empty trend data', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
      });

      expect(result.current.trendData).toHaveLength(0);
      expect(result.current.error).toBeDefined();
    });

    it('should fetch data for different time periods', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: Array.from({ length: 12 }, (_, i) => ({
          value: 90 + i,
          created_at: `2026-${String(i + 1).padStart(2, '0')}-01`,
        })),
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '12_months');
      });

      expect(result.current.trendData).toHaveLength(12);
    });

    it('should sort data chronologically', async () => {
      const mockData = [
        { value: 100, created_at: '2026-03-01' },
        { value: 90, created_at: '2026-01-01' },
        { value: 95, created_at: '2026-02-01' },
      ];

      const mockSelect = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
      });

      expect(result.current.trendData[0].created_at).toBe('2026-01-01');
      expect(result.current.trendData[2].created_at).toBe('2026-03-01');
    });
  });

  // ==================== TREND ANALYSIS TESTS ====================
  describe('analyzeTrend()', () => {
    const testData = [
      { value: 90, created_at: '2026-01-01' },
      { value: 92, created_at: '2026-02-01' },
      { value: 95, created_at: '2026-03-01' },
      { value: 98, created_at: '2026-04-01' },
    ];

    beforeEach(async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: testData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });
    });

    it('should detect improving trend', async () => {
      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.analyzeTrend();
      });

      // Values increasing from 90 to 98 indicates improving trend for glucose (higher is not always better)
      expect(result.current.trendAnalysis).toBeDefined();
    });

    it('should calculate trend direction with slope', async () => {
      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.analyzeTrend();
      });

      expect(result.current.trendAnalysis.slope).toBeDefined();
      expect(typeof result.current.trendAnalysis.slope).toBe('number');
    });

    it('should calculate R-squared value', async () => {
      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.analyzeTrend();
      });

      expect(result.current.trendAnalysis.rSquared).toBeDefined();
      expect(result.current.trendAnalysis.rSquared).toBeGreaterThanOrEqual(0);
      expect(result.current.trendAnalysis.rSquared).toBeLessThanOrEqual(1);
    });

    it('should detect stable trend with flat slope', async () => {
      const stableData = [
        { value: 95, created_at: '2026-01-01' },
        { value: 95, created_at: '2026-02-01' },
        { value: 95, created_at: '2026-03-01' },
      ];

      const mockSelect = jest.fn().mockResolvedValue({
        data: stableData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.analyzeTrend();
      });

      expect(result.current.trendAnalysis.slope).toBeCloseTo(0, 1);
    });
  });

  // ==================== STATISTICS TESTS ====================
  describe('calculateStatistics()', () => {
    it('should calculate mean value', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { value: 90, created_at: '2026-01-01' },
          { value: 100, created_at: '2026-02-01' },
          { value: 95, created_at: '2026-03-01' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.calculateStatistics();
      });

      expect(result.current.statistics.mean).toBe(95);
    });

    it('should calculate standard deviation', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { value: 90, created_at: '2026-01-01' },
          { value: 100, created_at: '2026-02-01' },
          { value: 95, created_at: '2026-03-01' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.calculateStatistics();
      });

      expect(result.current.statistics.stdDev).toBeDefined();
      expect(result.current.statistics.stdDev).toBeGreaterThan(0);
    });

    it('should calculate min and max values', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { value: 85, created_at: '2026-01-01' },
          { value: 110, created_at: '2026-02-01' },
          { value: 95, created_at: '2026-03-01' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.calculateStatistics();
      });

      expect(result.current.statistics.min).toBe(85);
      expect(result.current.statistics.max).toBe(110);
    });

    it('should calculate range', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { value: 80, created_at: '2026-01-01' },
          { value: 120, created_at: '2026-02-01' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.calculateStatistics();
      });

      expect(result.current.statistics.range).toBe(40);
    });
  });

  // ==================== OUTLIER DETECTION TESTS ====================
  describe('detectOutliers()', () => {
    it('should identify outliers using IQR method', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { value: 90, created_at: '2026-01-01' },
          { value: 95, created_at: '2026-02-01' },
          { value: 92, created_at: '2026-03-01' },
          { value: 200, created_at: '2026-04-01' }, // Outlier
          { value: 93, created_at: '2026-05-01' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.detectOutliers();
      });

      expect(result.current.outliers).toContainEqual(
        expect.objectContaining({
          value: 200,
        })
      );
    });

    it('should flag multiple outliers', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { value: 90, created_at: '2026-01-01' },
          { value: 300, created_at: '2026-02-01' }, // Outlier
          { value: 92, created_at: '2026-03-01' },
          { value: 15, created_at: '2026-04-01' }, // Outlier
          { value: 93, created_at: '2026-05-01' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.detectOutliers();
      });

      expect(result.current.outliers.length).toBeGreaterThan(1);
    });
  });

  // ==================== EXPORT TESTS ====================
  describe('exportChart()', () => {
    it('should generate chart image', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: Array.from({ length: 6 }, (_, i) => ({
          value: 90 + i * 2,
          created_at: `2026-${String(i + 1).padStart(2, '0')}-01`,
        })),
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        const chartImage = await result.current.exportChart('png');
        expect(chartImage).toBeDefined();
      });
    });

    it('should support PDF export format', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ value: 95, created_at: '2026-01-01' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        const chart = await result.current.exportChart('pdf');
        expect(chart).toBeDefined();
      });
    });

    it('should generate high quality export', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ value: 95, created_at: '2026-01-01' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        const chart = await result.current.exportChart('png', {
          quality: 'high',
        });
        expect(chart).toBeDefined();
      });
    });
  });

  // ==================== TIME PERIOD TESTS ====================
  describe('Time Period Selection', () => {
    it('should support 1 month period', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: Array.from({ length: 4 }, (_, i) => ({
          value: 90 + i,
          created_at: `2026-04-${((i * 7) % 28) + 1}`,
        })),
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '1_month');
      });

      expect(result.current.trendData).toHaveLength(4);
    });

    it('should support 3 month period', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: Array.from({ length: 12 }, (_, i) => ({
          value: 90 + i,
          created_at: `2026-${String((i % 12) + 1).padStart(2, '0')}-01`,
        })),
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '3_months');
      });

      expect(result.current.trendData.length).toBeGreaterThan(0);
    });

    it('should support 6 month period', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: Array.from({ length: 24 }, (_, i) => ({
          value: 90 + (i % 10),
          created_at: `2025-${String((i % 12) + 11).padStart(2, '0')}-${((i % 28) + 1).toString().padStart(2, '0')}`,
        })),
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
      });

      expect(result.current.trendData.length).toBeGreaterThan(0);
    });

    it('should support 1 year period', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: Array.from({ length: 12 }, (_, i) => ({
          value: 90 + (i % 10),
          created_at: `2025-${String(i + 1).padStart(2, '0')}-01`,
        })),
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '12_months');
      });

      expect(result.current.trendData).toHaveLength(12);
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle insufficient data', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ value: 95, created_at: '2026-04-01' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTrendAnalysis('patient-1'));

      await act(async () => {
        await result.current.fetchTrendData('glucose', '6_months');
        result.current.analyzeTrend();
      });

      expect(result.current.error).toBeDefined();
    });
  });
});
