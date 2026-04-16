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
  Tooth,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import { useDentistryManagement } from '@/hooks/useDentistryManagement';

interface DentistryDashboardProps {
  dentistId?: string;
}

export const DentistryDashboard: React.FC<DentistryDashboardProps> = ({ dentistId = 'DR001' }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { getUpcomingAppointments } = useDentistryManagement();

  useEffect(() => {
    loadData();
  }, [dentistId]);

  const loadData = async () => {
    setLoading(true);
    const data = await getUpcomingAppointments(dentistId);
    setAppointments(data || []);
    setLoading(false);
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Badge variant="destructive">🔴 Alto</Badge>;
      case 'moderate':
        return <Badge variant="secondary">🟡 Moderado</Badge>;
      case 'low':
        return <Badge variant="outline">🟢 Bajo</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const toothStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'cavity':
        return '⚠️';
      case 'filled':
        return '🔧';
      case 'root_canal':
        return '💊';
      case 'missing':
        return '❌';
      case 'extraction_needed':
        return '🚨';
      default:
        return '•';
    }
  };

  if (loading) {
    return <div className="p-4">Cargando datos...</div>;
  }

  const scheduled = appointments.filter((a) => a.status === 'scheduled');
  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  const completed = appointments.filter((a) => a.status === 'completed');

  // Sample tooth map visualization for FDI notation
  const toothMap = {
    upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
    upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
    lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
    lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  };

  const toothStatuses: Record<number, string> = {
    11: 'healthy',
    12: 'healthy',
    13: 'healthy',
    14: 'cavity',
    15: 'filled',
    16: 'root_canal',
    17: 'healthy',
    18: 'extraction_needed',
    21: 'healthy',
    22: 'healthy',
    23: 'healthy',
    24: 'healthy',
    25: 'filled',
    26: 'healthy',
    27: 'healthy',
    28: 'healthy',
    31: 'missing',
    32: 'healthy',
    33: 'healthy',
    34: 'healthy',
    35: 'healthy',
    36: 'root_canal',
    37: 'healthy',
    38: 'healthy',
    41: 'healthy',
    42: 'healthy',
    43: 'cavity',
    44: 'healthy',
    45: 'filled',
    46: 'healthy',
    47: 'healthy',
    48: 'extraction_needed',
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Citas Programadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{scheduled.length}</div>
            <p className="text-xs text-blue-600 mt-1">Por confirmar</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{confirmed.length}</div>
            <p className="text-xs text-green-600 mt-1">Esta semana</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{completed.length}</div>
            <p className="text-xs text-purple-600 mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Riesgo Alto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">2</div>
            <p className="text-xs text-red-600 mt-1">Pacientes críticos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tooth Map Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tooth className="w-5 h-5" />
            Mapa Dental (Notación FDI)
          </CardTitle>
          <CardDescription>Estado actual de la dentadura del paciente activo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upper Right */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Cuadrante Superior Derecho</p>
              <div className="flex gap-2 justify-start">
                {toothMap.upperRight.map((tooth) => (
                  <div
                    key={tooth}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-xs font-medium"
                    title={`Diente ${tooth}: ${toothStatuses[tooth]}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-sm">{toothStatusIcon(toothStatuses[tooth])}</span>
                      <span className="text-xs text-gray-500">{tooth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upper Left */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Cuadrante Superior Izquierdo</p>
              <div className="flex gap-2 justify-start">
                {toothMap.upperLeft.map((tooth) => (
                  <div
                    key={tooth}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-xs font-medium"
                    title={`Diente ${tooth}: ${toothStatuses[tooth]}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-sm">{toothStatusIcon(toothStatuses[tooth])}</span>
                      <span className="text-xs text-gray-500">{tooth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lower Left */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Cuadrante Inferior Izquierdo</p>
              <div className="flex gap-2 justify-start">
                {toothMap.lowerLeft.map((tooth) => (
                  <div
                    key={tooth}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-xs font-medium"
                    title={`Diente ${tooth}: ${toothStatuses[tooth]}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-sm">{toothStatusIcon(toothStatuses[tooth])}</span>
                      <span className="text-xs text-gray-500">{tooth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lower Right */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Cuadrante Inferior Derecho</p>
              <div className="flex gap-2 justify-start">
                {toothMap.lowerRight.map((tooth) => (
                  <div
                    key={tooth}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-xs font-medium"
                    title={`Diente ${tooth}: ${toothStatuses[tooth]}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-sm">{toothStatusIcon(toothStatuses[tooth])}</span>
                      <span className="text-xs text-gray-500">{tooth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Leyenda</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span className="text-sm">Sano</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span className="text-sm">Caries</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔧</span>
                <span className="text-sm">Restaurado</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💊</span>
                <span className="text-sm">Endodoncia</span>
              </div>
              <div className="flex items-center gap-2">
                <span>❌</span>
                <span className="text-sm">Faltante</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🚨</span>
                <span className="text-sm">Extracción</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Mis Citas Odontológicas</CardTitle>
              <CardDescription>Gestiona las citas con pacientes</CardDescription>
            </div>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Cita
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scheduled">
            <TabsList className="mb-4">
              <TabsTrigger value="scheduled">
                Programadas ({scheduled.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmadas ({confirmed.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completadas ({completed.length})
              </TabsTrigger>
            </TabsList>

            {['scheduled', 'confirmed', 'completed'].map((status) => (
              <TabsContent key={status} value={status}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Riesgo</TableHead>
                      <TableHead>Procedimiento</TableHead>
                      <TableHead>Costo Estimado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        patient: 'Carlos Mendoza',
                        datetime: '2026-04-15 09:00',
                        risk: 'high',
                        procedure: 'Limpieza + Caries',
                        cost: '$85.00',
                        appointment_id: 'APT-001',
                      },
                      {
                        patient: 'Elena Flores',
                        datetime: '2026-04-15 10:30',
                        risk: 'moderate',
                        procedure: 'Revisión dental',
                        cost: '$45.00',
                        appointment_id: 'APT-002',
                      },
                      {
                        patient: 'Roberto Sánchez',
                        datetime: '2026-04-16 14:00',
                        risk: 'low',
                        procedure: 'Control de alineación',
                        cost: '$65.00',
                        appointment_id: 'APT-003',
                      },
                    ].map((apt) => (
                      <TableRow key={apt.appointment_id}>
                        <TableCell className="font-medium">{apt.patient}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(apt.datetime).toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>{getRiskBadge(apt.risk)}</TableCell>
                        <TableCell>{apt.procedure}</TableCell>
                        <TableCell className="font-medium">{apt.cost}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            {status === 'completed' ? 'Ver' : 'Actualizar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* High-Risk Patients Alert */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="w-5 h-5" />
            Pacientes de Riesgo Alto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: 'María López',
                riskFactors: ['Placa severa (3)', 'Sangrado (2)', '5 caries activas'],
                recommendation: 'Tratamiento intensivo mesías',
              },
              {
                name: 'Antonio Gómez',
                riskFactors: ['IMC 31 (sobrepeso)', 'Diabetes tipo 2', 'Falta higiene'],
                recommendation: 'Control cada 3 meses con higienista',
              },
            ].map((patient, idx) => (
              <div key={idx} className="border border-red-300 rounded-lg p-4 bg-white">
                <p className="font-semibold text-red-900">{patient.name}</p>
                <div className="mt-2 text-sm text-red-800">
                  <p className="font-medium">Factores de riesgo:</p>
                  <ul className="list-disc list-inside mt-1">
                    {patient.riskFactors.map((factor, i) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </div>
                <p className="mt-2 text-sm text-red-700">
                  <span className="font-medium">Recomendación:</span> {patient.recommendation}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
