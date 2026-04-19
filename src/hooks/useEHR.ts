import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import type { Database } from '@/types/supabase';

type EHR = Database['public']['Tables']['electronic_health_record']['Row'];

interface UseEHROptions {
  enabled?: boolean;
}

export const useEHR = (patientId: string | null, options: UseEHROptions = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['ehr', patientId],
    queryFn: async (): Promise<EHR | null> => {
      if (!patientId) return null;

      const { data, error } = await supabase
        .from('electronic_health_record')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: enabled && !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para crear/actualizar EHR
export const useEHRMutation = () => {
  return useMutation({
    mutationFn: async (ehr: Partial<EHR>) => {
      const { data, error } = await supabase
        .from('electronic_health_record')
        .upsert([ehr])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
};

