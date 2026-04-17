import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const hospitalId = searchParams.get('hospital_id')

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Query must be at least 2 characters',
          results: []
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Full-text search in ehr_document_storage
    let queryBuilder = supabase
      .from('ehr_document_storage')
      .select('id, ehr_id, document_type, document_title, created_at, signed_by')

    // Add hospital filter if provided
    if (hospitalId) {
      // This requires a join with electronic_health_record
      const { data, error } = await supabase
        .from('ehr_document_storage')
        .select(`
          id,
          ehr_id,
          document_type,
          document_title,
          created_at,
          signed_by,
          electronic_health_record!inner(hospital_id)
        `)
        .textSearch('document_content_text', query)
        .eq('electronic_health_record.hospital_id', hospitalId)
        .limit(20)

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          query,
          results: data || [],
          count: data?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    } else {
      // Search without hospital filter
      const { data, error } = await supabase
        .from('ehr_document_storage')
        .select('id, ehr_id, document_type, document_title, created_at, signed_by')
        .textSearch('document_content_text', query)
        .limit(20)

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          query,
          results: data || [],
          count: data?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
  } catch (error) {
    console.error('Search error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        results: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
