import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useReportsAndAnalytics = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const { data, error: queryErr } = await supabase
          .from('audit_logs')
          .select('id, action, created_at')
          .limit(100)
          .order('created_at', { ascending: false });

        if (queryErr) throw queryErr;
        setReports(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const generateReport = useCallback(async (filters: any) => {
    try {
      // Placeholder for report generation
      return [];
    } catch (err) {
      console.error('Report generation error:', err);
    }
  }, []);

  return { reports, loading, error, generateReport };
};
