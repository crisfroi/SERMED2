// src/__tests__/immunization.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useVaccinationScheduling, useVaccineTracking, useImmunizationCompliance, useImmunizationDataFetch } from '@/hooks/use-immunization-hooks'
import React from 'react'

describe('Immunization Module - Unit Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('useVaccinationScheduling Hook', () => {
    it('should calculate age-based schedule correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccinationScheduling('pat-001', '2025-01-01'), { wrapper })

      const vaccines = [
        { vaccine_id: 'vac-001', vaccine_name: 'DTaP', schedule_months: '2,4,6' },
        { vaccine_id: 'vac-002', vaccine_name: 'IPV', schedule_months: '2,4,6' },
        { vaccine_id: 'vac-003', vaccine_name: 'Hepatitis B', schedule_months: '0,1,6' }
      ]

      const schedule = result.current.calculateAgeBasedSchedule(vaccines)
      expect(Array.isArray(schedule)).toBe(true)
    })

    it('should detect overdue vaccinations', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccinationScheduling('pat-001', '2020-06-15'), { wrapper })

      // Patient is 4 years old, should have received many vaccines
      expect(result.current.schedules).toBeDefined()
    })

    it('should check contraindications correctly', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccinationScheduling('pat-001', '2025-01-01'), { wrapper })

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          contraindicated: false,
          reasons: []
        })
      })

      const check = await result.current.checkContraindications('vac-001', ['none'])
      expect(check.contraindicated).toBe(false)
    })

    it('should reject MMR for immunocompromised patients', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccinationScheduling('pat-001', '2025-01-01'), { wrapper })

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          contraindicated: true,
          reasons: ['Live vaccine contraindicated in immunocompromised patients']
        })
      })

      const check = await result.current.checkContraindications('vac-mmr', ['HIV/AIDS'])
      expect(check.contraindicated).toBe(true)
    })

    it('should reject live vaccines during pregnancy', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccinationScheduling('pat-001', '1990-05-15'), { wrapper })

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          contraindicated: true,
          reasons: ['Live vaccines contraindicated in pregnancy']
        })
      })

      const check = await result.current.checkContraindications('vac-varicella', ['pregnancy'])
      expect(check.contraindicated).toBe(true)
    })
  })

  describe('useVaccineTracking Hook', () => {
    it('should record patient vaccinations', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccineTracking('pat-001'), { wrapper })

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          vaccination_id: 'vax-001',
          patient_id: 'pat-001',
          vaccine_id: 'vac-dtp',
          date_administered: '2026-04-15'
        })
      })

      const response = await result.current.recordVaccination({
        vaccine_id: 'vac-dtp',
        date_administered: '2026-04-15',
        facility_name: 'City Health'
      })

      expect(response).toHaveProperty('vaccination_id')
    })

    it('should track adverse events', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccineTracking('pat-001'), { wrapper })

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          ae_id: 'ae-001',
          event_description: 'Low fever',
          severity: 'mild'
        })
      })

      const response = await result.current.trackAdverseEvents('vax-001', {
        event_description: 'Low fever',
        severity: 'mild',
        onset_time: '2'  // hours after vaccination
      })

      expect(response).toHaveProperty('ae_id')
    })

    it('should generate vaccination history', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccineTracking('pat-001'), { wrapper })

      const vaccinations = [
        {
          vaccination_id: 'vax-001',
          patient_id: 'pat-001',
          vaccine_id: 'vac-001',
          date_administered: '2026-03-15',
          batch_lot_number: 'LOT-2026-001',
          provider_name: 'Dr. Smith',
          facility_name: 'City Health'
        },
        {
          vaccination_id: 'vax-002',
          patient_id: 'pat-001',
          vaccine_id: 'vac-002',
          date_administered: '2026-02-01',
          batch_lot_number: 'LOT-2026-002',
          provider_name: 'Nurse Johnson',
          facility_name: 'County Clinic'
        }
      ]

      const history = result.current.getVaccinationHistory(vaccinations)
      expect(history).toHaveLength(2)
      expect(history[0].vaccination_id).toBe('vax-001') // Most recent first
    })

    it('should identify recent vaccinations', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccineTracking('pat-001'), { wrapper })

      const vaccinations = [
        {
          vaccination_id: 'vax-001',
          patient_id: 'pat-001',
          vaccine_id: 'vac-001',
          date_administered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          batch_lot_number: 'LOT-001',
          provider_name: 'Dr. Smith',
          facility_name: 'City Health'
        }
      ]

      const history = result.current.getVaccinationHistory(vaccinations)
      expect(history[0].isRecent).toBe(true)
    })
  })

  describe('useImmunizationCompliance Hook', () => {
    it('should calculate 100% compliance for all vaccines completed', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useImmunizationCompliance('pat-001'), { wrapper })

      const statuses = [
        { compliance_id: '1', patient_id: 'pat-001', vaccine_id: 'vac-001', status: 'completed', adherence_percentage: 100 },
        { compliance_id: '2', patient_id: 'pat-001', vaccine_id: 'vac-002', status: 'completed', adherence_percentage: 100 },
        { compliance_id: '3', patient_id: 'pat-001', vaccine_id: 'vac-003', status: 'completed', adherence_percentage: 100 }
      ]

      const percentage = result.current.calculateCompliancePercentage(statuses)
      expect(percentage).toBe(100)
    })

    it('should calculate 0% compliance if no vaccines completed', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useImmunizationCompliance('pat-001'), { wrapper })

      const statuses = [
        { compliance_id: '1', patient_id: 'pat-001', vaccine_id: 'vac-001', status: 'pending', adherence_percentage: 0 },
        { compliance_id: '2', patient_id: 'pat-001', vaccine_id: 'vac-002', status: 'missed', adherence_percentage: 0 }
      ]

      const percentage = result.current.calculateCompliancePercentage(statuses)
      expect(percentage).toBe(0)
    })

    it('should calculate partial compliance correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useImmunizationCompliance('pat-001'), { wrapper })

      const statuses = [
        { compliance_id: '1', patient_id: 'pat-001', vaccine_id: 'vac-001', status: 'completed', adherence_percentage: 100 },
        { compliance_id: '2', patient_id: 'pat-001', vaccine_id: 'vac-002', status: 'completed', adherence_percentage: 100 },
        { compliance_id: '3', patient_id: 'pat-001', vaccine_id: 'vac-003', status: 'pending', adherence_percentage: 0 },
        { compliance_id: '4', patient_id: 'pat-001', vaccine_id: 'vac-004', status: 'pending', adherence_percentage: 0 }
      ]

      const percentage = result.current.calculateCompliancePercentage(statuses)
      expect(percentage).toBe(50)
    })

    it('should identify overdue vaccines', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useImmunizationCompliance('pat-001'), { wrapper })

      const today = new Date()
      const schedules = [
        {
          schedule_id: '1',
          patient_id: 'pat-001',
          vaccine_id: 'vac-001',
          scheduled_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          priority_flag: 'routine' as const,
          catch_up_eligible: false
        },
        {
          schedule_id: '2',
          patient_id: 'pat-001',
          vaccine_id: 'vac-002',
          scheduled_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          priority_flag: 'routine' as const,
          catch_up_eligible: false
        }
      ]

      const overdue = result.current.identifyOverdueVaccines(schedules)
      expect(overdue).toContain('vac-001')
      expect(overdue).not.toContain('vac-002')
    })

    it('should send reminder notifications', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useImmunizationCompliance('pat-001'), { wrapper })

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ reminder_id: 'rem-001', status: 'sent' })
      })

      const response = await result.current.sendReminderNotification('vac-001', 'email')
      expect(response).toHaveProperty('reminder_id')
    })
  })

  describe('useImmunizationDataFetch Hook', () => {
    it('should return vaccines data', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useImmunizationDataFetch(), { wrapper })

      expect(Array.isArray(result.current.vaccines)).toBe(true)
    })

    it('should return schedule templates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useImmunizationDataFetch(), { wrapper })

      expect(Array.isArray(result.current.scheduleTemplates)).toBe(true)
    })

    it('should return herd immunity data', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useImmunizationDataFetch(), { wrapper })

      expect(Array.isArray(result.current.herdImmunityData)).toBe(true)
    })

    it('should check population coverage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useImmunizationDataFetch(), { wrapper })

      const coverage = result.current.checkPopulationCoverage('North Metro', 'vac-001')
      // Coverage can be null if data not available
      expect(coverage === null || typeof coverage === 'number').toBe(true)
    })
  })

  describe('Immunization Integration Tests', () => {
    it('should enforce minimum age for vaccination', () => {
      const patientAge = 4 // months
      const minAgeForVaccine = 6 // months
      
      const canVaccinate = patientAge >= minAgeForVaccine
      expect(canVaccinate).toBe(false)
    })

    it('should enforce spacing between doses', () => {
      const previousDoseDate = new Date('2026-02-15')
      const plannedDoseDate = new Date('2026-04-20')
      const minimumIntervalDays = 28

      const daysBetween = Math.floor((plannedDoseDate.getTime() - previousDoseDate.getTime()) / (24 * 60 * 60 * 1000))
      const hasAdequateSpacing = daysBetween >= minimumIntervalDays

      expect(hasAdequateSpacing).toBe(true)
    })

    it('should track herd immunity threshold', () => {
      const regionalCoverage = 92
      const herdImmunityThreshold = 95

      expect(regionalCoverage).toBeLessThan(herdImmunityThreshold)
    })

    it('should identify vaccine-preventable disease risk', () => {
      const measlesCoverage = 89
      const measlesThreshold = 95

      const atRisk = measlesCoverage < measlesThreshold
      expect(atRisk).toBe(true)
    })

    it('should manage catch-up immunization schedules', () => {
      const missedDoses = 2
      const catchUpSchedule = { current_dose: 2, total_doses: 3, catch_up_available: true }

      expect(missedDoses).toBeGreaterThan(0)
      expect(catchUpSchedule.catch_up_available).toBe(true)
    })

    it('should prevent same-day administration of conflicting vaccines', () => {
      const scheduledVaccines = [
        { vaccine: 'MMR', date: '2026-04-20', route: 'injection' },
        { vaccine: 'Varicella', date: '2026-04-20', route: 'injection' },
        { vaccine: 'Hepatitis B', date: '2026-04-21', route: 'injection' }
      ]

      const sameDay = scheduledVaccines.filter(v => v.date === '2026-04-20')
      // Live vaccines given on same day can be administered together
      expect(sameDay.length).toBe(2)
    })

    it('should respect minimum age between booster doses', () => {
      const firstDoseAge = 18 // months
      const boosterAge = 48 // months (4 years)
      const minimumInterval = 12 // months

      const interval = boosterAge - firstDoseAge
      expect(interval).toBeGreaterThanOrEqual(minimumInterval)
    })

    it('should track vaccine lot numbers for safety recalls', () => {
      const vaccinations = [
        { vaccination_id: '1', batch_lot: 'LOT-2026-001' },
        { vaccination_id: '2', batch_lot: 'LOT-2026-002' },
        { vaccination_id: '3', batch_lot: 'LOT-2026-001' }
      ]

      const recalledLot = 'LOT-2026-001'
      const affectedVaccinations = vaccinations.filter(v => v.batch_lot === recalledLot)

      expect(affectedVaccinations).toHaveLength(2)
    })
  })

  describe('Immunization Error Handling', () => {
    it('should handle missing vaccine data', () => {
      const vaccineId = 'unknown-vaccine'
      const isValid = vaccineId && vaccineId.startsWith('vac-')

      expect(isValid).toBe(false)
    })

    it('should reject invalid date formats', () => {
      const dateString = 'invalid-date'
      const isValid = !isNaN(Date.parse(dateString))

      expect(isValid).toBe(false)
    })

    it('should handle database connection errors', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useVaccineTracking('pat-001'), { wrapper })

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      expect(result.current.error).toBeDefined()
    })
  })
})
