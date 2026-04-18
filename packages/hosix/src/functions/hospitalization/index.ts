/**
 * Hospitalization Functions
 * 
 * Deno Edge Functions for hospitalization management:
 * - kardex creation and evolution
 * - bed management
 * - surgery requests
 * - interconsultation requests
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// Main handler for hospitalization operations
Deno.serve(async (req: Request) => {
  try {
    const { action, data } = await req.json()

    switch (action) {
      case 'createKardex':
        return await createKardex(data)
      case 'updateKardexEvolution':
        return await updateKardexEvolution(data)
      case 'moveBed':
        return await moveBed(data)
      case 'requestSurgery':
        return await requestSurgery(data)
      case 'requestInterconsultation':
        return await requestInterconsultation(data)
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

async function createKardex(data: any): Promise<Response> {
  try {
    const { patient_id, admission_id, diagnosis, medical_order } = data

    if (!patient_id || !admission_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: kardex, error } = await supabase
      .from('kardex')
      .insert([{
        patient_id,
        admission_id,
        diagnosis,
        medical_order,
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
      JSON.stringify({ success: true, kardex }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function updateKardexEvolution(data: any): Promise<Response> {
  try {
    const { kardex_id, evolution_note, medical_order_update } = data

    if (!kardex_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing kardex_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: updated, error } = await supabase
      .from('kardex')
      .update({
        evolution_note,
        medical_order_update,
        updated_at: new Date().toISOString()
      })
      .eq('id', kardex_id)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, kardex: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function moveBed(data: any): Promise<Response> {
  try {
    const { admission_id, from_bed_id, to_bed_id } = data

    if (!admission_id || !to_bed_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: movement, error } = await supabase
      .from('bed_movements')
      .insert([{
        admission_id,
        from_bed_id: from_bed_id || null,
        to_bed_id,
        movement_date: new Date().toISOString()
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
      JSON.stringify({ success: true, movement }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function requestSurgery(data: any): Promise<Response> {
  try {
    const { admission_id, procedure, priority, scheduled_date } = data

    if (!admission_id || !procedure) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: surgery, error } = await supabase
      .from('surgeries')
      .insert([{
        admission_id,
        procedure,
        priority: priority || 'NORMAL',
        scheduled_date,
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
      JSON.stringify({ success: true, surgery }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function requestInterconsultation(data: any): Promise<Response> {
  try {
    const { admission_id, requested_specialty, reason, urgency } = data

    if (!admission_id || !requested_specialty) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: interconsultation, error } = await supabase
      .from('interconsultations')
      .insert([{
        admission_id,
        requested_specialty,
        reason,
        urgency: urgency || 'NORMAL',
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
      JSON.stringify({ success: true, interconsultation }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
