// WEEK 11 ADMIN 1: Deno Edge Functions (Supabase)
// Function: process_payroll_approval
// Purpose: Automate payroll approval workflow (submitted→approved→processed→paid)
// Trigger: POST /api/v1/hr/payroll/:id/process-approval

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayrollApprovalRequest {
  payroll_id: string;
  action: 'approve' | 'reject' | 'process' | 'mark_paid';
  approved_by: string;
  reason?: string;
  payment_method?: 'bank_transfer' | 'check' | 'cash';
  payment_date?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: PayrollApprovalRequest = await req.json();
    const { payroll_id, action, approved_by, reason, payment_method, payment_date } = body;

    // Validate required fields
    if (!payroll_id || !action || !approved_by) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: payroll_id, action, approved_by',
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate action
    const validActions = ['approve', 'reject', 'process', 'mark_paid'];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({
          error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    // Fetch current payroll record
    const { data: payroll, error: fetchError } = await supabase
      .from('payroll_processing')
      .select('*')
      .eq('id', payroll_id)
      .single();

    if (fetchError || !payroll) {
      return new Response(
        JSON.stringify({
          error: 'Payroll record not found',
          details: fetchError?.message,
          success: false,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate state transitions
    const stateTransitions: Record<string, Record<string, string>> = {
      approve: { submitted: 'approved' }, // submitted → approved
      reject: { submitted: 'draft' }, // submitted → draft
      process: { approved: 'processed' }, // approved → processed
      mark_paid: { processed: 'paid' }, // processed → paid
    };

    const validTransition = stateTransitions[action];
    const currentStatus = payroll.status;

    if (!Object.keys(validTransition).includes(currentStatus)) {
      return new Response(
        JSON.stringify({
          error: `Cannot ${action} payroll in '${currentStatus}' status`,
          current_status: currentStatus,
          valid_actions_for_status: Object.keys(stateTransitions).filter(
            (a) => stateTransitions[a][currentStatus]
          ),
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const new_status = validTransition[currentStatus];

    // Build update object
    const updateData: Record<string, unknown> = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    // Add action-specific fields
    if (action === 'approve') {
      updateData.approved_by = approved_by;
      updateData.approved_at = new Date().toISOString();
    } else if (action === 'mark_paid') {
      updateData.payment_date = payment_date || new Date().toISOString();
      updateData.payment_method = payment_method || 'bank_transfer';
      updateData.processed_by = approved_by;
    }

    // Update payroll record
    const { error: updateError } = await supabase
      .from('payroll_processing')
      .update(updateData)
      .eq('id', payroll_id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to update payroll status',
          details: updateError.message,
          success: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log action to audit trail
    const { error: auditError } = await supabase
      .from('payroll_audit_log')
      .insert({
        payroll_id,
        action: action.replace('_', ' ').toUpperCase(),
        performed_by: approved_by,
        user_role: 'HR_MANAGER', // TODO: Get from auth token
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        old_values: JSON.stringify({ status: currentStatus }),
        new_values: JSON.stringify({ status: new_status }),
        timestamp: new Date().toISOString(),
        reason_for_change: reason || `Automatic ${action}`,
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the request for audit errors
    }

    // Build response
    const response = {
      success: true,
      payroll_id,
      action,
      previous_status: currentStatus,
      new_status,
      timestamp: new Date().toISOString(),
      approver: approved_by,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Approval process error:', error);
    return new Response(
      JSON.stringify({
        error: 'Approval process failed',
        details: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
