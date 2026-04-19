/**
 * ============================================================================
 * ENCRYPTION UTILITIES FOR PII (Personally Identifiable Information)
 * ============================================================================
 * 
 * Purpose: Encrypt/decrypt sensitive patient data (names, emails, DOB, DNI, etc.)
 * Standard: AES-256-GCM (Authenticated Encryption)
 * 
 * Fields to Encrypt:
 * - first_name, last_name
 * - email, phone
 * - date_of_birth
 * - identification_number (DNI/Pasaporte)
 * - address, emergency_contacts
 * 
 * ============================================================================
 */

import crypto from 'crypto';

/**
 * ENCRYPTION CONFIGURATION
 */
export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'aes-256-gcm',
  IV_LENGTH: 16, // 128 bits
  AUTH_TAG_LENGTH: 16, // 128 bits
  ENCODING: 'hex' as BufferEncoding,
  SALT_LENGTH: 32, // For key derivation
  KEY_LENGTH: 32, // 256 bits for AES-256
};

/**
 * Interface para configuración de encriptación
 */
export interface EncryptionConfig {
  key: string; // Hex-encoded key
  derivedKey?: crypto.KeyObject;
}

export interface EncryptedData {
  iv: string; // Hex-encoded initialization vector
  encryptedData: string; // Hex-encoded encrypted content
  authTag: string; // Hex-encoded authentication tag
  salt?: string; // Hex-encoded salt (if using PBKDF2)
}

/**
 * ============================================================================
 * MAIN ENCRYPTION FUNCTIONS
 * ============================================================================
 */

/**
 * Encrypt sensitive PII data
 * 
 * @param plaintext - The data to encrypt
 * @param encryptionKey - The encryption key (hex-encoded or raw)
 * @returns Encrypted data object with IV, encrypted content, and auth tag
 * 
 * @example
 * const encrypted = encryptPII("John Doe", encryptionKey);
 * // Returns: { iv: "...", encryptedData: "...", authTag: "..." }
 */
export function encryptPII(plaintext: string, encryptionKey: string): EncryptedData {
  try {
    // Generate random IV for this encryption
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);

    // Convert key from hex to Buffer if needed
    const keyBuffer = Buffer.from(encryptionKey, ENCRYPTION_CONFIG.ENCODING);
    
    // Validate key length
    if (keyBuffer.length !== ENCRYPTION_CONFIG.KEY_LENGTH) {
      throw new Error(
        `Invalid key length: ${keyBuffer.length}. Expected: ${ENCRYPTION_CONFIG.KEY_LENGTH}`
      );
    }

    // Create cipher
    const cipher = crypto.createCipheriv(
      ENCRYPTION_CONFIG.ALGORITHM,
      keyBuffer,
      iv
    );

    // Encrypt the plaintext
    let encryptedContent = cipher.update(plaintext, 'utf8', 'hex');
    encryptedContent += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString(ENCRYPTION_CONFIG.ENCODING),
      encryptedData: encryptedContent,
      authTag: authTag.toString(ENCRYPTION_CONFIG.ENCODING),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt PII: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt PII data
 * 
 * @param encrypted - The encrypted data object
 * @param encryptionKey - The encryption key (must match the one used for encryption)
 * @returns The decrypted plaintext
 * 
 * @example
 * const plaintext = decryptPII(encryptedData, encryptionKey);
 * // Returns: "John Doe"
 */
export function decryptPII(encrypted: EncryptedData, encryptionKey: string): string {
  try {
    // Convert from hex strings to Buffers
    const iv = Buffer.from(encrypted.iv, ENCRYPTION_CONFIG.ENCODING);
    const encryptedDataBuffer = Buffer.from(encrypted.encryptedData, ENCRYPTION_CONFIG.ENCODING);
    const authTag = Buffer.from(encrypted.authTag, ENCRYPTION_CONFIG.ENCODING);
    const keyBuffer = Buffer.from(encryptionKey, ENCRYPTION_CONFIG.ENCODING);

    // Validate key length
    if (keyBuffer.length !== ENCRYPTION_CONFIG.KEY_LENGTH) {
      throw new Error(
        `Invalid key length: ${keyBuffer.length}. Expected: ${ENCRYPTION_CONFIG.KEY_LENGTH}`
      );
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_CONFIG.ALGORITHM,
      keyBuffer,
      iv
    );

    // Set authentication tag for verification
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encryptedDataBuffer, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt PII: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * ============================================================================
 * KEY MANAGEMENT FUNCTIONS
 * ============================================================================
 */

/**
 * Generate a new random encryption key
 * 
 * @returns Hex-encoded key string
 * 
 * @example
 * const key = generateEncryptionKey();
 * // Returns: "a1b2c3d4..." (64 hex characters for AES-256)
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(ENCRYPTION_CONFIG.KEY_LENGTH);
  return key.toString(ENCRYPTION_CONFIG.ENCODING);
}

/**
 * Generate key from password using PBKDF2
 * 
 * @param password - The password to derive key from
 * @param salt - Optional salt (if not provided, a random one is generated)
 * @returns Object containing derived key and salt
 * 
 * @example
 * const { key, salt } = generateKeyFromPassword("myPassword123");
 * // Use key for encryption and store salt with encrypted data
 */
export function generateKeyFromPassword(
  password: string,
  salt?: string
): { key: string; salt: string } {
  try {
    const saltBuffer = salt
      ? Buffer.from(salt, ENCRYPTION_CONFIG.ENCODING)
      : crypto.randomBytes(ENCRYPTION_CONFIG.SALT_LENGTH);

    const derivedKey = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      100000, // iterations (NIST recommendation)
      ENCRYPTION_CONFIG.KEY_LENGTH,
      'sha256' // digest algorithm
    );

    return {
      key: derivedKey.toString(ENCRYPTION_CONFIG.ENCODING),
      salt: saltBuffer.toString(ENCRYPTION_CONFIG.ENCODING),
    };
  } catch (error) {
    console.error('Key derivation error:', error);
    throw new Error(`Failed to derive key from password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * ============================================================================
 * KEY ROTATION FUNCTIONS
 * ============================================================================
 */

/**
 * Rotate encryption key (decrypt with old key, re-encrypt with new key)
 * 
 * This function should be called periodically to rotate encryption keys
 * for compliance and security best practices.
 * 
 * @param encryptedData - Data encrypted with old key
 * @param oldKey - The old encryption key
 * @param newKey - The new encryption key
 * @returns Re-encrypted data with new key
 * 
 * @example
 * const reencrypted = rotateEncryptionKey(encrypted, oldKey, newKey);
 * // Use reencrypted data for update
 */
export function rotateEncryptionKey(
  encryptedData: EncryptedData,
  oldKey: string,
  newKey: string
): EncryptedData {
  try {
    // Decrypt with old key
    const plaintext = decryptPII(encryptedData, oldKey);

    // Re-encrypt with new key
    const reencrypted = encryptPII(plaintext, newKey);

    return reencrypted;
  } catch (error) {
    console.error('Key rotation error:', error);
    throw new Error(`Failed to rotate encryption key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

/**
 * Check if encryption key is valid format
 * 
 * @param key - The key to validate
 * @returns true if valid, false otherwise
 */
export function isValidEncryptionKey(key: string): boolean {
  try {
    const keyBuffer = Buffer.from(key, ENCRYPTION_CONFIG.ENCODING);
    return keyBuffer.length === ENCRYPTION_CONFIG.KEY_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Create a hash of PII for comparison (for duplicate detection)
 * without storing the plaintext
 * 
 * Use case: Find duplicate patients by email without decrypting
 * 
 * @param plaintext - The plaintext to hash
 * @returns SHA-256 hash in hex format
 * 
 * @example
 * const emailHash = hashPII("john@example.com");
 * // Store hash in DB for duplicate detection
 */
export function hashPII(plaintext: string): string {
  return crypto
    .createHash('sha256')
    .update(plaintext)
    .digest(ENCRYPTION_CONFIG.ENCODING);
}

/**
 * Mask sensitive data for display (show first/last 2 chars)
 * 
 * Use case: Display encrypted data in logs without revealing full value
 * 
 * @param data - The data to mask
 * @param visibleChars - Number of chars to show at start/end (default: 2)
 * @returns Masked string
 * 
 * @example
 * maskSensitiveData("john@example.com", 2);
 * // Returns: "jo**@ex***.com"
 */
export function maskSensitiveData(data: string, visibleChars: number = 2): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);

  return `${start}${masked}${end}`;
}

/**
 * ============================================================================
 * AUDIT & LOGGING FUNCTIONS
 * ============================================================================
 */

/**
 * Create audit log entry for encryption/decryption operations
 * 
 * @param operation - 'encrypt' or 'decrypt'
 * @param fieldName - Name of the field being encrypted
 * @param userId - User performing the operation
 * @param result - 'success' or 'failure'
 * @param reason - Optional reason if failure
 * 
 * @example
 * createEncryptionAuditLog('encrypt', 'email', userId, 'success');
 */
export function createEncryptionAuditLog(
  operation: 'encrypt' | 'decrypt',
  fieldName: string,
  userId: string,
  result: 'success' | 'failure',
  reason?: string
): object {
  return {
    timestamp: new Date().toISOString(),
    operation,
    fieldName,
    userId,
    result,
    reason: reason || null,
    ipAddress: process.env.CLIENT_IP || 'unknown',
  };
}

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

export default {
  encryptPII,
  decryptPII,
  generateEncryptionKey,
  generateKeyFromPassword,
  rotateEncryptionKey,
  isValidEncryptionKey,
  hashPII,
  maskSensitiveData,
  createEncryptionAuditLog,
  ENCRYPTION_CONFIG,
};
