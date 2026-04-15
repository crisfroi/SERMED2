import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Episode = Database['public']['Tables']['ehr_episode_links']['Row'];
type EpisodeType = 'hospitalization' | 'appointment' | 'consult' | 'procedure' | 'surgery' | 'emergency';

interface UseEHREpisodesOptions {
  episodeType?: EpisodeType;
  enabled?: boolean;
}

export const useEHREpisodes = (ehrId: string | null, options: UseEHREpisodesOptions = {}) => {
  const { episodeType, enabled = true } = options;

  return useQuery({
    queryKey: ['ehr-episodes', ehrId, episodeType],
    queryFn: async (): Promise<Episode[]> => {
      if (!ehrId) return [];

      let query = supabase
        .from('ehr_episode_links')
        .select('*')
        .eq('ehr_id', ehrId)
        .order('episode_date_start', { ascending: false });

      if (episodeType) {
        query = query.eq('episode_type', episodeType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!ehrId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para crear episodio
export const useEHREpisodeMutation = () => {
  return useMutation({
    mutationFn: async (episode: Partial<Episode>) => {
      const { data, error } = await supabase
        .from('ehr_episode_links')
        .insert([episode])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
};
