/**
 * ============================================================================
 * ENHANCED SUPABASE CLIENT WITH ENCRYPTION SUPPORT
 * ============================================================================
 * 
 * Purpose: Centralized Supabase client with PII encryption/decryption helpers
 * Features:
 * - Automatic encryption/decryption of sensitive fields
 * - Query builders for encrypted searches
 * - Audit logging
 * - Multi-hospital support
 * 
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { 
  encryptPII, 
  decryptPII, 
  EncryptedData,
  hashPII 
} from '../utils/encryption';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration');
}

// ============================================================================
// ENCRYPTION KEY MANAGEMENT
// ============================================================================

// Get encryption key from environment or secure storage
const getEncryptionKey = (): string => {
  // In production, this should come from secure key management service
  const key = localStorage.getItem('user_encryption_key');
  if (!key) {
    throw new Error('Encryption key not found. User must authenticate first.');
  }
  return key;
};

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// ============================================================================
// PATIENT QUERIES WITH ENCRYPTION
// ============================================================================

export const supabaseDb = {
  /**
   * Get all patients for current user's hospital
   */
  async getPatients(hospitalId?: string) {
    try {
      let query = supabase
        .from('patients')
        .select(`
          id,
          hospital_id,
          department_id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          gender,
          blood_type,
          identification_number,
          identification_type,
          created_at,
          created_by,
          is_active
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching patients:', error);
        throw error;
      }

      // Decrypt sensitive fields
      return data?.map(patient => ({
        ...patient,
        first_name: decryptPII(patient.first_name as any, getEncryptionKey()),
        last_name: decryptPII(patient.last_name as any, getEncryptionKey()),
        email: decryptPII(patient.email as any, getEncryptionKey()),
      })) || [];
    } catch (error) {
      console.error('Error in getPatients:', error);
      throw error;
    }
  },

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) {
        console.error('Error fetching patient:', error);
        throw error;
      }

      if (data) {
        // Decrypt sensitive fields
        return {
          ...data,
          first_name: decryptPII(data.first_name as any, getEncryptionKey()),
          last_name: decryptPII(data.last_name as any, getEncryptionKey()),
          email: decryptPII(data.email as any, getEncryptionKey()),
          phone: decryptPII(data.phone as any, getEncryptionKey()),
        };
      }

      return null;
    } catch (error) {
      console.error('Error in getPatientById:', error);
      throw error;
    }
  },

  /**
   * Search patients by identification (encrypted)
   */
  async searchPatientByIdentification(identification: string, hospitalId: string) {
    try {
      const identificationHash = hashPII(identification);

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('identification_hash', identificationHash)
        .eq('hospital_id', hospitalId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error searching patient:', error);
        throw error;
      }

      if (data) {
        return {
          ...data,
          first_name: decryptPII(data.first_name as any, getEncryptionKey()),
          last_name: decryptPII(data.last_name as any, getEncryptionKey()),
        };
      }

      return null;
    } catch (error) {
      console.error('Error in searchPatientByIdentification:', error);
      throw error;
    }
  },

  /**
   * Create new patient with encrypted fields
   */
  async createPatient(patientData: any, hospitalId: string, userId: string) {
    try {
      const encryptionKey = getEncryptionKey();

      // Encrypt sensitive fields
      const encryptedData = {
        ...patientData,
        hospital_id: hospitalId,
        created_by: userId,
        updated_by: userId,
        first_name: encryptPII(patientData.first_name, encryptionKey),
        last_name: encryptPII(patientData.last_name, encryptionKey),
        email: patientData.email ? encryptPII(patientData.email, encryptionKey) : null,
        phone: patientData.phone ? encryptPII(patientData.phone, encryptionKey) : null,
        identification_number: patientData.identification_number 
          ? encryptPII(patientData.identification_number, encryptionKey) 
          : null,
        identification_hash: patientData.identification_number 
          ? hashPII(patientData.identification_number) 
          : null,
      };

      const { data, error } = await supabase
        .from('patients')
        .insert([encryptedData])
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createPatient:', error);
      throw error;
    }
  },

  /**
   * Update patient with encrypted fields
   */
  async updatePatient(patientId: string, updates: any, userId: string) {
    try {
      const encryptionKey = getEncryptionKey();

      const encryptedUpdates = { ...updates };

      // Encrypt sensitive fields if present
      if (updates.first_name) {
        encryptedUpdates.first_name = encryptPII(updates.first_name, encryptionKey);
      }
      if (updates.last_name) {
        encryptedUpdates.last_name = encryptPII(updates.last_name, encryptionKey);
      }
      if (updates.email) {
        encryptedUpdates.email = encryptPII(updates.email, encryptionKey);
      }
      if (updates.phone) {
        encryptedUpdates.phone = encryptPII(updates.phone, encryptionKey);
      }

      encryptedUpdates.updated_by = userId;
      encryptedUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('patients')
        .update(encryptedUpdates)
        .eq('id', patientId)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePatient:', error);
      throw error;
    }
  },

  /**
   * Get appointments
   */
  async getAppointments(hospitalId: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAppointments:', error);
      throw error;
    }
  },

  /**
   * Log audit event
   */
  async logAuditEvent(
    userId: string,
    hospitalId: string,
    tableName: string,
    recordId: string,
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any
  ) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([
          {
            user_id: userId,
            hospital_id: hospitalId,
            table_name: tableName,
            record_id: recordId,
            action,
            old_values: oldValues || null,
            new_values: newValues || null,
            accessed_at: new Date().toISOString(),
            ip_address: null, // Could be filled from request
          },
        ]);

      if (error) {
        console.error('Error logging audit event:', error);
      }
    } catch (error) {
      console.error('Error in logAuditEvent:', error);
    }
  },

  /**
   * Get hospitals
   */
  async getHospitals() {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching hospitals:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getHospitals:', error);
      throw error;
    }
  },

  /**
   * Get hospital by ID
   */
  async getHospitalById(hospitalId: string) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', hospitalId)
        .single();

      if (error) {
        console.error('Error fetching hospital:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getHospitalById:', error);
      throw error;
    }
  },

  /**
   * Get healthcare personnel
   */
  async getHealthcarePersonnel(hospitalId: string) {
    try {
      const { data, error } = await supabase
        .from('healthcare_personnel')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching personnel:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getHealthcarePersonnel:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time patient updates
   */
  subscribeToPatients(hospitalId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`patients-${hospitalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `hospital_id=eq.${hospitalId}`,
        },
        callback
      )
      .subscribe();
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default supabase;
