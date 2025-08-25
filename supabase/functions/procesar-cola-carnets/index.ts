import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

// Configuración de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    if (req.method !== 'POST') {
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

    // Primero limpiar items que han estado "procesando" por más de 10 minutos
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('cola_generacion_carnets')
      .update({
        estado: 'pendiente',
        updated_at: new Date().toISOString()
      })
      .eq('estado', 'procesando')
      .lt('updated_at', tenMinutesAgo);

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
      // Verificar si el profesional ya tiene carnet
      const { data: profesional, error: profError } = await supabaseAdmin
        .from('profesionales_sanitarios')
        .select('id, url_carnet, nombre_completo, id_profesional_unico')
        .eq('id', queueItem.profesional_id)
        .single();

      if (profError) {
        throw new Error(`Profesional no encontrado: ${profError.message}`);
      }

      if (profesional.url_carnet) {
        // Ya tiene carnet, marcar como completado
        await supabaseAdmin
          .from('cola_generacion_carnets')
          .update({ 
            estado: 'completado',
            url_carnet: profesional.url_carnet,
            updated_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);

        return new Response(JSON.stringify({
          success: true,
          message: 'Carnet ya existía, marcado como completado',
          url_carnet: profesional.url_carnet,
          profesional_id: queueItem.profesional_id,
          processed: 1
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Generar URL temporal de carnet (placeholder)
      const timestamp = Date.now();
      const carnetUrl = `https://placeholder-carnet-${profesional.id_profesional_unico || queueItem.profesional_id}-${timestamp}.example.com`;

      // Actualizar profesional con URL del carnet
      const { error: updateError } = await supabaseAdmin
        .from('profesionales_sanitarios')
        .update({ url_carnet: carnetUrl })
        .eq('id', queueItem.profesional_id);

      if (updateError) {
        throw new Error(`Error actualizando profesional: ${updateError.message}`);
      }

      // Marcar como completado
      await supabaseAdmin
        .from('cola_generacion_carnets')
        .update({ 
          estado: 'completado',
          url_carnet: carnetUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      console.log(`Carnet procesado exitosamente: ${carnetUrl}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Carnet procesado exitosamente',
        url_carnet: carnetUrl,
        profesional_id: queueItem.profesional_id,
        processed: 1
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (processingError) {
      console.error(`Error procesando carnet: ${processingError.message}`);
      
      // Marcar como error
      await supabaseAdmin
        .from('cola_generacion_carnets')
        .update({ 
          estado: 'error',
          mensaje_error: processingError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      return new Response(JSON.stringify({
        success: false,
        message: `Error procesando carnet: ${processingError.message}`,
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

  } catch (error) {
    console.error('Error general en procesamiento de cola:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });

    return new Response(JSON.stringify({
      success: false,
      message: 'Error general al procesar cola de carnets',
      error: error?.message || 'Unknown error',
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
