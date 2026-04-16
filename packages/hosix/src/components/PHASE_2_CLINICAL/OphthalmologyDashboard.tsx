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
  Eye,
  AlertCircle,
  Glasses,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Plus,
} from 'lucide-react';
import { useOphthalmology } from '@/hooks/useOphthalmology';

interface OphthalmologyDashboardProps {
  patientId?: string;
}

export const OphthalmologyDashboard: React.FC<OphthalmologyDashboardProps> = ({
  patientId = 'PAT-001',
}) => {
  const [visionRisk, setVisionRisk] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { checkVisionRisk } = useOphthalmology();

  useEffect(() => {
    loadVisionData();
  }, [patientId]);

  const loadVisionData = async () => {
    setLoading(true);
    const risk = await checkVisionRisk(patientId);
    setVisionRisk(risk);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-4">Cargando datos oftalmológicos...</div>;
  }

  const riskColor =
    visionRisk?.riskLevel === 'high'
      ? 'bg-red-50 border-red-200'
      : visionRisk?.riskLevel === 'moderate'
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-green-50 border-green-200';

  const riskTextColor =
    visionRisk?.riskLevel === 'high'
      ? 'text-red-900'
      : visionRisk?.riskLevel === 'moderate'
        ? 'text-yellow-900'
        : 'text-green-900';

  return (
    <div className="space-y-6">
      {/* Risk Alert */}
      {visionRisk && (
        <Card className={`border ${riskColor}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${riskTextColor}`}>
              <Eye className="w-5 h-5" />
              Riesgo Visual: {visionRisk.riskLevel?.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visionRisk.concerns && visionRisk.concerns.length > 0 && (
              <ul className={`space-y-2 ${riskTextColor}`}>
                {visionRisk.concerns.map((concern: string, idx: number) => (
                  <li key={idx} className="text-sm">
                    {concern}
                  </li>
                ))}
              </ul>
            )}
            <p className={`text-sm font-medium mt-4 ${riskTextColor}`}>
              Acción recomendada: {visionRisk.recommendedAction}
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Agudeza Visual OD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">20/20</div>
            <p className="text-xs text-gray-600 mt-1">Ojo derecho</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Agudeza Visual OS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">20/25</div>
            <p className="text-xs text-gray-600 mt-1">Ojo izquierdo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              PIO (OD/OS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">16/18</div>
            <p className="text-xs text-gray-600 mt-1">mmHg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Próximo Examen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">2026-05-15</div>
            <p className="text-xs text-gray-600 mt-1">En 30 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Refraction Values */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Glasses className="w-5 h-5" />
            Valores de Refracción Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-sm mb-3">OD (Ojo Derecho)</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Esfera:</span>
                  <span className="font-medium">-0.75 D</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cilindro:</span>
                  <span className="font-medium">-0.50 D</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Eje:</span>
                  <span className="font-medium">180°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AV Corregida:</span>
                  <span className="font-medium text-green-600">20/20</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-sm mb-3">OS (Ojo Izquierdo)</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Esfera:</span>
                  <span className="font-medium">-1.00 D</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cilindro:</span>
                  <span className="font-medium">-0.75 D</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Eje:</span>
                  <span className="font-medium">175°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AV Corregida:</span>
                  <span className="font-medium text-green-600">20/20</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examination History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Historial de Exámenes</CardTitle>
              <CardDescription>Seguimiento oftalmológico del paciente</CardDescription>
            </div>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Examen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Agudeza Visual</TableHead>
                <TableHead>PIO</TableHead>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Hallazgos</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  date: '2026-04-15',
                  va: 'OD 20/20, OS 20/25',
                  pio: '16/18 mmHg',
                  diagnosis: 'Miopía moderada',
                  findings:
                    'Media clara, retina normal, disco óptico rosa y bien definido',
                  referred: false,
                },
                {
                  date: '2025-10-20',
                  va: 'OD 20/20, OS 20/30',
                  pio: '15/16 mmHg',
                  diagnosis: 'Miopía + astigmatismo',
                  findings: 'Sin cambios significativos',
                  referred: false,
                },
                {
                  date: '2025-04-15',
                  va: 'OD 20/25, OS 20/40',
                  pio: '14/15 mmHg',
                  diagnosis: 'Miopía progresiva',
                  findings: 'Leve aumento en astigmatismo',
                  referred: false,
                },
              ].map((exam, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm">{exam.date}</TableCell>
                  <TableCell className="text-sm">{exam.va}</TableCell>
                  <TableCell className="text-sm">{exam.pio}</TableCell>
                  <TableCell className="text-sm font-medium">{exam.diagnosis}</TableCell>
                  <TableCell className="text-sm text-gray-600">{exam.findings}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ocular Diagnoses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Diagnósticos Oculares Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                diagnosis: 'Miopía moderada bilateral',
                severity: 'moderate',
                correction: 'Gafas bifocales',
                followup: 'Anual',
              },
              {
                diagnosis: 'Ligero astigmatismo',
                severity: 'mild',
                correction: 'Compensado en prescripción',
                followup: 'Anual',
              },
            ].map((diag, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{diag.diagnosis}</p>
                    <p className="text-sm text-gray-600 mt-1">Corrección: {diag.correction}</p>
                    <p className="text-sm text-gray-600">Seguimiento: {diag.followup}</p>
                  </div>
                  <Badge
                    variant={
                      diag.severity === 'mild'
                        ? 'outline'
                        : diag.severity === 'moderate'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {diag.severity === 'mild'
                      ? '🟢 Leve'
                      : diag.severity === 'moderate'
                        ? '🟡 Moderado'
                        : '🔴 Grave'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prescription Details */}
      <Card>
        <CardHeader>
          <CardTitle>Prescripción de Gafas Vigente</CardTitle>
          <CardDescription>Válida hasta 2027-04-15</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold mb-3">Marco y especificaciones</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tipo de marco:</span>
                <p className="font-medium">Monofocal</p>
              </div>
              <div>
                <span className="text-gray-600">Material de lentes:</span>
                <p className="font-medium">Policarbonato UV400 (100%)</p>
              </div>
              <div>
                <span className="text-gray-600">Distancia interpupilar:</span>
                <p className="font-medium">62 mm</p>
              </div>
              <div>
                <span className="text-gray-600">Recubrimiento:</span>
                <p className="font-medium">Anti-reflejante + Antidesgarre</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
