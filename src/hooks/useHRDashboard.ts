import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardMetrics {
  totalStaff: number;
  activeShifts: number;
  absences: number;
  certifications: { name: string; count: number }[];
}

export const useHRDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data: staff, error: staffErr } = await supabase
          .from('staff')
          .select('id')
          .limit(1);
        
        if (staffErr) throw staffErr;

        setMetrics({
          totalStaff: staff?.length || 0,
          activeShifts: 0,
          absences: 0,
          certifications: [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, loading, error };
};
