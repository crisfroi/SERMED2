'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, AlertTriangle, Baby, Plus } from 'lucide-react';
import { usePediatricsGrowth } from '@/hooks/usePediatricsGrowth';

interface PediatricsGrowthDashboardProps {
  patientId: string;
}

export const PediatricsGrowthDashboard: React.FC<PediatricsGrowthDashboardProps> = ({
  patientId,
}) => {
  const [growthData, setGrowthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { getGrowthTrend, getPediatricSummary } = usePediatricsGrowth();

  useEffect(() => {
    loadGrowthData();
  }, [patientId]);

  const loadGrowthData = async () => {
    setLoading(true);
    const trend = await getGrowthTrend(patientId);
    const summary = await getPediatricSummary(patientId);
    setGrowthData({ trend, summary });
    setLoading(false);
  };

  if (loading) {
    return <div className="p-4">Cargando datos de crecimiento...</div>;
  }

  // Sample growth chart data
  const growthChartData = [
    { month: 'Nacimiento', weight: 3.2, height: 50, headCirc: 34 },
    { month: '3 meses', weight: 5.5, height: 60, headCirc: 40 },
    { month: '6 meses', weight: 7.2, height: 66, headCirc: 43 },
    { month: '12 meses', weight: 9.8, height: 75, headCirc: 46 },
    { month: '18 meses', weight: 11.2, height: 81, headCirc: 47.5 },
    { month: '24 meses', weight: 12.8, height: 88, headCirc: 49 },
  ];

  const milestonesData = [
    { age: 3, milestone: 'Sonrisa Social', status: 'achieved', color: '#10b981' },
    { age: 6, milestone: 'Sentarse', status: 'achieved', color: '#10b981' },
    { age: 9, milestone: 'Gatear', status: 'in_progress', color: '#f59e0b' },
    { age: 12, milestone: 'Primeros pasos', status: 'pending', color: '#ef4444' },
    { age: 15, milestone: 'Palabras simples', status: 'pending', color: '#ef4444' },
  ];

  const trend = growthData?.trend;

  return (
    <div className="space-y-6">
      {/* Growth Status Alert */}
      {trend?.alerts && trend.alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Crecimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {trend.alerts.map((alert: string, idx: number) => (
                <li key={idx} className="text-sm text-red-800">
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Baby className="w-4 h-4" />
              Edad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-xs text-gray-600 mt-1">meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12.8</div>
            <p className="text-xs text-gray-600 mt-1">kg (p50)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Talla</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">88</div>
            <p className="text-xs text-gray-600 mt-1">cm (p50)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              ✅ Normal
            </Badge>
            <p className="text-xs text-gray-600 mt-1">Crecimiento esperado</p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Curvas de Crecimiento WHO</CardTitle>
          <CardDescription>Seguimiento de peso, talla y perímetro cefálico</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weight">
            <TabsList className="mb-4">
              <TabsTrigger value="weight">Peso (kg)</TabsTrigger>
              <TabsTrigger value="height">Talla (cm)</TabsTrigger>
              <TabsTrigger value="head">Perímetro Cefálico</TabsTrigger>
            </TabsList>

            <TabsContent value="weight">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Peso Real"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="height">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'Talla (cm)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="height"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Talla Real"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="head">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    label={{ value: 'Perímetro (cm)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="headCirc"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Perímetro Cefálico"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Developmental Milestones */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Hitos del Desarrollo</CardTitle>
              <CardDescription>Seguimiento de desarrollo psicomotor y socioemocional</CardDescription>
            </div>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Registrar Hito
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestonesData.map((milestone, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: milestone.color }}
                  ></div>
                  <div>
                    <p className="font-medium">{milestone.milestone}</p>
                    <p className="text-sm text-gray-600">{milestone.age} meses</p>
                  </div>
                </div>
                <Badge
                  variant={
                    milestone.status === 'achieved'
                      ? 'outline'
                      : milestone.status === 'in_progress'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {milestone.status === 'achieved'
                    ? '✅ Logrado'
                    : milestone.status === 'in_progress'
                      ? '⏳ En progreso'
                      : '⏳ Por alcanzar'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nutritional Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Recomendaciones Nutricionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                age: '0-6 meses',
                feeding: 'Lactancia exclusiva o fórmula',
                frequency: 'Cada 3-4 horas',
              },
              {
                age: '6-12 meses',
                feeding: 'Introducción alimentos complementarios',
                frequency: '2 comidas sólidas + lactancia',
              },
              {
                age: '12-24 meses',
                feeding: 'Progresión a dieta familiar',
                frequency: '3 comidas + 2 meriendas',
              },
            ].map((rec, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-sm">{rec.age}</p>
                <p className="text-sm mt-2">
                  <span className="text-gray-600">Alimentación:</span> {rec.feeding}
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Frecuencia:</span> {rec.frequency}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
