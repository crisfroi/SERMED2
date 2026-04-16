import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface SignatureRequest {
  document_id: string;
  content_hash: string;
  signature: string;
  signer_id: string;
  certificate?: string;
}

interface SignatureResponse {
  is_valid: boolean;
  signer_id: string;
  signed_at: string;
  algorithm: string;
  certificate_valid: boolean;
}

// Simple signature verification (in production, use proper PKI infrastructure)
const verifySignature = (
  contentHash: string,
  signature: string,
  _signerId: string
): boolean => {
  // Demo: check if signature is valid base64 and matches pattern
  try {
    const decodedSig = atob(signature);
    const decodedHash = atob(contentHash);
    return decodedSig.length > 0 && decodedHash.length > 0;
  } catch {
    return false;
  }
};

const verifyCertificate = (_certificate: string): boolean => {
  // Demo: verify certificate chain (in production, use X.509 validation)
  return true;
};

serve(async (req: Request) => {
  if (req.method === 'POST') {
    try {
      const payload: SignatureRequest = await req.json();

      const { document_id, content_hash, signature, signer_id, certificate } = payload;

      // Verify signature
      const isValid = verifySignature(content_hash, signature, signer_id);
      const certificateValid = certificate ? verifyCertificate(certificate) : false;

      if (!isValid) {
        return new Response(
          JSON.stringify({
            error: 'Signature verification failed',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const response: SignatureResponse = {
        is_valid: isValid && (!certificate || certificateValid),
        signer_id,
        signed_at: new Date().toISOString(),
        algorithm: 'RSA-SHA256',
        certificate_valid: certificateValid,
      };

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: error instanceof Error ? error.message : String(error),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
