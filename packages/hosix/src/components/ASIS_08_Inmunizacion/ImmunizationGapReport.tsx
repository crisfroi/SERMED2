import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader } from 'lucide-react';
import { useImmunizationGaps } from '@hosix/hooks/05-immunization/useImmunizationHooks';

// ============================================================================
// TYPES
// ============================================================================
interface VaccinationGap {
  id: string;
  vaccine_id: string;
  vaccine_name: string;
  dose_number: number;
  expected_age_months: number;
  actual_age_months: number;
  age_gap_months: number;
  reason_for_gap: string;
  epidemiological_risk: 'low' | 'medium' | 'high';
  catch_up_priority: 'routine' | 'high_priority' | 'urgent';
  resolved: boolean;
  recommended_catch_up_date: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const ImmunizationGapReport: React.FC<{
  patientId: string;
}> = ({ patientId }) => {
  const [gaps, setGaps] = useState<VaccinationGap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unresolved, setUnresolved] = useState(0);
  const [highPriority, setHighPriority] = useState(0);

  const { fetchImmunizationGaps, scheduleRescue } = useImmunizationGaps();

  useEffect(() => {
    const loadGaps = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchImmunizationGaps(patientId);
        if (result.success) {
          setGaps(result.data);
          setUnresolved(result.data.filter((g: VaccinationGap) => !g.resolved).length);
          setHighPriority(result.data.filter((g: VaccinationGap) =>
            !g.resolved && (g.catch_up_priority === 'urgent' || g.catch_up_priority === 'high_priority')
          ).length);
        } else {
          setError(result.error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadGaps();
  }, [patientId, fetchImmunizationGaps]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high_priority': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'routine': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50';
    }
  };

  const handleScheduleRescue = async (gapId: string) => {
    try {
      const result = await scheduleRescue(gapId);
      if (result.success) {
        // Refresh data
        const updated = gaps.map(g => 
          g.id === gapId ? {...g, resolved: true} : g
        );
        setGaps(updated);
      }
    } catch (err) {
      console.error('Error scheduling rescue:', err);
    }
  };

  return (
    <Card className="w-full p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Reporte de Brechas de Vacunación</h3>
          <p className="text-sm text-gray-600 mt-1">Análisis de vacunas faltantes o atrasadas</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-gray-600">Brechas no resuelt as</p>
            <p className="text-3xl font-bold text-red-600">{unresolved}</p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-gray-600">Alta Prioridad</p>
            <p className="text-3xl font-bold text-orange-600">{highPriority}</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-600">Total de Brechas</p>
            <p className="text-3xl font-bold text-blue-600">{gaps.length}</p>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600">Resueltas</p>
            <p className="text-3xl font-bold text-green-600">{gaps.filter(g => g.resolved).length}</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Analizando brechas...</span>
          </div>
        )}

        {/* Gaps List */}
        {!isLoading && gaps.length > 0 && (
          <div className="space-y-3">
            {gaps
              .filter(gap => !gap.resolved)
              .sort((a, b) => {
                const priorityOrder = { urgent: 0, high_priority: 1, routine: 2 };
                return (priorityOrder[a.catch_up_priority as keyof typeof priorityOrder] || 3) -
                       (priorityOrder[b.catch_up_priority as keyof typeof priorityOrder] || 3);
              })
              .map((gap) => (
                <div
                  key={gap.id}
                  className={`p-4 border-2 rounded-lg ${getRiskColor(gap.epidemiological_risk)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg">{gap.vaccine_name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(gap.catch_up_priority)}`}>
                          {gap.catch_up_priority === 'urgent' && '⚠️ Urgente'}
                          {gap.catch_up_priority === 'high_priority' && '🔴 Alta Prioridad'}
                          {gap.catch_up_priority === 'routine' && '🔵 Rutina'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <span className="text-gray-600">Dosis:</span>
                          <p className="font-medium text-gray-900">#{gap.dose_number}</p>
                        </div>

                        <div>
                          <span className="text-gray-600">Brecha de edad:</span>
                          <p className="font-medium text-gray-900">{gap.age_gap_months} meses atrás</p>
                        </div>

                        <div>
                          <span className="text-gray-600">RiesgoEpidemiológico:</span>
                          <p className={`font-medium ${
                            gap.epidemiological_risk === 'high' ? 'text-red-600' :
                            gap.epidemiological_risk === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {gap.epidemiological_risk === 'high' ? 'Alto' :
                             gap.epidemiological_risk === 'medium' ? 'Medio' : 'Bajo'}
                          </p>
                        </div>
                      </div>

                      {gap.reason_for_gap && (
                        <div className="mt-3 p-2 bg-white rounded border border-gray-300">
                          <p className="text-xs text-gray-600">Razón de la brecha:</p>
                          <p className="text-sm text-gray-900">{gap.reason_for_gap}</p>
                        </div>
                      )}

                      <div className="mt-3">
                        <p className="text-xs text-gray-600">Fecha recomendada para rescate:</p>
                        <p className="font-medium text-gray-900">
                          {new Date(gap.recommended_catch_up_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleScheduleRescue(gap.id)}
                      className="ml-4 whitespace-nowrap"
                    >
                      Agendar Rescate
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Resolved Gaps */}
        {!isLoading && gaps.filter(g => g.resolved).length > 0 && (
          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Brechas Resueltas</h4>
            <div className="space-y-2">
              {gaps
                .filter(gap => gap.resolved)
                .map((gap) => (
                  <div key={gap.id} className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{gap.vaccine_name} (Dosis {gap.dose_number})</p>
                      <p className="text-sm text-gray-600">Resuelta</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* No Data */}
        {!isLoading && gaps.length === 0 && !error && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              ¡Excelente! No hay brechas de vacunación. El esquema está al día.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-6 border-t">
          <Button variant="outline" className="flex-1">
            Exportar Reporte
          </Button>
          <Button variant="outline" className="flex-1">
            Enviar Notificación
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ImmunizationGapReport;
