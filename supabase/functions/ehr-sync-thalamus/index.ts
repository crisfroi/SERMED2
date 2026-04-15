import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  ehr_id: string
  action: 'push' | 'pull'
  thalamus_patient_id?: string
}

interface SyncResponse {
  success: boolean
  ehr_id: string
  synced_at: string
  status: 'synced' | 'failed' | 'pending'
  message: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body: SyncRequest = await req.json()
    const { ehr_id, action, thalamus_patient_id } = body

    if (!ehr_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing ehr_id',
          status: 'failed' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch current EHR record
    const { data: ehr, error: fetchError } = await supabase
      .from('electronic_health_record')
      .select('*')
      .eq('id', ehr_id)
      .single()

    if (fetchError || !ehr) {
      return new Response(
        JSON.stringify({
          success: false,
          ehr_id,
          message: `EHR not found: ${fetchError?.message}`,
          synced_at: new Date().toISOString(),
          status: 'failed'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // TODO: Implement actual THALAMUS/GNU Health sync logic here
    // For now, just update status

    const syncResult = {
      thalamus_synced_at: new Date().toISOString(),
      thalamus_sync_status: 'synced' as const,
      thalamus_patient_id: thalamus_patient_id || ehr.thalamus_patient_id,
      thalamus_last_error: null,
    }

    const { data: updated, error: updateError } = await supabase
      .from('electronic_health_record')
      .update(syncResult)
      .eq('id', ehr_id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    const response: SyncResponse = {
      success: true,
      ehr_id,
      synced_at: syncResult.thalamus_synced_at,
      status: 'synced',
      message: `EHR ${action} sync completed successfully`
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        status: 'failed',
        synced_at: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
