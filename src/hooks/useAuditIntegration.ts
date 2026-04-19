import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';

export interface AuditTrailEntry {
  id: string;
  entity_type: 'document' | 'patient' | 'user' | 'encryption_key' | 'access_token';
  entity_id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'decrypt' | 'export' | 'sign' | 'revoke_access';
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
  ip_address: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AccessLog {
  id: string;
  document_id: string;
  accessed_by: string;
  access_type: 'view' | 'download' | 'decrypt' | 'export';
  accessed_at: string;
  duration_seconds: number;
  ip_address: string;
  user_agent: string;
  reason: string;
  approved_by?: string;
}

export interface ComplianceReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalAccess: number;
    totalChanges: number;
    totalUnauthorizedAttempts: number;
    criticalEvents: number;
  };
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topAccessedDocuments: Array<{ documentId: string; accessCount: number }>;
  topUsers: Array<{ userId: string; actionCount: number }>;
}

export const useAuditIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log document access
  const logDocumentAccess = useCallback(
    async (
      documentId: string,
      userId: string,
      accessType: 'view' | 'download' | 'decrypt' | 'export',
      reason: string = 'Routine access',
      ipAddress: string = '0.0.0.0'
    ): Promise<AccessLog | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('ehr_access_logs')
          .insert({
            document_id: documentId,
            accessed_by: userId,
            access_type: accessType,
            accessed_at: new Date().toISOString(),
            duration_seconds: 0, // Will be updated on session end
            ip_address: ipAddress,
            user_agent: navigator.userAgent,
            reason,
          })
          .select()
          .single();

        if (err) throw err;
        return data as AccessLog;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to log document access';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Log audit trail entry
  const logAuditTrail = useCallback(
    async (
      entityType: 'document' | 'patient' | 'user' | 'encryption_key' | 'access_token',
      entityId: string,
      action: 'create' | 'read' | 'update' | 'delete' | 'decrypt' | 'export' | 'sign' | 'revoke_access',
      userId: string,
      description: string,
      oldValue?: string,
      newValue?: string,
      ipAddress: string = '0.0.0.0'
    ): Promise<AuditTrailEntry | null> => {
      try {
        setLoading(true);
        setError(null);

        // Determine severity based on action
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (['delete', 'decrypt', 'revoke_access'].includes(action)) severity = 'high';
        if (['export'].includes(action)) severity = 'medium';
        if (entityType === 'encryption_key' && action === 'delete') severity = 'critical';

        const { data, error: err } = await supabase
          .from('ehr_audit_trail')
          .insert({
            entity_type: entityType,
            entity_id: entityId,
            action,
            old_value: oldValue || null,
            new_value: newValue || null,
            changed_by: userId,
            changed_at: new Date().toISOString(),
            ip_address: ipAddress,
            description,
            severity,
          })
          .select()
          .single();

        if (err) throw err;
        return data as AuditTrailEntry;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to log audit trail';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get document access history
  const getDocumentAccessHistory = useCallback(
    async (
      documentId: string,
      startDate?: string,
      endDate?: string
    ): Promise<AccessLog[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('ehr_access_logs')
          .select('*')
          .eq('document_id', documentId)
          .order('accessed_at', { ascending: false });

        if (startDate) query = query.gte('accessed_at', startDate);
        if (endDate) query = query.lte('accessed_at', endDate);

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as AccessLog[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get access history';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get user activity log
  const getUserActivityLog = useCallback(
    async (
      userId: string,
      startDate?: string,
      endDate?: string
    ): Promise<AuditTrailEntry[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('ehr_audit_trail')
          .select('*')
          .eq('changed_by', userId)
          .order('changed_at', { ascending: false });

        if (startDate) query = query.gte('changed_at', startDate);
        if (endDate) query = query.lte('changed_at', endDate);

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as AuditTrailEntry[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get user activity log';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get critical events (high/critical severity)
  const getCriticalEvents = useCallback(
    async (startDate?: string, endDate?: string): Promise<AuditTrailEntry[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('ehr_audit_trail')
          .select('*')
          .in('severity', ['high', 'critical'])
          .order('changed_at', { ascending: false });

        if (startDate) query = query.gte('changed_at', startDate);
        if (endDate) query = query.lte('changed_at', endDate);

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as AuditTrailEntry[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get critical events';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Generate compliance report
  const generateComplianceReport = useCallback(
    async (startDate: string, endDate: string): Promise<ComplianceReport | null> => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all audit records in period
        let query = supabase
          .from('ehr_audit_trail')
          .select('action, severity, changed_by, entity_id, entity_type')
          .gte('changed_at', startDate)
          .lte('changed_at', endDate);

        const { data: auditData, error: auditErr } = await query;
        if (auditErr) throw auditErr;

        // Fetch access logs
        const { data: accessData, error: accessErr } = await supabase
          .from('ehr_access_logs')
          .select('access_type, accessed_by, document_id')
          .gte('accessed_at', startDate)
          .lte('accessed_at', endDate);

        if (accessErr) throw accessErr;

        // Calculate statistics
        const eventsByType: Record<string, number> = {};
        const eventsBySeverity: Record<string, number> = {};
        const topUsers: Record<string, number> = {};
        const topDocuments: Record<string, number> = {};

        let criticalCount = 0;
        let unauthorizedCount = 0;

        auditData?.forEach((entry: any) => {
          eventsByType[entry.action] = (eventsByType[entry.action] || 0) + 1;
          eventsBySeverity[entry.severity] = (eventsBySeverity[entry.severity] || 0) + 1;
          topUsers[entry.changed_by] = (topUsers[entry.changed_by] || 0) + 1;

          if (entry.severity === 'critical') criticalCount++;
          if (entry.action === 'revoke_access') unauthorizedCount++;
        });

        accessData?.forEach((entry: any) => {
          topDocuments[entry.document_id] = (topDocuments[entry.document_id] || 0) + 1;
        });

        const topAccessedDocs = Object.entries(topDocuments)
          .map(([docId, count]) => ({ documentId: docId, accessCount: count as number }))
          .sort((a, b) => b.accessCount - a.accessCount)
          .slice(0, 10);

        const topUsersList = Object.entries(topUsers)
          .map(([userId, count]) => ({ userId, actionCount: count as number }))
          .sort((a, b) => b.actionCount - a.actionCount)
          .slice(0, 10);

        return {
          period: { start: startDate, end: endDate },
          summary: {
            totalAccess: (accessData?.length || 0) + (auditData?.length || 0),
            totalChanges: auditData?.length || 0,
            totalUnauthorizedAttempts: unauthorizedCount,
            criticalEvents: criticalCount,
          },
          eventsByType,
          eventsBySeverity,
          topAccessedDocuments: topAccessedDocs,
          topUsers: topUsersList,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate compliance report';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Export audit logs (HIPAA compliance)
  const exportAuditLogs = useCallback(
    async (startDate: string, endDate: string): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('ehr_audit_trail')
          .select('*')
          .gte('changed_at', startDate)
          .lte('changed_at', endDate)
          .order('changed_at', { ascending: false });

        if (err) throw err;

        // Create CSV export
        const headers = [
          'Entity Type',
          'Entity ID',
          'Action',
          'Changed By',
          'Changed At',
          'IP Address',
          'Description',
          'Severity',
        ];
        const rows = (data || []).map((entry: any) => [
          entry.entity_type,
          entry.entity_id,
          entry.action,
          entry.changed_by,
          entry.changed_at,
          entry.ip_address,
          entry.description,
          entry.severity,
        ]);

        const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

        return csv;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to export audit logs';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    logDocumentAccess,
    logAuditTrail,
    getDocumentAccessHistory,
    getUserActivityLog,
    getCriticalEvents,
    generateComplianceReport,
    exportAuditLogs,
  };
};

