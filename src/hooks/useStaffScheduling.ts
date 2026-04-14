// WEEK 11 ADMIN 1: Custom Hooks
// Hook: useStaffScheduling
// Purpose: Manage staff schedules, shifts, conflict detection
// Note: Attendance tracking will be in Phase 2

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Schedule {
  id: string;
  staff_id: string;
  staff_name: string;
  schedule_date: string; // YYYY-MM-DD
  shift_type: 'morning' | 'afternoon' | 'night' | 'on-call';
  shift_start: string; // HH:MM
  shift_end: string; // HH:MM
  shift_hours: number;
  location_department: string;
  is_confirmed: boolean;
  attendance_status?: 'present' | 'absent' | 'late' | 'early-leave'; // Future: from system
  notes?: string;
  created_at: string;
}

export interface CreateScheduleInput {
  staff_id: string;
  schedule_date: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'on-call';
  shift_start: string;
  shift_end: string;
  location_department: string;
  notes?: string;
}

export interface ScheduleConflict {
  schedule_id_1: string;
  schedule_id_2: string;
  staff_name_1: string;
  staff_name_2: string;
  conflict_type: 'overlap' | 'both_on_call' | 'insufficient_rest';
  conflict_description: string;
  date: string;
}

interface UseStaffSchedulingReturn {
  // Query
  scheduleList: Schedule[] | undefined;
  scheduleLoading: boolean;
  scheduleError: Error | null;
  scheduleById: (id: string) => Schedule | undefined;
  scheduleByStaff: (staffId: string) => Schedule[];
  scheduleByDate: (date: string) => Schedule[];
  scheduleByDateRange: (startDate: string, endDate: string) => Schedule[];

  // Analysis
  detectConflicts: () => ScheduleConflict[];
  getStaffAvailability: (staffId: string, date: string) => boolean;
  getShiftsPerStaff: (period: string) => { staffId: string; count: number }[];
  calculateStaffHours: (staffId: string, startDate: string, endDate: string) => number;

  // Mutations
  createSchedule: (data: CreateScheduleInput) => Promise<Schedule>;
  updateSchedule: (id: string, data: Partial<CreateScheduleInput>) => Promise<Schedule>;
  deleteSchedule: (id: string) => Promise<void>;
  confirmSchedule: (id: string) => Promise<Schedule>;
  bulkCreateSchedules: (data: CreateScheduleInput[]) => Promise<Schedule[]>;

  // State
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createError: Error | null;
}

const MINIMUM_REST_HOURS = 12; // Minimum hours between shifts

export const useStaffScheduling = (): UseStaffSchedulingReturn => {
  const queryClient = useQueryClient();

  // Fetch schedule list
  const { data: scheduleList, isLoading: scheduleLoading, error: scheduleError } = useQuery<
    Schedule[]
  >({
    queryKey: ['schedule-list'],
    queryFn: async () => {
      const response = await fetch('/api/v1/hr/schedules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Create Schedule
  const createMutation = useMutation({
    mutationFn: async (data: CreateScheduleInput) => {
      const response = await fetch('/api/v1/hr/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-list'] });
    },
  });

  // Update Schedule
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateScheduleInput>;
    }) => {
      const response = await fetch(`/api/v1/hr/schedules/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-list'] });
    },
  });

  // Delete Schedule
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/hr/schedules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-list'] });
    },
  });

  // Confirm Schedule
  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/hr/schedules/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to confirm schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-list'] });
    },
  });

  // Bulk Create Schedules
  const bulkCreateMutation = useMutation({
    mutationFn: async (data: CreateScheduleInput[]) => {
      const response = await fetch('/api/v1/hr/schedules/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ schedules: data }),
      });
      if (!response.ok) throw new Error('Failed to bulk create schedules');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-list'] });
    },
  });

  // Helper functions
  const scheduleById = (id: string): Schedule | undefined => {
    return (scheduleList || []).find((s) => s.id === id);
  };

  const scheduleByStaff = (staffId: string): Schedule[] => {
    return (scheduleList || []).filter((s) => s.staff_id === staffId);
  };

  const scheduleByDate = (date: string): Schedule[] => {
    return (scheduleList || []).filter((s) => s.schedule_date === date);
  };

  const scheduleByDateRange = (startDate: string, endDate: string): Schedule[] => {
    return (scheduleList || []).filter(
      (s) => s.schedule_date >= startDate && s.schedule_date <= endDate
    );
  };

  /**
   * Detect scheduling conflicts
   * - Overlapping shifts for same staff
   * - Insufficient rest between shifts (< 12 hours)
   * - Multiple on-call assignments
   */
  const detectConflicts = (): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = [];
    const list = scheduleList || [];

    // Check each staff member's schedules
    const staffIds = Array.from(new Set(list.map((s) => s.staff_id)));

    staffIds.forEach((staffId) => {
      const staffSchedules = scheduleByStaff(staffId).sort(
        (a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime()
      );

      // Check for overlaps and insufficient rest
      for (let i = 0; i < staffSchedules.length - 1; i++) {
        const current = staffSchedules[i];
        const next = staffSchedules[i + 1];

        // Same day overlap
        if (current.schedule_date === next.schedule_date) {
          const currentEnd = new Date(`${current.schedule_date}T${current.shift_end}`);
          const nextStart = new Date(`${next.schedule_date}T${next.shift_start}`);

          if (currentEnd > nextStart) {
            conflicts.push({
              schedule_id_1: current.id,
              schedule_id_2: next.id,
              staff_name_1: current.staff_name,
              staff_name_2: current.staff_name,
              conflict_type: 'overlap',
              conflict_description: `Overlapping shifts on ${current.schedule_date}`,
              date: current.schedule_date,
            });
          }
        }

        // Check rest period (24 hours between shifts = consecutive days)
        if (current.schedule_date !== next.schedule_date) {
          const currentEnd = new Date(`${current.schedule_date}T${current.shift_end}`);
          const nextStart = new Date(`${next.schedule_date}T${next.shift_start}`);

          const restHours = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60);

          if (restHours < MINIMUM_REST_HOURS) {
            conflicts.push({
              schedule_id_1: current.id,
              schedule_id_2: next.id,
              staff_name_1: current.staff_name,
              staff_name_2: current.staff_name,
              conflict_type: 'insufficient_rest',
              conflict_description: `Only ${restHours.toFixed(1)} hours rest between ${current.schedule_date} and ${next.schedule_date}`,
              date: current.schedule_date,
            });
          }
        }
      }
    });

    // Check for multiple on-call assignments on same date
    const dateGroups = new Map<string, Schedule[]>();
    list.forEach((schedule) => {
      if (!dateGroups.has(schedule.schedule_date)) {
        dateGroups.set(schedule.schedule_date, []);
      }
      dateGroups.get(schedule.schedule_date)!.push(schedule);
    });

    dateGroups.forEach((schedules, date) => {
      const onCalls = schedules.filter((s) => s.shift_type === 'on-call');
      if (onCalls.length > 1) {
        for (let i = 0; i < onCalls.length - 1; i++) {
          conflicts.push({
            schedule_id_1: onCalls[i].id,
            schedule_id_2: onCalls[i + 1].id,
            staff_name_1: onCalls[i].staff_name,
            staff_name_2: onCalls[i + 1].staff_name,
            conflict_type: 'both_on_call',
            conflict_description: `Multiple on-call assignments on ${date}`,
            date,
          });
        }
      }
    });

    return conflicts;
  };

  /**
   * Check if staff member is available on specific date
   */
  const getStaffAvailability = (staffId: string, date: string): boolean => {
    const staffSchedules = scheduleByStaff(staffId).filter((s) => s.schedule_date === date);
    return staffSchedules.length === 0;
  };

  /**
   * Get number of shifts per staff in a period
   */
  const getShiftsPerStaff = (period: string): { staffId: string; count: number }[] => {
    const map = new Map<string, number>();
    const list = scheduleList || [];

    list
      .filter((s) => s.schedule_date.startsWith(period)) // YYYY-MM format
      .forEach((s) => {
        map.set(s.staff_id, (map.get(s.staff_id) || 0) + 1);
      });

    return Array.from(map.entries()).map(([staffId, count]) => ({ staffId, count }));
  };

  /**
   * Calculate total hours for staff in date range
   */
  const calculateStaffHours = (staffId: string, startDate: string, endDate: string): number => {
    return scheduleByDateRange(startDate, endDate)
      .filter((s) => s.staff_id === staffId)
      .reduce((sum, s) => sum + s.shift_hours, 0);
  };

  return {
    // Query
    scheduleList,
    scheduleLoading,
    scheduleError: scheduleError as Error | null,
    scheduleById,
    scheduleByStaff,
    scheduleByDate,
    scheduleByDateRange,

    // Analysis
    detectConflicts,
    getStaffAvailability,
    getShiftsPerStaff,
    calculateStaffHours,

    // Mutations
    createSchedule: (data) => createMutation.mutateAsync(data),
    updateSchedule: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteSchedule: (id) => deleteMutation.mutateAsync(id),
    confirmSchedule: (id) => confirmMutation.mutateAsync(id),
    bulkCreateSchedules: (data) => bulkCreateMutation.mutateAsync(data),

    // State
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error as Error | null,
  };
};

export default useStaffScheduling;
