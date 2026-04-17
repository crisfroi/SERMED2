import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ============================================================================
// ASIS 13: useEHRAccess Hook
// Propósito: Gestionar acceso y auditoría de EHR (HIPAA-compliant)
// Líneas: ~400
// ============================================================================

interface AccessLog {
  id: string;
  ehr_id: string;
  accessed_by: string;
  access_type: 'view' | 'edit' | 'export' | 'share' | 'approve' | 'delete';
  accessed_at: string;
  reason: string;
  ip_address: string;
  duration_seconds: number;
  status: string;
  data_accessed?: Record<string, boolean>;
}

export function useEHRAccess(erhId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch access logs
  const logsQuery = useQuery({
    queryKey: ['ehr-access-logs', erhId],
    queryFn: async () => {
      if (!erhId) return [];

      const { data, error } = await supabase
        .from('ehr_access_log')
        .select('*')
        .eq('ehr_id', erhId)
        .order('accessed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as AccessLog[];
    },
    enabled: !!erhId,
    staleTime: 1 * 60 * 1000, // 1 minute - access logs change frequently
  });

  // Mutation: Log access
  const logAccessMutation = useMutation({
    mutationFn: async (logEntry: Omit<AccessLog, 'id' | 'accessed_at'>) => {
      const { data, error } = await supabase
        .from('ehr_access_log')
        .insert({
          ...logEntry,
          accessed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehr-access-logs', erhId] });
    }
  });

  // Mutation: Export audit trail
  const exportAuditMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json' = 'csv') => {
      const response = await fetch(`/api/ehr/${erhId}/access-logs/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          format,
          include_all: true
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (url) => {
      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${erhId}-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Cleanup
      URL.revokeObjectURL(url);
    }
  });

  // Mutation: Check unauthorized access attempts
  const checkUnauthorizedMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/ehr/${erhId}/access-logs/check-unauthorized`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Check failed');
      return response.json();
    }
  });

  // Helpers
  const logViewAccess = async (dataAccessed?: Record<string, boolean>) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !erhId) return;

    logAccessMutation.mutate({
      ehr_id: erhId,
      accessed_by: user.id,
      access_type: 'view',
      reason: 'clinical_care',
      ip_address: 'auto-detected',
      duration_seconds: 0,
      status: 'completed',
      data_accessed: dataAccessed || { summary: true, episodes: false }
    });
  };

  const logEditAccess = async (dataModified?: Record<string, boolean>) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !erhId) return;

    logAccessMutation.mutate({
      ehr_id: erhId,
      accessed_by: user.id,
      access_type: 'edit',
      reason: 'clinical_care',
      ip_address: 'auto-detected',
      duration_seconds: 0,
      status: 'completed',
      data_accessed: dataModified || { summary: true }
    });
  };

  const logExportAccess = async (format: 'pdf' | 'hl7' | 'fhir') => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !erhId) return;

    logAccessMutation.mutate({
      ehr_id: erhId,
      accessed_by: user.id,
      access_type: 'export',
      reason: 'clinical_care',
      ip_address: 'auto-detected',
      duration_seconds: 0,
      status: 'completed',
      data_accessed: { export_format: true }
    });
  };

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    refetch: logsQuery.refetch,
    logAccess: (entry: Omit<AccessLog, 'id' | 'accessed_at'>) => logAccessMutation.mutate(entry),
    logViewAccess,
    logEditAccess,
    logExportAccess,
    exportAudit: (format?: 'csv' | 'json') => exportAuditMutation.mutate(format),
    isExporting: exportAuditMutation.isPending,
    checkUnauthorized: () => checkUnauthorizedMutation.mutateAsync(),
    unauthorizedAttempts: 0 // Would be populated from API
  };
}
