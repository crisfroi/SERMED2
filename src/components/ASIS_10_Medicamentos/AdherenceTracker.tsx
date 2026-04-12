import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  SkipForward,
  TrendingDown,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdherenceTracking } from '@/hooks/useAdherenceTracking';

interface AdherenceRecord {
  date: string;
  medication: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'taken' | 'missed' | 'taken_late' | 'refused' | 'pending';
  notes?: string;
}

interface AdherenceMetrics {
  adherencePercentage: number;
  medicationsTracked: number;
  missedDoses: number;
  lateDoses: number;
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
}

interface AdherenceTrackerProps {
  patientId: string;
  medicationId?: string; // If tracking specific medication
  timePeriod?: 'week' | 'month' | 'quarter';
}

const STATUS_CONFIG = {
  taken: {
    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    label: 'Tomado',
    color: 'bg-green-50 border-l-4 border-green-500',
  },
  taken_late: {
    icon: <Clock className="h-4 w-4 text-yellow-600" />,
    label: 'Tomado Tarde',
    color: 'bg-yellow-50 border-l-4 border-yellow-500',
  },
  missed: {
    icon: <SkipForward className="h-4 w-4 text-red-600" />,
    label: 'Perdido',
    color: 'bg-red-50 border-l-4 border-red-500',
  },
  refused: {
    icon: <AlertCircle className="h-4 w-4 text-orange-600" />,
    label: 'Rechazado',
    color: 'bg-orange-50 border-l-4 border-orange-500',
  },
  pending: {
    icon: <Clock className="h-4 w-4 text-blue-600" />,
    label: 'Pendiente',
    color: 'bg-blue-50 border-l-4 border-blue-500',
  },
};

export function AdherenceTracker({
  patientId,
  medicationId,
  timePeriod = 'month',
}: AdherenceTrackerProps) {
  const [records, setRecords] = useState<AdherenceRecord[]>([]);
  const [metrics, setMetrics] = useState<AdherenceMetrics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { fetchAdherenceRecords, getMetrics, recordAdherence } = useAdherenceTracking(patientId);

  useEffect(() => {
    loadAdherenceData();
  }, [patientId, medicationId, timePeriod]);

  const loadAdherenceData = async () => {
    try {
      setLoading(true);
      const recs = await fetchAdherenceRecords(medicationId, timePeriod);
      const mets = await getMetrics(medicationId, timePeriod);

      setRecords(recs);
      setMetrics(mets);

      // Generate chart data
      const groupedByDate = recs.reduce((acc: any, rec) => {
        const date = new Date(rec.date).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, taken: 0, missed: 0, late: 0, total: 0 };
        }
        acc[date].total += 1;
        if (rec.status === 'taken') acc[date].taken += 1;
        else if (rec.status === 'missed') acc[date].missed += 1;
        else if (rec.status === 'taken_late') acc[date].late += 1;
        return acc;
      }, {});

      setChartData(Object.values(groupedByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (err: any) {
      setError(err.message || 'Error loading adherence data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAdherence = async (recordId: string, status: AdherenceRecord['status']) => {
    try {
      await recordAdherence(recordId, status);
      setRecords(
        records.map((r) => (r.date === recordId ? { ...r, status } : r))
      );
    } catch (err: any) {
      setError(err.message || 'Error recording adherence');
    }
  };

  const trendIcon = metrics?.trend === 'improving' ? <TrendingUp className="h-4 w-4 text-green-600" /> : metrics?.trend === 'declining' ? <TrendingDown className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-gray-600" />;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando datos de adherencia...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="ml-2 text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {metrics?.adherencePercentage.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">Adherencia</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.medicationsTracked}
              </p>
              <p className="text-xs text-gray-600">Medicamentos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {metrics?.missedDoses}
              </p>
              <p className="text-xs text-gray-600">Dosis Perdidas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {metrics?.lateDoses}
              </p>
              <p className="text-xs text-gray-600">Dosis Tarde</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend and Risk */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tendencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {trendIcon}
                <span className="capitalize">{metrics?.trend}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {metrics?.trend === 'improving'
                  ? '↑ Mejorando'
                  : metrics?.trend === 'declining'
                  ? '↓ Empeorando'
                  : '→ Estable'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nivel de Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="capitalize">
                {metrics?.riskLevel === 'low'
                  ? '🟢 Bajo'
                  : metrics?.riskLevel === 'medium'
                  ? '🟡 Medio'
                  : '🔴 Alto'}
              </span>
              <Badge
                className={
                  metrics?.riskLevel === 'low'
                    ? 'bg-green-100 text-green-800'
                    : metrics?.riskLevel === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {metrics?.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adherence Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adherencia por Día</CardTitle>
            <CardDescription>
              Últimos {timePeriod === 'week' ? '7 días' : timePeriod === 'month' ? '30 días' : '90 días'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="taken" stackId="a" fill="#22c55e" name="Tomado" />
                <Bar dataKey="late" stackId="a" fill="#eab308" name="Tarde" />
                <Bar dataKey="missed" stackId="a" fill="#ef4444" name="Perdido" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Recientes</CardTitle>
          <CardDescription>Últimas tomas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {records.length === 0 ? (
              <p className="text-center text-gray-600">Sin registros</p>
            ) : (
              records.slice(0, 10).map((record, idx) => {
                const config = STATUS_CONFIG[record.status];
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 ${config.color}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="font-medium text-sm">
                          {record.medication}
                        </span>
                        <span className="text-xs text-gray-600">
                          {record.scheduledTime}
                        </span>
                      </div>
                      {record.actualTime && (
                        <p className="text-xs text-gray-600 ml-6">
                          Tomado a las {record.actualTime}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {config.label}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {metrics && metrics.adherencePercentage < 80 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="ml-2 text-orange-800">
            <strong>Recomendación:</strong> La adherencia del paciente está por debajo del 80%.
            Se recomienda intervención para mejorar la adherencia a la medicación.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default AdherenceTracker;
