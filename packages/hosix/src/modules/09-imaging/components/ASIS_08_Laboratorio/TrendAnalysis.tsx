// ============================================================================
// Trend Analysis Component - ASIS 8.0 - Lab Results Trends Over Time
// Track and visualize laboratory results trends for clinical decision-making
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Calendar,
  Activity,
} from 'lucide-react';
import { useTrendAnalysis } from '@hosix/hooks/09-imaging/useTrendAnalysis';

interface TrendDataPoint {
  date: string;
  value: number;
  testName: string;
  unit: string;
  normalMin: number;
  normalMax: number;
}

interface TrendAnalysisProps {
  patientId: string;
  defaultTestCode?: string;
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  patientId,
  defaultTestCode,
}) => {
  const [selectedTest, setSelectedTest] = useState(defaultTestCode || '');
  const [timeRange, setTimeRange] = useState('90'); // days
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  const {
    availableTests,
    trendHistory,
    loading,
    error,
    fetchTrendData,
    calculateTrendMetrics,
  } = useTrendAnalysis();

  useEffect(() => {
    if (selectedTest) {
      fetchTrendData(patientId, selectedTest, parseInt(timeRange));
    }
  }, [selectedTest, timeRange, patientId, fetchTrendData]);

  useEffect(() => {
    if (trendHistory) {
      setTrendData(trendHistory);
    }
  }, [trendHistory]);

  const metrics = selectedTest && trendData.length > 0 ? calculateTrendMetrics(trendData) : null;

  const currentValue = trendData.length > 0 ? trendData[trendData.length - 1].value : null;
  const previousValue = trendData.length > 1 ? trendData[trendData.length - 2].value : null;
  const changePercentage =
    currentValue && previousValue
      ? (((currentValue - previousValue) / previousValue) * 100).toFixed(1)
      : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Análisis de Tendencias de Laboratorio
          </CardTitle>
          <CardDescription>
            Visualiza el comportamiento de las pruebas a lo largo del tiempo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-semibold">Prueba de Laboratorio</label>
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una prueba" />
                </SelectTrigger>
                <SelectContent>
                  {availableTests.map((test) => (
                    <SelectItem key={test.id} value={test.code}>
                      {test.name} ({test.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-semibold">Período de Tiempo</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Último mes (30 días)</SelectItem>
                  <SelectItem value="90">Últimos 3 meses (90 días)</SelectItem>
                  <SelectItem value="180">Últimos 6 meses (180 días)</SelectItem>
                  <SelectItem value="365">Último año (365 días)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">Cargando datos de tendencia...</div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && selectedTest && trendData.length > 0 && (
        <>
          {/* Metrics Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Valor Actual</div>
                  <div className="text-2xl font-bold">{currentValue}</div>
                  {trendData.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {trendData[trendData.length - 1].unit}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Cambio</div>
                  <div className="flex items-center gap-2">
                    {changePercentage && parseFloat(changePercentage) < 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-red-600" />
                    )}
                    <div className="text-2xl font-bold">{changePercentage}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Promedio</div>
                  <div className="text-2xl font-bold">
                    {metrics?.average.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Registros</div>
                  <div className="text-2xl font-bold">{trendData.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Tendencias</CardTitle>
              <CardDescription>
                Histórico de {trendData[0]?.testName} (últimos{' '}
                {trendData.length} registros)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    angle={-45}
                    height={80}
                  />
                  <YAxis
                    label={{
                      value: trendData[0]?.unit,
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => value.toFixed(2)}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString('es-ES')
                    }
                  />
                  <Legend />
                  
                  {/* Rango Normal */}
                  {trendData.length > 0 && (
                    <>
                      <ReferenceLine
                        y={trendData[0]?.normalMin}
                        stroke="#90EE90"
                        strokeDasharray="5 5"
                        label={{ value: 'Mín', position: 'right' }}
                        name="Mínimo Normal"
                      />
                      <ReferenceLine
                        y={trendData[0]?.normalMax}
                        stroke="#90EE90"
                        strokeDasharray="5 5"
                        label={{ value: 'Máx', position: 'right' }}
                        name="Máximo Normal"
                      />
                    </>
                  )}

                  {/* Data Line */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ fill: '#2563EB', r: 4 }}
                    activeDot={{ r: 6 }}
                    name={trendData[0]?.testName}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historial Detallado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {trendData
                  .slice()
                  .reverse()
                  .map((point, idx) => {
                    const isAbnormal =
                      point.value < point.normalMin ||
                      point.value > point.normalMax;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          isAbnormal ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">
                            {new Date(point.date).toLocaleDateString(
                              'es-ES'
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {point.normalMin} - {point.normalMax}{' '}
                            {point.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {point.value}
                            </div>
                            <div className="text-sm text-gray-600">
                              {point.unit}
                            </div>
                          </div>
                          {isAbnormal && (
                            <Badge variant="destructive">Anormal</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && selectedTest && trendData.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              No hay datos de tendencia disponibles para esta prueba
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrendAnalysis;
