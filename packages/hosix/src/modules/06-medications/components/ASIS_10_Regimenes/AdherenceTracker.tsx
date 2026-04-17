// ============================================================================
// AdherenceTracker.tsx - Medication Adherence Monitoring Component
// ASIS 10.0 - Regímenes de Medicación - Seguimiento de Adherencia
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdherenceTracker } from '@hosix/hooks/06-medications/useAdherenceTracker';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Pill,
  Loader2,
} from 'lucide-react';

interface AdherenceTrackerProps {
  patientId: string;
  medicationId?: string;
  period?: 'week' | 'month' | 'quarter';
  onExport?: (data: any) => void;
}

interface DoseTaken {
  date: string;
  medication: string;
  taken: boolean;
  notes?: string;
}

interface AdherenceMetrics {
  totalDoses: number;
  dosesTaken: number;
  adherencePercentage: number;
  missedDoses: number;
  refillsPending: number;
  lastTaken?: Date;
  nextDue?: Date;
}

export const AdherenceTracker: React.FC<AdherenceTrackerProps> = ({
  patientId,
  medicationId,
  period = 'month',
  onExport,
}) => {
  const { adherenceData, metrics, loading, error, recordDose, exportData } = useAdherenceTracker(
    patientId,
    medicationId,
    period
  );

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const chartData = adherenceData?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    taken: item.taken ? 1 : 0,
    missed: item.taken ? 0 : 1,
    fullDate: item.date,
  })) || [];

  const adherencePercentage = metrics?.adherencePercentage || 0;
  const adheranceColor =
    adherencePercentage >= 80
      ? '#10b981'
      : adherencePercentage >= 60
        ? '#f59e0b'
        : '#ef4444';

  const weeklyData = [
    {
      name: 'Lun',
      adherence: Math.random() * 100,
    },
    {
      name: 'Mar',
      adherence: Math.random() * 100,
    },
    {
      name: 'Mié',
      adherence: Math.random() * 100,
    },
    {
      name: 'Jue',
      adherence: Math.random() * 100,
    },
    {
      name: 'Vie',
      adherence: Math.random() * 100,
    },
    {
      name: 'Sáb',
      adherence: Math.random() * 100,
    },
    {
      name: 'Dom',
      adherence: Math.random() * 100,
    },
  ];

  const pieData = [
    { name: 'Tomadas', value: metrics?.dosesTaken || 0, color: '#10b981' },
    { name: 'Perdidas', value: metrics?.missedDoses || 0, color: '#ef4444' },
  ];

  const handleRecordDose = async (date: string, taken: boolean) => {
    await recordDose(date, taken, noteText);
    setSelectedDate(null);
    setNoteText('');
  };

  const handleExport = () => {
    const exported = exportData();
    onExport?.(exported);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Adherencia</p>
                <p className="text-3xl font-bold">{adherencePercentage.toFixed(1)}%</p>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${adheranceColor}20` }}
              >
                <TrendingUp style={{ color: adheranceColor }} className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dosis Tomadas</p>
                <p className="text-3xl font-bold text-green-600">{metrics?.dosesTaken || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dosis Perdidas</p>
                <p className="text-3xl font-bold text-red-600">{metrics?.missedDoses || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Recargas Pendientes</p>
                <p className="text-3xl font-bold text-blue-600">{metrics?.refillsPending || 0}</p>
              </div>
              <Pill className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart - Daily Adherence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cumplimiento Diario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="adherence"
                    stroke="#3b82f6"
                    name="Adherencia %"
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Dose Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Resumen de Dosis
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dose Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendario de Dosis</CardTitle>
              <CardDescription>Registrar dosis tomadas en los últimos {
                period === 'week' ? '7 días' : period === 'month' ? '30 días' : '90 días'
              }</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              {chartData.map((item: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(item.fullDate)}
                  className={`p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
                    item.taken
                      ? 'bg-green-100 border-2 border-green-500 hover:bg-green-200'
                      : 'bg-red-100 border-2 border-red-500 hover:bg-red-200'
                  } ${selectedDate === item.fullDate ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {item.taken ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-xs font-semibold mt-1">{item.date}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Messages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics?.lastTaken && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Última dosis tomada: {new Date(metrics.lastTaken).toLocaleDateString('es-ES')}
            </AlertDescription>
          </Alert>
        )}
        {metrics?.nextDue && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Próxima dosis: {new Date(metrics.nextDue).toLocaleDateString('es-ES')}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Performance Indicators */}
      {adherencePercentage < 80 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Su adherencia está por debajo del objetivo (80%). Considere hablar con su médico sobre
            estrategias para mejorar la medicación.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AdherenceTracker;
