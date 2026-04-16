// WEEK 11 ADMIN 1: Deno Edge Functions (Supabase)
// Function: sync_staff_to_thalamus
// Purpose: [OPTIONAL] Sync staff data to THALAMUS (cross-hospital visibility)
// Note: NO BLOCKING - graceful degradation if THALAMUS unavailable
// Trigger: POST /api/v1/hr/thalamus/sync-staff

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  staff_ids?: string[]; // If provided, sync only these staff; otherwise sync all
}

interface SyncResult {
  total_synced: number;
  successful: number;
  failed: number;
  errors: Array<{ staff_id: string; error: string }>;
}

// Prepare staff data for THALAMUS
const prepareStaffForThalamus = (staff: any) => {
  return {
    hospital_id: Deno.env.get('HOSPITAL_ID') || 'unknown',
    hospital_name: Deno.env.get('HOSPITAL_NAME') || 'Unknown Hospital',
    staff_id: staff.id,
    employee_id: staff.employee_id,
    full_name: staff.full_name,
    email: staff.email,
    phone: staff.phone,
    position: staff.position || 'Unknown',
    department: staff.department || 'Unknown',
    employment_status: staff.employment_status,
    is_available: staff.employment_status === 'activo',
    base_salary_xaf: staff.base_salary_xaf || 0,
    hire_date: staff.hire_date,
    specialties: staff.specialties || [],
    last_updated: new Date().toISOString(),
  };
};

// Send batch to THALAMUS API
const sendToThalamus = async (staffData: any[]): Promise<SyncResult> => {
  const result: SyncResult = {
    total_synced: staffData.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  const thalamusUrl = Deno.env.get('THALAMUS_API_URL');
  const thalamusApiKey = Deno.env.get('THALAMUS_API_KEY');

  if (!thalamusUrl || !thalamusApiKey) {
    console.warn('THALAMUS configuration missing - sync skipped (graceful degradation)');
    return {
      total_synced: 0,
      successful: 0,
      failed: staffData.length,
      errors: staffData.map((s) => ({
        staff_id: s.staff_id,
        error: 'THALAMUS not configured (optional - no blocking)',
      })),
    };
  }

  try {
    const response = await fetch(`${thalamusUrl}/api/v1/hospital-staff/batch-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${thalamusApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        staff_records: staffData,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`THALAMUS sync failed (${response.status}):`, errorText);

      // Mark all as failed but don't block operation
      result.failed = staffData.length;
      result.errors = staffData.map((s) => ({
        staff_id: s.staff_id,
        error: `THALAMUS returned ${response.status}`,
      }));

      return result;
    }

    const syncResponse = await response.json();

    // Update result based on response
    result.successful = syncResponse.successful_count || 0;
    result.failed = syncResponse.failed_count || 0;
    result.errors = syncResponse.errors || [];

    console.log(`THALAMUS sync completed: ${result.successful}/${result.total_synced} successful`);

    return result;
  } catch (error) {
    console.error('THALAMUS sync error:', error);

    // Graceful degradation - non-blocking
    return {
      total_synced: staffData.length,
      successful: 0,
      failed: staffData.length,
      errors: staffData.map((s) => ({
        staff_id: s.staff_id,
        error: error.message || 'THALAMUS connection failed',
      })),
    };
  }
};

// Update sync status record
const updateSyncStatus = async (
  supabase: any,
  result: SyncResult,
  success: boolean
): Promise<void> => {
  try {
    await supabase.from('thalamus_sync_log').insert({
      sync_type: 'staff',
      total_records: result.total_synced,
      successful_records: result.successful,
      failed_records: result.failed,
      sync_status: success ? 'completed' : 'failed',
      error_details: JSON.stringify(result.errors),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Sync status update error:', err);
  }
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as SyncRequest;
    const { staff_ids } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    // Build query
    let query = supabase.from('staff_records').select(`
      id,
      employee_id,
      full_name,
      email,
      phone,
      position_id,
      department_id,
      employment_status,
      base_salary_xaf,
      hire_date,
      is_active
    `);

    // If specific staff_ids provided, filter
    if (staff_ids && staff_ids.length > 0) {
      query = query.in('id', staff_ids);
    }

    // Only sync active staff
    query = query.eq('is_active', true);

    const { data: staffRecords, error: fetchError } = await query;

    if (fetchError) {
      console.error('Staff fetch error:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch staff records',
          details: fetchError.message,
          success: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!staffRecords || staffRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          total_synced: 0,
          successful: 0,
          failed: 0,
          message: 'No staff records to sync',
          errors: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare staff data for THALAMUS
    const preparedData = staffRecords.map((staff) => prepareStaffForThalamus(staff));

    // Send to THALAMUS (with graceful degradation)
    const syncResult = await sendToThalamus(preparedData);

    // Update sync status
    await updateSyncStatus(supabase, syncResult, syncResult.failed === 0);

    // Build response
    const response = {
      success: syncResult.failed === 0, // Success only if 0 failures
      total_synced: syncResult.total_synced,
      successful: syncResult.successful,
      failed: syncResult.failed,
      errors: syncResult.errors,
      timestamp: new Date().toISOString(),
      note: 'THALAMUS sync is optional - system functions independently if THALAMUS is unavailable',
    };

    const statusCode = syncResult.failed === 0 ? 200 : syncResult.successful > 0 ? 206 : 500;

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync process error:', error);

    // Still return 200 for graceful degradation
    return new Response(
      JSON.stringify({
        success: false,
        total_synced: 0,
        successful: 0,
        failed: 0,
        errors: [{ staff_id: 'all', error: error.message || 'Sync process failed' }],
        note: 'THALAMUS sync failed - system continues to operate independently (non-blocking)',
      }),
      {
        status: 206, // Partial success (operation continued without THALAMUS)
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
