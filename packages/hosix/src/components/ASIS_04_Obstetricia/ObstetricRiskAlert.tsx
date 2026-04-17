import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useObstetricRisk } from '@hosix/hooks/01-obstetrics/useObstetricRisk';
import { AlertTriangle, TrendingUp, Heart, Clock, Users } from 'lucide-react';

interface ObstetricRiskAlertProps {
  pregnancyId: string;
  compactMode?: boolean;
}

interface RiskFactors {
  maternal: string[];
  fetal: string[];
  obstetric: string[];
  complications: string[];
}

const RISK_LEVELS = {
  low: {
    score: 0,
    label: 'Riesgo Bajo',
    color: 'bg-green-50 border-green-300',
    icon: '✓',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  moderate: {
    score: 1,
    label: 'Riesgo Moderado',
    color: 'bg-yellow-50 border-yellow-300',
    icon: '⚠️',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  high: {
    score: 2,
    label: 'Riesgo Alto',
    color: 'bg-orange-50 border-orange-300',
    icon: '⚠️',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
  },
  critical: {
    score: 3,
    label: 'Riesgo Crítico',
    color: 'bg-red-50 border-red-300',
    icon: '🚨',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

export const ObstetricRiskAlert: React.FC<ObstetricRiskAlertProps> = ({
  pregnancyId,
  compactMode = false,
}) => {
  const { riskScore, riskFactors, loading, error } = useObstetricRisk(pregnancyId);
  const [riskLevel, setRiskLevel] = useState<'low' | 'moderate' | 'high' | 'critical'>('low');
  const [recommendation, setRecommendation] = useState<string>('');

  useEffect(() => {
    // Determinar nivel de riesgo basado en score (0-100)
    if (riskScore < 20) {
      setRiskLevel('low');
      setRecommendation('Seguimiento rutinario en APS. Próxima cita en 4 semanas.');
    } else if (riskScore < 50) {
      setRiskLevel('moderate');
      setRecommendation('Seguimiento prenatal mensual por médico/obstetra. Educación sobre signos de alerta.');
    } else if (riskScore < 80) {
      setRiskLevel('high');
      setRecommendation('Seguimiento quincenal por especialista. Considerar hospitalización intraparto en centro de referencia.');
    } else {
      setRiskLevel('critical');
      setRecommendation('URGENCIA: Evaluación inmediata. Considerar internación y valorar madurez fetal para terminación del embarazo.');
    }
  }, [riskScore]);

  if (loading) return <div>Calculando puntaje de riesgo...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  const riskConfig = RISK_LEVELS[riskLevel];

  // Compact Mode - Solo muestra el badge de riesgo
  if (compactMode) {
    return (
      <Badge className={`${riskConfig.bgColor} ${riskConfig.textColor}`}>
        {riskConfig.icon} {riskConfig.label} ({riskScore}%)
      </Badge>
    );
  }

  // Full Mode - Vista completa
  return (
    <div className="space-y-4">
      {/* Main Risk Card */}
      <Card className={`border-2 ${riskConfig.color}`}>
        <CardHeader className={riskConfig.bgColor}>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {riskConfig.icon}
                {riskConfig.label}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Puntaje de Riesgo Obstétrico
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{riskScore}%</div>
              <p className="text-xs text-gray-600">sobre 100</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Risk Gauge */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs text-gray-600 font-medium">0%</div>
              <div className="flex-1 h-4 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-600 relative">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-800 rounded shadow-lg transition-all"
                  style={{ left: `${riskScore}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 font-medium">100%</div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Bajo</span>
              <span>Moderado</span>
              <span>Alto</span>
              <span>Crítico</span>
            </div>
          </div>

          {/* Recommendations */}
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              {recommendation}
            </AlertDescription>
          </Alert>

          {/* Risk Factors by Category */}
          {riskFactors && Object.keys(riskFactors).length > 0 && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              {riskFactors.maternal && riskFactors.maternal.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <p className="font-medium text-sm">Factores Maternos</p>
                  </div>
                  <div className="space-y-1 ml-6">
                    {riskFactors.maternal.map((factor, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        • {factor}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {riskFactors.fetal && riskFactors.fetal.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-600" />
                    <p className="font-medium text-sm">Factores Fetales</p>
                  </div>
                  <div className="space-y-1 ml-6">
                    {riskFactors.fetal.map((factor, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        • {factor}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {riskFactors.obstetric && riskFactors.obstetric.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <p className="font-medium text-sm">Factores Obstétricos</p>
                  </div>
                  <div className="space-y-1 ml-6">
                    {riskFactors.obstetric.map((factor, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        • {factor}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {riskFactors.complications && riskFactors.complications.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t-2 border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="font-medium text-sm text-red-700">Complicaciones Actuales</p>
                  </div>
                  <div className="space-y-1 ml-6">
                    {riskFactors.complications.map((complication, idx) => (
                      <p key={idx} className="text-sm text-red-700">
                        • {complication}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monitoring Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan de Monitoreo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {riskLevel === 'low' && (
            <>
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="font-medium text-sm text-green-900">✓ Gestación de Bajo Riesgo</p>
                <ul className="text-sm text-green-800 mt-2 space-y-1 ml-4">
                  <li>• Control en APS cada 4 semanas</li>
                  <li>• Educación prenatal continua</li>
                  <li>• Parto vaginal planificado en APS si es primigesta</li>
                  <li>• Envío a hospital de referencia ante complicaciones</li>
                </ul>
              </div>
            </>
          )}

          {riskLevel === 'moderate' && (
            <>
              <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="font-medium text-sm text-yellow-900">⚠️ Gestación de Riesgo Moderado</p>
                <ul className="text-sm text-yellow-800 mt-2 space-y-1 ml-4">
                  <li>• Control mensual con especialista (obstetra)</li>
                  <li>• Monitoreo fetal según indicación</li>
                  <li>• Evaluación anestésica prenatal</li>
                  <li>• Parto en hospital de segundo nivel</li>
                  <li>• Acompañante y apoyo emocional</li>
                </ul>
              </div>
            </>
          )}

          {riskLevel === 'high' && (
            <>
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <p className="font-medium mb-2">⚠️ Gestación de Riesgo Alto</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Control quincenal con especialista</li>
                    <li>• Monitoreo fetal regular (cada 1-2 semanas)</li>
                    <li>• Ecocardiografía fetal si hay cardiopatía materna</li>
                    <li>• Evaluación anestésica e internación para parto</li>
                    <li>• Parto en hospital de tercer nivel</li>
                    <li>• Neonatólogo presente en parto</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}

          {riskLevel === 'critical' && (
            <>
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <p className="font-bold mb-2">🚨 GESTACIÓN DE RIESGO CRÍTICO - REQUIERE MANEJO ESPECIALIZADO</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Consulta inmediata con medicina materno-fetal</li>
                    <li>• Internación para monitoreo continuo</li>
                    <li>• Monitoreo fetal frecuente (diario o más)</li>
                    <li>• Evaluación de necesidad de parto prematuro</li>
                    <li>• Traslado a centro de referencia 3r nivel</li>
                    <li>• Equipo multidisciplinario: obstetricia, neonatología, anestesiología, intensivismo</li>
                    <li>• Preparación para posibles complicaciones materno-fetales</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Clinical Reminders */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">Recordatorio Clínico</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-700">
          <p>
            <strong>Signos de Alerta:</strong> Toda gestante debe saber cuándo acudir a urgencias:
            sangrado vaginal, dolor severo, edema facial, cefalea severa, epigastralgia, pérdida de visión, mareos severos,
            disminución de movimientos fetales.
          </p>
          <p>
            <strong>Revaluación:</strong> El puntaje de riesgo debe recalcularse en cada control.
            Nueva complicación puede elevar el riesgo rapidamente.
          </p>
          <p>
            <strong>Empoderamiento:</strong> La gestante y su familia deben entender sus factores de riesgo
            y participar en decisiones sobre cuidado prenatal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ObstetricRiskAlert;
