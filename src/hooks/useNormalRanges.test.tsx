// @ts-nocheck
// ============================================================================
// useNormalRanges.test.ts - Unit Tests
// Demographic-Specific Normal Range Management
// ============================================================================

import { renderHook, act } from '@testing-library/react';
import { useNormalRanges } from './useNormalRanges';
import * as supabaseClient from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useNormalRanges', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseClient.createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  // ==================== FETCH RANGES TESTS ====================
  describe('getRangeByDemographic()', () => {
    it('should fetch normal range for adult male', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'hemoglobin',
            min: 13.5,
            max: 17.5,
            unit: 'g/dL',
            age_min: 18,
            age_max: 64,
            sex: 'M',
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('hemoglobin', {
          age: 35,
          sex: 'M',
          pregnancyStatus: false,
        });
        expect(range.min).toBe(13.5);
        expect(range.max).toBe(17.5);
      });
    });

    it('should fetch normal range for adult female', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'hemoglobin',
            min: 12.0,
            max: 16.0,
            unit: 'g/dL',
            age_min: 18,
            age_max: 64,
            sex: 'F',
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('hemoglobin', {
          age: 35,
          sex: 'F',
          pregnancyStatus: false,
        });

        expect(range.min).toBe(12.0);
        expect(range.max).toBe(16.0);
      });
    });

    it('should fetch pediatric range for children', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'glucose',
            min: 70,
            max: 100,
            unit: 'mg/dL',
            age_min: 5,
            age_max: 11,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('glucose', {
          age: 8,
          sex: 'M',
          pregnancyStatus: false,
        });

        expect(range.min).toBe(70);
        expect(range.max).toBe(100);
      });
    });

    it('should fetch geriatric range for elderly', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'creatinine',
            min: 0.6,
            max: 1.2,
            unit: 'mg/dL',
            age_min: 65,
            age_max: 150,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('creatinine', {
          age: 75,
          sex: 'M',
          pregnancyStatus: false,
        });

        expect(range.min).toBeLessThanOrEqual(range.max);
      });
    });

    it('should fetch pregnancy-adjusted range', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'glucose',
            min: 70,
            max: 105,
            unit: 'mg/dL',
            pregnancy_adjusted: true,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('glucose', {
          age: 28,
          sex: 'F',
          pregnancyStatus: true,
        });

        expect(range.pregnancy_adjusted).toBe(true);
      });
    });
  });

  // ==================== CLASSIFICATION TESTS ====================
  describe('classifyResult()', () => {
    it('should classify normal result', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'glucose',
            min: 70,
            max: 100,
            age_min: 18,
            age_max: 64,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const classification = await result.current.classifyResult('glucose', 85, {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
        });

        expect(classification).toBe('normal');
      });
    });

    it('should classify high result', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'glucose',
            min: 70,
            max: 100,
            critical_high: 150,
            age_min: 18,
            age_max: 64,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const classification = await result.current.classifyResult('glucose', 120, {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
        });

        expect(classification).toBe('high');
      });
    });

    it('should classify critical result', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'potassium',
            min: 3.5,
            max: 5.0,
            critical_high: 6.5,
            age_min: 18,
            age_max: 64,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const classification = await result.current.classifyResult('potassium', 7.0, {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
        });

        expect(classification).toBe('critical');
      });
    });

    it('should classify low result', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'hemoglobin',
            min: 12.0,
            max: 16.0,
            age_min: 18,
            age_max: 64,
            sex: 'F',
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const classification = await result.current.classifyResult('hemoglobin', 10.0, {
          age: 30,
          sex: 'F',
          pregnancyStatus: false,
        });

        expect(classification).toBe('low');
      });
    });

    it('should classify critically low result', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'hemoglobin',
            min: 12.0,
            max: 16.0,
            critical_low: 7.0,
            age_min: 18,
            age_max: 64,
            sex: 'F',
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const classification = await result.current.classifyResult('hemoglobin', 6.5, {
          age: 30,
          sex: 'F',
          pregnancyStatus: false,
        });

        expect(classification).toBe('critical');
      });
    });
  });

  // ==================== DEVIATION CALCULATION TESTS ====================
  describe('calculateDeviation()', () => {
    it('should calculate Z-score', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'glucose',
            min: 70,
            max: 100,
            mean: 85,
            sd: 7.5,
            age_min: 18,
            age_max: 64,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const deviation = await result.current.calculateDeviation('glucose', 95, {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
        });

        expect(deviation.zScore).toBeCloseTo(1.33, 1);
      });
    });

    it('should calculate percentage from normal', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'glucose',
            min: 70,
            max: 100,
            age_min: 18,
            age_max: 64,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const deviation = await result.current.calculateDeviation('glucose', 110, {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
        });

        expect(deviation.percentageFromNormal).toBeDefined();
        expect(deviation.percentageFromNormal).toBeGreaterThan(0);
      });
    });
  });

  // ==================== STANDARD SELECTION TESTS ====================
  describe('applyStandardsPreference()', () => {
    it('should use WHO standards', async () => {
      const mockSelect = jest
        .fn()
        .mockResolvedValueOnce({
          data: [{ test_id: 'hemoglobin', standard: 'WHO', min: 12, max: 16 }],
          error: null,
        });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('hemoglobin', {
          age: 30,
          sex: 'F',
          pregnancyStatus: false,
          standardPreference: 'WHO',
        });

        expect(range.standard).toBe('WHO');
      });
    });

    it('should use CLSI standards', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'glucose',
            standard: 'CLSI',
            min: 70,
            max: 105,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('glucose', {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
          standardPreference: 'CLSI',
        });

        expect(range.standard).toBe('CLSI');
      });
    });

    it('should use local hospital standards', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'TSH',
            standard: 'Hospital',
            min: 0.4,
            max: 4.0,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('TSH', {
          age: 30,
          sex: 'F',
          pregnancyStatus: false,
          standardPreference: 'Hospital',
        });

        expect(range.standard).toBe('Hospital');
      });
    });
  });

  // ==================== AGE INTERPOLATION TESTS ====================
  describe('interpolateRange()', () => {
    it('should interpolate range for age between breakpoints', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'glucose',
            min: 70,
            max: 100,
            age_min: 20,
            age_max: 40,
          },
          {
            test_id: 'glucose',
            min: 72,
            max: 105,
            age_min: 40,
            age_max: 60,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.interpolateRange('glucose', 35, 'M', false);
        expect(range.min).toBeGreaterThanOrEqual(70);
        expect(range.min).toBeLessThanOrEqual(72);
      });
    });

    it('should extrapolate for young ages', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'glucose',
            min: 70,
            max: 100,
            age_min: 5,
            age_max: 12,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.interpolateRange('glucose', 8, 'M', false);
        expect(range).toBeDefined();
      });
    });

    it('should extrapolate for elderly ages', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            test_id: 'creatinine',
            min: 0.6,
            max: 1.2,
            age_min: 65,
            age_max: 100,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.interpolateRange('creatinine', 85, 'M', false);
        expect(range).toBeDefined();
      });
    });
  });

  // ==================== MULTIPLE TEST RANGES ====================
  describe('getBatchRanges()', () => {
    it('should fetch ranges for multiple tests', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { test_id: 'glucose', min: 70, max: 100 },
          { test_id: 'hemoglobin', min: 12, max: 16 },
          { test_id: 'creatinine', min: 0.6, max: 1.2 },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const ranges = await result.current.getBatchRanges(
          ['glucose', 'hemoglobin', 'creatinine'],
          { age: 30, sex: 'M', pregnancyStatus: false }
        );

        expect(ranges).toHaveLength(3);
      });
    });

    it('should cache batch results', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { test_id: 'glucose', min: 70, max: 100 },
          { test_id: 'hemoglobin', min: 12, max: 16 },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result, rerender } = renderHook(() => useNormalRanges());

      await act(async () => {
        await result.current.getBatchRanges(['glucose', 'hemoglobin'], {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
        });
      });

      rerender();

      await act(async () => {
        await result.current.getBatchRanges(['glucose', 'hemoglobin'], {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
        });
      });

      expect(mockSelect).toHaveBeenCalledTimes(1); // Cache prevents second call
    });
  });

  // ==================== EDUCATIONAL TEXT ====================
  describe('getEducationalText()', () => {
    it('should provide text for abnormal results', async () => {
      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const text = result.current.getEducationalText('glucose', 'high');
        expect(text).toBeDefined();
        expect(text).toContain('glucose');
      });
    });

    it('should provide different text for different abnormalities', async () => {
      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const highText = result.current.getEducationalText('glucose', 'high');
        const lowText = result.current.getEducationalText('glucose', 'low');
        expect(highText).not.toBe(lowText);
      });
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should handle missing demographic data', async () => {
      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const response = await result.current.getRangeByDemographic('glucose', {
          age: undefined,
          sex: 'M',
          pregnancyStatus: false,
        });

        expect(response.error).toBeDefined();
      });
    });

    it('should handle unknown test types', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('unknown_test_xyz', {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
        });

        expect(range.error).toBeDefined();
      });
    });

    it('should fall back to population averages on error', async () => {
      const mockSelect = jest.fn().mockRejectedValue(new Error('DB error'));

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNormalRanges());

      await act(async () => {
        const range = await result.current.getRangeByDemographic('glucose', {
          age: 30,
          sex: 'M',
          pregnancyStatus: false,
          useFallback: true,
        });

        expect(range).toBeDefined();
      });
    });
  });
});
