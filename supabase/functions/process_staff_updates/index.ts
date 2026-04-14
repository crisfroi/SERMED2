// WEEK 11 ADMIN 1: Deno Edge Functions (Supabase)
// Function: process_staff_updates
// Purpose: Process staff record changes with audit trail logging
// Trigger: POST /api/v1/hr/staff/process-update

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StaffUpdate {
  staff_id: string;
  update_type: 'profile' | 'salary' | 'position' | 'status' | 'department';
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  reason: string;
  updated_by: string;
  notify_staff?: boolean;
}

interface AuditEntry {
  staff_id: string;
  update_type: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  reason: string;
  updated_by: string;
  timestamp: string;
}

// Validate staff update based on type
const validateStaffUpdate = (
  updateType: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  switch (updateType) {
    case 'salary':
      if (newValues.base_salary_xaf && typeof newValues.base_salary_xaf !== 'number') {
        errors.push('base_salary_xaf must be a number');
      }
      if (newValues.base_salary_xaf && newValues.base_salary_xaf < 0) {
        errors.push('base_salary_xaf cannot be negative');
      }
      // Check if salary increased by more than 50% (flag for review)
      if (
        oldValues.base_salary_xaf &&
        newValues.base_salary_xaf > oldValues.base_salary_xaf * 1.5
      ) {
        console.warn(`Salary increase > 50% for staff ${oldValues.staff_id}`);
      }
      break;

    case 'status':
      const validStatuses = ['activo', 'licencia', 'suspendido', 'jubilado'];
      if (!validStatuses.includes(newValues.employment_status)) {
        errors.push(`Invalid employment status. Must be one of: ${validStatuses.join(', ')}`);
      }
      // Validate state transitions
      const validTransitions: Record<string, string[]> = {
        activo: ['licencia', 'suspendido', 'jubilado'],
        licencia: ['activo', 'jubilado'],
        suspendido: ['activo', 'jubilado'],
        jubilado: [], // Terminal state
      };
      if (
        oldValues.employment_status &&
        !validTransitions[oldValues.employment_status]?.includes(newValues.employment_status)
      ) {
        errors.push(
          `Invalid status transition: ${oldValues.employment_status} → ${newValues.employment_status}`
        );
      }
      break;

    case 'position':
      if (newValues.position_id && typeof newValues.position_id !== 'string') {
        errors.push('position_id must be a string');
      }
      break;

    case 'department':
      if (newValues.department_id && typeof newValues.department_id !== 'string') {
        errors.push('department_id must be a string');
      }
      break;

    default:
      errors.push(
        `Unknown update type: ${updateType}. Must be profile, salary, position, status, or department`
      );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Create audit entry
const createAuditEntry = async (supabase: any, entry: AuditEntry): Promise<boolean> => {
  try {
    // For now, we'll store it in a simple audit log
    // In production, this might be a separate audit system
    const { error } = await supabase
      .from('staff_audit_log')
      .insert({
        staff_id: entry.staff_id,
        action: `UPDATE: ${entry.update_type}`,
        performed_by: entry.updated_by,
        user_role: 'HR_MANAGER', // TODO: Get from auth
        old_values: JSON.stringify(entry.old_values),
        new_values: JSON.stringify(entry.new_values),
        timestamp: entry.timestamp,
        reason_for_change: entry.reason,
      });

    if (error) {
      console.error('Audit entry creation failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Audit entry error:', err);
    return false;
  }
};

// Send notification to staff (if applicable)
const notifyStaff = async (
  supabase: any,
  staffId: string,
  updateType: string,
  notifyEmail?: string
): Promise<void> => {
  // This would typically send an email or notification
  console.log(`Notification queued for staff ${staffId}: ${updateType}`);
  // In production: call email service or notification queue
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as StaffUpdate;
    const {
      staff_id,
      update_type,
      old_values,
      new_values,
      reason,
      updated_by,
      notify_staff,
    } = body;

    // Validate required fields
    if (!staff_id || !update_type || !updated_by) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: staff_id, update_type, updated_by',
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate update
    const validation = validateStaffUpdate(update_type, old_values || {}, new_values || {});
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          validation_errors: validation.errors,
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

    // Fetch staff record to verify existence
    const { data: staff, error: staffError } = await supabase
      .from('staff_records')
      .select('*')
      .eq('id', staff_id)
      .single();

    if (staffError || !staff) {
      return new Response(
        JSON.stringify({
          error: 'Staff record not found',
          details: staffError?.message,
          success: false,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Apply update to staff record
    const { error: updateError } = await supabase
      .from('staff_records')
      .update({
        ...new_values,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staff_id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: 'Staff update failed',
          details: updateError.message,
          success: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create audit entry
    const auditEntry: AuditEntry = {
      staff_id,
      update_type,
      old_values: old_values || {},
      new_values: new_values || {},
      reason: reason || 'No reason provided',
      updated_by,
      timestamp: new Date().toISOString(),
    };

    const auditCreated = await createAuditEntry(supabase, auditEntry);

    // Send notification if requested
    if (notify_staff) {
      await notifyStaff(supabase, staff_id, update_type, staff.email);
    }

    // Build response
    const response = {
      success: true,
      staff_id,
      update_type,
      timestamp: new Date().toISOString(),
      audit_logged: auditCreated,
      notification_sent: notify_staff || false,
      message: `Staff record updated successfully`,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Staff update process error:', error);
    return new Response(
      JSON.stringify({
        error: 'Staff update process failed',
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
