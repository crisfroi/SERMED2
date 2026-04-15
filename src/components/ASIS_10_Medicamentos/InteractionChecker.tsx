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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useInteractionChecker } from '@/hooks/useInteractionChecker';

interface DrugInteraction {
  medicationA: string;
  medicationB: string;
  severity: 'minor' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
  management: string;
  evidence: string;
}

interface InteractionCheckerProps {
  patientId: string;
  currentMedications: string[]; // medication IDs
  proposedMedicationId?: string; // If checking one new med against current ones
  onRefresh?: () => void;
}

const SEVERITY_CONFIG = {
  minor: {
    color: 'bg-blue-100 text-blue-800',
    icon: <Zap className="h-4 w-4" />,
    borderColor: 'border-l-4 border-blue-500',
    label: 'Menor',
  },
  moderate: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: <AlertTriangle className="h-4 w-4" />,
    borderColor: 'border-l-4 border-yellow-500',
    label: 'Moderado',
  },
  severe: {
    color: 'bg-orange-100 text-orange-800',
    icon: <AlertCircle className="h-4 w-4" />,
    borderColor: 'border-l-4 border-orange-500',
    label: 'Severo',
  },
  contraindicated: {
    color: 'bg-red-100 text-red-800',
    icon: <AlertCircle className="h-4 w-4" />,
    borderColor: 'border-l-4 border-red-600',
    label: 'Contraindicado',
  },
};

export function InteractionChecker({
  patientId,
  currentMedications,
  proposedMedicationId,
  onRefresh,
}: InteractionCheckerProps) {
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInteraction, setExpandedInteraction] = useState<number | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | DrugInteraction['severity']>('all');
  const [error, setError] = useState<string | null>(null);

  const { checkMedicationInteractions, riskScore } = useInteractionChecker(patientId);

  useEffect(() => {
    checkInteractions();
  }, [currentMedications, proposedMedicationId]);

  const checkInteractions = async () => {
    try {
      setLoading(true);
      const medicationsToCheck = proposedMedicationId
        ? [proposedMedicationId, ...currentMedications]
        : currentMedications;

      const detected = await checkMedicationInteractions(medicationsToCheck);
      setInteractions(detected);
    } catch (err: any) {
      setError(err.message || 'Error checking interactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredInteractions = interactions.filter(
    (i) => severityFilter === 'all' || i.severity === severityFilter
  );

  const riskLevel = riskScore();
  const riskColor = 
    riskLevel > 0.7 ? 'text-red-600' : 
    riskLevel > 0.4 ? 'text-yellow-600' : 
    'text-green-600';

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-gray-600">Analizando interacciones...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasCritical = interactions.some(
    (i) => i.severity === 'severe' || i.severity === 'contraindicated'
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Verificador de Interacciones</CardTitle>
              <CardDescription>
                Análisis de interacciones medicamentosas
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Riesgo Detectado</p>
              <p className={`text-2xl font-bold ${riskColor}`}>
                {(riskLevel * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="ml-2 text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {hasCritical && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="ml-2 text-red-800">
                <strong>⚠️ Interacciones críticas detectadas.</strong> Se recomienda revisar
                antes de prescribir.
              </AlertDescription>
            </Alert>
          )}

          {interactions.length === 0 ? (
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="font-medium text-green-900">✓ Sin interacciones detectadas</p>
              <p className="mt-1 text-sm text-green-800">
                Combinación segura de medicamentos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                {['all', 'minor', 'moderate', 'severe', 'contraindicated'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSeverityFilter(filter as any)}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      severityFilter === filter
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'all'
                      ? `Todos (${interactions.length})`
                      : `${SEVERITY_CONFIG[filter as keyof typeof SEVERITY_CONFIG].label} (${
                          interactions.filter((i) => i.severity === filter).length
                        })`}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredInteractions.map((interaction, idx) => {
                  const config = SEVERITY_CONFIG[interaction.severity];
                  const isExpanded = expandedInteraction === idx;

                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border ${config.borderColor} bg-white p-3`}
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() =>
                          setExpandedInteraction(isExpanded ? null : idx)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`rounded-full p-1 ${config.color}`}>
                                {config.icon}
                              </div>
                              <span className="font-medium">
                                {interaction.medicationA} + {interaction.medicationB}
                              </span>
                              <Badge className={config.color}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-gray-700">
                              {interaction.description}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="ml-4 h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="ml-4 h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          <div>
                            <p className="font-medium text-sm">Manejo Recomendado:</p>
                            <p className="text-sm text-gray-700">
                              {interaction.management}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Nivel de Evidencia:</p>
                            <Badge variant="outline">{interaction.evidence}</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Riesgo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-green-900 font-medium">
                {interactions.filter((i) => i.severity === 'minor').length}
              </p>
              <p className="text-xs text-green-700">Interacciones Menores</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-yellow-900 font-medium">
                {interactions.filter((i) => i.severity === 'moderate').length}
              </p>
              <p className="text-xs text-yellow-700">Interacciones Moderadas</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-3">
              <p className="text-orange-900 font-medium">
                {interactions.filter((i) => i.severity === 'severe').length}
              </p>
              <p className="text-xs text-orange-700">Interacciones Severas</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-red-900 font-medium">
                {interactions.filter((i) => i.severity === 'contraindicated').length}
              </p>
              <p className="text-xs text-red-700">Contraindicadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InteractionChecker;
