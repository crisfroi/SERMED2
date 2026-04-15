// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface DrugInteraction {
  id: string;
  medication_1: string;
  medication_2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  interaction_mechanism: string;
  clinical_effect: string;
  management_recommendation: string;
  onset_timing?: string;
  requires_monitoring: boolean;
}

interface ActivePrescription {
  id: string;
  medication_name: string;
  dose: string;
  frequency: string;
  start_date: string;
}

interface Props {
  patientId: string;
  activePrescriptions?: ActivePrescription[];
  allInteractions?: DrugInteraction[];
  newMedicationName?: string;
}

const severityConfig = {
  minor: { color: 'bg-blue-50', borderColor: 'border-l-blue-500', icon: Info, textColor: 'text-blue-700', badge: 'bg-blue-200 text-blue-800' },
  moderate: { color: 'bg-amber-50', borderColor: 'border-l-amber-500', icon: AlertCircle, textColor: 'text-amber-700', badge: 'bg-amber-200 text-amber-800' },
  major: { color: 'bg-orange-50', borderColor: 'border-l-orange-600', icon: AlertTriangle, textColor: 'text-orange-700', badge: 'bg-orange-200 text-orange-800' },
  contraindicated: { color: 'bg-red-50', borderColor: 'border-l-red-600', icon: AlertTriangle, textColor: 'text-red-700', badge: 'bg-red-200 text-red-800' }
};

export const DrugInteractionChecker: React.FC<Props> = ({
  patientId,
  activePrescriptions = [],
  allInteractions = [],
  newMedicationName
}) => {
  const [detectedInteractions, setDetectedInteractions] = useState<DrugInteraction[]>([]);
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  useEffect(() => {
    // Find interactions involving active prescriptions
    const interactions = allInteractions.filter(interaction => 
      (activePrescriptions.some(p => p.medication_name.toLowerCase().includes(interaction.medication_1.toLowerCase())) ||
       activePrescriptions.some(p => p.medication_name.toLowerCase().includes(interaction.medication_2.toLowerCase()))) &&
      (newMedicationName 
        ? (interaction.medication_1.toLowerCase().includes(newMedicationName.toLowerCase()) ||
           interaction.medication_2.toLowerCase().includes(newMedicationName.toLowerCase()))
        : true)
    );
    setDetectedInteractions(interactions);
  }, [activePrescriptions, allInteractions, newMedicationName]);

  const filteredInteractions = severityFilter
    ? detectedInteractions.filter(i => i.severity === severityFilter)
    : detectedInteractions;

  const severityStats = {
    contraindicated: detectedInteractions.filter(i => i.severity === 'contraindicated').length,
    major: detectedInteractions.filter(i => i.severity === 'major').length,
    moderate: detectedInteractions.filter(i => i.severity === 'moderate').length,
    minor: detectedInteractions.filter(i => i.severity === 'minor').length
  };

  const hasContraindicated = severityStats.contraindicated > 0;
  const hasMajor = severityStats.major > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Verificador de Interacciones Farmacológicas</h2>
      </div>

      {/* Critical Alert */}
      {hasContraindicated && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 mb-1">⚠️ INTERACCIONES CONTRAINDICA DAS DETECTADAS</h3>
              <p className="text-red-800">Se han identificado {severityStats.contraindicated} interacción(es) que son CONTRAINDICA DAS. Consulte inmediatamente con farmacología clínica antes de prescribir.</p>
            </div>
          </div>
        </div>
      )}

      {/* Severity Alert */}
      {hasMajor && !hasContraindicated && (
        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-600 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-orange-900 mb-1">Interacciones Mayores Detectadas</h3>
              <p className="text-orange-800">{severityStats.major} interacción(es) importante(s) requieren monitoreo close o ajuste de dosis.</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-600">
          <p className="text-sm text-gray-600">Contraindica das</p>
          <p className="text-2xl font-bold text-red-700">{severityStats.contraindicated}</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-600">
          <p className="text-sm text-gray-600">Mayores</p>
          <p className="text-2xl font-bold text-orange-700">{severityStats.major}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
          <p className="text-sm text-gray-600">Moderadas</p>
          <p className="text-2xl font-bold text-amber-700">{severityStats.moderate}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Menores</p>
          <p className="text-2xl font-bold text-blue-700">{severityStats.minor}</p>
        </div>
      </div>

      {/* Active Medications Display */}
      {activePrescriptions.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Medicamentos Activos del Paciente</h3>
          <div className="flex flex-wrap gap-2">
            {activePrescriptions.map(med => (
              <div key={med.id} className="px-3 py-2 bg-white border border-gray-300 rounded-full text-sm">
                <span className="font-medium">{med.medication_name}</span>
                <span className="text-gray-600 ml-2">{med.dose} - {med.frequency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Severity Filter */}
      {detectedInteractions.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSeverityFilter(null)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              severityFilter === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Todas ({detectedInteractions.length})
          </button>
          {severityStats.contraindicated > 0 && (
            <button
              onClick={() => setSeverityFilter('contraindicated')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                severityFilter === 'contraindicated' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
              }`}
            >
              Contraindica das ({severityStats.contraindicated})
            </button>
          )}
          {severityStats.major > 0 && (
            <button
              onClick={() => setSeverityFilter('major')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                severityFilter === 'major' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'
              }`}
            >
              Mayores ({severityStats.major})
            </button>
          )}
        </div>
      )}

      {/* Interactions List */}
      <div className="space-y-4">
        {filteredInteractions.length > 0 ? (
          filteredInteractions.map(interaction => {
            const config = severityConfig[interaction.severity];
            const IconComponent = config.icon;
            const isExpanded = selectedInteractionId === interaction.id;

            return (
              <div
                key={interaction.id}
                className={`${config.color} border-l-4 ${config.borderColor} rounded-lg overflow-hidden`}
              >
                <button
                  onClick={() => setSelectedInteractionId(isExpanded ? null : interaction.id)}
                  className="w-full p-4 hover:opacity-90 transition text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <IconComponent className="w-5 h-5 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">
                            {interaction.medication_1} ↔ {interaction.medication_2}
                          </h3>
                          <span className={`inline-block px-2 py-1 text-xs rounded font-medium ${config.badge}`}>
                            {interaction.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {interaction.interaction_mechanism}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-300 bg-white bg-opacity-50 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">Efecto Clínico</h4>
                      <p className="text-sm text-gray-700">{interaction.clinical_effect}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">Recomendación de Manejo</h4>
                      <p className="text-sm text-gray-700 p-3 bg-white rounded border-l-4 border-blue-500">
                        {interaction.management_recommendation}
                      </p>
                    </div>

                    {interaction.requires_monitoring && (
                      <div className="p-3 bg-amber-100 border-l-4 border-amber-500 rounded">
                        <p className="text-sm text-amber-900 font-medium">
                          📊 Requiere monitoreo cercano de parámetros clínicos y/o laboratoriales
                        </p>
                      </div>
                    )}

                    {interaction.onset_timing && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Tiempo de Inicio:</span> {interaction.onset_timing}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">
                        Documentar
                      </button>
                      <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200">
                        Más  Información
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">No se detectaron interacciones significativas</p>
            <p className="text-sm mt-2">El medicamento puede ser prescrito sin conflictos aparentes</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Recomendaciones</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Siempre consultar con farmacología clínica para interacciones mayores</li>
          <li>✓ Educar al paciente sobre interacciones detectadas</li>
          <li>✓ Documentar decisión de prescribir a pesar de interacciones</li>
          <li>✓ Establecer plan de monitoreo específico para cada situación</li>
          <li>✓ Revisar periódicamente la efectividad del tratamiento</li>
        </ul>
      </div>
    </div>
  );
};
