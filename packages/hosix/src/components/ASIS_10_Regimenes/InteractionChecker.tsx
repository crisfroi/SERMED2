// ============================================================================
// InteractionChecker.tsx - Medication Interaction Detection Component
// ASIS 10.0 - Regímenes de Medicación - Validación de Interacciones
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInteractionChecker } from '@hosix/hooks/06-medications/useInteractionChecker';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Filter,
} from 'lucide-react';

interface InteractionCheckerProps {
  medicationIds: string[];
  patientId: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface InteractionDisplay {
  id: string;
  medication1: string;
  medication2: string;
  severity: 'critical' | 'moderate' | 'mild';
  interaction: string;
  management: string;
  expanded: boolean;
  alternatives?: string[];
}

export const InteractionChecker: React.FC<InteractionCheckerProps> = ({
  medicationIds,
  patientId,
  onConfirm,
  onCancel,
}) => {
  const { checkInteractions, loading, error } = useInteractionChecker(patientId);
  const [interactions, setInteractions] = useState<InteractionDisplay[]>([]);
  const [checked, setChecked] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'moderate' | 'mild'>(
    'all'
  );

  React.useEffect(() => {
    if (medicationIds.length > 0) {
      performCheck();
    }
  }, [medicationIds]);

  const performCheck = async () => {
    try {
      const result = await checkInteractions(medicationIds);
      const displayInteractions: InteractionDisplay[] = result.map(
        (interaction: any, index: number) => ({
          id: `interaction-${index}`,
          medication1: interaction.medication1_name,
          medication2: interaction.medication2_name,
          severity: interaction.severity,
          interaction: interaction.interaction_description,
          management: interaction.management_recommendation,
          expanded: false,
          alternatives: interaction.alternative_medications || [],
        })
      );
      setInteractions(displayInteractions);
      setChecked(true);
    } catch (err) {
      console.error('Error checking interactions:', err);
    }
  };

  const toggleInteraction = (id: string) => {
    setInteractions(
      interactions.map((interaction) =>
        interaction.id === id ? { ...interaction, expanded: !interaction.expanded } : interaction
      )
    );
  };

  const filteredInteractions = interactions.filter((i) =>
    severityFilter === 'all' ? true : i.severity === severityFilter
  );

  const criticalCount = interactions.filter((i) => i.severity === 'critical').length;
  const moderateCount = interactions.filter((i) => i.severity === 'moderate').length;
  const mildCount = interactions.filter((i) => i.severity === 'mild').length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'mild':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'moderate':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'mild':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Validador de Interacciones</CardTitle>
              <CardDescription>
                Detectar interacciones medicamentosas y recomendaciones de manejo
              </CardDescription>
            </div>
            {checked && (
              <div className="flex items-center gap-1">
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {criticalCount} Crítica{criticalCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                {moderateCount > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {moderateCount} Moderada{moderateCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                {mildCount > 0 && (
                  <Badge className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {mildCount} Leve{mildCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!checked ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Analizando interacciones...</p>
            </div>
          ) : interactions.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✓ No se detectaron interacciones significativas entre los medicamentos seleccionados.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 pb-4 border-b">
                <Button
                  size="sm"
                  variant={severityFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSeverityFilter('all')}
                  className="flex items-center gap-1"
                >
                  <Filter className="h-3 w-3" />
                  Todas ({interactions.length})
                </Button>
                {criticalCount > 0 && (
                  <Button
                    size="sm"
                    variant={severityFilter === 'critical' ? 'default' : 'outline'}
                    onClick={() => setSeverityFilter('critical')}
                    className="flex items-center gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Críticas ({criticalCount})
                  </Button>
                )}
                {moderateCount > 0 && (
                  <Button
                    size="sm"
                    variant={severityFilter === 'moderate' ? 'default' : 'outline'}
                    onClick={() => setSeverityFilter('moderate')}
                    className="flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Moderadas ({moderateCount})
                  </Button>
                )}
                {mildCount > 0 && (
                  <Button
                    size="sm"
                    variant={severityFilter === 'mild' ? 'default' : 'outline'}
                    onClick={() => setSeverityFilter('mild')}
                    className="flex items-center gap-1"
                  >
                    <Info className="h-3 w-3" />
                    Leves ({mildCount})
                  </Button>
                )}
              </div>

              {/* Interactions List */}
              <div className="space-y-3">
                {filteredInteractions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className={`border rounded-lg overflow-hidden ${getSeverityColor(
                      interaction.severity
                    )}`}
                  >
                    {/* Header */}
                    <button
                      onClick={() => toggleInteraction(interaction.id)}
                      className="w-full p-4 flex items-start justify-between hover:bg-black hover:bg-opacity-5 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {getSeverityIcon(interaction.severity)}
                        <div className="text-left">
                          <h4 className="font-semibold">
                            {interaction.medication1} + {interaction.medication2}
                          </h4>
                          <p className="text-sm font-medium">
                            {interaction.severity === 'critical'
                              ? 'Interacción Crítica'
                              : interaction.severity === 'moderate'
                                ? 'Interacción Moderada'
                                : 'Interacción Leve'}
                          </p>
                        </div>
                      </div>
                      {interaction.expanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>

                    {/* Expanded Content */}
                    {interaction.expanded && (
                      <div className="border-t border-current opacity-50 p-4 space-y-3 bg-black bg-opacity-2">
                        <div>
                          <p className="text-xs font-semibold mb-1">INTERACCIÓN:</p>
                          <p className="text-sm">{interaction.interaction}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <p className="text-xs font-semibold">RECOMENDACIÓN:</p>
                          </div>
                          <p className="text-sm">{interaction.management}</p>
                        </div>

                        {interaction.alternatives && interaction.alternatives.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-2">ALTERNATIVAS:</p>
                            <ul className="space-y-1">
                              {interaction.alternatives.map((alt: string, idx: number) => (
                                <li key={idx} className="text-sm flex items-center gap-2">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full"></span>
                                  {alt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {interaction.severity === 'critical' && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Esta interacción requiere revisión médica inmediata. No proceda sin aprobación del
                              prescriptor.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        {onConfirm && (
          <Button
            onClick={onConfirm}
            disabled={criticalCount > 0 && loading}
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {criticalCount > 0 ? 'Confirmar Prescripción' : 'Aceptar y Continuar'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default InteractionChecker;
