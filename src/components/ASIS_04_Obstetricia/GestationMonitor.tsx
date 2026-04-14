import React, { useEffect, useState } from 'react';
import { useObstetricPatient } from '@/hooks/useObstetricPatient';
import { useObstetricRisk } from '@/hooks/useObstetricRisk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface GestationMonitorProps {
  pregnancyId: string;
}

export const GestationMonitor: React.FC<GestationMonitorProps> = ({ pregnancyId }) => {
  const { pregnancy, loading, error } = useObstetricPatient(pregnancyId);
  const { riskScore, riskLevel, recommendations } = useObstetricRisk(pregnancyId);
  const [daysUntilEDD, setDaysUntilEDD] = useState<number>(0);

  useEffect(() => {
    if (pregnancy?.edd) {
      const today = new Date();
      const edd = new Date(pregnancy.edd);
      const diff = Math.floor((edd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setDaysUntilEDD(diff);
    }
  }, [pregnancy?.edd]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!pregnancy) return <div>No encontrado</div>;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'high':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoreo de Gestación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Edad Gestacional */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Edad Gestacional</p>
              <p className="text-3xl font-bold">{pregnancy.gestational_age_weeks}w</p>
            </div>

            {/* Días hasta EDD */}
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Falta para FPP</p>
              <p className="text-3xl font-bold">{daysUntilEDD}</p>
              <p className="text-xs text-gray-500">días</p>
            </div>

            {/* Status */}
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Estado</p>
              <Badge variant="outline">{pregnancy.status.toUpperCase()}</Badge>
            </div>
          </div>

          {/* FPP Calendar */}
          <div className="border rounded-lg p-4 flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Fecha Probable de Parto (FPP)</p>
              <p className="text-lg font-semibold">
                {new Date(pregnancy.edd).toLocaleDateString('es-EC', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getRiskIcon(riskLevel)}
            Evaluación de Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    riskScore < 30
                      ? 'bg-green-500'
                      : riskScore < 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full font-semibold ${getRiskColor(riskLevel)}`}>
              {riskScore}%
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Nivel de riesgo: <span className="font-semibold capitalize">{riskLevel}</span>
          </p>
        </CardContent>
      </Card>

      {/* Complications */}
      {pregnancy.complications && pregnancy.complications.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Complicaciones Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pregnancy.complications.map((complication, idx) => (
                <Badge key={idx} variant="secondary">
                  {complication}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recomendaciones</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm">
                  {rec}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Critical Condition Alert */}
      {pregnancy.critical_condition && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">¡CONDICIÓN CRÍTICA!</AlertTitle>
          <AlertDescription className="text-red-800">
            Esta paciente requiere atención inmediata. Contactar a obstetra de guardia.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GestationMonitor;
