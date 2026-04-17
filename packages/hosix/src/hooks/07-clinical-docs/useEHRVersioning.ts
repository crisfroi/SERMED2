import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface EHRDocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  created_by: string;
  created_at: string;
  change_summary: string;
  document_type: 'clinical_note' | 'prescription' | 'lab_result' | 'imaging_report' | 'discharge_summary' | 'consent_form';
  status: 'active' | 'archived' | 'retracted';
}

export interface EHRDocument {
  id: string;
  patient_id: string;
  document_type: 'clinical_note' | 'prescription' | 'lab_result' | 'imaging_report' | 'discharge_summary' | 'consent_form';
  title: string;
  current_version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'retracted';
  is_final: boolean;
}

interface VersionHistory {
  document: EHRDocument;
  versions: EHRDocumentVersion[];
}

interface VersionComparison {
  versionA: EHRDocumentVersion;
  versionB: EHRDocumentVersion;
  differences: Array<{
    type: 'added' | 'removed' | 'modified';
    section: string;
    oldValue?: string;
    newValue?: string;
  }>;
}

export const useEHRVersioning = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch document with all versions
  const fetchDocumentHistory = useCallback(
    async (documentId: string): Promise<VersionHistory | null> => {
      try {
        setLoading(true);
        setError(null);

        // Fetch main document
        const { data: docData, error: docError } = await supabase
          .from('ehr_documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (docError) throw docError;

        // Fetch all versions
        const { data: versionsData, error: versionsError } = await supabase
          .from('ehr_document_versions')
          .select('*')
          .eq('document_id', documentId)
          .order('version_number', { ascending: false });

        if (versionsError) throw versionsError;

        return {
          document: docData as EHRDocument,
          versions: (versionsData || []) as EHRDocumentVersion[],
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch document history';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create new version
  const createNewVersion = useCallback(
    async (
      documentId: string,
      content: string,
      changeSummary: string,
      userId: string
    ): Promise<EHRDocumentVersion | null> => {
      try {
        setLoading(true);
        setError(null);

        // Get current document to find next version number
        const { data: currentDoc, error: docErr } = await supabase
          .from('ehr_documents')
          .select('current_version')
          .eq('id', documentId)
          .single();

        if (docErr) throw docErr;

        const nextVersion = (currentDoc?.current_version || 0) + 1;

        // Create new version
        const { data: newVersion, error: versionErr } = await supabase
          .from('ehr_document_versions')
          .insert({
            document_id: documentId,
            version_number: nextVersion,
            content,
            created_by: userId,
            change_summary: changeSummary,
            status: 'active',
          })
          .select()
          .single();

        if (versionErr) throw versionErr;

        // Update document current_version
        const { error: updateErr } = await supabase
          .from('ehr_documents')
          .update({
            current_version: nextVersion,
            updated_at: new Date().toISOString(),
          })
          .eq('id', documentId);

        if (updateErr) throw updateErr;

        return newVersion as EHRDocumentVersion;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create new version';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Rollback to specific version
  const rollbackToVersion = useCallback(
    async (
      documentId: string,
      targetVersion: number,
      rollbackReason: string,
      userId: string
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        // Fetch target version content
        const { data: targetVersionData, error: fetchErr } = await supabase
          .from('ehr_document_versions')
          .select('content')
          .eq('document_id', documentId)
          .eq('version_number', targetVersion)
          .single();

        if (fetchErr) throw fetchErr;

        // Create new version with rolled-back content
        await createNewVersion(
          documentId,
          targetVersionData.content,
          `Rollback to v${targetVersion}. Reason: ${rollbackReason}`,
          userId
        );

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to rollback version';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [createNewVersion]
  );

  // Get version at specific timestamp
  const getVersionAtTimestamp = useCallback(
    async (documentId: string, timestamp: string): Promise<EHRDocumentVersion | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('ehr_document_versions')
          .select('*')
          .eq('document_id', documentId)
          .lte('created_at', timestamp)
          .order('version_number', { ascending: false })
          .limit(1)
          .single();

        if (err) throw err;
        return data as EHRDocumentVersion;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get version at timestamp';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Compare two versions
  const compareVersions = useCallback(
    (versionA: EHRDocumentVersion, versionB: EHRDocumentVersion): VersionComparison => {
      const contentA = versionA.content.split('\n');
      const contentB = versionB.content.split('\n');
      const differences: VersionComparison['differences'] = [];

      // Simple diff logic (in production, use a diff library like diff-match-patch)
      const maxLength = Math.max(contentA.length, contentB.length);
      for (let i = 0; i < maxLength; i++) {
        if (!contentA[i]) {
          differences.push({
            type: 'added',
            section: `Line ${i + 1}`,
            newValue: contentB[i],
          });
        } else if (!contentB[i]) {
          differences.push({
            type: 'removed',
            section: `Line ${i + 1}`,
            oldValue: contentA[i],
          });
        } else if (contentA[i] !== contentB[i]) {
          differences.push({
            type: 'modified',
            section: `Line ${i + 1}`,
            oldValue: contentA[i],
            newValue: contentB[i],
          });
        }
      }

      return { versionA, versionB, differences };
    },
    []
  );

  // Archive old versions (keep last N active)
  const archiveOldVersions = useCallback(
    async (documentId: string, keepCount: number = 10): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        // Get all versions
        const { data: versions, error: fetchErr } = await supabase
          .from('ehr_document_versions')
          .select('id, version_number')
          .eq('document_id', documentId)
          .order('version_number', { ascending: false });

        if (fetchErr) throw fetchErr;

        // Archive versions beyond keepCount
        if (versions && versions.length > keepCount) {
          const idsToArchive = versions.slice(keepCount).map((v) => v.id);

          const { error: updateErr } = await supabase
            .from('ehr_document_versions')
            .update({ status: 'archived' })
            .in('id', idsToArchive);

          if (updateErr) throw updateErr;
        }

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to archive old versions';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Finalize document (lock from further edits without version)
  const finalizeDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('ehr_documents')
          .update({ is_final: true })
          .eq('id', documentId);

        if (err) throw err;
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to finalize document';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    fetchDocumentHistory,
    createNewVersion,
    rollbackToVersion,
    getVersionAtTimestamp,
    compareVersions,
    archiveOldVersions,
    finalizeDocument,
  };
};
