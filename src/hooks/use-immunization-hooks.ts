// @ts-nocheck
// src/hooks/use-immunization-hooks.ts
import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export interface PatientVaccination {
  vaccination_id: string;
  patient_id: string;
  vaccine_id: string;
  date_administered: string;
  batch_lot_number: string;
  provider_name: string;
  facility_name: string;
  adverse_events_noted?: string;
}

export interface VaccinationSchedule {
  schedule_id: string;
  patient_id: string;
  vaccine_id: string;
  scheduled_date: string;
  priority_flag: 'routine' | 'urgent' | 'catch_up';
  catch_up_eligible: boolean;
}

export interface ComplianceStatus {
  compliance_id: string;
  patient_id: string;
  vaccine_id: string;
  status: 'completed' | 'pending' | 'missed' | 'contraindicated';
  adherence_percentage: number;
}

export interface HerdImmunityData {
  vaccine_id: string;
  coverage_percentage: number;
  target_percentage: number;
  population_region: string;
  trend: 'up' | 'down' | 'stable';
}

// Hook 1: useVaccinationScheduling
export const useVaccinationScheduling = (patientId: string, dateOfBirth: string) => {
  const [error, setError] = useState<string | null>(null);

  const scheduleQuery = useQuery({
    queryKey: ['vaccination-schedules', patientId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/vaccination-schedules/${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch schedules');
        return response.json() as Promise<VaccinationSchedule[]>;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }
  });

  const scheduleVaccine = useCallback(async (data: {
    vaccine_id: string;
    scheduled_date: string;
    facility_name: string;
    priority_flag?: 'routine' | 'urgent' | 'catch_up';
  }) => {
    try {
      const response = await fetch('/api/vaccination-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, patient_id: patientId })
      });
      if (!response.ok) throw new Error('Failed to schedule vaccine');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [patientId]);

  const calculateAgeBasedSchedule = useCallback((vaccines: any[]): VaccinationSchedule[] => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const ageInMonths = Math.floor((today.getTime() - dob.getTime()) / (30 * 24 * 60 * 60 * 1000));

    return vaccines
      .filter(vaccine => {
        const scheduleMonths = vaccine.schedule_months.split(',').map(Number);
        return scheduleMonths.some(m => Math.abs(m - ageInMonths) <= 1);
      })
      .map(vaccine => ({
        schedule_id: vaccine.vaccine_id,
        patient_id: patientId,
        vaccine_id: vaccine.vaccine_id,
        scheduled_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority_flag: 'routine' as const,
        catch_up_eligible: ageInMonths > 1
      }));
  }, [patientId, dateOfBirth]);

  const checkContraindications = useCallback(async (vaccineId: string, medicalHistory: string[]) => {
    try {
      const response = await fetch('/api/contraindications-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaccine_id: vaccineId, medical_history: medicalHistory })
      });
      if (!response.ok) throw new Error('Contraindication check failed');
      return response.json() as Promise<{ contraindicated: boolean; reasons: string[] }>;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  return {
    schedules: scheduleQuery.data || [],
    loading: scheduleQuery.isLoading,
    error,
    scheduleVaccine,
    calculateAgeBasedSchedule,
    checkContraindications,
    refetch: scheduleQuery.refetch
  };
};

// Hook 2: useVaccineTracking
export const useVaccineTracking = (patientId: string) => {
  const [error, setError] = useState<string | null>(null);

  const vaccinationQuery = useQuery({
    queryKey: ['vaccinations', patientId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/patient-vaccinations/${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch vaccinations');
        return response.json() as Promise<PatientVaccination[]>;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }
  });

  const recordVaccination = useCallback(async (data: Partial<PatientVaccination>) => {
    try {
      const response = await fetch('/api/patient-vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, patient_id: patientId })
      });
      if (!response.ok) throw new Error('Failed to record vaccination');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [patientId]);

  const trackAdverseEvents = useCallback(async (vaccinationId: string, adverseEvents: {
    event_description: string;
    severity: 'mild' | 'moderate' | 'severe';
    onset_time: string;
  }) => {
    try {
      const response = await fetch(`/api/adverse-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaccination_id: vaccinationId, ...adverseEvents })
      });
      if (!response.ok) throw new Error('Failed to track adverse event');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const getVaccinationHistory = useCallback((vaccinations: PatientVaccination[]) => {
    return vaccinations
      .sort((a, b) => new Date(b.date_administered).getTime() - new Date(a.date_administered).getTime())
      .map(v => ({
        ...v,
        isRecent: (new Date().getTime() - new Date(v.date_administered).getTime()) / (24 * 60 * 60 * 1000) < 30
      }));
  }, []);

  return {
    vaccinations: vaccinationQuery.data || [],
    loading: vaccinationQuery.isLoading,
    error,
    recordVaccination,
    trackAdverseEvents,
    getVaccinationHistory,
    refetch: vaccinationQuery.refetch
  };
};

// Hook 3: useImmunizationCompliance
export const useImmunizationCompliance = (patientId: string) => {
  const [error, setError] = useState<string | null>(null);

  const complianceQuery = useQuery({
    queryKey: ['immunization-compliance', patientId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/immunization-compliance/${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch compliance data');
        return response.json() as Promise<ComplianceStatus[]>;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }
  });

  const calculateCompliancePercentage = useCallback((statuses: ComplianceStatus[]): number => {
    if (statuses.length === 0) return 0;
    const completed = statuses.filter(s => s.status === 'completed').length;
    return Math.round((completed / statuses.length) * 100);
  }, []);

  const identifyOverdueVaccines = useCallback((schedules: VaccinationSchedule[]): string[] => {
    const today = new Date();
    return schedules
      .filter(s => {
        const scheduledDate = new Date(s.scheduled_date);
        return scheduledDate < today;
      })
      .map(s => s.vaccine_id);
  }, []);

  const generateComplianceReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/immunization-compliance/${patientId}/report`);
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [patientId]);

  const sendReminderNotification = useCallback(async (vaccineId: string, reminderType: 'email' | 'sms' | 'both') => {
    try {
      const response = await fetch(`/api/immunization-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, vaccine_id: vaccineId, reminder_type: reminderType })
      });
      if (!response.ok) throw new Error('Failed to send reminder');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [patientId]);

  return {
    statuses: complianceQuery.data || [],
    loading: complianceQuery.isLoading,
    error,
    calculateCompliancePercentage,
    identifyOverdueVaccines,
    generateComplianceReport,
    sendReminderNotification,
    refetch: complianceQuery.refetch
  };
};

// Hook 4: useImmunizationDataFetch
export const useImmunizationDataFetch = () => {
  const [error, setError] = useState<string | null>(null);

  const vaccinesQuery = useQuery({
    queryKey: ['vaccines-master'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/vaccine-master');
        if (!response.ok) throw new Error('Failed to fetch vaccine master data');
        return response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    staleTime: 24 * 60 * 60 * 1000
  });

  const scheduleTemplatesQuery = useQuery({
    queryKey: ['immunization-schedules'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/immunization-schedules-master');
        if (!response.ok) throw new Error('Failed to fetch schedules');
        return response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    staleTime: 24 * 60 * 60 * 1000
  });

  const herdImmunityQuery = useQuery({
    queryKey: ['herd-immunity-tracking'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/herd-immunity-tracking');
        if (!response.ok) throw new Error('Failed to fetch herd immunity data');
        return response.json() as Promise<HerdImmunityData[]>;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    staleTime: 60 * 60 * 1000 // 1 hour
  });

  const checkPopulationCoverage = useCallback((region: string, vaccine: string): number | null => {
    const data = herdImmunityQuery.data?.find(d => d.population_region === region && d.vaccine_id === vaccine);
    return data?.coverage_percentage || null;
  }, [herdImmunityQuery.data]);

  return {
    vaccines: vaccinesQuery.data || [],
    scheduleTemplates: scheduleTemplatesQuery.data || [],
    herdImmunityData: herdImmunityQuery.data || [],
    loading: vaccinesQuery.isLoading || scheduleTemplatesQuery.isLoading || herdImmunityQuery.isLoading,
    error,
    checkPopulationCoverage
  };
};
