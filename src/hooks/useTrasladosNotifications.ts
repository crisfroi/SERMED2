import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useTrasladosNotifications = () => {
  const { toast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    const channel = supabase
      .channel('solicitudes_traslado_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'solicitudes_traslado' }, (payload) => {
        if (['SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO'].includes(userRole || '')) {
          const rec: any = payload.new;
          toast({
            title: 'Nueva solicitud de traslado',
            description: `Profesional ${rec.profesional_id} solicita traslado al centro ${rec.centro_destino_id}.`,
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'solicitudes_traslado' }, (payload) => {
        const rec: any = payload.new;
        const estado = rec.estado;
        if (estado === 'aprobado') {
          toast({ title: 'Traslado aprobado', description: 'Una solicitud de traslado ha sido aprobada.' });
        } else if (estado === 'rechazado') {
          toast({ title: 'Traslado rechazado', description: 'Una solicitud de traslado ha sido rechazada.' });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userRole]);
};

export default useTrasladosNotifications;
