// @ts-nocheck
// src/hooks/use-surgery-hooks.ts
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export interface SurgeryScheduleData {
  schedule_id: string;
  patient_id: string;
  surgery_type_id: string;
  or_number: number;
  scheduled_date: string;
  estimated_end_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface SurgicalTeam {
  assignment_id: string;
  schedule_id: string;
  role: string;
  staff_member_id: string;
  certification_required: boolean;
  experience_level: 'Junior' | 'Mid-level' | 'Senior';
}

// Hook 1: useSurgeryScheduling
export const useSurgeryScheduling = (patientId: string) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scheduleQuery = useQuery({
    queryKey: ['surgery-schedule', patientId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/surgery-schedules/${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch schedule');
        return response.json() as Promise<SurgeryScheduleData[]>;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: Partial<SurgeryScheduleData>) => {
      setLoading(true);
      try {
        const response = await fetch('/api/surgery-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Schedule creation failed');
        return response.json();
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      scheduleQuery.refetch();
    }
  });

  const cancelSchedule = useCallback(async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/surgery-schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (!response.ok) throw new Error('Cancellation failed');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const checkORAvailability = useCallback(async (
    orNumber: number,
    date: string,
    duration: number
  ) => {
    try {
      const response = await fetch(
        `/api/or-availability?or=${orNumber}&date=${date}&duration=${duration}`
      );
      if (!response.ok) throw new Error('Availability check failed');
      return response.json() as Promise<{ available: boolean; conflicts?: string[] }>;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  return {
    schedules: scheduleQuery.data || [],
    loading: scheduleQuery.isLoading || loading,
    error: error || scheduleQuery.error?.message,
    scheduleOperation: scheduleMutation,
    cancelSchedule,
    checkORAvailability,
    refetch: scheduleQuery.refetch
  };
};

// Hook 2: useSurgicalTeamManagement
export const useSurgicalTeamManagement = (scheduleId: string) => {
  const [selectedTeam, setSelectedTeam] = useState<SurgicalTeam[]>([]);
  const [error, setError] = useState<string | null>(null);

  const teamQuery = useQuery({
    queryKey: ['surgical-team', scheduleId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/surgical-teams/${scheduleId}`);
        if (!response.ok) throw new Error('Failed to fetch team');
        const data = await response.json() as SurgicalTeam[];
        setSelectedTeam(data);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }
  });

  const addTeamMember = useCallback(async (member: Omit<SurgicalTeam, 'assignment_id'>) => {
    try {
      const response = await fetch('/api/surgical-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      if (!response.ok) throw new Error('Failed to add team member');
      const newMember = await response.json() as SurgicalTeam;
      setSelectedTeam([...selectedTeam, newMember]);
      return newMember;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [selectedTeam]);

  const removeTeamMember = useCallback(async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/surgical-teams/${assignmentId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove team member');
      setSelectedTeam(selectedTeam.filter(m => m.assignment_id !== assignmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [selectedTeam]);

  const validatTeamCompleteness = useCallback((): { valid: boolean; missing: string[] } => {
    const required = ['Primary Surgeon', 'Anesthesiologist', 'Surgical Nurse'];
    const missing: string[] = [];
    
    required.forEach(role => {
      if (!selectedTeam.find(m => m.role === role)) {
        missing.push(role);
      }
    });
    
    return { valid: missing.length === 0, missing };
  }, [selectedTeam]);

  return {
    team: selectedTeam,
    loading: teamQuery.isLoading,
    error,
    addTeamMember,
    removeTeamMember,
    validateTeam: validatTeamCompleteness,
    refetch: teamQuery.refetch
  };
};

// Hook 3: usePostOpRecovery
export const usePostOpRecovery = (scheduleId: string) => {
  const [vitalSigns, setVitalSigns] = useState({
    systolic_bp: 0,
    diastolic_bp: 0,
    heart_rate: 0,
    oxygen_saturation: 0,
    temperature: 0
  });
  const [complications, setComplications] = useState<string[]>([]);

  const recoveryQuery = useQuery({
    queryKey: ['post-op-recovery', scheduleId],
    queryFn: async () => {
      const response = await fetch(`/api/post-op-recovery/${scheduleId}`);
      if (!response.ok) throw new Error('Failed to fetch recovery data');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });

  const updateVitalSigns = useCallback(async (newVitals: typeof vitalSigns) => {
    try {
      const response = await fetch(`/api/post-op-recovery/${scheduleId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVitals)
      });
      if (!response.ok) throw new Error('Failed to update vitals');
      setVitalSigns(newVitals);
      return response.json();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [scheduleId]);

  const logComplica = useCallback(async (complicationDetails: {
    type: string;
    severity: 'mild' | 'moderate' | 'severe';
    description: string;
    intervention?: string;
  }) => {
    try {
      const response = await fetch(`/api/post-op-recovery/${scheduleId}/complications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complicationDetails)
      });
      if (!response.ok) throw new Error('Failed to log complication');
      return response.json();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [scheduleId]);

  const assessDischargeReadiness = useCallback((): { ready: boolean; missingCriteria: string[] } => {
    const criteria = [
      { name: 'Pain controlled', check: vitalSigns.systolic_bp > 90 }, // placeholder
      { name: 'Vitals stable', check: vitalSigns.heart_rate > 50 && vitalSigns.heart_rate < 120 },
      { name: 'Ambulating', check: true }, // tracked separately
      { name: 'Tolerating diet', check: true }, // tracked separately
      { name: 'Normal urination', check: true } // tracked separately
    ];

    const missingCriteria = criteria.filter(c => !c.check).map(c => c.name);
    return { ready: missingCriteria.length === 0, missingCriteria };
  }, [vitalSigns]);

  return {
    vitalSigns,
    complications,
    loading: recoveryQuery.isLoading,
    data: recoveryQuery.data,
    updateVitalSigns,
    logComplica,
    assessDischargeReadiness,
    refetch: recoveryQuery.refetch
  };
};

// Hook 4: useSurgeryDataFetch
export const useSurgeryDataFetch = () => {
  const surgeryTypesQuery = useQuery({
    queryKey: ['surgery-types'],
    queryFn: async () => {
      const response = await fetch('/api/surgery-types');
      if (!response.ok) throw new Error('Failed to fetch surgery types');
      return response.json();
    },
    staleTime: 60 * 60 * 1000 // 1 hour
  });

  const operatingRoomsQuery = useQuery({
    queryKey: ['operating-rooms'],
    queryFn: async () => {
      const response = await fetch('/api/operating-rooms');
      if (!response.ok) throw new Error('Failed to fetch OR data');
      return response.json();
    },
    staleTime: 15 * 60 * 1000 // 15 minutes
  });

  const staffQuery = useQuery({
    queryKey: ['surgical-staff'],
    queryFn: async () => {
      const response = await fetch('/api/surgical-staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
    staleTime: 30 * 60 * 1000 // 30 minutes
  });

  return {
    surgeryTypes: surgeryTypesQuery.data || [],
    operatingRooms: operatingRoomsQuery.data || [],
    surgicalStaff: staffQuery.data || [],
    loading: surgeryTypesQuery.isLoading || operatingRoomsQuery.isLoading || staffQuery.isLoading,
    error: surgeryTypesQuery.error || operatingRoomsQuery.error || staffQuery.error
  };
};
