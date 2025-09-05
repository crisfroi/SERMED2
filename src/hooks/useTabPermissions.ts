import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TabPermissionRecord = {
  id: string;
  usuario_id: string;
  pestana: string;
  puede_ver: boolean | null;
  puede_editar: boolean | null;
  puede_aprobar: boolean | null;
  restricciones: Record<string, any> | null;
};

export type TabPermissionsMap = Record<string, {
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
  restricciones?: Record<string, any> | null;
}>;

export const useTabPermissions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TabPermissionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('permisos_pestanas')
          .select('*')
          .eq('usuario_id', user.id);
        if (error) throw error;
        setRecords((data as any) || []);
      } catch (e: any) {
        setError(e.message || 'Error al cargar permisos de pestañas');
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [user?.id]);

  const map: TabPermissionsMap = useMemo(() => {
    const m: TabPermissionsMap = {} as any;
    for (const r of records) {
      m[r.pestana] = {
        canView: !!r.puede_ver,
        canEdit: !!r.puede_editar,
        canApprove: !!r.puede_aprobar,
        restricciones: r.restricciones || null,
      };
    }
    return m;
  }, [records]);

  const canViewTab = (tabId: string, roleDefault: boolean): boolean => {
    const override = map[tabId];
    return override ? override.canView : roleDefault;
  };

  const getTabActions = (tabId: string) => map[tabId] || { canView: false, canEdit: false, canApprove: false };

  return { loading, error, records, map, canViewTab, getTabActions };
};

export default useTabPermissions;
