/**
 * Referral Functions
 * 
 * Deno Edge Functions for referral management:
 * - referral validation
 * - status checking
 * - referral creation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// Main handler for referral operations
Deno.serve(async (req: Request) => {
  try {
    const { action, data } = await req.json()

    switch (action) {
      case 'validateReferral':
        return await validateReferral(data)
      case 'checkReferralStatus':
        return await checkReferralStatus(data)
      case 'createReferral':
        return await createReferral(data)
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function validateReferral(data: any): Promise<Response> {
  try {
    const { patient_id, origin_hospital_id, destination_hospital_id, reason } = data

    if (!patient_id || !origin_hospital_id || !destination_hospital_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate both hospitals exist
    const { data: originHosp, error: originError } = await supabase
      .from('hospitals')
      .select('id')
      .eq('id', origin_hospital_id)
      .single()

    const { data: destHosp, error: destError } = await supabase
      .from('hospitals')
      .select('id')
      .eq('id', destination_hospital_id)
      .single()

    if (originError || destError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid hospital reference' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        valid: true,
        message: 'Referral is valid and can be created'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function checkReferralStatus(data: any): Promise<Response> {
  try {
    const { referral_id } = data

    if (!referral_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing referral_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: referral, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referral_id)
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, referral }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function createReferral(data: any): Promise<Response> {
  try {
    const { patient_id, origin_hospital_id, destination_hospital_id, reason, priority, clinical_summary } = data

    if (!patient_id || !origin_hospital_id || !destination_hospital_id || !reason) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate referral first
    const validation = await validateReferral(data)
    const validationResponse = await validation.json()

    if (!validationResponse.success || !validationResponse.valid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Referral validation failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create referral
    const { data: referral, error } = await supabase
      .from('referrals')
      .insert([{
        patient_id,
        origin_hospital_id,
        destination_hospital_id,
        reason,
        priority: priority || 'NORMAL',
        clinical_summary,
        status: 'PENDING',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, referral }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
