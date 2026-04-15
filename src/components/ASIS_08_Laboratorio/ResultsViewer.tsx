// @ts-nocheck
// ============================================================================
// Lab Results Viewer Component - ASIS 8.0 - View Test Results
// Display laboratory test results with clinical interpretation and alerts
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLabResults } from '@/hooks/useLabResults';

interface LabResult {
  id: string;
  testName: string;
  testCode: string;
  value: number;
  unit: string;
  normalMin: number;
  normalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
  interpretation: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
  resultDate: string;
  comments?: string;
  trendStatus?: 'improving' | 'worsening' | 'stable';
}

interface ResultsViewerProps {
  patientId: string;
  labOrderId?: string;
  onExport?: () => void;
}

const getInterpretationColor = (
  interpretation: string
): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' => {
  switch (interpretation) {
    case 'normal':
      return 'default';
    case 'low':
    case 'high':
      return 'warning';
    case 'critical_low':
    case 'critical_high':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getInterpretationLabel = (interpretation: string): string => {
  const labels: Record<string, string> = {
    normal: 'Normal',
    low: 'Bajo',
    high: 'Alto',
    critical_low: 'CRÍTICO BAJO',
    critical_high: 'CRÍTICO ALTO',
  };
  return labels[interpretation] || interpretation;
};

const getInterpretationIcon = (interpretation: string) => {
  switch (interpretation) {
    case 'normal':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'low':
      return <TrendingDown className="h-4 w-4 text-orange-600" />;
    case 'high':
      return <TrendingUp className="h-4 w-4 text-orange-600" />;
    case 'critical_low':
    case 'critical_high':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
};

export const ResultsViewer: React.FC<ResultsViewerProps> = ({
  patientId,
  labOrderId,
  onExport,
}) => {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const { results, loading, error, fetchResults, exportResults } = useLabResults();

  useEffect(() => {
    fetchResults(patientId, labOrderId);
  }, [patientId, labOrderId, fetchResults]);

  const toggleResultExpanded = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const criticalResults = results.filter((r) =>
    ['critical_low', 'critical_high'].includes(r.interpretation)
  );

  const abnormalResults = results.filter(
    (r) =>
      ['low', 'high'].includes(r.interpretation) &&
      !['critical_low', 'critical_high'].includes(r.interpretation)
  );

  const normalResults = results.filter((r) => r.interpretation === 'normal');

  const handleExport = async () => {
    try {
      const pdfData = await exportResults(patientId);
      // Crear descarga
      const element = document.createElement('a');
      element.href = URL.createObjectURL(new Blob([pdfData], { type: 'application/pdf' }));
      element.download = `lab_results_${patientId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      onExport?.();
    } catch (err) {
      console.error('Error exporting results:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Cargando resultados...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical Alerts */}
      {criticalResults.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>⚠️ Resultados Críticos Detectados</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {criticalResults.map((result) => (
                <div key={result.id}>
                  <strong>{result.testName} ({result.testCode}):</strong> {result.value}{' '}
                  {result.unit}
                  {result.criticalLow && result.value < result.criticalLow
                    ? ` (Crítico bajo: < ${result.criticalLow})`
                    : result.criticalHigh && result.value > result.criticalHigh
                      ? ` (Crítico alto: > ${result.criticalHigh})`
                      : ''}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Abnormal Alert */}
      {abnormalResults.length > 0 && criticalResults.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">
            ℹ️ Algunos resultados están fuera del rango normal
          </AlertTitle>
          <AlertDescription className="text-orange-700">
            Se encontraron {abnormalResults.length} resultados anormales que requieren revisión
          </AlertDescription>
        </Alert>
      )}

      {/* Export Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Todos ({results.length})
          </TabsTrigger>
          <TabsTrigger value="abnormal" className={abnormalResults.length > 0 ? 'text-orange-600' : ''}>
            Anormales ({abnormalResults.length})
          </TabsTrigger>
          <TabsTrigger value="normal" className="text-green-600">
            Normales ({normalResults.length})
          </TabsTrigger>
        </TabsList>

        {/* All Results */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Resultados Completos</CardTitle>
              <CardDescription>Todos los resultados de laboratorio</CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsTable results={results} expandedResults={expandedResults} onExpand={toggleResultExpanded} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abnormal Results */}
        <TabsContent value="abnormal">
          <Card>
            <CardHeader>
              <CardTitle>Resultados Anormales</CardTitle>
              <CardDescription>Tests fuera del rango normal</CardDescription>
            </CardHeader>
            <CardContent>
              {abnormalResults.length > 0 ? (
                <ResultsTable results={abnormalResults} expandedResults={expandedResults} onExpand={toggleResultExpanded} />
              ) : (
                <div className="text-center text-gray-500">No hay resultados anormales</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Normal Results */}
        <TabsContent value="normal">
          <Card>
            <CardHeader>
              <CardTitle>Resultados Normales</CardTitle>
              <CardDescription>Tests dentro del rango normal</CardDescription>
            </CardHeader>
            <CardContent>
              {normalResults.length > 0 ? (
                <ResultsTable results={normalResults} expandedResults={expandedResults} onExpand={toggleResultExpanded} />
              ) : (
                <div className="text-center text-gray-500">No hay resultados normales</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ResultsTableProps {
  results: LabResult[];
  expandedResults: Set<string>;
  onExpand: (resultId: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  expandedResults,
  onExpand,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="w-12"></TableHead>
          <TableHead>Prueba</TableHead>
          <TableHead className="text-right">Resultado</TableHead>
          <TableHead className="text-center">Estado</TableHead>
          <TableHead>Rango Normal</TableHead>
          <TableHead className="text-center">Tendencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <React.Fragment key={result.id}>
            <TableRow className="hover:bg-gray-50 cursor-pointer" onClick={() => onExpand(result.id)}>
              <TableCell>
                <button className="p-1">
                  {expandedResults.has(result.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </TableCell>
              <TableCell>
                <div className="font-semibold">{result.testName}</div>
                <div className="text-sm text-gray-600">{result.testCode}</div>
              </TableCell>
              <TableCell className="text-right">
                <div className="text-lg font-bold">{result.value}</div>
                <div className="text-sm text-gray-600">{result.unit}</div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  {getInterpretationIcon(result.interpretation)}
                  <Badge variant={getInterpretationColor(result.interpretation)}>
                    {getInterpretationLabel(result.interpretation)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {result.normalMin} - {result.normalMax} {result.unit}
              </TableCell>
              <TableCell className="text-center">
                {result.trendStatus === 'improving' && (
                  <TrendingDown className="h-4 w-4 text-green-600 mx-auto" />
                )}
                {result.trendStatus === 'worsening' && (
                  <TrendingUp className="h-4 w-4 text-red-600 mx-auto" />
                )}
                {result.trendStatus === 'stable' && (
                  <div className="text-gray-400">—</div>
                )}
              </TableCell>
            </TableRow>

            {expandedResults.has(result.id) && (
              <TableRow className="bg-blue-50">
                <TableCell colSpan={6} className="p-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Fecha:</span> {new Date(result.resultDate).toLocaleDateString('es-ES')}
                    </div>
                    {result.comments && (
                      <div>
                        <span className="font-semibold">Comentarios:</span>
                        <p className="mt-1 text-sm text-gray-700">{result.comments}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold">Interpretación:</span>
                      <p className="mt-1 text-sm text-gray-700">
                        {getInterpretationLabel(result.interpretation)} -{' '}
                        {result.interpretation === 'normal'
                          ? 'Valor dentro del rango de referencia'
                          : result.interpretation.includes('critical')
                            ? 'Valor fuera del rango crítico - requiere atención urgente'
                            : 'Valor fuera del rango normal - requiere seguimiento'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};

export default ResultsViewer;
