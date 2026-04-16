import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface ReferralStatusRequest {
  referral_id: string;
  days_since_creation?: number;
}

interface ReferralStatusResponse {
  status: string;
  days_pending: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recommendation: string;
}

// Calculate status and priority
const calculateReferralStatus = (daysSinceCreation: number): ReferralStatusResponse => {
  let status = 'pending';
  let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
  let recommendation = 'No action needed';

  if (daysSinceCreation < 3) {
    priority = 'normal';
    recommendation = 'Referral recently created. Monitor for specialist acceptance.';
  } else if (daysSinceCreation >= 3 && daysSinceCreation < 7) {
    priority = 'high';
    recommendation = 'Follow up with specialist clinic. Referral pending for 3+ days.';
  } else if (daysSinceCreation >= 7 && daysSinceCreation < 14) {
    priority = 'urgent';
    recommendation = 'Urgently contact specialist. Referral pending for over 1 week.';
    status = 'escalate';
  } else if (daysSinceCreation >= 14) {
    priority = 'urgent';
    recommendation = 'CRITICAL: Referral pending for 2+ weeks. Immediate action required.';
    status = 'overdue';
  }

  return {
    status,
    days_pending: daysSinceCreation,
    priority,
    recommendation,
  };
};

serve(async (req: Request) => {
  if (req.method === 'POST') {
    try {
      const payload: ReferralStatusRequest = await req.json();
      const { referral_id, days_since_creation = 0 } = payload;

      if (!referral_id) {
        return new Response(
          JSON.stringify({ error: 'referral_id is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const statusInfo = calculateReferralStatus(days_since_creation);

      return new Response(JSON.stringify(statusInfo), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: error instanceof Error ? error.message : String(error),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
