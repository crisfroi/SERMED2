// @ts-nocheck
// WEEK 12 ADMIN 2: Waiting Rooms
// Component: QueueAnalyticsReport.tsx
// Purpose: Management analytics and reporting dashboard
// Status: Production-ready

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';

interface QueueAnalytics {
  date?: string;
  hour?: number;
  total_patients_queued: number;
  total_patients_attended: number;
  total_no_show: number;
  avg_wait_time: number;
  max_wait_time: number;
  min_wait_time: number;
  no_show_rate: number;
  peak_hours: Record<string, number>;
  priority_breakdown: Record<string, number>;
}

interface QueueAnalyticsReportProps {
  roomId?: string;
  roomName?: string;
}

const PRIORITY_COLORS = {
  critical: '#dc2626',
  high: '#f97316',
  normal: '#eab308',
  low: '#22c55e',
};

export const QueueAnalyticsReport: React.FC<QueueAnalyticsReportProps> = ({
  roomId,
  roomName = 'Queue Analytics',
}) => {
  const [timeRange, setTimeRange] = useState('today');
  const [exportFormat, setExportFormat] = useState('pdf');

  // Fetch analytics data
  const { data: analyticsData = [], isLoading } = useQuery<QueueAnalytics[]>({
    queryKey: ['queue-analytics', roomId, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        range: timeRange,
        ...(roomId && { room_id: roomId }),
      });
      const response = await fetch(`/api/v1/waiting-rooms/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 60000,
  });

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (analyticsData.length === 0) return null;
    const total = analyticsData.reduce(
      (acc, item) => ({
        queued: acc.queued + item.total_patients_queued,
        attended: acc.attended + item.total_patients_attended,
        noShow: acc.noShow + item.total_no_show,
        avgWait:
          acc.avgWait +
          (item.avg_wait_time * item.total_patients_queued) / Math.max(item.total_patients_queued, 1),
      }),
      { queued: 0, attended: 0, noShow: 0, avgWait: 0 }
    );

    return {
      totalQueued: total.queued,
      totalAttended: total.attended,
      totalNoShow: total.noShow,
      avgWaitTime: Math.round(total.avgWait / analyticsData.length),
      noShowRate: ((total.noShow / (total.queued || 1)) * 100).toFixed(2),
      completionRate: ((total.attended / (total.queued || 1)) * 100).toFixed(2),
    };
  }, [analyticsData]);

  // Prepare data for charts
  const timeSeriesData = useMemo(() => {
    return analyticsData.map((item) => ({
      name: item.hour ? `${item.hour}:00` : item.date || 'Unknown',
      avgWait: item.avg_wait_time,
      attended: item.total_patients_attended,
      noShow: item.total_no_show,
      queued: item.total_patients_queued,
    }));
  }, [analyticsData]);

  const priorityData = useMemo(() => {
    if (analyticsData.length === 0) return [];
    const combined = analyticsData.reduce(
      (acc, item) => {
        Object.entries(item.priority_breakdown || {}).forEach(([priority, count]) => {
          acc[priority] = (acc[priority] || 0) + (count as number);
        });
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(combined).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
      fill: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || '#gray',
    }));
  }, [analyticsData]);

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/v1/waiting-rooms/analytics/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: exportFormat,
          range: timeRange,
          room_id: roomId,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{roomName}</h1>
          <p className="text-gray-600">Reporte de Analytics de Cola</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mes</SelectItem>
                <SelectItem value="quarter">Último Trimestre</SelectItem>
              </SelectContent>
            </Select>

            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{summary.totalQueued}</div>
              <p className="text-sm text-gray-500">Total en Cola</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
              <div className="text-2xl font-bold">{summary.totalAttended}</div>
              <p className="text-sm text-gray-500">Atendidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <AlertTriangle className="h-8 w-8 text-orange-600 mb-2" />
              <div className="text-2xl font-bold">{summary.totalNoShow}</div>
              <p className="text-sm text-gray-500">No Presentados</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Clock className="h-8 w-8 text-purple-600 mb-2" />
              <div className="text-2xl font-bold">{summary.avgWaitTime} min</div>
              <p className="text-sm text-gray-500">Promedio Espera</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Wait Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Tiempo de Espera</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                Cargando datos...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgWait"
                    stroke="#3b82f6"
                    name="Promedio (min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || priorityData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                {isLoading ? 'Cargando datos...' : 'Sin datos'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Patients Processed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pacientes Procesados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                Cargando datos...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attended" fill="#22c55e" name="Atendidos" />
                  <Bar dataKey="noShow" fill="#ef4444" name="No Presentados" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas Detalladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tasa de Presentación</p>
                <p className="text-3xl font-bold text-green-600">{summary.completionRate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tasa de Ausencia</p>
                <p className="text-3xl font-bold text-red-600">{summary.noShowRate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Promedio Atendidos/Día</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(summary.totalAttended / (analyticsData.length || 1))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Satisfacción Estimada</p>
                <p className="text-3xl font-bold text-purple-600">
                  {(100 - parseFloat(summary.noShowRate)).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QueueAnalyticsReport;
