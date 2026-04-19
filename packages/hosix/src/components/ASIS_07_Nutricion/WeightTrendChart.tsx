import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useNutritionTracking } from '@/hooks/useNutritionTracking';

// ============================================================================
// TYPES
// ============================================================================
interface WeightDataPoint {
  date: string;
  weight: number;
  bmi: number;
  status: string;
}

interface ChartData {
  date: string;
  weight: number;
  bmi: number;
  target_weight?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const WeightTrendChart: React.FC<{
  patientId: string;
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  showTarget?: boolean;
}> = ({ patientId, timeframe = 'month', showTarget = true }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [trend, setTrend] = useState<'stable' | 'improving' | 'declining' | null>(null);
  const [metrics, setMetrics] = useState({
    currentWeight: 0,
    weightChange: 0,
    weightChangePercent: 0,
    currentBMI: 0,
    targetWeight: 0,
  });

  const { fetchWeightTrend } = useNutritionTracking();

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchWeightTrend(patientId, selectedTimeframe);
        
        if (result.success) {
          const chartData = result.data.map((point: WeightDataPoint) => ({
            date: point.date,
            weight: point.weight,
            bmi: point.bmi,
            target_weight: showTarget ? result.targetWeight : undefined,
          }));

          setData(chartData);

          // Calculate trend
          if (result.data.length >= 2) {
            const firstWeight = result.data[0].weight;
            const lastWeight = result.data[result.data.length - 1].weight;
            const change = lastWeight - firstWeight;
            const changePercent = ((change / firstWeight) * 100).toFixed(2);

            setMetrics({
              currentWeight: lastWeight,
              weightChange: Number(change.toFixed(1)),
              weightChangePercent: Number(changePercent),
              currentBMI: result.data[result.data.length - 1].bmi,
              targetWeight: result.targetWeight || 0,
            });

            if (change < -0.5) setTrend('improving');
            else if (change > 0.5) setTrend('declining');
            else setTrend('stable');
          }
        } else {
          setError(result.error || 'Error loading weight data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [patientId, selectedTimeframe, fetchWeightTrend]);

  return (
    <Card className="w-full p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Seguimiento de Peso</h3>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metrics Summary */}
        {!isLoading && data.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Peso Actual</p>
              <p className="text-lg font-bold text-gray-900">{metrics.currentWeight} kg</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Cambio</p>
              <p className={`text-lg font-bold ${metrics.weightChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.weightChange > 0 ? '+' : ''}{metrics.weightChange} kg
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">% Cambio</p>
              <p className={`text-lg font-bold ${metrics.weightChangePercent < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.weightChangePercent > 0 ? '+' : ''}{metrics.weightChangePercent}%
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">IMC Actual</p>
              <p className="text-lg font-bold text-gray-900">{metrics.currentBMI.toFixed(1)}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Peso Meta</p>
              <p className="text-lg font-bold text-gray-900">{metrics.targetWeight} kg</p>
            </div>
          </div>
        )}

        {/* Trend Indicator */}
        {trend && (
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            trend === 'improving' ? 'bg-green-50' :
            trend === 'declining' ? 'bg-red-50' :
            'bg-yellow-50'
          }`}>
            {trend === 'improving' && (
              <>
                <TrendingDown className="h-5 w-5 text-green-600" />
                <span className="text-green-900 font-medium">Tendencia mejorable - Pérdida de peso positiva</span>
              </>
            )}
            {trend === 'declining' && (
              <>
                <TrendingUp className="h-5 w-5 text-red-600" />
                <span className="text-red-900 font-medium">Tendencia negativa - Ganancia de peso</span>
              </>
            )}
            {trend === 'stable' && (
              <>
                <Minus className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-900 font-medium">Estable - Sin cambios significativos</span>
              </>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        )}

        {/* Chart */}
        {!isLoading && data.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#1f2937' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#3b82f6" 
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Peso (kg)"
                  strokeWidth={2}
                />
                {showTarget && (
                  <Line 
                    type="monotone" 
                    dataKey="target_weight" 
                    stroke="#10b981" 
                    strokeDasharray="5 5"
                    dot={false}
                    name="Peso Meta (kg)"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && data.length === 0 && !error && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              No hay datos de peso disponibles para el período seleccionado
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1">
            Descargar Reporte
          </Button>
          <Button variant="outline" className="flex-1">
            Compartir Gráfico
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default WeightTrendChart;
