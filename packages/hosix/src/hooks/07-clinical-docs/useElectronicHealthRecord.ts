import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ============================================================================
// ASIS 13: useElectronicHealthRecord Hook
// Propósito: Gestionar datos de Historia Médica Electrónica
// Características: CRUD, consolidación, exportación PDF/HL7
// Líneas: ~600
// ============================================================================

interface Electronic HealthRecord {
  id: string;
  patient_id: string;
  summary_note: string;
  active_problems: string[];
  medications_active: string[];
  allergies: string[];
  last_summary_updated: string;
  thalamus_synced_at: string | null;
  thalamus_sync_status: string;
}

interface EHRData {
  id: string;
  episode_type: string;
  episode_date: string;
  clinician_name: string;
  summary: string;
  primary_diagnosis: string;
  secondary_diagnoses: string[];
  status: string;
}

interface EHRDocument {
  id: string;
  document_type: string;
  document_title: string;
  file_path: string;
  created_at: string;
}

export function useElectronicHealthRecord(patientId: string) {
  const queryClient = useQueryClient();

  // Fetch EHR main record
  const ehrQuery = useQuery({
    queryKey: ['ehr', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('electronic_health_record')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ElectronicHealthRecord | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch episodes (todo tipo de episodios clínicos)
  const episodesQuery = useQuery({
    queryKey: ['ehr-episodes', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ehr_episode_links')
        .select('*')
        .eq('ehr_id', ehrQuery.data?.id)
        .order('episode_date', { ascending: false });

      if (error) throw error;
      return (data || []) as EHRData[];
    },
    enabled: !!ehrQuery.data?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  // Fetch documents
  const documentsQuery = useQuery({
    queryKey: ['ehr-documents', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ehr_document_storage')
        .select('*')
        .eq('ehr_id', ehrQuery.data?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EHRDocument[];
    },
    enabled: !!ehrQuery.data?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation: Update EHR summary/problems/medications
  const updateEHRMutation = useMutation({
    mutationFn: async (updates: Partial<ElectronicHealthRecord>) => {
      const { data, error } = await supabase
        .from('electronic_health_record')
        .update(updates)
        .eq('id', ehrQuery.data?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehr', patientId] });

      // Log access for HIPAA audit trail
      logEHRAccess(ehrQuery.data?.id, 'edit', 'clinical_care');
    },
  });

  // Mutation: Generate PDF export
  const generatePDFMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'hl7' | 'fhir') => {
      const response = await fetch(`/api/ehr/${ehrQuery.data?.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          format,
          include_episodes: true,
          include_documents: true,
          include_access_log: false
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (url, format) => {
      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `ehr-${ehrQuery.data?.patient_id}-${new Date().toISOString()}.${format === 'pdf' ? 'pdf' : 'xml'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Log access
      logEHRAccess(ehrQuery.data?.id, 'export', `export_${format}`);

      // Cleanup
      URL.revokeObjectURL(url);
    }
  });

  // Mutation: Consolidate EHR summary (called after updates)
  const consolidateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/ehr/${ehrQuery.data?.id}/consolidate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Consolidation failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehr', patientId] });
    }
  });

  // Function to log access (HIPAA audit trail)
  const logEHRAccess = async (
    erhId: string | undefined,
    accessType: string,
    reason: string,
    dataAccessed?: Record<string, boolean>
  ) => {
    if (!erhId) return;

    const { error } = await supabase
      .from('ehr_access_log')
      .insert({
        ehr_id: erhId,
        accessed_by: (await supabase.auth.getUser()).data.user?.id,
        access_type: accessType,
        reason: reason,
        ip_address: 'auto-detected', // En producción, obtener del backend
        duration_seconds: 0,
        status: 'completed',
        data_accessed: dataAccessed || { summary: true, episodes: true }
      });

    if (error) console.error('Failed to log access:', error);
  };

  return {
    ehr: ehrQuery.data,
    episodes: episodesQuery.data || [],
    documents: documentsQuery.data || [],
    isLoading: ehrQuery.isLoading || episodesQuery.isLoading || documentsQuery.isLoading,
    error: ehrQuery.error || episodesQuery.error || documentsQuery.error,
    refetch: async () => {
      await ehrQuery.refetch();
      await episodesQuery.refetch();
      await documentsQuery.refetch();
    },
    updateEHR: (updates: Partial<ElectronicHealthRecord>) => updateEHRMutation.mutate(updates),
    generatePDF: (format: 'pdf' | 'hl7' | 'fhir') => generatePDFMutation.mutate(format),
    consolidateSummary: () => consolidateSummaryMutation.mutate(),
    isExporting: generatePDFMutation.isPending,
    exportEHR: async (format: 'pdf' | 'hl7' | 'fhir') => {
      return generatePDFMutation.mutateAsync(format);
    }
  };
}
