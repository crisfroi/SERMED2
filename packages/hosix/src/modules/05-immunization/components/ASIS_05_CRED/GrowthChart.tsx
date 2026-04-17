import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useChildGrowth } from '@hosix/hooks/02-pediatrics/useChildGrowth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface GrowthChartProps {
  childId: string;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ childId }) => {
  const { growthControls, loading, error } = useChildGrowth(childId);
  const [chartData, setChartData] = useState<any[]>([]);
  const [trend, setTrend] = useState<'normal' | 'slow' | 'rapid'>('normal');

  useEffect(() => {
    if (growthControls && growthControls.length > 0) {
      // Ordenar cronológicamente
      const sorted = [...growthControls].sort(
        (a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
      );

      // Preparar datos para gráfica
      const data = sorted.map((control) => ({
        date: new Date(control.visit_date).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' }),
        ageMonths: control.age_months,
        weight: control.weight_kg,
        height: control.height_cm,
        percentileWeight: control.who_percentile_weight,
        percentileHeight: control.who_percentile_height,
        status: control.nutritional_status,
      }));

      setChartData(data);

      // Calcular tendencia (últimas 3 mediciones)
      if (sorted.length >= 3) {
        const recent = sorted.slice(-3);
        const avgPercentile = recent.reduce((acc, r) => acc + (r.who_percentile_weight || 0), 0) / 3;

        if (avgPercentile < 10) {
          setTrend('slow');
        } else if (avgPercentile > 90) {
          setTrend('rapid');
        } else {
          setTrend('normal');
        }
      }
    }
  }, [growthControls]);

  if (loading) return <div>Cargando datos de crecimiento...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  const lastControl = growthControls?.[growthControls.length - 1];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {lastControl && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Peso Actual</p>
              <p className="text-3xl font-bold">{lastControl.weight_kg} kg</p>
              <p className="text-xs text-gray-500">
                Percentil: {lastControl.who_percentile_weight}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Talla Actual</p>
              <p className="text-3xl font-bold">{lastControl.height_cm} cm</p>
              <p className="text-xs text-gray-500">
                Percentil: {lastControl.who_percentile_height}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Estado Nutricional</p>
              <Badge variant={
                lastControl.nutritional_status === 'normal' ? 'default' :
                lastControl.nutritional_status === 'wasting' ? 'destructive' :
                'secondary'
              }>
                {lastControl.nutritional_status.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend Alert */}
      {trend !== 'normal' && (
        <Alert className={trend === 'slow' ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}>
          <AlertTriangle className={`h-4 w-4 ${trend === 'slow' ? 'text-yellow-600' : 'text-red-600'}`} />
          <AlertDescription className={trend === 'slow' ? 'text-yellow-800' : 'text-red-800'}>
            {trend === 'slow' 
              ? '⚠️ Crecimiento lento: Considerar evaluación nutricional'
              : '⚠️ Crecimiento acelerado: Es posible que se requiera evaluación'}
          </AlertDescription>
        </Alert>
      )}

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfica de Crecimiento (WHO)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  stroke="#888"
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#888"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#888"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                />
                <Legend />
                
                {/* Percentiles como referencia (fondo) */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="percentileWeight"
                  stroke="#999"
                  strokeWidth={1}
                  dot={false}
                  name="Percentil Peso (ref)"
                  strokeDasharray="5 5"
                />

                {/* Peso real */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                  name="Peso (kg)"
                  connectNulls
                />

                {/* Altura real */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="height"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                  name="Talla (cm)"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">Sin datos de crecimiento registrados</p>
          )}
        </CardContent>
      </Card>

      {/* WHO Growth Status Interpretation */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle>Interpretación WHO</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Percentil 5:</strong> Límite inferior normal. Niños debajo pueden tener desnutrición.
          </p>
          <p>
            <strong>Percentil 50:</strong> Mediana - Crecimiento típico
          </p>
          <p>
            <strong>Percentil 95:</strong> Límite superior normal. Arriba puede indicar sobrepeso/obesidad.
          </p>
          {lastControl?.who_percentile_weight && (
            <div className="mt-4 p-3 bg-white rounded-md border">
              <p>
                El niño está en <strong>percentil {lastControl.who_percentile_weight}%</strong> para peso.
                {lastControl.who_percentile_weight < 5 && ' ⚠️ Bajo - Requiere seguimiento'}
                {lastControl.who_percentile_weight >= 5 && lastControl.who_percentile_weight < 95 && ' ✅ Normal'}
                {lastControl.who_percentile_weight >= 95 && ' ⚠️ Elevado - Evaluar sobrepeso'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GrowthChart;
