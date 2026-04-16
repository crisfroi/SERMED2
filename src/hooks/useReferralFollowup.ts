import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ReferralFollowup {
  id: string;
  referral_id: string;
  patient_id: string;
  followup_date: string;
  followup_type: 'phone' | 'in_person' | 'email' | 'sms';
  status: 'pending' | 'completed' | 'missed' | 'rescheduled';
  notes?: string;
  completed_at?: string;
  completed_by?: string;
}

export interface ReferralOutcome {
  id: string;
  referral_id: string;
  patient_id: string;
  outcome_type: 'resolved' | 'ongoing' | 'referred_elsewhere' | 'declined_treatment' | 'lost_to_followup';
  clinical_outcome?: string;
  patient_satisfaction: number; // 1-5
  complications?: string;
  outcome_date: string;
  recorded_by: string;
}

export interface ReferralQuality {
  totalReferrals: number;
  resolvedCount: number;
  resolutionRate: number;
  averageSpecialistResponseTime: number;
  averagePatientSatisfaction: number;
  followupCompletionRate: number;
}

export const useReferralFollowup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schedule followup
  const scheduleFollowup = useCallback(
    async (
      referralId: string,
      patientId: string,
      followupDate: string,
      followupType: 'phone' | 'in_person' | 'email' | 'sms',
      notes?: string,
      userId: string = 'system'
    ): Promise<ReferralFollowup | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('referral_followup')
          .insert({
            referral_id: referralId,
            patient_id: patientId,
            followup_date: followupDate,
            followup_type: followupType,
            notes,
            status: 'pending',
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'referral',
          entity_id: referralId,
          action: 'create',
          changed_by: userId,
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Followup scheduled for ${followupDate} via ${followupType}`,
          severity: 'low',
        });

        return data as ReferralFollowup;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to schedule followup';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get pending followups
  const getPendingFollowups = useCallback(async (): Promise<ReferralFollowup[]> => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      const { data, error: err } = await supabase
        .from('referral_followup')
        .select('*')
        .eq('status', 'pending')
        .lte('followup_date', today)
        .order('followup_date', { ascending: true });

      if (err) throw err;
      return (data || []) as ReferralFollowup[];
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get pending followups';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get followup history for referral
  const getFollowupHistory = useCallback(
    async (referralId: string): Promise<ReferralFollowup[]> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('referral_followup')
          .select('*')
          .eq('referral_id', referralId)
          .order('followup_date', { ascending: false });

        if (err) throw err;
        return (data || []) as ReferralFollowup[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get followup history';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Mark followup as completed
  const completeFollowup = useCallback(
    async (
      followupId: string,
      notes: string,
      userId: string = 'system'
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('referral_followup')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_by: userId,
            notes,
          })
          .eq('id', followupId);

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'followup',
          entity_id: followupId,
          action: 'update',
          changed_by: userId,
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Followup completed: ${notes}`,
          severity: 'low',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to complete followup';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    scheduleFollowup,
    getPendingFollowups,
    getFollowupHistory,
    completeFollowup,
  };
};

export const useReferralOutcomes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Record referral outcome
  const recordOutcome = useCallback(
    async (
      referralId: string,
      patientId: string,
      outcomeType: 'resolved' | 'ongoing' | 'referred_elsewhere' | 'declined_treatment' | 'lost_to_followup',
      clinicalOutcome: string,
      patientSatisfaction: number,
      complications: string | null,
      userId: string = 'system'
    ): Promise<ReferralOutcome | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('referral_outcomes')
          .insert({
            referral_id: referralId,
            patient_id: patientId,
            outcome_type: outcomeType,
            clinical_outcome: clinicalOutcome,
            patient_satisfaction: Math.min(Math.max(patientSatisfaction, 1), 5),
            complications,
            outcome_date: new Date().toISOString(),
            recorded_by: userId,
          })
          .select()
          .single();

        if (err) throw err;

        // Update referral status to completed
        await supabase
          .from('referrals')
          .update({ status: 'completed' })
          .eq('id', referralId);

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'referral',
          entity_id: referralId,
          action: 'update',
          changed_by: userId,
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Referral outcome recorded: ${outcomeType}. Satisfaction: ${patientSatisfaction}/5`,
          severity: 'low',
        });

        return data as ReferralOutcome;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to record outcome';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get outcome for referral
  const getOutcomeForReferral = useCallback(
    async (referralId: string): Promise<ReferralOutcome | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('referral_outcomes')
          .select('*')
          .eq('referral_id', referralId)
          .single();

        if (err && err.code !== 'PGRST116') throw err; // PGRST116 = no rows
        return data as ReferralOutcome | null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get outcome';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get quality metrics
  const getQualityMetrics = useCallback(
    async (timeframeDays: number = 90): Promise<ReferralQuality | null> => {
      try {
        setLoading(true);
        setError(null);

        const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString();

        // Get referrals in timeframe
        const { data: referrals, error: refErr } = await supabase
          .from('referrals')
          .select('id')
          .gte('created_at', startDate);

        if (refErr) throw refErr;

        const referralIds = referrals?.map((r) => r.id) || [];

        // Get outcomes
        const { data: outcomes, error: outcomeErr } = await supabase
          .from('referral_outcomes')
          .select('outcome_type, patient_satisfaction')
          .in('referral_id', referralIds);

        if (outcomeErr) throw outcomeErr;

        const resolvedCount = (outcomes || []).filter((o) => o.outcome_type === 'resolved').length;
        const satisfactionScores = (outcomes || [])
          .map((o) => o.patient_satisfaction)
          .filter((s) => s !== null);
        const avgSatisfaction = satisfactionScores.length > 0 ? satisfactionScores.reduce((a, b) => a + b) / satisfactionScores.length : 0;

        // Get followup completion rate
        const { count: totalFollowups } = await supabase
          .from('referral_followup')
          .select('*', { count: 'exact', head: true })
          .in('referral_id', referralIds);

        const { count: completedFollowups } = await supabase
          .from('referral_followup')
          .select('*', { count: 'exact', head: true })
          .in('referral_id', referralIds)
          .eq('status', 'completed');

        const followupRate = (totalFollowups || 0) > 0 ? ((completedFollowups || 0) / (totalFollowups || 1)) * 100 : 0;

        return {
          totalReferrals: referralIds.length,
          resolvedCount,
          resolutionRate: referralIds.length > 0 ? (resolvedCount / referralIds.length) * 100 : 0,
          averageSpecialistResponseTime: 3, // Would calculate from specialist_responses
          averagePatientSatisfaction: avgSatisfaction,
          followupCompletionRate: followupRate,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get quality metrics';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    recordOutcome,
    getOutcomeForReferral,
    getQualityMetrics,
  };
};
