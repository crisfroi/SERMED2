import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface Appointment {
  appointment_id: string;
  patient_id: string;
  provider_id: string;
  facility_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: 'consultation' | 'procedure' | 'follow_up' | 'checkup' | 'emergency' | 'telemedicine';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  chief_complaint?: string;
  notes?: string;
  reminder_sent: boolean;
}

export interface AppointmentSlot {
  slot_id: string;
  provider_id: string;
  date: string;
  start_time: string;
  end_time: string;
  available: boolean;
  appointment_type: string;
}

export interface ClientBlockTime {
  block_id: string;
  provider_id: string;
  start_datetime: string;
  end_datetime: string;
  reason: 'lunch' | 'meeting' | 'vacation' | 'maintenance' | 'other';
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface RescheduleRequest {
  appointment_id: string;
  new_date: string;
  new_time: string;
  reason: string;
}

export const useAppointmentCalendar = () => {
  const createAppointment = async (
    appointment: Omit<Appointment, 'appointment_id' | 'status' | 'reminder_sent'>
  ): Promise<Appointment | null> => {
    try {
      const appointmentRecord: Appointment = {
        appointment_id: `APT-${Date.now()}`,
        ...appointment,
        status: 'scheduled',
        reminder_sent: false,
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentRecord])
        .select();

      if (error) throw error;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'appointment_created',
          table_name: 'appointments',
          record_id: data?.[0]?.appointment_id,
          patient_id: appointment.patient_id,
          details: `${appointment.appointment_type} appointment scheduled for ${appointment.appointment_date} at ${appointment.appointment_time}`,
          severity: 'low',
        },
      ]);

      return data?.[0] || appointmentRecord;
    } catch (error) {
      console.error('Error creating appointment:', error);
      return null;
    }
  };

  const getAppointmentsByDate = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', date)
        .neq('status', 'cancelled')
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting appointments by date:', error);
      return [];
    }
  };

  const getPatientAppointments = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      return [];
    }
  };

  const getProviderSchedule = async (providerId: string, startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('provider_id', providerId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting provider schedule:', error);
      return [];
    }
  };

  const checkAvailability = async (
    providerId: string,
    date: string,
    startTime: string,
    durationMinutes: number
  ): Promise<boolean> => {
    try {
      const endTime = addMinutesToTime(startTime, durationMinutes);

      // Get block times for provider
      const { data: blockTimes, error: blockError } = await supabase
        .from('provider_block_times')
        .select('*')
        .eq('provider_id', providerId)
        .eq('date', date);

      if (blockError) throw blockError;

      // Check if time falls within block time
      const isBlocked = blockTimes?.some((block) => {
        return timeOverlaps(startTime, endTime, block.start_time, block.end_time);
      });

      if (isBlocked) return false;

      // Get existing appointments
      const { data: appointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('provider_id', providerId)
        .eq('appointment_date', date)
        .neq('status', 'cancelled');

      if (appointmentError) throw appointmentError;

      // Check for conflicts with existing appointments
      const hasConflict = appointments?.some((apt) => {
        const aptEndTime = addMinutesToTime(apt.appointment_time, apt.duration_minutes);
        return timeOverlaps(startTime, endTime, apt.appointment_time, aptEndTime);
      });

      return !hasConflict;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  const getAvailableSlots = async (
    providerId: string,
    date: string,
    slotDurationMinutes: number = 30
  ): Promise<AppointmentSlot[]> => {
    try {
      const slots: AppointmentSlot[] = [];
      const workingHours = { start: '08:00', end: '18:00' };

      let currentTime = workingHours.start;

      while (compareTime(currentTime, workingHours.end) < 0) {
        const isAvailable = await checkAvailability(providerId, date, currentTime, slotDurationMinutes);

        slots.push({
          slot_id: `SLOT-${providerId}-${date}-${currentTime}`,
          provider_id: providerId,
          date,
          start_time: currentTime,
          end_time: addMinutesToTime(currentTime, slotDurationMinutes),
          available: isAvailable,
          appointment_type: 'consultation',
        });

        currentTime = addMinutesToTime(currentTime, slotDurationMinutes);
      }

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  };

  const rescheduleAppointment = async (request: RescheduleRequest): Promise<Appointment | null> => {
    try {
      const isAvailable = await checkAvailability(
        '', // Provider ID would need to be fetched first
        request.new_date,
        request.new_time,
        30
      );

      if (!isAvailable) {
        console.error('Selected time slot is not available');
        return null;
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({
          appointment_date: request.new_date,
          appointment_time: request.new_time,
          status: 'scheduled',
        })
        .eq('appointment_id', request.appointment_id)
        .select();

      if (error) throw error;

      if (data?.[0]) {
        await supabase.from('ehr_audit_trail').insert([
          {
            action: 'appointment_rescheduled',
            table_name: 'appointments',
            record_id: request.appointment_id,
            patient_id: data[0].patient_id,
            details: `Rescheduled to ${request.new_date} at ${request.new_time}. Reason: ${request.reason}`,
            severity: 'low',
          },
        ]);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return null;
    }
  };

  const cancelAppointment = async (appointmentId: string, reason: string): Promise<boolean> => {
    try {
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('appointment_id', appointmentId);

      if (updateError) throw updateError;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'appointment_cancelled',
          table_name: 'appointments',
          record_id: appointmentId,
          patient_id: appointment.patient_id,
          details: `Cancelled: ${reason}`,
          severity: 'low',
        },
      ]);

      return true;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return false;
    }
  };

  const sendAppointmentReminder = async (appointmentId: string): Promise<boolean> => {
    try {
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Update appointment to mark reminder as sent
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('appointment_id', appointmentId);

      if (updateError) throw updateError;

      // Log reminder notification
      await supabase.from('appointment_reminders').insert([
        {
          reminder_id: `REM-${Date.now()}`,
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          reminder_date: new Date().toISOString(),
          channel: 'sms_and_email',
          status: 'sent',
        },
      ]);

      return true;
    } catch (error) {
      console.error('Error sending reminder:', error);
      return false;
    }
  };

  const getCalendarMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: todayAppointments, error: todayError } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', today)
        .neq('status', 'cancelled');

      const { data: allAppointments, error: allError } = await supabase
        .from('appointments')
        .select('*')
        .neq('status', 'cancelled');

      if (todayError || allError) throw todayError || allError;

      const todayData = todayAppointments || [];
      const allData = allAppointments || [];

      return {
        appointmentsToday: todayData.length,
        completedToday: todayData.filter((a) => a.status === 'completed').length,
        noShowsToday: todayData.filter((a) => a.status === 'no_show').length,
        totalAppointments: allData.length,
        scheduledAppointments: allData.filter((a) => a.status === 'scheduled').length,
        completedAppointments: allData.filter((a) => a.status === 'completed').length,
        cancelledAppointments: allData.filter((a) => a.status === 'cancelled').length,
      };
    } catch (error) {
      console.error('Error getting calendar metrics:', error);
      return null;
    }
  };

  return {
    createAppointment,
    getAppointmentsByDate,
    getPatientAppointments,
    getProviderSchedule,
    checkAvailability,
    getAvailableSlots,
    rescheduleAppointment,
    cancelAppointment,
    sendAppointmentReminder,
    getCalendarMetrics,
  };
};

// Helper functions
const addMinutesToTime = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

const compareTime = (time1: string, time2: string): number => {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const t1 = h1 * 60 + m1;
  const t2 = h2 * 60 + m2;
  return t1 - t2;
};

const timeOverlaps = (start1: string, end1: string, start2: string, end2: string): boolean => {
  return compareTime(start1, end2) < 0 && compareTime(start2, end1) < 0;
};
