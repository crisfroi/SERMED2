import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, Loader } from 'lucide-react';
import { useVaccineSchedule } from '@/hooks/useVaccineSchedule';

// ============================================================================
// TYPES
// ============================================================================
interface ScheduleItem {
  vaccine_id: string;
  vaccine_name: string;
  recommended_age_months: number;
  current_age_months: number;
  dose_number: number;
  status: 'pending' | 'completed' | 'overdue' | 'contraindicated';
  last_vaccination_date?: string;
  next_due_date: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const VaccineScheduleViewer: React.FC<{
  patientId: string;
  ageMonths?: number;
}> = ({ patientId, ageMonths }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [currentAge, setCurrentAge] = useState(ageMonths || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionPercent, setCompletionPercent] = useState(0);

  const { fetchVaccineSchedule, calculateScheduleProgress } = useVaccineSchedule();

  // Load schedule
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchVaccineSchedule(patientId);
        if (result.success) {
          setSchedule(result.data);

          // Calculate completion
          const completed = result.data.filter((s: ScheduleItem) => s.status === 'completed').length;
          setCompletionPercent(result.data.length > 0 ? Math.round((completed / result.data.length) * 100) : 0);

          if (ageMonths === undefined) {
            setCurrentAge(result.currentAge);
          }
        } else {
          setError(result.error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [patientId, fetchVaccineSchedule]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300';
      case 'contraindicated': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'contraindicated': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Esquema de Vacunación</h3>
          <p className="text-sm text-gray-600 mt-1">Edad actual: {currentAge} meses</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-900">Progreso de Vacunación</span>
            <span className="font-bold text-blue-600">{completionPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Cargando esquema de vacunación...</span>
          </div>
        )}

        {/* Schedule List */}
        {!isLoading && schedule.length > 0 && (
          <div className="space-y-3">
            {schedule.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 border rounded-lg transition-all ${
                  item.status === 'completed' 
                    ? 'bg-green-50 border-green-200'
                    : item.status === 'overdue'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status === 'completed' && 'Completada'}
                        {item.status === 'pending' && `Próximamente`}
                        {item.status === 'overdue' && 'Vencida'}
                        {item.status === 'contraindicated' && 'Contraindicada'}
                      </span>
                    </div>

                    <h4 className="font-semibold text-gray-900">
                      {item.vaccine_name}
                      {item.dose_number > 1 && ` (Dosis ${item.dose_number})`}
                    </h4>

                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Edad recomendada:</span>
                        <p className="font-medium text-gray-900">{item.recommended_age_months} meses</p>
                      </div>

                      {item.last_vaccination_date && (
                        <div>
                          <span className="text-gray-600">Fecha de vacunación:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(item.last_vaccination_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-600">Próximo vencimiento:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(item.next_due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {item.status === 'overdue' && (
                      <Alert className="mt-3 bg-red-50 border-red-200 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-900">
                          Esta vacunación está vencida y debe administrarse lo antes posible
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {item.status !== 'completed' && item.status !== 'contraindicated' && (
                    <Button size="sm" className="ml-4">
                      Agendar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Data State */}
        {!isLoading && schedule.length === 0 && !error && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              No hay información de esquema de vacunación disponible
            </AlertDescription>
          </Alert>
        )}

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 rounded border border-green-300" />
            <span className="text-gray-700">Completada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded border border-blue-300" />
            <span className="text-gray-700">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 rounded border border-red-300" />
            <span className="text-gray-700">Vencida</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded border border-gray-300" />
            <span className="text-gray-700">Contraindicada</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1">
            Descargar Carnet
          </Button>
          <Button variant="outline" className="flex-1">
            Imprimir Esquema
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VaccineScheduleViewer;
