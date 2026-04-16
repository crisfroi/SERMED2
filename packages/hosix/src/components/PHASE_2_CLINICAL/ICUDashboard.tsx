'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  Heart,
  Activity,
  Zap,
  TrendingUp,
  Droplet,
  Wind,
  Thermometer,
} from 'lucide-react';
import { useICUManagement } from '@/hooks/useICUManagement';

interface ICUDashboardProps {
  patientId?: string;
}

export const ICUDashboard: React.FC<ICUDashboardProps> = ({ patientId }) => {
  const [vitalTrends, setVitalTrends] = useState<any[]>([]);
  const [currentVitals, setCurrentVitals] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { getVitalTrends } = useICUManagement();

  useEffect(() => {
    if (patientId) {
      loadVitalTrends();
    }
  }, [patientId]);

  const loadVitalTrends = async () => {
    if (!patientId) return;
    setLoading(true);
    const trends = await getVitalTrends(patientId, 24);
    setVitalTrends(trends);
    if (trends.length > 0) {
      setCurrentVitals(trends[trends.length - 1]);
    }
    setLoading(false);
  };

  const chartData = vitalTrends.map((v) => ({
    time: new Date(v.monitoring_time).toLocaleTimeString(),
    hr: v.heart_rate,
    o2: v.oxygen_saturation,
    temp: v.body_temperature,
    sbp: v.systolic_bp,
  }));

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case 'hr':
        return value < 60 || value > 100 ? 'text-red-600' : 'text-green-600';
      case 'o2':
        return value < 95 ? 'text-red-600' : 'text-green-600';
      case 'sbp':
        return value < 90 || value > 140 ? 'text-red-600' : 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {currentVitals?.oxygen_saturation < 95 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            ⚠️ Saturación de oxígeno baja: {currentVitals?.oxygen_saturation}%
          </AlertDescription>
        </Alert>
      )}

      {/* Current Vitals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Frecuencia Cardíaca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getVitalStatus('hr', currentVitals?.heart_rate || 0)}`}>
              {currentVitals?.heart_rate || '--'} bpm
            </div>
            <p className="text-xs text-gray-500 mt-1">Normal: 60-100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              O₂ Saturation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getVitalStatus('o2', currentVitals?.oxygen_saturation || 0)}`}>
              {currentVitals?.oxygen_saturation || '--'}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Normal: &gt;95%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplet className="w-4 h-4 text-orange-500" />
              Presión Sistólica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getVitalStatus('sbp', currentVitals?.systolic_bp || 0)}`}>
              {currentVitals?.systolic_bp || '--'} mmHg
            </div>
            <p className="text-xs text-gray-500 mt-1">Normal: 90-140</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-500" />
              Temperatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentVitals?.body_temperature || '--'} °C</div>
            <p className="text-xs text-gray-500 mt-1">Normal: 36.5-37.5</p>
          </CardContent>
        </Card>
      </div>

      {/* Vital Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoreo de Signos Vitales (24h)</CardTitle>
          <CardDescription>Tendencia de parámetros críticos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="heart">
            <TabsList className="mb-4">
              <TabsTrigger value="heart">Frecuencia Cardíaca</TabsTrigger>
              <TabsTrigger value="oxygen">Saturación O₂</TabsTrigger>
              <TabsTrigger value="pressure">Presión Arterial</TabsTrigger>
            </TabsList>

            <TabsContent value="heart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[40, 120]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="hr" stroke="#ef4444" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="oxygen">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="o2" stroke="#3b82f6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="pressure">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[60, 180]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sbp" stroke="#f59e0b" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ventilation Info (if on mechanical ventilation) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="w-5 h-5" />
            Configuración de Ventilador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Modo</p>
              <p className="font-mono font-bold">AC/VC</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">FiO₂</p>
              <p className="font-mono font-bold">40%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">PEEP</p>
              <p className="font-mono font-bold">8 cm H₂O</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Volumen Corriente</p>
              <p className="font-mono font-bold">450 mL</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
