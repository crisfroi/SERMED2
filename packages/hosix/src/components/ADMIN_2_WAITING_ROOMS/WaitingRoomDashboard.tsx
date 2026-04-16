// WEEK 12 ADMIN 2: Waiting Rooms
// Component: WaitingRoomDashboard.tsx
// Purpose: Main waiting room display (public screen in hospital)
// Status: Production-ready

import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Users, Tv } from 'lucide-react';

interface QueueEntry {
  id: string;
  queue_number: string;
  patient_name: string;
  priority_level: 'critical' | 'high' | 'normal' | 'low';
  queued_at: string;
  actual_wait_minutes?: number;
  consultation_type: string;
}

interface WaitingStats {
  total_in_queue: number;
  avg_wait_time: number;
  current_being_attended: string | null;
  attending_clinic: string | null;
  attending_clinician: string | null;
  attending_duration_minutes: number | null;
}

interface WaitingRoomDashboardProps {
  roomId: string;
  roomName?: string;
  fullscreen?: boolean;
  autoRefreshSeconds?: number;
}

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return 'bg-red-600 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'normal':
      return 'bg-yellow-400 text-black';
    case 'low':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

const getPriorityIcon = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🟠';
    case 'normal':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
};

export const WaitingRoomDashboard: React.FC<WaitingRoomDashboardProps> = ({
  roomId,
  roomName = 'Waiting Room',
  fullscreen = true,
  autoRefreshSeconds = 3,
}) => {
  const queryClient = useQueryClient();
  const [visibleCount, setVisibleCount] = useState(25);

  // Fetch queue data
  const { data: queueList = [], isLoading: queueLoading } = useQuery<QueueEntry[]>({
    queryKey: ['waiting-queue', roomId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/waiting-rooms/${roomId}/queue`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch queue');
      return response.json();
    },
    refetchInterval: autoRefreshSeconds * 1000,
    staleTime: autoRefreshSeconds * 1000 - 500,
  });

  // Fetch stats
  const { data: stats = null } = useQuery<WaitingStats | null>({
    queryKey: ['waiting-stats', roomId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/waiting-rooms/${roomId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: autoRefreshSeconds * 1000,
    staleTime: autoRefreshSeconds * 1000 - 500,
  });

  // Auto-scroll queue every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const queueContainer = document.getElementById('queue-list');
      if (queueContainer) {
        queueContainer.scrollTop += queueContainer.clientHeight / 5;
        if (queueContainer.scrollTop >= queueContainer.scrollHeight - queueContainer.clientHeight) {
          queueContainer.scrollTop = 0;
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const containerClasses = fullscreen
    ? 'min-h-screen bg-slate-900 text-white p-0 flex flex-col'
    : 'bg-white rounded-lg shadow-lg p-8';

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={`${fullscreen ? 'bg-slate-800 p-6 flex justify-between items-center' : 'pb-4 border-b'}`}>
        <div>
          <h1 className={fullscreen ? 'text-5xl font-bold mb-2' : 'text-3xl font-bold mb-2'}>
            {roomName}
          </h1>
          <p className={fullscreen ? 'text-2xl text-slate-300' : 'text-sm text-gray-500'}>
            {new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
        <div className={`text-center ${fullscreen ? 'bg-green-600 px-6 py-3 rounded' : 'px-4 py-2 bg-green-100 rounded'}`}>
          <p className={fullscreen ? 'text-xl' : 'text-sm'}>ABIERTO</p>
          <p className={fullscreen ? 'text-4xl font-bold' : 'text-2xl font-bold'}>
            {stats?.total_in_queue || 0}
          </p>
        </div>
      </div>

      <div className={fullscreen ? 'flex-1 flex flex-col overflow-hidden p-6 gap-6' : ''}>
        {/* Currently Being Attended */}
        {stats?.current_being_attended && (
          <Card className={fullscreen ? 'bg-slate-800 border-slate-700' : ''}>
            <CardHeader className={fullscreen ? 'bg-slate-700 text-white' : ''}>
              <CardTitle className={fullscreen ? 'text-3xl' : ''}>En Atención Ahora</CardTitle>
            </CardHeader>
            <CardContent className={`pt-6 ${fullscreen ? 'bg-slate-800 text-white' : ''}`}>
              <div className={fullscreen ? 'text-center' : 'text-center'}>
                <div className={fullscreen ? 'text-6xl font-bold text-blue-400 mb-4' : 'text-4xl font-bold text-blue-600 mb-4'}>
                  {stats.current_being_attended}
                </div>
                <div className={fullscreen ? 'text-2xl mb-2' : 'text-lg mb-2'}>
                  {stats.attending_clinic}
                </div>
                <div className={fullscreen ? 'text-xl text-slate-300' : 'text-sm text-gray-500'}>
                  Dr(a). {stats.attending_clinician} • {stats.attending_duration_minutes} minutos
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue Stats */}
        <div className={`grid grid-cols-3 gap-4 ${fullscreen ? '' : 'mb-6'}`}>
          <Card className={fullscreen ? 'bg-slate-800 border-slate-700' : ''}>
            <CardContent className={`pt-6 text-center ${fullscreen ? 'text-white' : ''}`}>
              <div className={fullscreen ? 'text-slate-400 text-xl mb-2' : 'text-gray-500 text-sm mb-2'}>
                Promedio Espera
              </div>
              <div className={fullscreen ? 'text-5xl font-bold text-blue-400' : 'text-3xl font-bold text-blue-600'}>
                {stats?.avg_wait_time || 0}
              </div>
              <div className={fullscreen ? 'text-slate-400 mt-1' : 'text-gray-500 text-xs mt-1'}>
                minutos
              </div>
            </CardContent>
          </Card>

          <Card className={fullscreen ? 'bg-slate-800 border-slate-700' : ''}>
            <CardContent className={`pt-6 text-center ${fullscreen ? 'text-white' : ''}`}>
              <Clock className={fullscreen ? 'h-12 w-12 mx-auto mb-2 text-slate-400' : 'h-8 w-8 mx-auto mb-2 text-gray-400'} />
              <div className={fullscreen ? 'text-slate-400 text-xl mb-2' : 'text-gray-500 text-sm mb-2'}>
                Actualizado
              </div>
              <div className={fullscreen ? 'text-2xl font-bold text-green-400' : 'text-lg font-bold text-green-600'}>
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </CardContent>
          </Card>

          <Card className={fullscreen ? 'bg-slate-800 border-slate-700' : ''}>
            <CardContent className={`pt-6 text-center ${fullscreen ? 'text-white' : ''}`}>
              <Users className={fullscreen ? 'h-12 w-12 mx-auto mb-2 text-slate-400' : 'h-8 w-8 mx-auto mb-2 text-gray-400'} />
              <div className={fullscreen ? 'text-slate-400 text-xl mb-2' : 'text-gray-500 text-sm mb-2'}>
                En Cola
              </div>
              <div className={fullscreen ? 'text-5xl font-bold text-yellow-400' : 'text-3xl font-bold text-yellow-600'}>
                {stats?.total_in_queue || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Queue Display */}
        <div className={`${fullscreen ? 'flex-1 overflow-hidden rounded-lg border-2 border-slate-700 bg-slate-800' : 'bg-gray-50 rounded-lg border p-4 overflow-auto max-h-96'}`}>
          <div
            id="queue-list"
            className={`${fullscreen ? 'h-full overflow-y-auto ps-ps-style' : 'space-y-2'}`}
            style={fullscreen ? { overflow: 'auto', scrollBehavior: 'smooth' } : {}}
          >
            {queueLoading ? (
              <div className={`text-center py-8 ${fullscreen ? 'text-slate-400 text-2xl' : 'text-gray-500'}`}>
                Cargando cola...
              </div>
            ) : queueList.length === 0 ? (
              <div className={`text-center py-8 ${fullscreen ? 'text-green-400 text-3xl' : 'text-green-600 text-lg'}`}>
                ✓ Sin pacientes en espera
              </div>
            ) : (
              queueList.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`${getPriorityColor(entry.priority_level)} p-4 mb-3 rounded-lg ${fullscreen ? 'border-4 border-white' : 'border-2'} ${
                    index < visibleCount ? 'visible' : 'hidden'
                  }`}
                >
                  <div className={fullscreen ? 'text-5xl font-bold mb-2' : 'text-2xl font-bold mb-1'}>
                    {entry.queue_number}
                  </div>
                  <div className={fullscreen ? 'text-3xl font-semibold' : 'text-lg font-semibold'}>
                    {getPriorityIcon(entry.priority_level)} {entry.patient_name}
                  </div>
                  <div className={fullscreen ? 'text-2xl mt-2' : 'text-sm mt-1'}>
                    {entry.consultation_type} • {entry.actual_wait_minutes || 0} min
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legend */}
        <div className={`grid grid-cols-4 gap-4 text-center ${fullscreen ? 'mt-4' : ''}`}>
          <div className="bg-red-600 text-white p-3 rounded">
            <div className={fullscreen ? 'text-xl font-bold' : 'text-sm font-bold'}>🔴 CRÍTICO</div>
          </div>
          <div className="bg-orange-500 text-white p-3 rounded">
            <div className={fullscreen ? 'text-xl font-bold' : 'text-sm font-bold'}>🟠 ALTO</div>
          </div>
          <div className="bg-yellow-400 text-black p-3 rounded">
            <div className={fullscreen ? 'text-xl font-bold' : 'text-sm font-bold'}>🟡 NORMAL</div>
          </div>
          <div className="bg-green-500 text-white p-3 rounded">
            <div className={fullscreen ? 'text-xl font-bold' : 'text-sm font-bold'}>🟢 BAJO</div>
          </div>
        </div>
      </div>

      {/* Footer - Last Update */}
      <div className={`text-center py-2 ${fullscreen ? 'text-slate-500 text-sm' : 'text-gray-400 text-xs'}`}>
        Última actualización: {new Date().toLocaleTimeString('es-ES')}
      </div>
    </div>
  );
};

export default WaitingRoomDashboard;
