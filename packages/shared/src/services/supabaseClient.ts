/**
 * @sermed2/shared/services/supabaseClient.ts
 * Cliente Supabase centralizado
 */

import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ Helper Functions ============

export const supabaseDb = {
  /**
   * Obtener pacientes
   */
  async getPatients(limit = 50) {
    return supabase
      .from('electronic_health_record')
      .select('*')
      .limit(limit);
  },

  /**
   * Obtener citas
   */
  async getAppointments(patientId?: string) {
    let query = supabase.from('appointments').select('*');
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    return query;
  },

  /**
   * Query genérica
   */
  async query(table: string, select = '*', filters?: Record<string, any>) {
    let query = supabase.from(table).select(select);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    return query;
  },

  /**
   * Crear registro
   */
  async create(table: string, data: Record<string, any>) {
    return supabase.from(table).insert(data).select();
  },

  /**
   * Actualizar registro
   */
  async update(table: string, id: string, data: Record<string, any>) {
    return supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
  },

  /**
   * Eliminar registro
   */
  async delete(table: string, id: string) {
    return supabase.from(table).delete().eq('id', id);
  },
};

// ============ Auth Functions ============

export const supabaseAuth = {
  /**
   * Obtener sesión actual
   */
  async getSession() {
    return supabase.auth.getSession();
  },

  /**
   * Sign out
   */
  async signOut() {
    return supabase.auth.signOut();
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user;
  },
};

export default supabase;
