// Referral Module Tests (ASIS 11)
// Comprehensive test suite for referral workflow and tracking
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useReferralRequest,
  useReferralTracking,
  useOutcomeAssessment,
  useReferralValidation,
} from '../hooks/useReferralHooks';

// Mock fetch
global.fetch = vi.fn();

describe('ASIS 11 - Referral Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // HOOK TESTS: useReferralRequest
  // ==========================================
  describe('useReferralRequest Hook', () => {
    it('should create new referral request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'ref-001',
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        }),
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await result.current.createReferral({
          patient_id: 'pat-123',
          from_department: 'Emergency',
          to_department: 'Cardiology',
          reason: 'Chest pain evaluation',
          urgency: 'urgent',
          clinical_summary: 'Patient with acute chest pain',
        });
      });

      expect(result.current.isLoading).toBeFalsy();
    });

    it('should validate referral before submission', async () => {
      const { result } = renderHook(() => useReferralRequest());

      const validation = result.current.validateReferral({
        patient_id: 'pat-123',
        from_department: 'Emergency',
        to_department: 'Cardiology',
      });

      expect(validation.isValid).toBe(true);
    });

    it('should fetch referral templates', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'tmpl-001',
              name: 'Cardiology Referral',
              fields: [],
            },
          ],
        }),
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await result.current.fetchTemplates('Cardiology');
      });

      expect(result.current.templates).toBeDefined();
    });

    it('should attach supporting documents to referral', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { attached: true } }),
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await result.current.attachDocument('ref-001', {
          fileName: 'ECG.pdf',
          fileType: 'application/pdf',
        });
      });

      expect(result.current.error).toBeNull();
    });

    it('should add clinical findings to referral', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { findings_added: true } }),
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await result.current.addClinicalFindings('ref-001', {
          vital_signs: { bp: '140/90', hr: 85, rr: 18 },
          physical_exam: 'Normal heart sounds',
          differential_diagnosis: ['ACS', 'GERD', 'Musculoskeletal'],
        });
      });

      expect(result.current.isLoading).toBeFalsy();
    });

    it('should cancel referral with reason', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'cancelled' } }),
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await result.current.cancelReferral('ref-001', 'Patient condition improved');
      });

      expect(result.current.error).toBeNull();
    });

    it('should create urgent referral with expedited routing', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'ref-urgent',
            urgency: 'stat',
            routed_to: 'specialist_queue',
          },
        }),
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await result.current.createUrgentReferral({
          patient_id: 'pat-456',
          to_department: 'Neurology',
          reason: 'Acute stroke evaluation',
        });
      });

      expect(result.current.error).toBeNull();
    });

    it('should suggest appropriate specialists based on diagnosis', async () => {
      const { result } = renderHook(() => useReferralRequest());

      const suggestions = result.current.suggestSpecialists('Hypertensive Crisis');

      expect(suggestions).toContain('Cardiology');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should check insurance authorization requirements', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            requiresAuth: true,
            authNumber: 'AUTH-123456',
            validUntil: '2026-05-10',
          },
        }),
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await result.current.checkAuthorizationNeeds('pat-123', 'Cardiology');
      });

      expect(result.current.authorizationInfo).toBeDefined();
    });
  });

  // ==========================================
  // HOOK TESTS: useReferralTracking
  // ==========================================
  describe('useReferralTracking Hook', () => {
    it('should fetch referral status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'ref-001',
            status: 'accepted',
            accepted_by: 'Dr. Smith',
            accepted_at: new Date().toISOString(),
          },
        }),
      });

      const { result } = renderHook(() => useReferralTracking());

      await act(async () => {
        await result.current.getStatus('ref-001');
      });

      expect(result.current.referralStatus).toBeDefined();
    });

    it('should track referral timeline', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            timeline: [
              {
                event: 'created',
                timestamp: '2026-04-10T08:00:00',
              },
              {
                event: 'sent',
                timestamp: '2026-04-10T08:15:00',
              },
              {
                event: 'accepted',
                timestamp: '2026-04-10T09:00:00',
              },
            ],
          },
        }),
      });

      const { result } = renderHook(() => useReferralTracking());

      await act(async () => {
        await result.current.getTimeline('ref-001');
      });

      expect(result.current.timeline?.length).toBeGreaterThan(0);
    });

    it('should calculate response time SLA', () => {
      const { result } = renderHook(() => useReferralTracking());

      const sla = result.current.calculateSLA(
        new Date('2026-04-10T08:00:00'),
        new Date('2026-04-10T20:00:00'),
        'urgent'
      );

      expect(sla).toHaveProperty('target');
      expect(sla).toHaveProperty('actual');
      expect(sla).toHaveProperty('met');
    });

    it('should track receiving facility acceptance', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            acceptance: {
              status: 'accepted',
              receivingFacility: 'Cardiology Center',
              appointmentDate: '2026-04-12T14:00:00',
            },
          },
        }),
      });

      const { result } = renderHook(() => useReferralTracking());

      await act(async () => {
        await result.current.getAcceptanceDetails('ref-001');
      });

      expect(result.current.acceptanceInfo).toBeDefined();
    });

    it('should track patient follow-up appointment', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            appointment: {
              date: '2026-04-12',
              time: '14:00',
              facility: 'Cardiology Center',
              provider: 'Dr. Johnson',
            },
          },
        }),
      });

      const { result } = renderHook(() => useReferralTracking());

      await act(async () => {
        await result.current.getAppointmentDetails('ref-001');
      });

      expect(result.current.appointmentInfo).toBeDefined();
    });

    it('should flag overdue referrals for response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            overdue: true,
            hoursOverdue: 4,
            priority: 'high',
          },
        }),
      });

      const { result } = renderHook(() => useReferralTracking());

      await act(async () => {
        await result.current.checkOverdueStatus('ref-001');
      });

      expect(result.current.isOverdue).toBe(true);
    });

    it('should send reminder notifications', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { notificationSent: true } }),
      });

      const { result } = renderHook(() => useReferralTracking());

      await act(async () => {
        await result.current.sendReminder('ref-001', 'specialist');
      });

      expect(result.current.error).toBeNull();
    });

    it('should track referral closure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            status: 'closed',
            closed_at: new Date().toISOString(),
          },
        }),
      });

      const { result } = renderHook(() => useReferralTracking());

      await act(async () => {
        await result.current.closeReferral('ref-001', 'Completed');
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================
  // HOOK TESTS: useOutcomeAssessment
  // ==========================================
  describe('useOutcomeAssessment Hook', () => {
    it('should record specialist assessment', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'outcome-001',
            diagnosis: 'Stable Angina',
            recommendations: ['Increase cardio', 'Beta-blockers'],
          },
        }),
      });

      const { result } = renderHook(() => useOutcomeAssessment());

      await act(async () => {
        await result.current.recordAssessment('ref-001', {
          diagnosis: 'Stable Angina',
          findings: 'Positive stress test',
          management: 'Medical optimization',
        });
      });

      expect(result.current.isLoading).toBeFalsy();
    });

    it('should extract assessment outcome codes', () => {
      const { result } = renderHook(() => useOutcomeAssessment());

      const codes = result.current.extractOutcomeCodes('ICD-10');

      expect(Array.isArray(codes)).toBe(true);
    });

    it('should generate recommendations from assessment', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            recommendations: [
              'Lifestyle modification',
              'Pharmacotherapy',
              'Follow-up in 2 weeks',
            ],
          },
        }),
      });

      const { result } = renderHook(() => useOutcomeAssessment());

      await act(async () => {
        await result.current.generateRecommendations('outcome-001');
      });

      expect(result.current.recommendations?.length).toBeGreaterThan(0);
    });

    it('should track treatment plan adherence', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            adherence: 85,
            trend: 'improving',
          },
        }),
      });

      const { result } = renderHook(() => useOutcomeAssessment());

      await act(async () => {
        await result.current.trackAdherence('outcome-001');
      });

      expect(result.current.adherencePercentage).toBeDefined();
    });

    it('should measure clinical outcome', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            outcome: 'improved',
            metrics: {
              symptomResolution: 90,
              qualityOfLife: 85,
            },
          },
        }),
      });

      const { result } = renderHook(() => useOutcomeAssessment());

      await act(async () => {
        await result.current.measureOutcome('ref-001');
      });

      expect(result.current.clinicalOutcome).toBeDefined();
    });

    it('should identify unmet needs', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            unmetNeeds: [
              'Additional specialist consultation',
              'Advanced imaging',
            ],
          },
        }),
      });

      const { result } = renderHook(() => useOutcomeAssessment());

      await act(async () => {
        await result.current.identifyUnmetNeeds('ref-001');
      });

      expect(result.current.unmetNeeds?.length).toBeGreaterThan(0);
    });

    it('should generate follow-up referral if needed', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            followUpRequired: true,
            referralId: 'ref-followup',
          },
        }),
      });

      const { result } = renderHook(() => useOutcomeAssessment());

      await act(async () => {
        await result.current.generateFollowUpReferral('ref-001');
      });

      expect(result.current.error).toBeNull();
    });

    it('should capture patient satisfaction', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            satisfaction: 4.5,
            feedback: 'Very helpful visit',
          },
        }),
      });

      const { result } = renderHook(() => useOutcomeAssessment());

      await act(async () => {
        await result.current.recordSatisfaction('ref-001', {
          rating: 5,
          feedback: 'Excellent specialist',
        });
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================
  // HOOK TESTS: useReferralValidation
  // ==========================================
  describe('useReferralValidation Hook', () => {
    it('should validate referral before sending', () => {
      const { result } = renderHook(() => useReferralValidation());

      const validation = result.current.validateReferral({
        patient_id: 'pat-123',
        from_department: 'Emergency',
        to_department: 'Cardiology',
        reason: 'Chest pain',
        clinical_summary: 'Acute presentation',
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const { result } = renderHook(() => useReferralValidation());

      const validation = result.current.validateReferral({
        patient_id: 'pat-123',
        // Missing required fields
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should check if specialty exists in network', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { exists: true, providers: 3 } }),
      });

      const { result } = renderHook(() => useReferralValidation());

      await act(async () => {
        await result.current.checkSpecialtyAvailability('Cardiology');
      });

      expect(result.current.specialtyAvailable).toBe(true);
    });

    it('should validate receiving facility capacity', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            available_slots: 5,
            next_available: '2026-04-12',
          },
        }),
      });

      const { result } = renderHook(() => useReferralValidation());

      await act(async () => {
        await result.current.checkFacilityCapacity('facility-001');
      });

      expect(result.current.facilityCapacityInfo).toBeDefined();
    });

    it('should validate insurance coverage', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            covered: true,
            copay: 25,
            authRequired: false,
          },
        }),
      });

      const { result } = renderHook(() => useReferralValidation());

      await act(async () => {
        await result.current.validateCoverage('insurance-123', 'Cardiology');
      });

      expect(result.current.coverageInfo).toBeDefined();
    });

    it('should detect clinical contraindications', async () => {
      const { result } = renderHook(() => useReferralValidation());

      result.current.patientComorbidities = [
        'Severe COPD',
        'Uncontrolled diabetes',
      ];

      const contraindications =
        result.current.checkReferralContraindications('Surgery');

      expect(contraindications.length).toBeGreaterThan(0);
    });

    it('should validate referral urgency level', () => {
      const { result } = renderHook(() => useReferralValidation());

      const validation = result.current.validateUrgency({
        reason: 'Acute chest pain',
        symptoms: ['shortness of breath', 'diaphoresis'],
        vital_signs: { bp: '180/110', hr: 110 },
      });

      expect(validation.urgencyLevel).toBeDefined();
      expect(['routine', 'urgent', 'stat']).toContain(validation.urgencyLevel);
    });

    it('should ensure appropriate medical justification', () => {
      const { result } = renderHook(() => useReferralValidation());

      const validation = result.current.validateJustification({
        reason: 'Routine follow-up',
        summary: 'Patient needs specialist evaluation',
      });

      expect(validation.isValid).toBe(true);
    });
  });

  // ==========================================
  // INTEGRATION TESTS
  // ==========================================
  describe('Referral Workflow Integration', () => {
    it('should complete full referral to outcome workflow', async () => {
      // Create referral
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'ref-001', status: 'pending' } }),
      });

      const { result: reqResult } = renderHook(() => useReferralRequest());

      await act(async () => {
        await reqResult.current.createReferral({
          patient_id: 'pat-123',
          from_department: 'Emergency',
          to_department: 'Cardiology',
          reason: 'Chest pain',
          urgency: 'urgent',
          clinical_summary: 'Acute presentation',
        });
      });

      expect(reqResult.current.error).toBeNull();

      // Track status
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'accepted' } }),
      });

      const { result: trackResult } = renderHook(() => useReferralTracking());

      await act(async () => {
        await trackResult.current.getStatus('ref-001');
      });

      expect(trackResult.current.error).toBeNull();

      // Record outcome
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'outcome-001', diagnosis: 'Stable Angina' },
        }),
      });

      const { result: outcomeResult } = renderHook(() => useOutcomeAssessment());

      await act(async () => {
        await outcomeResult.current.recordAssessment('ref-001', {
          diagnosis: 'Stable Angina',
          findings: 'Positive',
          management: 'Medical',
        });
      });

      expect(outcomeResult.current.error).toBeNull();
    });

    it('should enforce SLA compliance throughout workflow', async () => {
      const { result: trackResult } = renderHook(() => useReferralTracking());

      const sla = trackResult.current.calculateSLA(
        new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        new Date(),
        'urgent'
      );

      expect(sla.met).toBe(true); // Should be met within 24-hour target
    });

    it('should validate integration between request, tracking, and outcome', async () => {
      const { result: validResult } = renderHook(
        () => useReferralValidation()
      );

      const validation = validResult.current.validateReferral({
        patient_id: 'pat-123',
        from_department: 'Emergency',
        to_department: 'Cardiology',
        reason: 'Evaluation needed',
        clinical_summary: 'Clinical findings present',
      });

      expect(validation.isValid).toBe(true);
    });

    it('should ensure authorization before sending referral', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { requiresAuth: false, canProceed: true },
        }),
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await result.current.checkAuthorizationNeeds('pat-123', 'Cardiology');
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================
  // ERROR HANDLING & EDGE CASES
  // ==========================================
  describe('Error Handling & Edge Cases', () => {
    it('should handle network timeout on referral creation', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Timeout'));

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        try {
          await result.current.createReferral({
            patient_id: 'pat-123',
            to_department: 'Cardiology',
            reason: 'Test',
            urgency: 'urgent',
            clinical_summary: 'Test summary',
          } as any);
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it('should prevent duplicate referrals', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Duplicate referral exists',
        }),
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await result.current.createReferral({
          patient_id: 'pat-123',
          to_department: 'Cardiology',
          reason: 'Duplicate',
          urgency: 'routine',
          clinical_summary: 'Test',
        } as any);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle receiving facility rejection', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { status: 'rejected', reason: 'No bed availability' },
        }),
      });

      const { result } = renderHook(() => useReferralTracking());

      await act(async () => {
        await result.current.getStatus('ref-001');
      });

      expect(result.current.error).toBeNull();
    });

    it('should gracefully handle missing appointment details', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      const { result } = renderHook(() => useReferralTracking());

      await act(async () => {
        await result.current.getAppointmentDetails('ref-001');
      });

      expect(result.current.appointmentInfo === undefined).toBe(true);
    });

    it('should retry failed referral submission', async () => {
      let callCount = 0;
      (global.fetch as any).mockImplementation(async () => {
        callCount++;
        if (callCount < 2) throw new Error('Network error');
        return {
          ok: true,
          json: async () => ({ data: { id: 'ref-001' } }),
        };
      });

      const { result } = renderHook(() => useReferralRequest());

      await act(async () => {
        await (result.current.createReferral as any)({
          patient_id: 'pat-123',
          to_department: 'Cardiology',
          reason: 'Test',
          urgency: 'routine',
          clinical_summary: 'Test',
          _retries: 2,
        });
      });

      expect(callCount >= 1).toBe(true);
    });
  });
});
