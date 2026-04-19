import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import type { Database } from '@/types/supabase';

type DocumentType = 'lab_result' | 'prescription' | 'discharge' | 'imaging' | 'report' | 'consultation' | 'procedure' | 'consent';

interface UploadParams {
  ehrId: string;
  documentType: DocumentType;
  file: File;
  documentTitle?: string;
  description?: string;
  signedBy?: string;
  episodeId?: string;
}

export const useEHRDocumentUpload = () => {
  return useMutation({
    mutationFn: async (params: UploadParams) => {
      const { ehrId, documentType, file, documentTitle, description, signedBy, episodeId } = params;

      // 1. Upload file to Supabase Storage
      const fileName = `${ehrId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ehr-documents')
        .upload(fileName, file);

      if (uploadError || !uploadData) throw uploadError;

      // 2. Read file content for indexing (text files)
      let contentText = '';
      if (file.type.startsWith('text/') || file.type === 'application/pdf') {
        // For PDFs, use edge function to extract text
        // For now, just get first 5000 chars
        try {
          contentText = await file.text();
        } catch (e) {
          contentText = ''; // Binary file, skip indexing
        }
      }

      // 3. Create database record
      const { data: docData, error: dbError } = await supabase
        .from('ehr_document_storage')
        .insert([
          {
            ehr_id: ehrId,
            episode_id: episodeId || null,
            document_type: documentType,
            document_title: documentTitle || file.name,
            document_description: description,
            file_path: uploadData.path,
            file_size_bytes: file.size,
            file_mime_type: file.type,
            document_content_text: contentText,
            signed_by: signedBy || null,
            signature_valid: !!signedBy,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      return docData;
    },
  });
};

// Hook para descargar documento
export const useEHRDocumentDownload = (filePath: string) => {
  return async () => {
    const { data, error } = await supabase.storage
      .from('ehr-documents')
      .download(filePath);

    if (error) throw error;

    // Create blob URL for download
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || 'document';
    a.click();
    URL.revokeObjectURL(url);
  };
};

// Hook para eliminar documento
export const useEHRDocumentDelete = () => {
  return useMutation({
    mutationFn: async ({ documentId, filePath }: { documentId: string; filePath: string }) => {
      // 1. Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('ehr-documents')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // 2. Delete from database
      const { error: dbError } = await supabase
        .from('ehr_document_storage')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;
    },
  });
};

