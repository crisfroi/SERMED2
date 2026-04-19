import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';

export interface EncryptionKey {
  id: string;
  key_name: string;
  key_version: number;
  algorithm: 'AES-256-GCM' | 'RSA-4096' | 'ChaCha20-Poly1305';
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_by: string;
}

export interface EncryptedDocument {
  document_id: string;
  encrypted_content: string;
  encryption_key_id: string;
  initialization_vector: string;
  authentication_tag: string;
  encrypted_at: string;
}

interface EncryptionStatus {
  isEncrypted: boolean;
  keyId: string | null;
  algorithm: string | null;
  encryptedAt: string | null;
  expiresAt: string | null;
  keyIsActive: boolean;
}

export const useDocumentEncryption = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate new encryption key (in production, use proper key management service)
  const generateEncryptionKey = useCallback(
    async (
      keyName: string,
      algorithm: 'AES-256-GCM' | 'RSA-4096' | 'ChaCha20-Poly1305' = 'AES-256-GCM',
      expiryDays: number = 365
    ): Promise<EncryptionKey | null> => {
      try {
        setLoading(true);
        setError(null);

        // In production, use AWS KMS, Azure Key Vault, or HashiCorp Vault
        const keyContent = btoa(Math.random().toString(36).substring(2)); // Demo: base64 random

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        const { data, error: err } = await supabase
          .from('ehr_encryption_keys')
          .insert({
            key_name: keyName,
            key_version: 1,
            algorithm,
            expires_at: expiresAt.toISOString(),
            is_active: true,
            created_by: 'system', // Would be actual user ID
          })
          .select()
          .single();

        if (err) throw err;
        return data as EncryptionKey;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate encryption key';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Encrypt document content
  const encryptDocument = useCallback(
    async (
      documentId: string,
      content: string,
      keyId: string
    ): Promise<EncryptedDocument | null> => {
      try {
        setLoading(true);
        setError(null);

        // Simple XOR encryption for demo (use proper crypto library in production)
        const iv = btoa(Math.random().toString(36).substring(2)).substring(0, 16);
        const encryptedContent = btoa(
          content
            .split('')
            .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ iv.charCodeAt(i % iv.length)))
            .join('')
        );

        const authTag = btoa(
          (Math.random().toString(36) + Math.random().toString(36)).substring(2, 15)
        );

        const { data, error: err } = await supabase
          .from('ehr_document_encryption')
          .insert({
            document_id: documentId,
            encrypted_content: encryptedContent,
            encryption_key_id: keyId,
            initialization_vector: iv,
            authentication_tag: authTag,
            encrypted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (err) throw err;

        // Update document status
        await supabase
          .from('ehr_documents')
          .update({ encryption_status: 'encrypted' })
          .eq('id', documentId);

        return data as EncryptedDocument;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to encrypt document';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Decrypt document content
  const decryptDocument = useCallback(
    async (
      documentId: string,
      encryptedContent: string,
      iv: string
    ): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);

        // Simple XOR decryption for demo
        const decrypted = atob(encryptedContent)
          .split('')
          .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ iv.charCodeAt(i % iv.length)))
          .join('');

        // Log decryption access for audit
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'document',
          entity_id: documentId,
          action: 'decrypt',
          old_value: null,
          new_value: null,
          changed_by: 'system',
          changed_at: new Date().toISOString(),
          ip_address: 'local',
          description: 'Document decrypted for viewing',
        });

        return decrypted;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to decrypt document';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get encryption status
  const getEncryptionStatus = useCallback(
    async (documentId: string): Promise<EncryptionStatus | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data: encData, error: encErr } = await supabase
          .from('ehr_document_encryption')
          .select('*, ehr_encryption_keys(*)')
          .eq('document_id', documentId)
          .order('encrypted_at', { ascending: false })
          .limit(1)
          .single();

        if (encErr && encErr.code !== 'PGRST116') throw encErr; // PGRST116 = no rows

        if (!encData) {
          return {
            isEncrypted: false,
            keyId: null,
            algorithm: null,
            encryptedAt: null,
            expiresAt: null,
            keyIsActive: false,
          };
        }

        return {
          isEncrypted: true,
          keyId: encData.encryption_key_id,
          algorithm: encData.ehr_encryption_keys?.algorithm || null,
          encryptedAt: encData.encrypted_at,
          expiresAt: encData.ehr_encryption_keys?.expires_at || null,
          keyIsActive: encData.ehr_encryption_keys?.is_active || false,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get encryption status';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-encrypt document with new key
  const reEncryptDocument = useCallback(
    async (
      documentId: string,
      decryptedContent: string,
      newKeyId: string
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        // Delete old encryption record
        const { error: delErr } = await supabase
          .from('ehr_document_encryption')
          .delete()
          .eq('document_id', documentId);

        if (delErr) throw delErr;

        // Encrypt with new key
        await encryptDocument(documentId, decryptedContent, newKeyId);

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to re-encrypt document';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [encryptDocument]
  );

  // Rotate encryption keys
  const rotateEncryptionKey = useCallback(
    async (oldKeyId: string): Promise<EncryptionKey | null> => {
      try {
        setLoading(true);
        setError(null);

        // Get old key to find algorithm
        const { data: oldKey, error: fetchErr } = await supabase
          .from('ehr_encryption_keys')
          .select('*')
          .eq('id', oldKeyId)
          .single();

        if (fetchErr) throw fetchErr;

        // Deactivate old key
        await supabase
          .from('ehr_encryption_keys')
          .update({ is_active: false })
          .eq('id', oldKeyId);

        // Create new key with incremented version
        const newKey = await generateEncryptionKey(
          `${oldKey.key_name}_rotated`,
          oldKey.algorithm,
          365
        );

        return newKey;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to rotate encryption key';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [generateEncryptionKey]
  );

  // Get active encryption keys
  const getActiveEncryptionKeys = useCallback(async (): Promise<EncryptionKey[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('ehr_encryption_keys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (err) throw err;
      return (data || []) as EncryptionKey[];
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get active encryption keys';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateEncryptionKey,
    encryptDocument,
    decryptDocument,
    getEncryptionStatus,
    reEncryptDocument,
    rotateEncryptionKey,
    getActiveEncryptionKeys,
  };
};

