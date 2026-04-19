import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import type { Database } from '@/types/supabase';

type Document = Database['public']['Tables']['ehr_document_storage']['Row'];
type DocumentType = 'lab_result' | 'prescription' | 'discharge' | 'imaging' | 'report' | 'consultation' | 'procedure' | 'consent';

interface UseEHRDocumentsOptions {
  documentType?: DocumentType;
  enabled?: boolean;
}

export const useEHRDocuments = (ehrId: string | null, options: UseEHRDocumentsOptions = {}) => {
  const { documentType, enabled = true } = options;

  return useQuery({
    queryKey: ['ehr-documents', ehrId, documentType],
    queryFn: async (): Promise<Document[]> => {
      if (!ehrId) return [];

      let query = supabase
        .from('ehr_document_storage')
        .select('*')
        .eq('ehr_id', ehrId)
        .order('created_at', { ascending: false });

      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!ehrId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para bÃºsqueda full-text
export const useEHRDocumentSearch = (query: string) => {
  return useQuery({
    queryKey: ['ehr-documents-search', query],
    queryFn: async (): Promise<Document[]> => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('ehr_document_storage')
        .select('*')
        .textSearch('document_content_text', query);

      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para crear documento
export const useEHRDocumentMutation = () => {
  return useMutation({
    mutationFn: async (doc: Partial<Document>) => {
      const { data, error } = await supabase
        .from('ehr_document_storage')
        .insert([doc])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
};

