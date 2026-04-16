// ============================================================================
// ComorbidityAssessment.tsx - Comorbidity Detection & Risk Assessment
// ASIS 14.0 - Diagnóstico Unificado
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useComorbidity } from '@/hooks/useComorbidity';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  AlertTriangle,
  Activity,
  TrendingUp,
  Info,
  Loader2,
  AlertCircle,
  Heart,
  Brain,
  Zap,
} from 'lucide-react';

interface ComorbidityAssessmentProps {
  patientId: string;
  primaryDiagnosis?: string;
  onUpdate?: (comorbidities: any[]) => void;
}

interface ComorbidityItem {
  id: string;
  name: string;
  icdCode: string;
  riskScore: number;
  severity: 'low' | 'medium' | 'high';
  frequencyPercent: number;
  treatmentImpact: string;
  drugInteractions: number;
}

interface RiskProfile {
  charlsonIndex: number;
  elixhauserScore: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very-high';
  hospitalReadmissionRisk: number;
}

export const ComorbidityAssessment: React.FC<ComorbidityAssessmentProps> = ({
  patientId,
  primaryDiagnosis,
  onUpdate,
}) => {
  const { detectComorbidities, calculateRiskScores, treatmentRecommendations, loading, error } =
    useComorbidity(patientId, primaryDiagnosis);

  const [comorbidities, setComorbidities] = useState<ComorbidityItem[]>([]);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [selectedComorbidity, setSelectedComorbidity] = useState<ComorbidityItem | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    performAssessment();
  }, [patientId, primaryDiagnosis]);

  const performAssessment = async () => {
    try {
      const comorbidData = await detectComorbidities();
      setComorbidities(comorbidData);

      const riskData = await calculateRiskScores(comorbidData);
      setRiskProfile(riskData);

      const recommendations = await treatmentRecommendations(comorbidData);
      setRecommendations(recommendations);

      onUpdate?.(comorbidData);
    } catch (err) {
      console.error('Error assessing comorbidities:', err);
    }
  };

  const severityColors = {
    low: 'bg-green-50 border-green-200 text-green-700',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    high: 'bg-red-50 border-red-200 text-red-700',
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <Info className="h-5 w-5 text-green-600" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const riskCategoryColors = {
    low: 'text-green-600 bg-green-50',
    moderate: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    'very-high': 'text-red-600 bg-red-50',
  };

  const chartData = comorbidities.map((c) => ({
    name: c.name.substring(0, 15),
    riskScore: c.riskScore,
    frequency: c.frequencyPercent,
    interactions: c.drugInteractions,
  }));

  const riskCategoryLabel = {
    low: 'Riesgo Bajo',
    moderate: 'Riesgo Moderado',
    high: 'Riesgo Alto',
    'very-high': 'Riesgo Muy Alto',
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Risk Profile Overview */}
      {riskProfile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Índice Charlson</p>
                  <p className="text-3xl font-bold">{riskProfile.charlsonIndex}</p>
                </div>
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Puntuación Elixhauser</p>
                  <p className="text-3xl font-bold">{riskProfile.elixhauserScore}</p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Categoría de Riesgo</p>
                  <p className={`font-bold text-lg ${riskCategoryColors[riskProfile.riskCategory]}`}>
                    {riskCategoryLabel[riskProfile.riskCategory]}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Riesgo de Reingreso</p>
                  <p className="text-3xl font-bold text-red-600">
                    {riskProfile.hospitalReadmissionRisk.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comorbidities Chart */}
      {!loading && comorbidities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Puntuaciones de Riesgo por Comorbilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="riskScore" fill="#ef4444" name="Puntuación Riesgo" />
                <Bar dataKey="interactions" fill="#3b82f6" name="Interacciones" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Comorbidities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Comorbilidades Detectadas ({comorbidities.length})
          </CardTitle>
          <CardDescription>
            Condiciones médicas concomitantes que afectan el tratamiento y el riesgo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : comorbidities.length > 0 ? (
            <div className="space-y-3">
              {comorbidities.map((comorbidity) => (
                <div
                  key={comorbidity.id}
                  onClick={() => setSelectedComorbidity(comorbidity)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${severityColors[comorbidity.severity]} ${
                    selectedComorbidity?.id === comorbidity.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(comorbidity.severity)}
                      <div>
                        <h4 className="font-semibold">{comorbidity.name}</h4>
                        <p className="text-xs opacity-75">{comorbidity.icdCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{comorbidity.severity.toUpperCase()}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-xs opacity-75">Puntuación Riesgo</p>
                      <p className="font-semibold">{comorbidity.riskScore}/100</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75">Prevalencia</p>
                      <p className="font-semibold">{comorbidity.frequencyPercent}%</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75">Interacciones Drogas</p>
                      <p className="font-semibold">{comorbidity.drugInteractions}</p>
                    </div>
                  </div>

                  <p className="text-sm mt-3 opacity-90">{comorbidity.treatmentImpact}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Sin comorbilidades significativas detectadas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatment Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendaciones de Tratamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, index) => (
              <Alert key={index}>
                <AlertDescription>
                  <p className="font-semibold text-sm mb-1">{rec.title}</p>
                  <p className="text-xs text-gray-600">{rec.description}</p>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={performAssessment}>
          Reevaluar
        </Button>
        <Button>Guardar Evaluación</Button>
      </div>
    </div>
  );
};

export default ComorbidityAssessment;
