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
import * as TabsPrimitive from '@radix-ui/react-tabs';
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
import { AlertCircle, Bed, Clock, User, FileText, Plus, CheckCircle2 } from 'lucide-react';
import { useInpatientManagement } from '@/hooks/useInpatientManagement';

interface InpatientDashboardProps {
  departmentId?: string;
}

export const InpatientDashboard: React.FC<InpatientDashboardProps> = ({ departmentId }) => {
  const [occupancy, setOccupancy] = useState<any>(null);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { getActiveBedOccupancy } = useInpatientManagement();

  useEffect(() => {
    loadOccupancy();
  }, [departmentId]);

  const loadOccupancy = async () => {
    setLoading(true);
    const data = await getActiveBedOccupancy(departmentId);
    setOccupancy(data);
    setLoading(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const occupancyPercentage = occupancy?.occupancyRate || 0;
  const occupancyColor =
    occupancyPercentage > 90 ? 'bg-red-100' : occupancyPercentage > 70 ? 'bg-yellow-100' : 'bg-green-100';

  return (
    <div className="space-y-6">
      {/* Occupancy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bed className="w-4 h-4" />
              Camas Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancy?.availableBeds || 0}</div>
            <p className="text-xs text-gray-500">de {occupancy?.totalBeds || 0} camas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Ocupación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(occupancyPercentage)}%</div>
            <p className="text-xs text-gray-500">{occupancy?.occupiedBeds || 0} camas ocupadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Promedio Estancia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2</div>
            <p className="text-xs text-gray-500">días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Altas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-gray-500">pacientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Status */}
      <Card className={occupancyColor}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Estado de Ocupación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                occupancyPercentage > 90
                  ? 'bg-red-500'
                  : occupancyPercentage > 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {occupancyPercentage > 90
              ? 'Capacidad casi alcanzada. Considere preparar altas'
              : occupancyPercentage > 70
                ? 'Ocupación moderada-alta'
                : 'Ocupación normal'}
          </p>
        </CardContent>
      </Card>

      {/* Admissions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pacientes Hospitalizados</CardTitle>
              <CardDescription>Admisiones activas</CardDescription>
            </div>
            <Button
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Admisión
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="pending">Altas Pendientes</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Cama</TableHead>
                    <TableHead>Motivo Ingreso</TableHead>
                    <TableHead>Días Ingresado</TableHead>
                    <TableHead>Médico Responsable</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      patient: 'Juan García López',
                      bed: 'A-203',
                      reason: 'Neumonía bacteriana',
                      days: 5,
                      doctor: 'Dr. Pérez',
                    },
                    {
                      patient: 'María Rodríguez',
                      bed: 'B-105',
                      reason: 'Post-quirúrgico (HSJ)',
                      days: 2,
                      doctor: 'Dra. Ramírez',
                    },
                  ].map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.patient}</TableCell>
                      <TableCell>{row.bed}</TableCell>
                      <TableCell>{row.reason}</TableCell>
                      <TableCell>{row.days}</TableCell>
                      <TableCell>{row.doctor}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
