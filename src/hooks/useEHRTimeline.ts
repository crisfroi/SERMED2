import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';

// ============================================================================
// ASIS 13: useEHRTimeline Hook
// PropÃ³sito: Gestionar timeline de episodios clÃ­nicos
// LÃ­neas: ~350
// ============================================================================

interface TimelineEpisode {
  id: string;
  episode_type: string;
  episode_date: string;
  clinician_name: string;
  summary: string;
  primary_diagnosis: string;
  secondary_diagnoses: string[];
  status: string;
  sequence_number: number;
}

interface TimelineFilter {
  episodeTypes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  diagnosis?: string;
}

export function useEHRTimeline(erhId: string | undefined, filter?: TimelineFilter) {
  // Fetch episodes with filtering
  const episodesQuery = useQuery({
    queryKey: ['ehr-timeline', erhId, filter],
    queryFn: async () => {
      if (!erhId) return [];

      let query = supabase
        .from('ehr_episode_links')
        .select('*')
        .eq('ehr_id', erhId)
        .order('episode_date', { ascending: false });

      // Apply type filter
      if (filter?.episodeTypes && filter.episodeTypes.length > 0) {
        query = query.in('episode_type', filter.episodeTypes);
      }

      // Apply date range filter
      if (filter?.dateRange) {
        query = query
          .gte('episode_date', filter.dateRange.start)
          .lte('episode_date', filter.dateRange.end);
      }

      // Apply diagnosis filter
      if (filter?.diagnosis) {
        query = query.or(`primary_diagnosis.eq.${filter.diagnosis},secondary_diagnoses.contains.[${filter.diagnosis}]`);
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;
      return (data || []) as TimelineEpisode[];
    },
    enabled: !!erhId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get unique episode types from current data
  const episodeTypes = (() => {
    if (!episodesQuery.data) return [];
    return Array.from(new Set(episodesQuery.data.map(ep => ep.episode_type)));
  })();

  // Get episode statistics
  const stats = (() => {
    if (!episodesQuery.data) return null;

    const episodes = episodesQuery.data;
    const episodeMap: Record<string, number> = {};
    episodes.forEach(ep => {
      episodeMap[ep.episode_type] = (episodeMap[ep.episode_type] || 0) + 1;
    });

    return {
      totalEpisodes: episodes.length,
      byType: episodeMap,
      lastEpisode: episodes[0]?.episode_date,
      oldestEpisode: episodes[episodes.length - 1]?.episode_date,
      episodeTypes: Object.keys(episodeMap)
    };
  })();

  // Helper: Get last N episodes
  const getLastEpisodes = (n: number): TimelineEpisode[] => {
    return (episodesQuery.data || []).slice(0, n);
  };

  // Helper: Get episodes by type
  const getEpisodesByType = (type: string): TimelineEpisode[] => {
    return (episodesQuery.data || []).filter(ep => ep.episode_type === type);
  };

  // Helper: Get Recent days episodes
  const getRecentEpisodes = (days: number): TimelineEpisode[] => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return (episodesQuery.data || []).filter(ep => {
      const episodeDate = new Date(ep.episode_date);
      return episodeDate >= cutoff;
    });
  };

  // Helper: Get episode by ID
  const getEpisodeById = (id: string): TimelineEpisode | undefined => {
    return (episodesQuery.data || []).find(ep => ep.id === id);
  };

  // Helper: Get diagnoses summary
  const getDiagnosesSummary = (): Record<string, number> => {
    const diagMap: Record<string, number> = {};

    (episodesQuery.data || []).forEach(ep => {
      if (ep.primary_diagnosis) {
        diagMap[ep.primary_diagnosis] = (diagMap[ep.primary_diagnosis] || 0) + 1;
      }
      if (ep.secondary_diagnoses) {
        ep.secondary_diagnoses.forEach(diag => {
          diagMap[diag] = (diagMap[diag] || 0) + 1;
        });
      }
    });

    return diagMap;
  };

  // Helper: Get clinicians involved
  const getCliniciansSummary = (): Record<string, number> => {
    const clinMap: Record<string, number> = {};

    (episodesQuery.data || []).forEach(ep => {
      if (ep.clinician_name) {
        clinMap[ep.clinician_name] = (clinMap[ep.clinician_name] || 0) + 1;
      }
    });

    return clinMap;
  };

  // Helper: Get timeline (formatted for display)
  const getFormattedTimeline = (): TimelineEpisode[] => {
    return episodesQuery.data || [];
  };

  // Helper: Find gaps in care (episodes with more than 90 days between)
  const findCareGaps = (min_days: number = 90): Array<{ start: TimelineEpisode; end: TimelineEpisode; gap_days: number }> => {
    const episodes = episodesQuery.data || [];
    if (episodes.length < 2) return [];

    const gaps: Array<{ start: TimelineEpisode; end: TimelineEpisode; gap_days: number }> = [];

    for (let i = 0; i < episodes.length - 1; i++) {
      const current = new Date(episodes[i].episode_date);
      const next = new Date(episodes[i + 1].episode_date);
      const gap_days = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

      if (gap_days >= min_days) {
        gaps.push({
          start: episodes[i],
          end: episodes[i + 1],
          gap_days
        });
      }
    }

    return gaps;
  };

  return {
    episodes: episodesQuery.data || [],
    isLoading: episodesQuery.isLoading,
    error: episodesQuery.error,
    refetch: episodesQuery.refetch,
    episodeTypes,
    stats,
    
    // Helper methods
    getLastEpisodes,
    getEpisodesByType,
    getRecentEpisodes,
    getEpisodeById,
    getDiagnosesSummary,
    getCliniciansSummary,
    getFormattedTimeline,
    findCareGaps
  };
}

