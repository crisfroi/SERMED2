/**
 * HOSIX - Module 16: Prescription Form
 * Componente para crear prescripciones
 */

import React, { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { usePermissions } from '@/hooks/usePermissions';

export interface PrescriptionItem {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface PrescriptionFormProps {
  patientId: string;
  onSave?: (prescription: PrescriptionItem[]) => void;
  onCancel?: () => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  patientId,
  onSave,
  onCancel,
}) => {
  const { addNotification } = useApp();
  const { isDoctor } = usePermissions();
  const [medications, setMedications] = useState<PrescriptionItem[]>([
    { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleMedicationChange = (
    index: number,
    field: keyof PrescriptionItem,
    value: string
  ) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validMeds = medications.filter((m) => m.medicationName.trim());

    if (validMeds.length === 0) {
      addNotification('error', 'Agrega al menos una medicación');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Save to database
      addNotification('success', 'Prescripción guardada exitosamente');
      onSave?.(validMeds);
    } catch (error: any) {
      addNotification('error', error.message || 'Error al guardar prescripción');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDoctor()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p>⚠️ Solo doctores pueden crear prescripciones</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <h3 className="text-lg font-semibold text-gray-900">Nueva Prescripción</h3>

      {/* Medications */}
      <div className="space-y-4">
        {medications.map((med, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-900">
                Medicación {index + 1}
              </h4>
              {medications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  ✕ Eliminar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Medication Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Medicamento *
                </label>
                <input
                  type="text"
                  value={med.medicationName}
                  onChange={(e) =>
                    handleMedicationChange(index, 'medicationName', e.target.value)
                  }
                  placeholder="Ej: Amoxicilina"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosis *
                </label>
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) =>
                    handleMedicationChange(index, 'dosage', e.target.value)
                  }
                  placeholder="Ej: 500mg"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia *
                </label>
                <select
                  value={med.frequency}
                  onChange={(e) =>
                    handleMedicationChange(index, 'frequency', e.target.value)
                  }
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="cada 4 horas">Cada 4 horas</option>
                  <option value="cada 6 horas">Cada 6 horas</option>
                  <option value="cada 8 horas">Cada 8 horas</option>
                  <option value="cada 12 horas">Cada 12 horas</option>
                  <option value="una vez al día">Una vez al día</option>
                  <option value="dos veces al día">Dos veces al día</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración *
                </label>
                <input
                  type="text"
                  value={med.duration}
                  onChange={(e) =>
                    handleMedicationChange(index, 'duration', e.target.value)
                  }
                  placeholder="Ej: 7 días"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Instructions */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instrucciones
                </label>
                <textarea
                  value={med.instructions}
                  onChange={(e) =>
                    handleMedicationChange(index, 'instructions', e.target.value)
                  }
                  placeholder="Tomar con alimentos, no conducir, evitar alcohol, etc."
                  disabled={isLoading}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Medication Button */}
      <button
        type="button"
        onClick={addMedication}
        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
      >
        + Agregar medicación
      </button>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isLoading ? 'Guardando...' : 'Guardar prescripción'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default PrescriptionForm;
