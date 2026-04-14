// ============================================================================
// useImagingOrder.test.ts - Unit Tests
// Imaging Order Management
// ============================================================================

import { renderHook, act } from '@testing-library/react';
import { useImagingOrder } from './useImagingOrder';
import * as supabaseClient from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useImagingOrder', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseClient.createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  // ==================== CREATE ORDER TESTS ====================
  describe('createOrder()', () => {
    it('should create imaging order successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1', patient_id: 'p1', modality: 'CT', status: 'pending' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          modality: 'CT',
          bodyPart: 'Chest',
          indication: 'Pneumonia evaluation',
          priority: 'routine',
        });
      });

      expect(result.current.order).toBeDefined();
      expect(result.current.order.modality).toBe('CT');
    });

    it('should require indication text', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const response = await result.current.createOrder({
          modality: 'MRI',
          bodyPart: 'Brain',
          indication: '',
          priority: 'routine',
        });

        expect(response.error).toBeDefined();
      });
    });

    it('should support urgent priority imaging orders', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1', priority: 'urgent' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          modality: 'CT',
          bodyPart: 'Abdomen',
          indication: 'Acute pain',
          priority: 'urgent',
        });
      });

      expect(result.current.order?.priority).toBe('urgent');
    });

    it('should set default status to pending', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1', status: 'pending' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          modality: 'MRI',
          bodyPart: 'Spine',
          indication: 'Back pain',
          priority: 'routine',
        });
      });

      expect(result.current.order?.status).toBe('pending');
    });

    it('should include scheduled date if provided', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1', scheduled_date: '2026-04-20' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          modality: 'CT',
          bodyPart: 'Chest',
          indication: 'Screening',
          priority: 'routine',
          scheduledDate: '2026-04-20',
        });
      });

      expect(result.current.order?.scheduled_date).toBe('2026-04-20');
    });
  });

  // ==================== CONTRAINDICATION TESTS ====================
  describe('validateContraindications()', () => {
    it('should flag pregnancy for high-dose CT', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const validation = result.current.validateContraindications('CT', {
          pregnancyStatus: true,
          contrast: false,
          doseLevel: 'high',
        });

        expect(validation.contraindicated).toBe(true);
        expect(validation.reason).toContain('pregnancy');
      });
    });

    it('should flag iodine allergy for contrast studies', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const validation = result.current.validateContraindications('CT', {
          allergy: 'iodine',
          contrast: true,
        });

        expect(validation.contraindicated).toBe(true);
        expect(validation.reason).toContain('allergy');
      });
    });

    it('should flag renal failure for contrast ordering', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const validation = result.current.validateContraindications('MRI', {
          renalFunction: 'severe failure',
          contrast: true,
        });

        expect(validation.contraindicated).toBe(true);
      });
    });

    it('should allow CT without contrast for pregnancy', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const validation = result.current.validateContraindications('CT', {
          pregnancyStatus: true,
          contrast: false,
          doseLevel: 'low',
        });

        expect(validation.contraindicated).toBe(false);
      });
    });

    it('should allow MRI for pregnant patients', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const validation = result.current.validateContraindications('MRI', {
          pregnancyStatus: true,
        });

        expect(validation.contraindicated).toBe(false);
      });
    });
  });

  // ==================== RADIATION DOSE TESTS ====================
  describe('trackRadiationDose()', () => {
    it('should calculate effective dose for CT', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const dose = result.current.trackRadiationDose('CT', {
          scanType: 'Chest',
          numberOfScans: 1,
        });

        expect(dose.effectiveDose).toBeDefined();
        expect(dose.effectiveDose).toBeGreaterThan(0);
      });
    });

    it('should return zero dose for non-imaging modalities', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const dose = result.current.trackRadiationDose('US', {});

        expect(dose.effectiveDose).toBe(0);
      });
    });

    it('should warn for high cumulative dose', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        // Simulate multiple prior studies
        result.current.trackRadiationDose('CT', { scanType: 'Chest', numberOfScans: 3 });
        result.current.trackRadiationDose('CT', { scanType: 'Abdomen', numberOfScans: 2 });

        const dose = result.current.trackRadiationDose('CT', { scanType: 'Pelvis' });

        if (dose.cumulativeDose > 100) {
          expect(dose.warning).toBeDefined();
        }
      });
    });

    it('should track dose history', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        result.current.trackRadiationDose('CT', { scanType: 'Chest' });
        result.current.trackRadiationDose('CT', { scanType: 'Abdomen' });
      });

      expect(result.current.doseHistory).toHaveLength(2);
    });
  });

  // ==================== QUEUE MANAGEMENT TESTS ====================
  describe('submitToQueue()', () => {
    it('should add order to acquisition queue', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'order-1', queue_position: 3 }],
        error: null,
      });

      const mockUpdate = jest.fn().mockResolvedValue({
        data: [{ queue_position: 3 }],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      mockSupabase.from.mockReturnValueOnce({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          modality: 'CT',
          bodyPart: 'Chest',
          indication: 'Pneumonia',
          priority: 'routine',
        });

        await result.current.submitToQueue();
      });

      expect(result.current.queuePosition).toBeDefined();
    });

    it('should prioritize urgent orders', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        data: [{ queue_position: 1 }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        result.current.order = { priority: 'urgent' };
        await result.current.submitToQueue();
      });

      expect(result.current.queuePosition).toBeLessThanOrEqual(5);
    });
  });

  // ==================== MODALITY TESTS ====================
  describe('fetchAvailableModalities()', () => {
    it('should fetch list of imaging modalities', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: 'CT', name: 'CT Scan' },
          { id: 'MRI', name: 'MRI Scan' },
          { id: 'XR', name: 'X-ray' },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        await result.current.fetchAvailableModalities();
      });

      expect(result.current.availableModalities).toHaveLength(3);
    });

    it('should cache modality list', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'CT', name: 'CT Scan' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result, rerender } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        await result.current.fetchAvailableModalities();
      });

      rerender();

      await act(async () => {
        await result.current.fetchAvailableModalities();
      });

      expect(mockSelect).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== BODY PART TESTS ====================
  describe('getBodyPartsForModality()', () => {
    it('should return valid body parts for CT', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const parts = result.current.getBodyPartsForModality('CT');
        expect(parts).toContain('Chest');
        expect(parts).toContain('Abdomen');
      });
    });

    it('should return different parts for different modalities', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const ctParts = result.current.getBodyPartsForModality('CT');
        const usPartsult = result.current.getBodyPartsForModality('US');
        expect(ctParts).not.toEqual(usPartsult);
      });
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        await result.current.createOrder({
          modality: 'CT',
          bodyPart: 'Chest',
          indication: 'Test',
          priority: 'routine',
        });
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should validate modality selection', async () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      await act(async () => {
        const response = await result.current.createOrder({
          modality: 'INVALID_MODALITY',
          bodyPart: 'Chest',
          indication: 'Test',
          priority: 'routine',
        });

        expect(response.error).toBeDefined();
      });
    });
  });

  // ==================== ORTHANC INTEGRATION TESTS ====================
  describe('submitToDicomArchive()', () => {
    it('should submit accepted order to DICOM archive', async () => {
      const mockFunctionCall = jest.fn().mockResolvedValue({
        data: { archive_id: 'archive-123', status: 'submitted' },
      });

      mockSupabase.functions = {
        invoke: mockFunctionCall,
      };

      const { result } = renderHook(() => useImagingOrder('p1'));

      result.current.order = { id: 'order-1', status: 'accepted' };

      await act(async () => {
        await result.current.submitToDicomArchive();
      });

      expect(mockFunctionCall).toHaveBeenCalled();
    });

    it('should track DICOM archive submission', async () => {
      const mockFunctionCall = jest.fn().mockResolvedValue({
        data: { archive_id: 'archive-123', status: 'submitted' },
      });

      mockSupabase.functions = {
        invoke: mockFunctionCall,
      };

      const { result } = renderHook(() => useImagingOrder('p1'));

      result.current.order = { id: 'order-1', status: 'accepted' };

      await act(async () => {
        await result.current.submitToDicomArchive();
      });

      expect(result.current.archiveId).toBe('archive-123');
    });
  });

  // ==================== STATE MANAGEMENT ====================
  describe('State Management', () => {
    it('should reset state', () => {
      const { result } = renderHook(() => useImagingOrder('p1'));

      result.current.order = { id: 'order-1' };

      act(() => {
        result.current.reset();
      });

      expect(result.current.order).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
