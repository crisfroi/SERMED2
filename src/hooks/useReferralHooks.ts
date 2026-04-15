// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || ''
);

// Hook for managing referral requests
export const useReferralManagement = (patientId: string) => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('referral_requests')
        .select('*, referral_types(*), specialist_facilities(*)')
        .eq('patient_id', patientId)
        .order('request_date', { ascending: false });

      if (err) throw err;
      setReferrals(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching referrals');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createReferral = useCallback(async (referralData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('referral_requests')
        .insert([{ ...referralData, patient_id: patientId, status: 'pending' }])
        .select()
        .single();

      if (err) throw err;
      setReferrals(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error creating referral');
      throw err;
    }
  }, [patientId]);

  const updateReferralStatus = useCallback(async (referralId: string, status: string) => {
    try {
      const { data, error: err } = await supabase
        .from('referral_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', referralId)
        .select()
        .single();

      if (err) throw err;
      setReferrals(prev => prev.map(r => r.id === referralId ? data : r));
      return data;
    } catch (err: any) {
      setError(err.message || 'Error updating referral status');
      throw err;
    }
  }, []);

  const getOverdueReferrals = useCallback(() => {
    const now = new Date();
    return referrals.filter(r => {
      const expectedDate = new Date(r.expected_response_date);
      return expectedDate < now && !['completed', 'closed'].includes(r.status);
    });
  }, [referrals]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return {
    referrals,
    loading,
    error,
    createReferral,
    updateReferralStatus,
    getOverdueReferrals,
    refetch: fetchReferrals
  };
};

// Hook for managing specialist responses
export const useSpecialistResponses = (patientId: string) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('specialist_responses')
        .select(`
          *,
          referral_requests!inner(patient_id)
        `)
        .eq('referral_requests.patient_id', patientId)
        .order('response_date', { ascending: false });

      if (err) throw err;
      setResponses(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching specialist responses');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const recordResponse = useCallback(async (referralId: string, responseData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('specialist_responses')
        .insert([{ ...responseData, referral_request_id: referralId }])
        .select()
        .single();

      if (err) throw err;
      setResponses(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error recording response');
      throw err;
    }
  }, []);

  const markResponseReviewed = useCallback(async (responseId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('specialist_responses')
        .update({ response_status: 'reviewed' })
        .eq('id', responseId)
        .select()
        .single();

      if (err) throw err;
      setResponses(prev => prev.map(r => r.id === responseId ? data : r));
      return data;
    } catch (err: any) {
      setError(err.message || 'Error marking response as reviewed');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  return {
    responses,
    loading,
    error,
    recordResponse,
    markResponseReviewed,
    refetch: fetchResponses
  };
};

// Hook for managing referral follow-ups
export const useReferralFollowup = (referralId: string) => {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('referral_followup')
        .select('*')
        .eq('referral_request_id', referralId)
        .order('followup_date', { ascending: false });

      if (err) throw err;
      setFollowups(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching followups');
    } finally {
      setLoading(false);
    }
  }, [referralId]);

  const createFollowup = useCallback(async (followupData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('referral_followup')
        .insert([{ ...followupData, referral_request_id: referralId }])
        .select()
        .single();

      if (err) throw err;
      setFollowups(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error creating followup');
      throw err;
    }
  }, [referralId]);

  const completeFollowup = useCallback(async (followupId: string, outcomes: string) => {
    try {
      const { data, error: err } = await supabase
        .from('referral_followup')
        .update({
          completed: true,
          completion_date: new Date().toISOString(),
          outcomes
        })
        .eq('id', followupId)
        .select()
        .single();

      if (err) throw err;
      setFollowups(prev => prev.map(f => f.id === followupId ? data : f));
      return data;
    } catch (err: any) {
      setError(err.message || 'Error completing followup');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  return {
    followups,
    loading,
    error,
    createFollowup,
    completeFollowup,
    refetch: fetchFollowups
  };
};

// Hook for recording referral outcomes
export const useReferralOutcomes = (referralId: string) => {
  const [outcome, setOutcome] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOutcome = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('referral_outcomes')
        .select('*')
        .eq('referral_request_id', referralId)
        .single();

      if (err?.code !== 'PGRST116') {
        if (err) throw err;
        setOutcome(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching outcome');
    } finally {
      setLoading(false);
    }
  }, [referralId]);

  const recordOutcome = useCallback(async (outcomeData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('referral_outcomes')
        .insert([{ ...outcomeData, referral_request_id: referralId }])
        .select()
        .single();

      if (err) throw err;
      setOutcome(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error recording outcome');
      throw err;
    }
  }, [referralId]);

  useEffect(() => {
    fetchOutcome();
  }, [fetchOutcome]);

  return {
    outcome,
    loading,
    error,
    recordOutcome,
    refetch: fetchOutcome
  };
};
