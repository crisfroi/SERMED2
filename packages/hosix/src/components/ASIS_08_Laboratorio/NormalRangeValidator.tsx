// ============================================================================
// Normal Range Validator Component - ASIS 8.0
// Validate lab results against demographic-specific normal ranges
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useNormalRanges } from '@/hooks/useNormalRanges';

interface RangeData {
  sex?: string;
  ageMin?: number;
  ageMax?: number;
  normalMin: number;
  normalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
}

interface ValidationResult {
  testCode: string;
  testName: string;
  resultValue: number;
  unit: string;
  applicableRange: RangeData;
  interpretation: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
  percentageOfNormal: number;
  distanceFromEdge: number;
}

interface NormalRangeValidatorProps {
  testCode: string;
  testName: string;
  resultValue: number;
  unit: string;
  patientAge: number;
  patientSex: 'M' | 'F';
}

const getInterpretationDetails = (
  interpretation: string
): { icon: React.ReactNode; color: string; description: string } => {
  switch (interpretation) {
    case 'normal':
      return {
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: 'text-green-600',
        description: 'Resultado dentro del rango normal',
      };
    case 'low':
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        color: 'text-orange-600',
        description: 'Resultado bajo respecto al rango normal',
      };
    case 'high':
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        color: 'text-orange-600',
        description: 'Resultado alto respecto al rango normal',
      };
    case 'critical_low':
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        color: 'text-red-600',
        description: 'Resultado CRÍTICO BAJO - requiere atención urgente',
      };
    case 'critical_high':
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        color: 'text-red-600',
        description: 'Resultado CRÍTICO ALTO - requiere atención urgente',
      };
    default:
      return {
        icon: <Info className="h-5 w-5" />,
        color: 'text-gray-600',
        description: 'Interpretación desconocida',
      };
  }
};

export const NormalRangeValidator: React.FC<NormalRangeValidatorProps> = ({
  testCode,
  testName,
  resultValue,
  unit,
  patientAge,
  patientSex,
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const { getNormalRanges, validateResult } = useNormalRanges();

  useEffect(() => {
    const validateTest = async () => {
      setLoading(true);
      try {
        const ranges = await getNormalRanges(testCode, patientAge, patientSex);
        const result = validateResult(
          testCode,
          testName,
          resultValue,
          unit,
          ranges
        );
        setValidationResult(result);
      } finally {
        setLoading(false);
      }
    };

    validateTest();
  }, [testCode, testName, resultValue, unit, patientAge, patientSex]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Validando resultado...</div>
        </CardContent>
      </Card>
    );
  }

  if (!validationResult) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            No se pudieron obtener los rangos de referencia
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    applicableRange,
    interpretation,
    percentageOfNormal,
    distanceFromEdge,
  } = validationResult;

  const details = getInterpretationDetails(interpretation);

  // Datos para el gráfico de validación
  const rangeData = [
    {
      name: 'Rango Crítico Bajo',
      value: applicableRange.criticalLow || applicableRange.normalMin - 10,
      fill: '#DC2626',
    },
    {
      name: 'Rango Normal',
      value: applicableRange.normalMin,
      fill: '#22C55E',
    },
    {
      name: 'Rango Normal Alto',
      value: applicableRange.normalMax,
      fill: '#22C55E',
    },
    {
      name: 'Rango Crítico Alto',
      value: applicableRange.criticalHigh || applicableRange.normalMax + 10,
      fill: '#DC2626',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Validation Result Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{testName}</CardTitle>
          <CardDescription>Validación de resultado según edad y sexo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alert based on interpretation */}
          {['critical_low', 'critical_high'].includes(interpretation) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>⚠️ Resultado Crítico Detectado</AlertTitle>
              <AlertDescription>
                Este resultado está fuera del rango seguro y requiere atención urgente del médico.
              </AlertDescription>
            </Alert>
          )}

          {['low', 'high'].includes(interpretation) && (
            <Alert>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Resultado Anormal</AlertTitle>
              <AlertDescription className="text-orange-700">
                Este resultado está fuera del rango normal esperado.
              </AlertDescription>
            </Alert>
          )}

          {/* Result Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="text-sm text-gray-600">Valor del Resultado</div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-3xl font-bold text-blue-600">{resultValue}</div>
                <div className="text-lg text-gray-600">{unit}</div>
              </div>
            </div>

            <div className={`rounded-lg p-4 ${
              interpretation === 'normal' ? 'bg-green-50' : 'bg-orange-50'
            }`}>
              <div className="text-sm text-gray-600">Estado</div>
              <div className="mt-2 flex items-center gap-2">
                <span className={details.color}>{details.icon}</span>
                <div>
                  <div className="font-semibold">
                    {interpretation === 'normal'
                      ? 'Normal'
                      : interpretation === 'low'
                        ? 'Bajo'
                        : interpretation === 'high'
                          ? 'Alto'
                          : 'Crítico'}
                  </div>
                  <div className="text-sm text-gray-600">{details.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Range Information */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="font-semibold mb-3">Rangos de Referencia</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Rango Normal:</span>
                <span className="font-semibold">
                  {applicableRange.normalMin} - {applicableRange.normalMax}{' '}
                  {unit}
                </span>
              </div>
              
              {applicableRange.criticalLow !== undefined && (
                <div className="flex justify-between text-red-600">
                  <span>Crítico Bajo:</span>
                  <span className="font-semibold">
                    {applicableRange.criticalLow} {unit}
                  </span>
                </div>
              )}
              
              {applicableRange.criticalHigh !== undefined && (
                <div className="flex justify-between text-red-600">
                  <span>Crítico Alto:</span>
                  <span className="font-semibold">
                    {applicableRange.criticalHigh} {unit}
                  </span>
                </div>
              )}

              <div className="mt-3 flex justify-between rounded-lg bg-blue-50 p-2 text-sm">
                <span>Edad del paciente:</span>
                <span className="font-semibold">{patientAge} años ({patientSex === 'M' ? 'Hombre' : 'Mujer'})</span>
              </div>
            </div>
          </div>

          {/* Analysis Metrics */}
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-600">Porcentaje del Normal</div>
                <div className="mt-2 text-2xl font-bold">
                  {percentageOfNormal.toFixed(1)}%
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {percentageOfNormal > 100 ? 'Por encima' : 'Por debajo'} del valor medio
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-600">Distancia al Límite</div>
                <div className="mt-2 text-2xl font-bold">
                  {Math.abs(distanceFromEdge).toFixed(1)} {unit}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {distanceFromEdge > 0
                    ? 'Dentro del rango'
                    : 'Fuera del rango'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-600">Interpretación</div>
                <div className="mt-2">
                  <Badge
                    variant={
                      interpretation === 'normal'
                        ? 'default'
                        : interpretation.includes('critical')
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-sm"
                  >
                    {interpretation === 'normal'
                      ? '✓ Normal'
                      : interpretation === 'low'
                        ? '↓ Bajo'
                        : interpretation === 'high'
                          ? '↑ Alto'
                          : '⚠️ Crítico'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Visual Range Representation */}
      <Card>
        <CardHeader>
          <CardTitle>Visualización del Rango</CardTitle>
          <CardDescription>Posición del resultado dentro de los rangos de referencia</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={[
                {
                  name: 'Rango',
                  min: applicableRange.normalMin,
                  max: applicableRange.normalMax,
                  value: resultValue,
                  criticalLow: applicableRange.criticalLow,
                  criticalHigh: applicableRange.criticalHigh,
                },
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              
              {/* Critical zones */}
              {applicableRange.criticalLow && (
                <ReferenceLine
                  y={applicableRange.criticalLow}
                  stroke="#DC2626"
                  strokeDasharray="5 5"
                  label="Crítico Bajo"
                />
              )}
              
              {/* Normal range */}
              <ReferenceLine
                y={applicableRange.normalMin}
                stroke="#22C55E"
                label="Mín Normal"
              />
              <ReferenceLine
                y={applicableRange.normalMax}
                stroke="#22C55E"
                label="Máx Normal"
              />
              
              {/* Critical high */}
              {applicableRange.criticalHigh && (
                <ReferenceLine
                  y={applicableRange.criticalHigh}
                  stroke="#DC2626"
                  strokeDasharray="5 5"
                  label="Crítico Alto"
                />
              )}

              {/* Result value */}
              <ReferenceLine
                y={resultValue}
                stroke="#2563EB"
                strokeWidth={3}
                label={{ value: `Resultado: ${resultValue}`, position: 'bottom' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default NormalRangeValidator;
