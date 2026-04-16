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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertTriangle,
  Ambulance,
  Clock,
  MapPin,
  Phone,
  TrendingUp,
  Zap,
  Plus,
} from 'lucide-react';
import Map from 'lucide-react/dist/esm/icons/map';
import { useEMS } from '@/hooks/useEMS';

interface EMSDashboardProps {
  centerName?: string;
}

export const EMSDashboard: React.FC<EMSDashboardProps> = ({
  centerName = 'Centro de Despachadores',
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { getEMSResponseMetrics } = useEMS();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    const data = await getEMSResponseMetrics(24);
    setMetrics(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-4">Cargando datos de emergencias...</div>;
  }

  const currentMetrics = metrics || {
    totalCalls: 47,
    criticalCalls: 3,
    emergentCalls: 12,
    dispatchedAmbulances: 42,
    averageResponseTimeMinutes: 8.5,
    callsPerHour: 1.96,
  };

  const severityColor = (count: number, total: number) => {
    const percentage = (count / total) * 100;
    if (percentage > 30) return 'bg-red-50 border-red-200';
    if (percentage > 15) return 'bg-orange-50 border-orange-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {currentMetrics.criticalCalls > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Llamadas Críticas en Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{currentMetrics.criticalCalls}</p>
            <p className="text-sm text-red-600 mt-1">
              Requieren recursos avanzados inmediatos
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className={`border ${severityColor(currentMetrics.criticalCalls, currentMetrics.totalCalls)}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Llamadas Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentMetrics.totalCalls}</div>
            <p className="text-xs text-gray-600 mt-1">
              {currentMetrics.callsPerHour} por hora
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {currentMetrics.criticalCalls}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {((currentMetrics.criticalCalls / currentMetrics.totalCalls) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">
              {currentMetrics.emergentCalls}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {((currentMetrics.emergentCalls / currentMetrics.totalCalls) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-green-600" />
              Ambulancias Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {currentMetrics.dispatchedAmbulances}
            </div>
            <p className="text-xs text-green-600 mt-1">En servicio</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Tiempo Resp. Prom
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {currentMetrics.averageResponseTimeMinutes}
            </div>
            <p className="text-xs text-blue-600 mt-1">minutos</p>
          </CardContent>
        </Card>
      </div>

      {/* Call Log */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Historial de Llamadas de Emergencia</CardTitle>
              <CardDescription>Últimas 24 horas</CardDescription>
            </div>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Llamada
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">Activas</TabsTrigger>
              <TabsTrigger value="completed">Completadas</TabsTrigger>
              <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Queja Principal</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Severidad</TableHead>
                    <TableHead>Ambulancia</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      time: '14:35',
                      complaint: 'Dolor pecho',
                      location: 'Av. Principal 1234',
                      severity: 'critical',
                      ambulance: 'AMB-05',
                      eta: '3 min',
                      status: 'En escena',
                    },
                    {
                      time: '14:28',
                      complaint: 'Accidente automovilístico',
                      location: 'Autopista Sur, km 12',
                      severity: 'emergent',
                      ambulance: 'AMB-02',
                      eta: '2 min',
                      status: 'Transportando',
                    },
                    {
                      time: '14:15',
                      complaint: 'Caída con traumatismo',
                      location: 'Calle 5 Norte 890',
                      severity: 'urgent',
                      ambulance: 'AMB-08',
                      eta: 'Llegó',
                      status: 'En escena',
                    },
                  ].map((call, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{call.time}</TableCell>
                      <TableCell className="text-sm">{call.complaint}</TableCell>
                      <TableCell className="text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {call.location}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            call.severity === 'critical'
                              ? 'destructive'
                              : call.severity === 'emergent'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {call.severity === 'critical'
                            ? '🔴 Crítica'
                            : call.severity === 'emergent'
                              ? '🟠 Urgente'
                              : '🟡 Importante'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{call.ambulance}</TableCell>
                      <TableCell className="text-sm">{call.eta}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{call.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="completed">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Queja</TableHead>
                    <TableHead>Ambulancia</TableHead>
                    <TableHead>Tiempo Respuesta</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      time: '11:45',
                      complaint: 'Infarto agudo',
                      ambulance: 'AMB-01',
                      response: '5 min',
                      destination: 'Hospital Central',
                      details: '65M, estable, ECG realizado',
                    },
                    {
                      time: '09:20',
                      complaint: 'Apendicitis aguda',
                      ambulance: 'AMB-03',
                      response: '7 min',
                      destination: 'Hospital Central - Cirugía',
                      details: '42F, dolor severo, PA 140/90',
                    },
                  ].map((call, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{call.time}</TableCell>
                      <TableCell className="text-sm">{call.complaint}</TableCell>
                      <TableCell className="font-medium">{call.ambulance}</TableCell>
                      <TableCell className="text-sm">{call.response}</TableCell>
                      <TableCell className="text-sm">{call.destination}</TableCell>
                      <TableCell className="text-sm text-gray-600">{call.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="cancelled">
              <div className="text-center py-8 text-gray-500">
                <p>No hay llamadas canceladas en las últimas 24 horas</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ambulance Fleet Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ambulance className="w-5 h-5" />
            Estado de Flota de Ambulancias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                type: 'Soporte Básico',
                total: 8,
                available: 3,
                color: 'bg-blue-50',
              },
              {
                type: 'Soporte Avanzado',
                total: 6,
                available: 2,
                color: 'bg-orange-50',
              },
              {
                type: 'Cuidados Críticos',
                total: 2,
                available: 1,
                color: 'bg-red-50',
              },
            ].map((fleet, idx) => (
              <div key={idx} className={`border rounded-lg p-4 ${fleet.color}`}>
                <p className="font-semibold text-sm">{fleet.type}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-bold">{fleet.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Disponibles:</span>
                    <span className="font-bold text-green-700">{fleet.available}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>En servicio:</span>
                    <span className="font-bold text-orange-700">{fleet.total - fleet.available}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Time Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tendencias de Desempeño
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Tiempo de Respuesta Promedio</p>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-full"
                  style={{ width: '68%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                8.5 minutos (Meta: &lt;10 min) ✅
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Tasa de Cobertura de Críticos</p>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full"
                  style={{ width: '75%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                75% (Meta: &gt;90%) ⚠️
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Disponibilidad de Ambulancias</p>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: '85%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                6 de 16 disponibles (37.5%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
