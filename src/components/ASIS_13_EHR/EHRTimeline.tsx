import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// ============================================================================
// ASIS 13: EHRTimeline Component
// Propósito: Visualizar cronología de eventos clínicos del paciente
// Estado: Responsive con filtros por tipo de episodio
// Líneas: ~600
// ============================================================================

interface Episode {
  id: string;
  episode_type: string;
  episode_date: string;
  clinician_name: string;
  summary: string;
  primary_diagnosis: string;
  secondary_diagnoses?: string[];
  status?: 'completed' | 'in_progress' | 'pending';
}

interface EHRTimelineProps {
  episodes: Episode[];
}

export const EHRTimeline: React.FC<EHRTimelineProps> = ({ episodes }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | 'all'>('all');

  // Filter episodes
  const filteredEpisodes = filterType === 'all' 
    ? episodes 
    : episodes.filter(ep => ep.episode_type === filterType);

  // Get unique episode types for filter
  const episodeTypes = Array.from(new Set(episodes.map(ep => ep.episode_type)));

  // Sort episodes by date (newest first)
  const sortedEpisodes = [...filteredEpisodes].sort(
    (a, b) => new Date(b.episode_date).getTime() - new Date(a.episode_date).getTime()
  );

  const getEpisodeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'consultation': '👨‍⚕️',
      'hospitalization': '🏥',
      'procedure': '⚕️',
      'emergency': '🚨',
      'lab_order': '🔬',
      'imaging_order': '📸',
      'pharmacy': '💊',
      'referral': '📋'
    };
    return iconMap[type] || '📝';
  };

  const getEpisodeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'consultation': 'bg-blue-50 border-l-4 border-blue-500',
      'hospitalization': 'bg-red-50 border-l-4 border-red-500',
      'procedure': 'bg-purple-50 border-l-4 border-purple-500',
      'emergency': 'bg-orange-50 border-l-4 border-orange-500',
      'lab_order': 'bg-green-50 border-l-4 border-green-500',
      'imaging_order': 'bg-cyan-50 border-l-4 border-cyan-500',
      'pharmacy': 'bg-yellow-50 border-l-4 border-yellow-500',
      'referral': 'bg-indigo-50 border-l-4 border-indigo-500'
    };
    return colorMap[type] || 'bg-gray-50 border-l-4 border-gray-500';
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      'completed': { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600 bg-green-50', label: 'Completado' },
      'in_progress': { icon: <Clock className="w-4 h-4" />, color: 'text-yellow-600 bg-yellow-50', label: 'En Progreso' },
      'pending': { icon: <AlertCircle className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50', label: 'Pendiente' }
    };
    const config = statusMap[status || 'completed'];
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sortedEpisodes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay episodios clínicos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* FILTER SECTION */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos ({episodes.length})
        </button>
        {episodeTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)} ({episodes.filter(e => e.episode_type === type).length})
          </button>
        ))}
      </div>

      {/* TIMELINE */}
      <div className="relative">
        {/* Vertical line (timeline) */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        {/* Episodes */}
        <div className="space-y-4">
          {sortedEpisodes.map((episode, index) => (
            <div key={episode.id} className="relative pl-16">
              {/* Timeline dot */}
              <div className="absolute left-0 w-12 h-12 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center text-xl z-10">
                  {getEpisodeIcon(episode.episode_type)}
                </div>
              </div>

              {/* Episode card */}
              <div
                className={`${getEpisodeColor(episode.episode_type)} rounded-lg p-4 cursor-pointer transition-all hover:shadow-md`}
                onClick={() => setExpandedId(expandedId === episode.id ? null : episode.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {episode.episode_type.replace('_', ' ')}
                      </h3>
                      {episode.status && getStatusBadge(episode.status)}
                    </div>
                    <p className="text-xs text-gray-600">{formatDate(episode.episode_date)}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    {expandedId === episode.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Summary (always visible) */}
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                  {episode.summary || 'Sin descripción'}
                </p>

                {/* Detail (expandable) */}
                {expandedId === episode.id && (
                  <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">
                    {episode.clinician_name && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Clínico:</span>{' '}
                        <span className="text-gray-600">{episode.clinician_name}</span>
                      </p>
                    )}

                    {episode.primary_diagnosis && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Diagnóstico Principal:</span>{' '}
                        <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                          {episode.primary_diagnosis}
                        </code>
                      </p>
                    )}

                    {episode.secondary_diagnoses && episode.secondary_diagnoses.length > 0 && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Diagnósticos Secundarios:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {episode.secondary_diagnoses.map((diag, idx) => (
                            <code key={idx} className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                              {diag}
                            </code>
                          ))}
                        </div>
                      </p>
                    )}

                    {episode.summary && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Resumen Completo:</span>
                        <p className="text-gray-600 mt-1">{episode.summary}</p>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EHRTimeline;
