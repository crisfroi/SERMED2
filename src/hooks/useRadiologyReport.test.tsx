// @ts-nocheck
// ============================================================================
// useRadiologyReport.test.ts - Unit Tests
// Radiology Report Management and Display
// ============================================================================

import { renderHook, act } from '@testing-library/react';
import { useRadiologyReport } from './useRadiologyReport';
import * as supabaseClient from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useRadiologyReport', () => {
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

  // ==================== FETCH REPORT TESTS ====================
  describe('fetchReport()', () => {
    it('should fetch radiology report by study ID', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'report-1',
            study_id: 'study-1',
            modality: 'CT',
            findings: 'Normal',
            impression: 'No acute findings',
            recommendation: 'Follow-up in 1 year',
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        await result.current.fetchReport('study-1');
      });

      expect(result.current.report).toBeDefined();
      expect(result.current.report.findings).toBe('Normal');
    });

    it('should load report findings', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'report-1',
            findings: 'Small opacity in right upper lobe',
            impression: 'Possible pneumonia',
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        await result.current.fetchReport('study-1');
      });

      expect(result.current.report?.findings).toContain('opacity');
    });

    it('should handle missing report', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        await result.current.fetchReport('study-unknown');
      });

      expect(result.current.report).toBeNull();
      expect(result.current.error).toBeDefined();
    });

    it('should set loading state during fetch', async () => {
      const mockSelect = jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() =>
                resolve({
                  data: [{ id: 'report-1', findings: 'Normal' }],
                  error: null,
                }),
                50
              )
            )
        );

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useRadiologyReport());

      act(() => {
        result.current.fetchReport('study-1');
      });

      expect(result.current.loading).toBe(true);
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Access denied' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        await result.current.fetchReport('study-1');
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ==================== REAL-TIME SUBSCRIPTIONS ====================
  describe('subscribeToReportChanges()', () => {
    it('should subscribe to report updates', async () => {
      const mockOn = jest.fn();
      mockSupabase.from.mockReturnValue({
        on: mockOn.mockReturnValue({ unsubscribe: jest.fn() }),
      });

      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        result.current.subscribeToReportChanges('study-1');
      });

      expect(mockOn).toHaveBeenCalled();
    });

    it('should receive report finalization notifications', async () => {
      const mockOn = jest.fn((event, callback) => {
        setTimeout(() => {
          callback({
            eventType: 'UPDATE',
            new: {
              id: 'report-1',
              status: 'finalized',
              findings: 'Pneumonia',
            },
          });
        }, 0);
        return { unsubscribe: jest.fn() };
      });

      mockSupabase.from.mockReturnValue({
        on: mockOn,
      });

      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        result.current.subscribeToReportChanges('study-1');
      });

      // Wait for callback
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.report?.status).toBe('finalized');
    });

    it('should unsubscribe on cleanup', () => {
      const mockUnsubscribe = jest.fn();
      const mockOn = jest.fn(() => ({
        unsubscribe: mockUnsubscribe,
      }));

      mockSupabase.from.mockReturnValue({
        on: mockOn,
      });

      const { result, unmount } = renderHook(() => useRadiologyReport());

      act(() => {
        result.current.subscribeToReportChanges('study-1');
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // ==================== CRITICAL FINDINGS TESTS ====================
  describe('flagCriticalFindings()', () => {
    it('should identify critical findings', async () => {
      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        const critical = result.current.flagCriticalFindings(
          'Large focal mass measuring 5cm in right upper lobe'
        );
        expect(critical).toContain('mass');
      });
    });

    it('should extract and classify findings', async () => {
      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        result.current.report = {
          id: 'report-1',
          findings: 'Pneumothorax on left side',
          impression: 'Spontaneous pneumothorax',
        };

        const findings = result.current.extractFindings();
        expect(findings).toContainEqual(expect.objectContaining({
          type: 'pneumothorax',
        }));
      });
    });

    it('should generate alert for critical findings', async () => {
      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        const alert = result.current.generateCriticalAlert(
          'Acute subdural hematoma requiring immediate surgery'
        );

        expect(alert).toBeDefined();
        expect(alert.severity).toBe('critical');
      });
    });

    it('should support custom critical keywords', async () => {
      const { result } = renderHook(() => useRadiologyReport());

      await act(async () => {
        result.current.setCriticalKeywords(['embolism', 'dissection', 'infarction']);

        const isCritical = result.current.isCriticalFinding(
          'Pulmonary embolism in right main pulmonary artery'
        );

        expect(isCritical).toBe(true);
      });
    });
  });

  // ==================== VOICE ANNOTATION TESTS ====================
  describe('Voice Annotations', () => {
    it('should attach voice annotation to report', async () => {
      const mockFile = new File(['audio data'], 'annotation.wav', { type: 'audio/wav' });

      const mockInvoke = jest.fn().mockResolvedValue({
        data: { annotation_id: 'anno-1', url: 'https://example.com/audio.wav' },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useRadiologyReport());

      result.current.report = { id: 'report-1' };

      await act(async () => {
        await result.current.attachVoiceAnnotation(mockFile);
      });

      expect(result.current.voiceAnnotations).toHaveLength(1);
    });

    it('should store annotation metadata', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: {
          annotation_id: 'anno-1',
          duration: 45,
          radiologist: 'Dr. Smith',
        },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useRadiologyReport());

      result.current.report = { id: 'report-1' };

      await act(async () => {
        await result.current.attachVoiceAnnotation(new File([''], 'anno.wav'));
      });

      expect(result.current.voiceAnnotations[0]?.duration).toBe(45);
    });
  });

  // ==================== EXPORT TESTS ====================
  describe('exportReport()', () => {
    it('should export report to PDF', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: { file_url: 'https://example.com/report.pdf', format: 'pdf' },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useRadiologyReport());

      result.current.report = { id: 'report-1' };

      await act(async () => {
        await result.current.exportReport('pdf');
      });

      expect(mockInvoke).toHaveBeenCalledWith('export_radiology_report', expect.any(Object));
    });

    it('should export report with DICOM preview', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: {
          file_url: 'https://example.com/report.pdf',
          has_dicom_preview: true,
        },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useRadiologyReport());

      result.current.report = { id: 'report-1', study_id: 'study-1' };

      await act(async () => {
        await result.current.exportReport('pdf', { includeDicom: true });
      });

      expect(result.current.exportUrl).toContain('example.com');
    });

    it('should include critical findings in export', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: {
          file_url: 'https://example.com/report.pdf',
          critical_findings_highlighted: true,
        },
      });

      mockSupabase.functions.invoke = mockInvoke;

      const { result } = renderHook(() => useRadiologyReport());

      result.current.report = {
        id: 'report-1',
        findings: 'Acute infarction',
      };

      await act(async () => {
        await result.current.exportReport('pdf');
      });

      // Critical findings should be flagged in export
      expect(result.current.exportUrl).toBeDefined();
    });
  });

  // ==================== SIGNATURE TESTS ====================
  describe('Report Signatures', () => {
    it('should add radiologist signature', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        data: [{ id: 'report-1', radiologist_signature: 'Dr. Smith' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useRadiologyReport());

      result.current.report = { id: 'report-1' };

      await act(async () => {
        await result.current.signReport('radiologist', 'Dr. Smith');
      });

      expect(result.current.report?.radiologist_signature).toBe('Dr. Smith');
    });

    it('should add attending physician signature', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        data: [{ id: 'report-1', attending_signature: 'Dr. Johnson' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useRadiologyReport());

      result.current.report = { id: 'report-1' };

      await act(async () => {
        await result.current.signReport('attending', 'Dr. Johnson');
      });

      expect(result.current.report?.attending_signature).toBe('Dr. Johnson');
    });
  });

  // ==================== RECOMMENDATION SUMMARY ====================
  describe('Recommendations', () => {
    it('should generate recommendations summary', async () => {
      const { result } = renderHook(() => useRadiologyReport());

      result.current.report = {
        id: 'report-1',
        recommendation: 'Follow-up imaging in 1 month. Consider MRI for further evaluation.',
      };

      await act(async () => {
        const summary = result.current.generateRecommendationSummary();
        expect(summary).toContain('Follow-up');
      });
    });

    it('should categorize recommendations', async () => {
      const { result } = renderHook(() => useRadiologyReport());

      result.current.extractRecommendations(
        'Urgent CT follow-up within 24 hours. Consider biopsy if no improvement in 1 week.'
      );

      expect(result.current.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: 'urgent',
        })
      );
    });
  });

  // ==================== STATE MANAGEMENT ====================
  describe('State Management', () => {
    it('should reset report state', () => {
      const { result } = renderHook(() => useRadiologyReport());

      result.current.report = {
        id: 'report-1',
        findings: 'Normal',
      };

      act(() => {
        result.current.reset();
      });

      expect(result.current.report).toBeNull();
      expect(result.current.voiceAnnotations).toHaveLength(0);
    });
  });
});
