// WEEK 12 ADMIN 2: Waiting Rooms
// Component: PatientWaitingScreen.tsx
// Purpose: What patient sees while waiting (mobile/tablet interface)
// Status: Production-ready

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Clock, User, Phone, HelpCircle } from 'lucide-react';

interface PatientQueueStatus {
  id: string;
  queue_number: string;
  position_in_queue: number;
  total_in_queue: number;
  estimated_wait_minutes: number;
  actual_wait_minutes: number;
  priority_level: string;
  clinic_name: string;
  consultation_type: string;
  room_name: string;
  patient_name: string;
  confirmation_code?: string;
}

interface PatientWaitingScreenProps {
  queueId: string;
  onEmergency?: () => void;
}

const getProgressPercentage = (position: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round(((total - position) / total) * 100);
};

const formatWaitTime = (minutes: number): string => {
  if (minutes < 1) return 'Menos de 1 minuto';
  if (minutes === 1) return '1 minuto';
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const PatientWaitingScreen: React.FC<PatientWaitingScreenProps> = ({
  queueId,
  onEmergency,
}) => {
  const [wasCalledBefore, setWasCalledBefore] = useState(false);
  const [previousPosition, setPreviousPosition] = useState<number | null>(null);

  // Fetch patient queue status
  const { data: status, isLoading, isFetching } = useQuery<PatientQueueStatus>({
    queryKey: ['patient-queue-status', queueId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/waiting-queue/${queueId}/patient-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    },
    refetchInterval: 2000,
    staleTime: 1500,
  });

  // Detect when patient is called
  useEffect(() => {
    if (status && status.position_in_queue === 1 && !wasCalledBefore) {
      setWasCalledBefore(true);
      // Play audio notification if available
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(() => console.log('Could not play audio'));
    }
  }, [status?.position_in_queue, wasCalledBefore]);

  // Track position changes
  useEffect(() => {
    if (status && previousPosition !== null && status.position_in_queue < previousPosition) {
      // Patient moved forward!
      const element = document.getElementById('position-display');
      if (element) {
        element.classList.add('animate-bounce');
        setTimeout(() => element.classList.remove('animate-bounce'), 1000);
      }
    }
    setPreviousPosition(status?.position_in_queue || null);
  }, [status?.position_in_queue, previousPosition]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 text-center">
            <div className="inline-block animate-spin">
              <Clock className="h-12 w-12 text-blue-600" />
            </div>
            <p className="mt-4 text-gray-600">Cargando información de cola...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-2 border-red-300">
          <CardContent className="pt-8">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-center text-red-600 font-semibold">
              No se encontró información de la cola
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isNextToCall = status.position_in_queue === 1;
  const progressPercent = getProgressPercentage(status.position_in_queue, status.total_in_queue);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Called Alert */}
        {isNextToCall && (
          <Alert className="mb-4 bg-green-50 border-2 border-green-500 shadow-lg animate-pulse">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-700 font-bold text-lg">
              ¡PRÓXIMO! Diríjase a {status.clinic_name}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Ticket Card */}
        <Card className="mb-4 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
            <CardTitle className="text-sm">Su Número de Cita</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8 text-center bg-white">
            <div
              id="position-display"
              className="text-8xl font-bold text-blue-600 mb-4"
            >
              {status.queue_number}
            </div>
            <div className="text-gray-600 text-sm mb-4">
              Confirmación: {status.confirmation_code || status.id.slice(0, 8)}
            </div>
            <Badge className="bg-blue-100 text-blue-800 text-base px-4 py-2">
              {status.consultation_type}
            </Badge>
          </CardContent>
        </Card>

        {/* Position in Queue */}
        <Card className="mb-4 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Posición en Cola</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-600 mb-2">Pacientes delante de usted</div>
              <div className="flex items-center justify-center gap-3">
                <div
                  className={`text-5xl font-bold ${
                    isNextToCall ? 'text-green-600' : 'text-blue-600'
                  }`}
                >
                  {status.position_in_queue}
                </div>
                <div className="text-2xl text-gray-400">/</div>
                <div className="text-xl text-gray-600">{status.total_in_queue}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isNextToCall ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-2 text-center">
              {progressPercent}% completado
            </div>
          </CardContent>
        </Card>

        {/* Wait Time */}
        <Card className="mb-4 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Tiempo de Espera</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Tiempo Estimado</div>
                <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold text-orange-600">
                  {formatWaitTime(status.estimated_wait_minutes)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">En Espera Actual</div>
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-blue-600">
                  {formatWaitTime(status.actual_wait_minutes)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Destination Info */}
        <Card className="mb-4 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Información de Atención</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <div className="text-sm text-gray-600">Consultorio</div>
                <div className="font-semibold text-gray-900">{status.clinic_name}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <div className="text-sm text-gray-600">Sala de Espera</div>
                <div className="font-semibold text-gray-900">{status.room_name}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {isNextToCall
              ? 'Su número ha sido llamado. Diríjase inmediatamente al consultorio indicado.'
              : `Quedan ${status.position_in_queue - 1} pacientes delante. Está en el sistema, la llamaremos pronto.`}
          </AlertDescription>
        </Alert>

        {/* Emergency Button */}
        <Button
          onClick={onEmergency}
          variant="destructive"
          className="w-full py-6 text-lg font-bold"
        >
          🚨 EMERGENCIA - AYUDA INMEDIATA
        </Button>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-4">
          <p>
            Última actualización:{' '}
            {new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-1">
            {isFetching && 'Actualizando...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientWaitingScreen;
