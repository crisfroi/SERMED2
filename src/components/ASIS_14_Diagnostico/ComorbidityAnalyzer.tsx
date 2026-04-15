// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  TrendingUp,
  Zap,
  BarChart3,
  LinkIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { useComorbidityAnalysis } from '@/hooks/useComorbidityAnalysis';

interface ComorbidityRelationship {
  diagnosisA: string;
  diagnosisB: string;
  relationship: 'temporal' | 'causal' | 'independent' | 'complication' | 'sequential';
  severityMultiplier: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  interactionRisk: string;
  managementImpact: string;
}

interface ComorbidityMetrics {
  totalDiagnoses: number;
  comorbidityCount: number;
  complexityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recentAlerts: number;
  treatmentComplications: string[];
}

interface ComorbidityAnalyzerProps {
  patientId: string;
  onAlert?: (message: string) => void;
}

const RELATIONSHIP_COLORS = {
  temporal: 'bg-blue-100 text-blue-800',
  causal: 'bg-red-100 text-red-800',
  independent: 'bg-gray-100 text-gray-800',
  complication: 'bg-orange-100 text-orange-800',
  sequential: 'bg-purple-100 text-purple-800',
};

const RELATIONSHIP_LABELS = {
  temporal: 'Temporal',
  causal: 'Causal',
  independent: 'Independiente',
  complication: 'Complicación',
  sequential: 'Secuencial',
};

const RISK_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function ComorbidityAnalyzer({
  patientId,
  onAlert,
}: ComorbidityAnalyzerProps) {
  const [comorbidities, setComorbidities] = useState<ComorbidityRelationship[]>([]);
  const [metrics, setMetrics] = useState<ComorbidityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedComorbidity, setExpandedComorbidity] = useState<number | null>(null);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | ComorbidityRelationship['riskLevel']>('all');

  const { analyzeComorbidities, getComorbidityMetrics } = useComorbidityAnalysis(patientId);

  useEffect(() => {
    loadComorbidityData();
  }, [patientId]);

  const loadComorbidityData = async () => {
    try {
      setLoading(true);
      const comorbidityData = await analyzeComorbidities();
      const metricsData = await getComorbidityMetrics();

      setComorbidities(comorbidityData);
      setMetrics(metricsData);

      // Alert for critical comorbidities
      const criticalCount = comorbidityData.filter(
        (c) => c.riskLevel === 'critical'
      ).length;
      if (criticalCount > 0) {
        onAlert?.(
          `⚠️ Se detectaron ${criticalCount} comorbilidad(es) crítica(s)`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error analyzing comorbidities');
    } finally {
      setLoading(false);
    }
  };

  const filteredComorbidities = comorbidities.filter(
    (c) => selectedRiskFilter === 'all' || c.riskLevel === selectedRiskFilter
  );

  // Prepare complexity chart data
  const complexityData = {
    labels: ['Diagnósticos', 'Comorbilidades'],
    values: [metrics?.totalDiagnoses || 0, metrics?.comorbidityCount || 0],
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-gray-600">
              Analizando comorbilidades...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-600">
            No hay datos de comorbilidades disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="ml-2 text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {metrics.totalDiagnoses}
              </p>
              <p className="text-xs text-gray-600">Diagnósticos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {metrics.comorbidityCount}
              </p>
              <p className="text-xs text-gray-600">Comorbilidades</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {(metrics.complexityScore * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">Complejidad</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {metrics.recentAlerts}
              </p>
              <p className="text-xs text-gray-600">Alertas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Level Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nivel de Riesgo General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge
                className={
                  metrics.riskLevel === 'low'
                    ? 'bg-green-100 text-green-800'
                    : metrics.riskLevel === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : metrics.riskLevel === 'high'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {metrics.riskLevel.toUpperCase()}
              </Badge>
              <p className="mt-2 text-sm text-gray-600">
                {metrics.riskLevel === 'low'
                  ? '✓ Bajo riesgo por comorbilidades'
                  : metrics.riskLevel === 'medium'
                  ? '⚠ Riesgo moderado detectado'
                  : metrics.riskLevel === 'high'
                  ? '⚠️ Alto riesgo por comorbilidades'
                  : '🚨 Riesgo crítico - intervención requerida'}
              </p>
            </div>

            {metrics.treatmentComplications.length > 0 && (
              <div className="text-right">
                <p className="text-sm font-medium text-red-700">
                  Complicaciones de Tratamiento:
                </p>
                <ul className="mt-1 space-y-1 text-xs text-gray-600">
                  {metrics.treatmentComplications.slice(0, 3).map((comp, idx) => (
                    <li key={idx}>• {comp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complexity Chart */}
      {comorbidities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Comorbilidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {['temporal', 'causal', 'complication', 'independent'].map(
                (type) => {
                  const count = comorbidities.filter(
                    (c) => c.relationship === type
                  ).length;
                  return (
                    <div
                      key={type}
                      className="rounded-lg bg-gray-50 p-3"
                    >
                      <p className="text-xs text-gray-600 uppercase">
                        {RELATIONSHIP_LABELS[type as keyof typeof RELATIONSHIP_LABELS]}
                      </p>
                      <p className="text-lg font-bold text-primary">{count}</p>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comorbidities List */}
      {comorbidities.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Comorbilidades</CardTitle>
            <CardDescription>
              Relaciones detectadas entre diagnósticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Risk Filter */}
            <div className="flex gap-2">
              {(['all', 'low', 'medium', 'high', 'critical'] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedRiskFilter(filter)}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      selectedRiskFilter === filter
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'all'
                      ? `Todos (${comorbidities.length})`
                      : `${filter.charAt(0).toUpperCase() + filter.slice(1)} (${
                          comorbidities.filter((c) => c.riskLevel === filter)
                            .length
                        })`}
                  </button>
                )
              )}
            </div>

            {/* Comorbidities */}
            <div className="space-y-2">
              {filteredComorbidities.map((comorbidity, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200"
                >
                  <div
                    className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100"
                    onClick={() =>
                      setExpandedComorbidity(
                        expandedComorbidity === idx ? null : idx
                      )
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {comorbidity.diagnosisA} ↔ {comorbidity.diagnosisB}
                        </span>
                        <Badge
                          className={
                            RELATIONSHIP_COLORS[
                              comorbidity.relationship as keyof typeof RELATIONSHIP_COLORS
                            ]
                          }
                        >
                          {
                            RELATIONSHIP_LABELS[
                              comorbidity.relationship as keyof typeof RELATIONSHIP_LABELS
                            ]
                          }
                        </Badge>
                        <Badge className={RISK_COLORS[comorbidity.riskLevel]}>
                          {comorbidity.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {expandedComorbidity === idx ? (
                      <ChevronUp className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    )}
                  </div>

                  {expandedComorbidity === idx && (
                    <div className="border-t px-4 py-3 space-y-3">
                      <div>
                        <p className="font-medium text-sm">Riesgo de Interacción:</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {comorbidity.interactionRisk}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-sm">
                          Impacto en Manejo:
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {comorbidity.managementImpact}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded bg-blue-50 p-2">
                          <p className="text-xs text-blue-700 font-medium">
                            Multiplicador de Severidad
                          </p>
                          <p className="text-blue-900 font-bold">
                            {(comorbidity.severityMultiplier * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="rounded bg-red-50 p-2">
                          <p className="text-xs text-red-700 font-medium">
                            Nivel de Riesgo
                          </p>
                          <p className="text-red-900 font-bold">
                            {comorbidity.riskLevel.charAt(0).toUpperCase() +
                              comorbidity.riskLevel.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-8 text-center">
          <p className="text-green-700 font-medium">
            ✓ No se detectaron comorbilidades
          </p>
        </Card>
      )}

      {/* Clinical Recommendations */}
      {metrics.riskLevel !== 'low' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="ml-2 text-orange-800">
            <strong>Recomendaciones Clínicas:</strong> Se recomienda realizar un
            seguimiento más frecuente y revisar el plan de tratamiento considerando
            todas las comorbilidades detectadas.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default ComorbidityAnalyzer;
