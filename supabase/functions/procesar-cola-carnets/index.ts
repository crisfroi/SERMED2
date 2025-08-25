import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

// Configuración de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    if (req.method !== 'GET') {
      return new Response('Método no permitido', {
        status: 405,
        headers: corsHeaders
      });
    }

    console.log('Iniciando procesamiento de cola de carnets...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Buscar el primer item pendiente en la cola
    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from('cola_generacion_carnets')
      .select('id, profesional_id')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (queueError || !queueItem) {
      console.log('No hay carnets pendientes de generación');
      return new Response(JSON.stringify({
        success: true,
        message: 'No hay carnets pendientes de generación',
        processed: 0
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    console.log(`Procesando carnet para profesional: ${queueItem.profesional_id}`);

    // Marcar como procesando
    await supabaseAdmin
      .from('cola_generacion_carnets')
      .update({ 
        estado: 'procesando',
        updated_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);

    try {
      // Llamar a la función de generación de carnet con admin credentials
      const carnetResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/generar-carnet-profesional?id=${queueItem.profesional_id}`,
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!carnetResponse.ok) {
        const errorText = await carnetResponse.text();
        throw new Error(`HTTP ${carnetResponse.status}: ${errorText}`);
      }

      const carnetResult = await carnetResponse.json();

      if (carnetResult.success) {
        // Marcar como completado
        await supabaseAdmin
          .from('cola_generacion_carnets')
          .update({ 
            estado: 'completado',
            url_carnet: carnetResult.url_carnet,
            updated_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);

        console.log(`Carnet generado exitosamente: ${carnetResult.url_carnet}`);

        return new Response(JSON.stringify({
          success: true,
          message: 'Carnet generado exitosamente',
          url_carnet: carnetResult.url_carnet,
          profesional_id: queueItem.profesional_id,
          processed: 1
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });

      } else {
        // Marcar como error
        const errorMessage = carnetResult.error || carnetResult.details || 'Error desconocido en generación';
        
        await supabaseAdmin
          .from('cola_generacion_carnets')
          .update({ 
            estado: 'error',
            mensaje_error: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);

        console.error(`Error al generar carnet: ${errorMessage}`);

        return new Response(JSON.stringify({
          success: false,
          message: `Error al generar carnet: ${errorMessage}`,
          profesional_id: queueItem.profesional_id,
          processed: 0
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

    } catch (processingError) {
      // Marcar como error en caso de excepción
      await supabaseAdmin
        .from('cola_generacion_carnets')
        .update({ 
          estado: 'error',
          mensaje_error: processingError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      throw processingError;
    }

  } catch (error) {
    console.error('Error al procesar cola de carnets:', error);

    return new Response(JSON.stringify({
      success: false,
      message: 'Error al procesar cola de carnets',
      error: error.message,
      processed: 0
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
