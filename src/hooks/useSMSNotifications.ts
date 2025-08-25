import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SMSNotification {
  id: string;
  profesional_id: string;
  telefono: string;
  tipo_notificacion: string;
  fecha_envio: string;
  estado: string;
  mensaje_sid?: string;
}

export function useSMSNotifications(profesionalId?: string) {
  return useQuery({
    queryKey: ['sms-notifications', profesionalId],
    queryFn: async () => {
      let query = supabase
        .from('notificaciones_sms')
        .select('*')
        .order('fecha_envio', { ascending: false });

      if (profesionalId) {
        query = query.eq('profesional_id', profesionalId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profesionalId
  });
}

export function useNotificationCount(profesionalId?: string) {
  return useQuery({
    queryKey: ['notification-count', profesionalId],
    queryFn: async () => {
      if (!profesionalId) return null;

      const { data, error } = await supabase
        .rpc('get_notification_count', { p_profesional_id: profesionalId });
      
      if (error) throw error;
      return data?.[0] || {
        total_notificaciones: 0,
        notificaciones_30_dias: 0,
        notificaciones_10_dias: 0,
        ultima_notificacion: null
      };
    },
    enabled: !!profesionalId
  });
}

export function useSendSMSNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      telefono,
      tipoNotificacion,
      mensaje
    }: {
      profesionalId: string;
      telefono: string;
      tipoNotificacion: string;
      mensaje: string;
    }) => {
      console.log('SMS Hook: Sending SMS with params:', {
        profesionalId,
        telefono,
        tipoNotificacion,
        mensajeLength: mensaje.length
      });

      try {
        const { data, error } = await supabase.functions.invoke('send-sms-notification', {
          body: {
            profesionalId,
            telefono,
            tipoNotificacion,
            mensaje
          }
        });

        if (error) {
          console.error('SMS Hook: Edge Function error:', error);

          // Create a more descriptive error
          let errorMessage = error.message || 'Error desconocido al enviar SMS';

          if (error.message?.includes('non-2xx status code')) {
            errorMessage = 'El servicio de SMS está experimentando problemas técnicos. Por favor, inténtelo más tarde.';
          } else if (error.message?.includes('credentials')) {
            errorMessage = 'El servicio de SMS no está configurado correctamente.';
          } else if (error.message?.includes('Missing required parameter')) {
            errorMessage = 'Faltan parámetros requeridos para enviar el SMS.';
          }

          throw new Error(errorMessage);
        }

        if (data && !data.success) {
          throw new Error(data.error || 'El SMS no se pudo enviar correctamente');
        }

        console.log('SMS Hook: Success:', data);
        return data;

      } catch (error: any) {
        // Log failed attempt to database
        try {
          await supabase.from('notificaciones_sms').insert({
            profesional_id: profesionalId,
            telefono: telefono,
            tipo_notificacion: tipoNotificacion,
            estado: 'error_hook',
            mensaje_sid: null
          });
        } catch (logError) {
          console.warn('SMS Hook: Could not log failed attempt:', logError);
        }

        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('SMS Hook: Mutation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['sms-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
    },
    onError: (error) => {
      console.error('SMS Hook: Mutation failed:', error);
    }
  });
}

export function useCheckRenewalNotifications() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-renewal-notifications');
      if (error) throw error;
      return data;
    }
  });
}
