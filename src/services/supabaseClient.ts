import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const supabaseAuth = {
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

export const supabaseDb = {
  // Patient queries
  async getPatients(limit = 50) {
    const { data, error } = await supabase
      .from('electronic_health_record')
      .select('*')
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getPatientById(id: string) {
    const { data, error } = await supabase
      .from('electronic_health_record')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Appointment queries
  async getAppointments(patientId?: string) {
    let query = supabase.from('appointments').select('*');
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Generic query builder
  async query(table: string, select = '*', filters?: Record<string, any>) {
    let query = supabase.from(table).select(select);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};
