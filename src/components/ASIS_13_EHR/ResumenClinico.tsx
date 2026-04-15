// @ts-nocheck
import React, { useState } from 'react';
import { AlertTriangle, Pill, AlertCircle, Trash2, Plus } from 'lucide-react';

// ============================================================================
// ASIS 13: ResumenClinico Component
// Propósito: Mostrar resumen consolidado de diagnósticos, medicamentos, alergias
// Estado: Editable (si no es readOnly)
// Líneas: ~500
// ============================================================================

interface EHRData {
  id: string;
  summary_note?: string;
  active_problems?: string[];
  medications_active?: string[];
  allergies?: string[];
  last_summary_updated?: string;
}

interface ResumenClinicoProps {
  ehr: EHRData;
  readOnly?: boolean;
}

export const ResumenClinico: React.FC<ResumenClinicoProps> = ({ ehr, readOnly = true }) => {
  const [editMode, setEditMode] = useState(false);
  const [problems, setProblems] = useState(ehr.active_problems || []);
  const [medications, setMedications] = useState(ehr.medications_active || []);
  const [allergies, setAllergies] = useState(ehr.allergies || []);
  const [newProblem, setNewProblem] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddProblem = () => {
    if (newProblem.trim()) {
      setProblems([...problems, newProblem]);
      setNewProblem('');
    }
  };

  const handleRemoveProblem = (index: number) => {
    setProblems(problems.filter((_, i) => i !== index));
  };

  const handleAddMedication = () => {
    if (newMedication.trim()) {
      setMedications([...medications, newMedication]);
      setNewMedication('');
    }
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy]);
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/ehr/${ehr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_problems: problems,
          medications_active: medications,
          allergies: allergies
        })
      });
      if (response.ok) {
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH EDIT BUTTON */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Resumen Consolidado</h2>
          {ehr.last_summary_updated && (
            <p className="text-xs text-gray-600 mt-1">
              Última actualización: {new Date(ehr.last_summary_updated).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
        {!readOnly && editMode && (
          <button
            onClick={() => setEditMode(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
        {!readOnly && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Editar
          </button>
        )}
      </div>

      {/* SUMMARY NOTE */}
      {ehr.summary_note && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">RESUMEN GENERADO AUTOMÁTICAMENTE</p>
          <p className="text-gray-900 text-sm">{ehr.summary_note}</p>
        </div>
      )}

      {/* PROBLEMAS/DIAGNÓSTICOS ACTIVOS */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-lg">Problemas Activos (ICD-10)</h3>
        
        {editMode ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newProblem}
                onChange={(e) => setNewProblem(e.target.value)}
                placeholder="Ej: E10 (Diabetes Type 1) o I10 (Hypertension)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddProblem()}
              />
              <button
                onClick={handleAddProblem}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="space-y-2">
              {problems.map((problem, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                  <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-sm font-mono">
                    {problem}
                  </code>
                  <button
                    onClick={() => handleRemoveProblem(idx)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {problems.length > 0 ? (
              problems.map((problem, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <code className="text-red-700 font-mono text-sm font-semibold">{problem}</code>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm col-span-2">Sin problemas registrados</p>
            )}
          </div>
        )}
      </div>

      {/* MEDICAMENTOS VIGENTES */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Pill className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-lg">Medicamentos Vigentes</h3>
        </div>

        {editMode ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Ej: Metformin 500mg BID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddMedication()}
              />
              <button
                onClick={handleAddMedication}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="space-y-2">
              {medications.map((med, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                  <span className="text-sm text-gray-900">{med}</span>
                  <button
                    onClick={() => handleRemoveMedication(idx)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {medications.length > 0 ? (
              medications.map((med, idx) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-900 font-medium text-sm">{med}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Sin medicamentos prescritos</p>
            )}
          </div>
        )}
      </div>

      {/* ALERGIAS */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-900 text-lg">Alergias Documentadas</h3>
          {allergies.length > 0 && (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
        </div>

        {editMode ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Ej: Penicillin - Anaphylaxis"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
              />
              <button
                onClick={handleAddAllergy}
                className="px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="space-y-2">
              {allergies.map((allergy, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                  <span className="text-sm text-gray-900">{allergy}</span>
                  <button
                    onClick={() => handleRemoveAllergy(idx)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {allergies.length > 0 ? (
              allergies.map((allergy, idx) => (
                <div key={idx} className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                  <p className="text-red-900 font-bold text-sm">⚠️ {allergy}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Sin alergias documentadas</p>
            )}
          </div>
        )}
      </div>

      {/* SAVE BUTTON */}
      {editMode && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      )}
    </div>
  );
};

export default ResumenClinico;
