/**
 * HOSIX - Module 16: useClinical Hook
 * Hook para gestionar documentos clínicos
 */

import { useState, useCallback } from 'react';
import { supabase } from '@sermed2/shared/services/supabaseClient';
import { useApp } from '@hosix/hooks/shared';
import { Document } from '@/components/clinical/DocumentViewer';

interface ClinicalDocument {
  id: string;
  patient_id: string;
  doctor_id: string;
  type: 'visit_note' | 'diagnosis' | 'prescription' | 'lab_result' | 'imaging';
  title: string;
  content: string;
  signature?: string;
  signed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useClinical = () => {
  const { addNotification } = useApp();
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<ClinicalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [documentFilter, setDocumentFilter] = useState<
    'all' | 'visit_note' | 'diagnosis' | 'prescription' | 'lab_result' | 'imaging'
  >('all');

  /**
   * Fetch paginated clinical documents for a patient
   */
  const fetchDocuments = useCallback(
    async (patientId: string, page = 1, pageSize = 10) => {
      setIsLoading(true);

      try {
        const offset = (page - 1) * pageSize;

        let query = supabase
          .from('clinical_documents')
          .select('*', { count: 'exact' })
          .eq('patient_id', patientId);

        if (documentFilter !== 'all') {
          query = query.eq('type', documentFilter);
        }

        query = query.order('created_at', { ascending: false });
        query = query.range(offset, offset + pageSize - 1);

        const { data, count, error } = await query;

        if (error) throw error;

        setDocuments(data || []);
        setTotalDocuments(count || 0);

        return { documents: data, total: count };
      } catch (error: any) {
        addNotification('error', error.message || 'Error al cargar documentos');
        setDocuments([]);
        return { documents: [], total: 0 };
      } finally {
        setIsLoading(false);
      }
    },
    [documentFilter, addNotification]
  );

  /**
   * Fetch single clinical document
   */
  const fetchDocumentDetails = useCallback(
    async (documentId: string) => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('clinical_documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (error) throw error;

        setCurrentDocument(data);
        return data;
      } catch (error: any) {
        addNotification('error', error.message || 'Error al cargar documento');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Create new clinical document
   */
  const createDocument = useCallback(
    async (patientId: string, doctorId: string, data: Partial<ClinicalDocument>) => {
      setIsLoading(true);

      try {
        const { error, data: newDoc } = await supabase
          .from('clinical_documents')
          .insert([
            {
              patient_id: patientId,
              doctor_id: doctorId,
              type: data.type,
              title: data.title,
              content: data.content,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setDocuments([newDoc, ...documents]);
        addNotification('success', 'Documento creado exitosamente');

        return newDoc;
      } catch (error: any) {
        addNotification('error', error.message || 'Error al crear documento');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [documents, addNotification]
  );

  /**
   * Update clinical document
   */
  const updateDocument = useCallback(
    async (documentId: string, updates: Partial<ClinicalDocument>) => {
      setIsLoading(true);

      try {
        const { error, data: updatedDoc } = await supabase
          .from('clinical_documents')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', documentId)
          .select()
          .single();

        if (error) throw error;

        setDocuments(
          documents.map((doc) => (doc.id === documentId ? updatedDoc : doc))
        );

        if (currentDocument?.id === documentId) {
          setCurrentDocument(updatedDoc);
        }

        addNotification('success', 'Documento actualizado exitosamente');
        return updatedDoc;
      } catch (error: any) {
        addNotification('error', error.message || 'Error al actualizar documento');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [documents, currentDocument, addNotification]
  );

  /**
   * Delete clinical document
   */
  const deleteDocument = useCallback(
    async (documentId: string) => {
      setIsLoading(true);

      try {
        const { error } = await supabase
          .from('clinical_documents')
          .delete()
          .eq('id', documentId);

        if (error) throw error;

        setDocuments(documents.filter((doc) => doc.id !== documentId));

        if (currentDocument?.id === documentId) {
          setCurrentDocument(null);
        }

        addNotification('success', 'Documento eliminado exitosamente');
        return true;
      } catch (error: any) {
        addNotification('error', error.message || 'Error al eliminar documento');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [documents, currentDocument, addNotification]
  );

  /**
   * Sign clinical document
   */
  const signDocument = useCallback(
    async (documentId: string, signature: string) => {
      setIsLoading(true);

      try {
        const { error, data: signedDoc } = await supabase
          .from('clinical_documents')
          .update({
            signature,
            signed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', documentId)
          .select()
          .single();

        if (error) throw error;

        setDocuments(
          documents.map((doc) => (doc.id === documentId ? signedDoc : doc))
        );

        if (currentDocument?.id === documentId) {
          setCurrentDocument(signedDoc);
        }

        addNotification('success', 'Documento firmado exitosamente');
        return signedDoc;
      } catch (error: any) {
        addNotification('error', error.message || 'Error al firmar documento');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [documents, currentDocument, addNotification]
  );

  /**
   * Search documents by title or content
   */
  const searchDocuments = useCallback(
    async (patientId: string, query: string) => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('clinical_documents')
          .select('*')
          .eq('patient_id', patientId)
          .or(
            `title.ilike.%${query}%,content.ilike.%${query}%`
          )
          .order('created_at', { ascending: false });

        if (error) throw error;

        setDocuments(data || []);
        return data || [];
      } catch (error: any) {
        addNotification('error', error.message || 'Error al buscar documentos');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Get documents by type
   */
  const getDocumentsByType = useCallback(
    async (
      patientId: string,
      type: 'visit_note' | 'diagnosis' | 'prescription' | 'lab_result' | 'imaging'
    ) => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('clinical_documents')
          .select('*')
          .eq('patient_id', patientId)
          .eq('type', type)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
      } catch (error: any) {
        addNotification('error', error.message || 'Error al obtener documentos');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Get document signatures for verification
   */
  const getSignedDocuments = useCallback(
    async (patientId: string) => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('clinical_documents')
          .select('*')
          .eq('patient_id', patientId)
          .not('signed_at', 'is', null)
          .order('signed_at', { ascending: false });

        if (error) throw error;

        return data || [];
      } catch (error: any) {
        addNotification('error', error.message || 'Error al obtener documentos firmados');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  return {
    // State
    documents,
    currentDocument,
    isLoading,
    totalDocuments,
    documentFilter,

    // Methods
    fetchDocuments,
    fetchDocumentDetails,
    createDocument,
    updateDocument,
    deleteDocument,
    signDocument,
    searchDocuments,
    getDocumentsByType,
    getSignedDocuments,

    // Setters
    setDocumentFilter,
  };
};

export default useClinical;
