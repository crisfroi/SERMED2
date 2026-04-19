// ============================================================================
// useRadiologyReport Hook - Radiology Report Management
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

interface RadiologyFinding {
  id: string;
  finding_type: string;
  location: string;
  size_mm?: number;
  description: string;
  severity_score: number;
  benign_likelihood: number;
  requires_followup: boolean;
  followup_interval_days?: number;
}

interface RadiologyReport {
  id: string;
  report_date: string;
  report_status: string;
  clinical_history?: string;
  technique?: string;
  findings_text: string;
  impression: string;
  recommendations?: string;
  prior_study_comparison?: string;
  radiologist_name: string;
  signed_at?: string;
  signed_by_name?: string;
  created_at: string;
}

export const useRadiologyReport = () => {
  const [report, setReport] = useState<RadiologyReport | null>(null);
  const [findings, setFindings] = useState<RadiologyFinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (imagingOrderId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch report
      const { data: reportData, error: reportError } = await supabase
        .from('imaging_reports')
        .select(
          `
          id,
          report_date,
          report_status,
          clinical_history,
          technique,
          findings_text,
          impression,
          recommendations,
          prior_study_comparison,
          radiologist:radiologist_id(party_name),
          signed_by:signed_by_id(party_name),
          created_at
        `
        )
        .eq('imaging_order_id', imagingOrderId)
        .single();

      if (reportError && reportError.code !== 'PGRST116') {
        throw reportError;
      }

      if (reportData) {
        setReport({
          id: reportData.id,
          report_date: reportData.report_date,
          report_status: reportData.report_status,
          clinical_history: reportData.clinical_history,
          technique: reportData.technique,
          findings_text: reportData.findings_text,
          impression: reportData.impression,
          recommendations: reportData.recommendations,
          prior_study_comparison: reportData.prior_study_comparison,
          radiologist_name: reportData.radiologist?.party_name || 'N/A',
          signed_at: reportData.signed_at,
          signed_by_name: reportData.signed_by?.party_name,
          created_at: reportData.created_at,
        });

        // Fetch findings
        const { data: findingsData, error: findingsError } = await supabase
          .from('imaging_findings')
          .select(
            `
            id,
            finding_type,
            finding_location,
            finding_size_mm,
            finding_description,
            severity_score,
            benign_likelihood_percentage,
            requires_followup,
            followup_interval_days
          `
          )
          .eq('imaging_report_id', reportData.id);

        if (findingsError) throw findingsError;

        setFindings(
          (findingsData || []).map((f) => ({
            id: f.id,
            finding_type: f.finding_type,
            location: f.finding_location,
            size_mm: f.finding_size_mm,
            description: f.finding_description,
            severity_score: f.severity_score,
            benign_likelihood: f.benign_likelihood_percentage,
            requires_followup: f.requires_followup,
            followup_interval_days: f.followup_interval_days,
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching report');
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadReport = useCallback(
    async (imagingOrderId: string): Promise<ArrayBuffer> => {
      try {
        const response = await supabase.functions.invoke(
          'export_radiology_report',
          {
            body: { imagingOrderId },
          }
        );

        if (response.error) throw response.error;

        // Trigger PDF download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `radiology_report_${imagingOrderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return response.data;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Error downloading report'
        );
      }
    },
    []
  );

  const requestEdits = useCallback(
    async (reportId: string, comments?: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('imaging_reports')
          .update({
            report_status: 'pending_review',
          })
          .eq('id', reportId);

        if (error) throw error;

        // Optionally create a comment about requested edits
        if (comments) {
          await supabase.from('request_edits_log').insert([
            {
              imaging_report_id: reportId,
              comments,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Error requesting edits'
        );
      }
    },
    []
  );

  return {
    report,
    findings,
    loading,
    error,
    fetchReport,
    downloadReport,
    requestEdits,
  };
};

export default useRadiologyReport;

