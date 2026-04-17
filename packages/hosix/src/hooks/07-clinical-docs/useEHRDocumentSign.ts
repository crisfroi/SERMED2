import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SignDocumentParams {
  documentId: string;
  userId: string;
}

/**
 * Sign an EHR document digitally
 * This hook handles the digital signature workflow
 */
export const useEHRDocumentSign = () => {
  return useMutation({
    mutationFn: async (params: SignDocumentParams) => {
      const { documentId, userId } = params;

      // Update document record with signature
      const { data, error } = await supabase
        .from('ehr_document_storage')
        .update({
          signed_by: userId,
          signature_timestamp: new Date().toISOString(),
          signature_valid: true,
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
  });
};

// Hook para validar firma
export const useEHRDocumentVerifySignature = () => {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data, error } = await supabase
        .from('ehr_document_storage')
        .select('signed_by, signature_timestamp, signature_valid')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      return {
        isSigned: !!data.signed_by,
        signedBy: data.signed_by,
        signedAt: data.signature_timestamp,
        isValid: data.signature_valid,
      };
    },
  });
};
