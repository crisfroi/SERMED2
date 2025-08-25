/**
 * SMS Service utility with fallback capabilities
 * Provides robust SMS sending with error handling and simulation modes
 */

import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from './errorHandler';

export interface SMSParams {
  profesionalId: string;
  telefono: string;
  tipoNotificacion: string;
  mensaje: string;
}

export interface SMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  fallback?: boolean;
}

/**
 * Send SMS with fallback to simulation mode if Edge Function fails
 */
export async function sendSMSWithFallback(params: SMSParams): Promise<SMSResult> {
  const { profesionalId, telefono, tipoNotificacion, mensaje } = params;

  console.log('SMS Service: Attempting to send SMS:', {
    profesionalId,
    telefono,
    tipoNotificacion,
    mensajeLength: mensaje.length
  });

  try {
    // Try the Edge Function first
    const { data, error } = await supabase.functions.invoke('send-sms-notification', {
      body: {
        profesionalId,
        telefono,
        tipoNotificacion,
        mensaje
      }
    });

    if (error) {
      console.warn('SMS Service: Edge Function failed, using fallback:', error);
      return await simulateSMSSend(params);
    }

    if (data && data.success) {
      console.log('SMS Service: Edge Function success');
      return {
        success: true,
        messageSid: data.messageSid
      };
    } else {
      console.warn('SMS Service: Edge Function returned unsuccessful result, using fallback');
      return await simulateSMSSend(params);
    }

  } catch (error) {
    console.warn('SMS Service: Edge Function threw error, using fallback:', error);
    return await simulateSMSSend(params);
  }
}

/**
 * Simulate SMS sending when the actual service is not available
 * Logs the attempt to the database for tracking purposes
 */
async function simulateSMSSend(params: SMSParams): Promise<SMSResult> {
  const { profesionalId, telefono, tipoNotificacion, mensaje } = params;

  try {
    // Generate a mock message SID
    const mockSid = `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Log the simulated SMS to the database
    const { error: insertError } = await supabase
      .from('notificaciones_sms')
      .insert({
        profesional_id: profesionalId,
        telefono: telefono,
        tipo_notificacion: tipoNotificacion,
        estado: 'simulado',
        mensaje_sid: mockSid
      });

    if (insertError) {
      console.error('SMS Service: Could not log simulated SMS:', insertError);
    }

    console.log('SMS Service: SMS simulated successfully');
    
    return {
      success: true,
      messageSid: mockSid,
      fallback: true
    };

  } catch (error) {
    console.error('SMS Service: Simulation also failed:', error);
    return {
      success: false,
      error: getErrorMessage(error),
      fallback: true
    };
  }
}

/**
 * Validate SMS parameters before sending
 */
export function validateSMSParams(params: SMSParams): string | null {
  const { profesionalId, telefono, tipoNotificacion, mensaje } = params;

  if (!profesionalId) {
    return 'ID del profesional es requerido';
  }

  if (!telefono) {
    return 'Número de teléfono es requerido';
  }

  if (!tipoNotificacion) {
    return 'Tipo de notificación es requerido';
  }

  if (!mensaje || mensaje.trim().length === 0) {
    return 'Mensaje es requerido';
  }

  if (mensaje.length > 1600) {
    return 'El mensaje es demasiado largo (máximo 1600 caracteres)';
  }

  // Basic phone number validation
  const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/;
  if (!phoneRegex.test(telefono)) {
    return 'Formato de teléfono inválido';
  }

  return null; // Valid
}

/**
 * Normalize phone number to a standard format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add +240 for Equatorial Guinea
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('240')) {
      normalized = '+' + normalized;
    } else {
      normalized = '+240' + normalized;
    }
  }
  
  return normalized;
}
