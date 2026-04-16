import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Referral {
  id: string;
  patient_id: string;
  from_clinic_id: string;
  to_specialty: string;
  target_clinic_id?: string;
  reason: string;
  clinical_summary: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  scheduled_date?: string;
  estimated_completion_date?: string;
  priority_score: number;
}

export interface ReferralHistory {
  referralId: string;
  status: string;
  statusChangedAt: string;
  changedBy: string;
  reason?: string;
}

interface ReferralStats {
  totalReferrals: number;
  pendingCount: number;
  acceptedCount: number;
  completedCount: number;
  averageWaitDays: number;
}

export const useReferralManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create referral
  const createReferral = useCallback(
    async (referralData: Partial<Referral>): Promise<Referral | null> => {
      try {
        setLoading(true);
        setError(null);

        // Calculate priority score based on urgency and clinical summary length
        const urgencyScore = {
          routine: 1,
          urgent: 3,
          emergency: 5,
        };
        const priorityScore =
          urgencyScore[referralData.urgency as keyof typeof urgencyScore] * 20 +
          (referralData.clinical_summary?.length || 0) / 10;

        const { data, error: err } = await supabase
          .from('referrals')
          .insert({
            ...referralData,
            priority_score: priorityScore,
            status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'referral',
          entity_id: data.id,
          action: 'create',
          changed_by: referralData.created_by || 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Referrals created to ${referralData.to_specialty}`,
          severity: 'low',
        });

        return data as Referral;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create referral';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get patient referrals
  const getPatientReferrals = useCallback(
    async (patientId: string): Promise<Referral[]> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('referrals')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (err) throw err;
        return (data || []) as Referral[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get patient referrals';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get referrals by specialty
  const getReferralsBySpecialty = useCallback(
    async (specialty: string, status?: string): Promise<Referral[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('referrals')
          .select('*')
          .eq('to_specialty', specialty)
          .order('priority_score', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as Referral[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get referrals by specialty';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update referral status
  const updateReferralStatus = useCallback(
    async (
      referralId: string,
      newStatus: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled',
      reason?: string,
      userId: string = 'system'
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        // Update referral
        const { error: updateErr } = await supabase
          .from('referrals')
          .update({
            status: newStatus,
            estimated_completion_date:
              newStatus === 'accepted' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
          })
          .eq('id', referralId);

        if (updateErr) throw updateErr;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'referral',
          entity_id: referralId,
          action: 'update',
          old_value: 'pending',
          new_value: newStatus,
          changed_by: userId,
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Referral status changed to ${newStatus}${reason ? ': ' + reason : ''}`,
          severity: newStatus === 'rejected' ? 'high' : 'low',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update referral status';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get referral status history
  const getReferralHistory = useCallback(
    async (referralId: string): Promise<ReferralHistory[]> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('ehr_audit_trail')
          .select('entity_id, action, changed_at, changed_by, description')
          .eq('entity_id', referralId)
          .eq('entity_type', 'referral')
          .order('changed_at', { ascending: false });

        if (err) throw err;

        return (
          (data || []).map((entry) => ({
            referralId: entry.entity_id,
            status: entry.action,
            statusChangedAt: entry.changed_at,
            changedBy: entry.changed_by,
            reason: entry.description,
          })) as ReferralHistory[]
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get referral history';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get referral statistics
  const getReferralStats = useCallback(
    async (clinicId?: string, timeframeDays: number = 30): Promise<ReferralStats | null> => {
      try {
        setLoading(true);
        setError(null);

        const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString();

        let query = supabase
          .from('referrals')
          .select('status, created_at, scheduled_date')
          .gte('created_at', startDate);

        if (clinicId) {
          query = query.eq('target_clinic_id', clinicId);
        }

        const { data, error: err } = await query;

        if (err) throw err;

        const referrals = (data || []) as any[];
        const statuses: Record<string, number> = {
          pending: 0,
          accepted: 0,
          rejected: 0,
          completed: 0,
          cancelled: 0,
        };

        let totalWaitDays = 0;
        let waitDayCount = 0;

        referrals.forEach((ref) => {
          statuses[ref.status]++;
          if (ref.scheduled_date) {
            const createdDate = new Date(ref.created_at);
            const scheduledDate = new Date(ref.scheduled_date);
            totalWaitDays += Math.floor((scheduledDate.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000));
            waitDayCount++;
          }
        });

        return {
          totalReferrals: referrals.length,
          pendingCount: statuses.pending,
          acceptedCount: statuses.accepted,
          completedCount: statuses.completed,
          averageWaitDays: waitDayCount > 0 ? Math.floor(totalWaitDays / waitDayCount) : 0,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get referral statistics';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Cancel referral
  const cancelReferral = useCallback(
    async (referralId: string, reason: string, userId: string = 'system'): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('referrals')
          .update({ status: 'cancelled' })
          .eq('id', referralId);

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'referral',
          entity_id: referralId,
          action: 'delete',
          changed_by: userId,
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Referral cancelled: ${reason}`,
          severity: 'medium',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to cancel referral';
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
    createReferral,
    getPatientReferrals,
    getReferralsBySpecialty,
    updateReferralStatus,
    getReferralHistory,
    getReferralStats,
    cancelReferral,
  };
};
