/**
 * HOSIX - Module 16: Diagnosis Form (CLINICAL)
 * Componente para registrar diagnósticos
 */

import React, { useState } from 'react';
import { useApp } from '@hosix/hooks/shared/useApp';
import { usePermissions } from '@hosix/hooks/shared/usePermissions';

export interface DiagnosisFormProps {
  patientId: string;
  onSave?: (diagnosis: DiagnosisData) => void;
  onCancel?: () => void;
}

export interface DiagnosisData {
  icdCode: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  onset: string;
  notes: string;
}

export const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  patientId,
  onSave,
  onCancel,
}) => {
  const { addNotification } = useApp();
  const { isDoctor } = usePermissions();
  const [formData, setFormData] = useState<DiagnosisData>({
    icdCode: '',
    description: '',
    severity: 'moderate',
    onset: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.icdCode.trim() || !formData.description.trim()) {
      addNotification('error', 'Código ICD y descripción son requeridos');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Save to database
      addNotification('success', 'Diagnóstico guardado exitosamente');
      onSave?.(formData);
    } catch (error: any) {
      addNotification('error', error.message || 'Error al guardar diagnóstico');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDoctor()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p>⚠️ Solo doctores pueden crear diagnósticos</p>
      </div>
    );
  }

  const severityColors = {
    mild: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    severe: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900">Nuevo Diagnóstico</h3>

      {/* ICD Code */}
      <div className="space-y-2">
        <label htmlFor="icdCode" className="block text-sm font-medium text-gray-700">
          Código ICD-10 *
        </label>
        <input
          id="icdCode"
          name="icdCode"
          type="text"
          value={formData.icdCode}
          onChange={handleInputChange}
          placeholder="Ej: E11.9 (Diabetes Tipo 2)"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-600">
          Ingresa el código ICD-10 del diagnóstico
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe el diagnóstico con detalle"
          disabled={isLoading}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Severity And Onset */}
      <div className="grid grid-cols-2 gap-4">
        {/* Severity */}
        <div className="space-y-2">
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
            Severidad
          </label>
          <select
            id="severity"
            name="severity"
            value={formData.severity}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mild">Leve</option>
            <option value="moderate">Moderado</option>
            <option value="severe">Severo</option>
            <option value="critical">Crítico</option>
          </select>
        </div>

        {/* Onset Date */}
        <div className="space-y-2">
          <label htmlFor="onset" className="block text-sm font-medium text-gray-700">
            Fecha de Inicio
          </label>
          <input
            id="onset"
            name="onset"
            type="date"
            value={formData.onset}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notas Adicionales
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Información adicional relevante"
          disabled={isLoading}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isLoading ? 'Guardando...' : 'Guardar diagnóstico'}
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

export default DiagnosisForm;
