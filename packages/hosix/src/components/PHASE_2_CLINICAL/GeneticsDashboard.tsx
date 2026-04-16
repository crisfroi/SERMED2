'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DNA,
  Users,
  Risk,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { useGenetics } from '@/hooks/useGenetics';

interface GeneticsDashboardProps {
  patientId?: string;
}

export const GeneticsDashboard: React.FC<GeneticsDashboardProps> = ({
  patientId = 'PAT-001',
}) => {
  const [loading, setLoading] = useState(false);
  const { performRiskAssessment } = useGenetics();

  return (
    <div className="space-y-6">
      {/* Genetic Risk Alert */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900 flex items-center gap-2">
            <Risk className="w-5 h-5" />
            Evaluación de Riesgo Genético
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">Riesgo por Historia Familiar</p>
              <Badge className="mt-2 bg-orange-100 text-orange-900">🟡 MODERADO</Badge>
            </div>
            <div className="border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">Tests Genéticos</p>
              <p className="text-lg font-bold mt-2">3</p>
              <p className="text-xs text-gray-600">Realizados</p>
            </div>
            <div className="border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">Genes de Riesgo</p>
              <p className="text-lg font-bold mt-2">1</p>
              <p className="text-xs text-gray-600">Patogénico</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Genetic Tests */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DNA className="w-5 h-5" />
                Pruebas Genéticas Realizadas
              </CardTitle>
              <CardDescription>Historial de tests genómicos</CardDescription>
            </div>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Test
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Test</TableHead>
                <TableHead>Genes</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Significancia</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  type: 'Carrier Screening',
                  genes: 'CFTR, GJB2, SMN',
                  date: '2026-02-15',
                  significance: 'Pathogenic',
                  result: 'Portador CFTR',
                  status: 'interpreted',
                },
                {
                  type: 'Cancer Predisposition',
                  genes: 'BRCA1, BRCA2, TP53',
                  date: '2026-01-20',
                  significance: 'Benign',
                  result: 'Sin mutaciones',
                  status: 'interpreted',
                },
                {
                  type: 'Whole Genome Sequencing',
                  genes: '20,000+ genes',
                  date: '2025-11-10',
                  significance: 'VUS',
                  result: 'Pendiente revisión',
                  status: 'received',
                },
              ].map((test, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{test.type}</TableCell>
                  <TableCell className="text-sm">{test.genes}</TableCell>
                  <TableCell className="text-sm">{test.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        test.significance === 'Pathogenic'
                          ? 'destructive'
                          : test.significance === 'VUS'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {test.significance}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{test.result}</TableCell>
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

      {/* Family History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Historia Familiar
              </CardTitle>
              <CardDescription>Antecedentes de enfermedades genéticas</CardDescription>
            </div>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Agregar Familiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                relative: 'Madre',
                age: 'Viva - 62 años',
                conditions: ['Diabetes tipo 2', 'Hipertensión'],
                genetic_risk: true,
              },
              {
                relative: 'Padre',
                age: 'Fallecido - 72 años (Infarto)',
                conditions: ['Enfermedad cardíaca coronaria', 'Diabetes'],
                genetic_risk: true,
              },
              {
                relative: 'Hermano',
                age: 'Vivo - 48 años',
                conditions: ['Hipercolesterolemia familiar'],
                genetic_risk: true,
              },
              {
                relative: 'Hermana',
                age: 'Viva - 45 años',
                conditions: ['Sin antecedentes relevantes'],
                genetic_risk: false,
              },
            ].map((member, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 ${
                  member.genetic_risk
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{member.relative}</p>
                    <p className="text-sm text-gray-600">{member.age}</p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Condiciones:</span>{' '}
                      {member.conditions.join(', ')}
                    </p>
                  </div>
                  {member.genetic_risk && (
                    <Badge className="bg-red-100 text-red-900">⚠️ Riesgo</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Carrier Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Portador (Carrier Status)</CardTitle>
          <CardDescription>Genes donde el paciente es portador</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { gene: 'CFTR', inheritance: 'Autosómico recesivo', carrier: true },
              { gene: 'GJB2', inheritance: 'Autosómico recesivo', carrier: false },
              {
                gene: 'BRCA1',
                inheritance: 'Autosómico dominante',
                carrier: false,
              },
              { gene: 'BRCA2', inheritance: 'Autosómico dominante', carrier: false },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{item.gene}</p>
                  <p className="text-xs text-gray-600">{item.inheritance}</p>
                </div>
                <Badge variant={item.carrier ? 'destructive' : 'outline'}>
                  {item.carrier ? '⚠️ Portador' : '✅ No portador'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Recomendaciones Clínicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="immediate">
            <TabsList className="mb-4">
              <TabsTrigger value="immediate">Inmediatas</TabsTrigger>
              <TabsTrigger value="family">Familiares</TabsTrigger>
              <TabsTrigger value="surveillance">Vigilancia</TabsTrigger>
            </TabsList>

            <TabsContent value="immediate" className="space-y-3">
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <p className="font-semibold text-red-900 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Acción urgente
                </p>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Consejería genética con genetista clínico</li>
                  <li>• Confirmación de resultado CFTR mediante secuenciación</li>
                  <li>• Valoración para posible testing de penetrancia</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="family" className="space-y-3">
              <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                <p className="font-semibold text-orange-900 flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  Recomendaciones familiares
                </p>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Ofrecer testing CFTR a todos los hermanos</li>
                  <li>• Asesoramiento preconcepcional si planea descendencia</li>
                  <li>• Consejería para pareja sobre riesgo reproductivo</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="surveillance" className="space-y-3">
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <p className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Plan de vigilancia
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Monitoreo pulmonar anual (screening CFTR)</li>
                  <li>• Prueba de sudor confirmatory si llevar a cabo</li>
                  <li>• Seguimiento con gastroenterología si hay síntomas</li>
                  <li>• Evaluación multidisciplinaria cada 12 meses</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
