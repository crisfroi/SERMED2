import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  clinic_id: string;
  available_slots: number;
  average_response_time_days: number;
  success_rate: number;
  is_available: boolean;
}

interface SpecialistResponse {
  id: string;
  referral_id: string;
  specialist_id: string;
  response_date: string;
  appointment_date?: string;
  diagnosis: string;
  recommendations: string;
  status: 'pending_response' | 'responded' | 'patient_notified' | 'completed';
  response_content: string;
}

interface ResponseTemplate {
  id: string;
  specialty: string;
  template_name: string;
  content: string;
  created_by: string;
  created_at: string;
}

export const useSpecialistLookup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find specialists by specialty
  const findSpecialistsBySpecialty = useCallback(
    async (specialty: string, preferredClinic?: string): Promise<Specialist[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('specialists')
          .select('*')
          .eq('specialty', specialty)
          .eq('is_available', true)
          .order('success_rate', { ascending: false });

        if (preferredClinic) {
          query = query.eq('clinic_id', preferredClinic);
        }

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as Specialist[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to find specialists';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get available slots for specialist
  const getAvailableSlots = useCallback(
    async (specialistId: string, daysAhead: number = 30): Promise<string[]> => {
      try {
        setLoading(true);
        setError(null);

        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const { data, error: err } = await supabase
          .from('specialist_schedule')
          .select('date')
          .eq('specialist_id', specialistId)
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('is_available', true);

        if (err) throw err;

        return (data || []).map((d) => d.date);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get available slots';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get specialist profile
  const getSpecialistProfile = useCallback(
    async (specialistId: string): Promise<Specialist & { credentials?: string; experience_years?: number } | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('specialists')
          .select('*')
          .eq('id', specialistId)
          .single();

        if (err) throw err;
        return data as Specialist & { credentials?: string; experience_years?: number };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get specialist profile';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get specialists by clinic
  const getSpecialistsByClinic = useCallback(
    async (clinicId: string): Promise<Specialist[]> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('specialists')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('specialty', { ascending: true });

        if (err) throw err;
        return (data || []) as Specialist[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get specialists by clinic';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get top specialists (by success rate)
  const getTopSpecialists = useCallback(
    async (specialty?: string, limit: number = 5): Promise<Specialist[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('specialists')
          .select('*')
          .order('success_rate', { ascending: false })
          .limit(limit);

        if (specialty) {
          query = query.eq('specialty', specialty);
        }

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as Specialist[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get top specialists';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    findSpecialistsBySpecialty,
    getAvailableSlots,
    getSpecialistProfile,
    getSpecialistsByClinic,
    getTopSpecialists,
  };
};

export const useSpecialistResponses = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create specialist response
  const createResponse = useCallback(
    async (
      referralId: string,
      specialistId: string,
      appointmentDate: string,
      responseContent: string,
      userId: string
    ): Promise<SpecialistResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('specialist_responses')
          .insert({
            referral_id: referralId,
            specialist_id: specialistId,
            appointment_date: appointmentDate,
            response_content: responseContent,
            status: 'responded',
            response_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'specialist_response',
          entity_id: data.id,
          action: 'create',
          changed_by: userId,
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Specialist response to referral ${referralId}`,
          severity: 'low',
        });

        return data as SpecialistResponse;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create response';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get responses for referral
  const getResponsesForReferral = useCallback(
    async (referralId: string): Promise<SpecialistResponse[]> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('specialist_responses')
          .select('*')
          .eq('referral_id', referralId)
          .order('response_date', { ascending: false });

        if (err) throw err;
        return (data || []) as SpecialistResponse[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get responses';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get pending responses
  const getPendingResponses = useCallback(
    async (specialistId?: string): Promise<SpecialistResponse[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('specialist_responses')
          .select('*')
          .eq('status', 'pending_response')
          .order('response_date', { ascending: true });

        if (specialistId) {
          query = query.eq('specialist_id', specialistId);
        }

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as SpecialistResponse[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get pending responses';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update response status
  const updateResponseStatus = useCallback(
    async (
      responseId: string,
      newStatus: 'pending_response' | 'responded' | 'patient_notified' | 'completed',
      userId: string
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('specialist_responses')
          .update({ status: newStatus })
          .eq('id', responseId);

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'specialist_response',
          entity_id: responseId,
          action: 'update',
          changed_by: userId,
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Response status changed to ${newStatus}`,
          severity: 'low',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update response status';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get response templates
  const getResponseTemplates = useCallback(
    async (specialty?: string): Promise<ResponseTemplate[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('response_templates')
          .select('*')
          .order('template_name', { ascending: true });

        if (specialty) {
          query = query.eq('specialty', specialty);
        }

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as ResponseTemplate[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get response templates';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createResponse,
    getResponsesForReferral,
    getPendingResponses,
    updateResponseStatus,
    getResponseTemplates,
  };
};
