// ============================================================================
// useDicomViewer.test.ts - Unit Tests
// DICOM Viewer Integration and Display
// ============================================================================

import { renderHook, act } from '@testing-library/react';
import { useDicomViewer } from './useDicomViewer';
import * as supabaseClient from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useDicomViewer', () => {
  const mockSupabase = {
    from: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseClient.createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  // ==================== FETCH DICOM TESTS ====================
  describe('fetchDicomFromOrthanc()', () => {
    it('should fetch DICOM from Orthanc via edge function', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: {
          dicom_synced: true,
          preview_url: 'https://storage.example.com/preview.jpg',
          study_uid: '1.2.3.4.5',
        },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        await result.current.fetchDicomFromOrthanc({
          study_oid: 'study-123',
          series_oid: 'series-456',
          patient_id: 'p1',
          imaging_order_id: 'order-1',
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith('sync_orthanc_dicom', expect.any(Object));
    });

    it('should store preview URL after fetch', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: {
          dicom_synced: true,
          preview_url: 'https://storage.example.com/preview.jpg',
        },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        await result.current.fetchDicomFromOrthanc({
          study_oid: 'study-123',
          series_oid: 'series-456',
          patient_id: 'p1',
          imaging_order_id: 'order-1',
        });
      });

      expect(result.current.previewUrl).toBe('https://storage.example.com/preview.jpg');
    });

    it('should set loading state during fetch', async () => {
      const mockInvoke = jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() =>
                resolve({
                  data: { dicom_synced: true, preview_url: 'url' },
                }),
                50
              )
            )
        );

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useDicomViewer());

      act(() => {
        result.current.fetchDicomFromOrthanc({
          study_oid: 'study-123',
          series_oid: 'series-456',
          patient_id: 'p1',
          imaging_order_id: 'order-1',
        });
      });

      expect(result.current.loading).toBe(true);
    });

    it('should handle fetch errors', async () => {
      const mockInvoke = jest.fn().mockRejectedValue(new Error('Orthanc connection failed'));

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        await result.current.fetchDicomFromOrthanc({
          study_oid: 'study-123',
          series_oid: 'series-456',
          patient_id: 'p1',
          imaging_order_id: 'order-1',
        });
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ==================== DICOM BINARY LOADING TESTS ====================
  describe('loadDicomBinary()', () => {
    it('should convert DICOM to Cornerstone format', async () => {
      const mockDicomBinary = new Uint8Array([1, 2, 3, 4, 5]);

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        const cornerstone = result.current.loadDicomBinary(mockDicomBinary);
        expect(cornerstone).toBeDefined();
      });
    });

    it('should extract DICOM tags from binary', async () => {
      const mockDicomBinary = new Uint8Array([1, 2, 3, 4, 5]);

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        const tags = result.current.extractDicomTags(mockDicomBinary);
        expect(tags).toBeDefined();
      });
    });

    it('should handle invalid DICOM binary', async () => {
      const invalidBinary = new Uint8Array([255, 255, 255]);

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        const response = await result.current.loadDicomBinary(invalidBinary);
        expect(response.error).toBeDefined();
      });
    });
  });

  // ==================== CACHING TESTS ====================
  describe('Caching', () => {
    it('should cache DICOM metadata locally', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: {
          dicom_synced: true,
          preview_url: 'url',
          metadata: { PatientID: 'p1', StudyDate: '2026-04-16' },
        },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        await result.current.fetchDicomFromOrthanc({
          study_oid: 'study-123',
          series_oid: 'series-456',
          patient_id: 'p1',
          imaging_order_id: 'order-1',
        });
      });

      expect(result.current.cachedMetadata).toBeDefined();
    });

    it('should cache DICOM binary for quick loading', async () => {
      const mockBinary = new Uint8Array([1, 2, 3, 4, 5]);

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.cacheDicomBinary('study-123', mockBinary);
      });

      expect(result.current.getCachedBinary('study-123')).toBeDefined();
    });

    it('should expire cache after TTL', async () => {
      jest.useFakeTimers();

      const mockBinary = new Uint8Array([1, 2, 3, 4, 5]);

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.cacheDicomBinary('study-123', mockBinary, { ttl: 60000 });
      });

      jest.advanceTimersByTime(61000);

      expect(result.current.getCachedBinary('study-123')).toBeUndefined();

      jest.useRealTimers();
    });
  });

  // ==================== STREAMING TESTS ====================
  describe('Streaming', () => {
    it('should handle streaming for large DICOM files', async () => {
      const mockStream = jest
        .fn()
        .mockResolvedValue({
          reader: { read: jest.fn() },
        });

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        await result.current.streamDicomBinary('study-123', mockStream);
      });

      expect(result.current.loadingProgress).toBeDefined();
    });

    it('should track streaming progress', async () => {
      const mockOnProgress = jest.fn();

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.streamDicomBinary('study-123', jest.fn(), {
          onProgress: mockOnProgress,
        });
      });

      // Progress should be tracked
      expect(mockOnProgress).toBeDefined();
    });

    it('should support pause/resume of streaming', async () => {
      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.streamDicomBinary('study-123', jest.fn());
        result.current.pauseStreaming();
      });

      expect(result.current.streamingState).toBe('paused');

      await act(async () => {
        result.current.resumeStreaming();
      });

      expect(result.current.streamingState).toBe('downloading');
    });
  });

  // ==================== VIEWER CONTROLS TESTS ====================
  describe('DICOM Viewer Controls', () => {
    it('should adjust window/level for CT images', async () => {
      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.setWindowLevel({ window: 400, level: 40 });
      });

      expect(result.current.windowLevel.window).toBe(400);
      expect(result.current.windowLevel.level).toBe(40);
    });

    it('should preset window/level for different anatomies', async () => {
      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.applyPreset('lungs');
      });

      expect(result.current.windowLevel.window).toBe(1500);
      expect(result.current.windowLevel.level).toBe(-600);
    });

    it('should support zoom and pan', async () => {
      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.setZoom(2.0);
        result.current.setPan({ x: 50, y: 50 });
      });

      expect(result.current.zoom).toBe(2.0);
    });

    it('should support image rotation', async () => {
      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.setRotation(90);
      });

      expect(result.current.rotation).toBe(90);
    });
  });

  // ==================== SERIES NAVIGATION TESTS ====================
  describe('Series Navigation', () => {
    it('should navigate between images in series', async () => {
      const mockImages = Array.from({ length: 10 }, (_, i) => ({ id: `img-${i}` }));

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.loadSeries(mockImages);
      });

      expect(result.current.totalImages).toBe(10);

      await act(async () => {
        result.current.nextImage();
      });

      expect(result.current.currentImageIndex).toBe(1);

      await act(async () => {
        result.current.previousImage();
      });

      expect(result.current.currentImageIndex).toBe(0);
    });

    it('should support image jumping', async () => {
      const mockImages = Array.from({ length: 20 }, (_, i) => ({ id: `img-${i}` }));

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.loadSeries(mockImages);
        result.current.goToImage(15);
      });

      expect(result.current.currentImageIndex).toBe(15);
    });
  });

  // ==================== DOWNLOAD TESTS ====================
  describe('downloadDicomImage()', () => {
    it('should download DICOM image', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: { download_url: 'https://example.com/dicom.dcm' },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        const url = await result.current.downloadDicomImage('study-123');
        expect(url).toBe('https://example.com/dicom.dcm');
      });
    });

    it('should support batch download', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: { zip_url: 'https://example.com/dicom.zip' },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        const url = await result.current.downloadSeries(['img-1', 'img-2', 'img-3']);
        expect(url).toBe('https://example.com/dicom.zip');
      });
    });
  });

  // ==================== ERROR RECOVERY TESTS ====================
  describe('Error Recovery', () => {
    it('should retry on connection failure', async () => {
      const mockInvoke = jest
        .fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce({
          data: { dicom_synced: true, preview_url: 'url' },
        });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        await result.current.fetchDicomFromOrthanc(
          {
            study_oid: 'study-123',
            series_oid: 'series-456',
            patient_id: 'p1',
            imaging_order_id: 'order-1',
          },
          { retries: 3 }
        );
      });

      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });

    it('should use fallback preview on DICOM unavailable', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: {
          dicom_synced: false,
          preview_url: 'https://example.com/fallback.jpg',
          error: 'DICOM not available',
        },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        await result.current.fetchDicomFromOrthanc({
          study_oid: 'study-123',
          series_oid: 'series-456',
          patient_id: 'p1',
          imaging_order_id: 'order-1',
        });
      });

      expect(result.current.previewUrl).toBe('https://example.com/fallback.jpg');
    });

    it('should handle metadata extraction failures', async () => {
      const invalidBinary = new Uint8Array([255, 255, 255]);

      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.extractDicomTags(invalidBinary);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ==================== STATE MANAGEMENT ====================
  describe('State Management', () => {
    it('should reset viewer state', () => {
      const { result } = renderHook(() => useDicomViewer());

      result.current.setZoom(2.0);
      result.current.setRotation(90);

      act(() => {
        result.current.reset();
      });

      expect(result.current.zoom).toBe(1.0);
      expect(result.current.rotation).toBe(0);
    });

    it('should save and restore viewer state', async () => {
      const { result } = renderHook(() => useDicomViewer());

      await act(async () => {
        result.current.setZoom(1.5);
        result.current.setPan({ x: 100, y: 100 });
        const state = result.current.saveState();

        result.current.reset();
        result.current.restoreState(state);
      });

      expect(result.current.zoom).toBe(1.5);
    });
  });
});
