import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleRestrictions, UserRole } from '@/types/roles';

export interface ContextFilters {
  restrictToCenter: boolean;
  centerId: string | null;
  centerName: string | null;
}

export const useContextFilters = (): ContextFilters => {
  const { user, userRole } = useAuth();
  const [state, setState] = useState<ContextFilters>({ restrictToCenter: false, centerId: null, centerName: null });

  useEffect(() => {
    const run = async () => {
      const restrictions = getRoleRestrictions(userRole as UserRole);
      const centerRestricted = !!restrictions?.dataFilters?.onlyAssignedCenter || (userRole === 'ADMIN_CENTRO_SANITARIO');

      if (!user?.id) {
        setState({ restrictToCenter: centerRestricted, centerId: null, centerName: null });
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('centro_asignado_id')
          .eq('id', user.id)
          .single();
        if (error) throw error;

        if (profile?.centro_asignado_id) {
          const { data: centro, error: cErr } = await supabase
            .from('centros_salud')
            .select('id,nombre')
            .eq('id', profile.centro_asignado_id)
            .single();
          if (cErr) throw cErr;
          setState({ restrictToCenter: centerRestricted, centerId: centro?.id || null, centerName: centro?.nombre || null });
        } else {
          setState({ restrictToCenter: centerRestricted, centerId: null, centerName: null });
        }
      } catch {
        setState({ restrictToCenter: centerRestricted, centerId: null, centerName: null });
      }
    };
    run();
  }, [user?.id, (userRole as string) || '']);

  return state;
};

export default useContextFilters;
