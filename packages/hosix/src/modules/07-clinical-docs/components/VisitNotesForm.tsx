/**
 * HOSIX - FASE 3 Module 16: Clinical Documentation
 * Componentes para gestión de documentos clínicos
 */

import React, { useState } from 'react';
import { useApp } from '@hosix/hooks/shared/useApp';
import { usePermissions } from '@hosix/hooks/shared/usePermissions';

export interface VisitNotesFormProps {
  patientId: string;
  existingNotes?: string;
  onSave?: (notes: string) => void;
  onCancel?: () => void;
}

export const VisitNotesForm: React.FC<VisitNotesFormProps> = ({
  patientId,
  existingNotes = '',
  onSave,
  onCancel,
}) => {
  const { addNotification } = useApp();
  const { isDoctor } = usePermissions();
  const [notes, setNotes] = useState(existingNotes);
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(existingNotes.length);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNotes(text);
    setCharCount(text.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notes.trim()) {
      addNotification('error', 'Las notas no pueden estar vacías');
      return;
    }

    if (charCount < 10) {
      addNotification('error', 'Las notas deben tener al menos 10 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Save to database
      addNotification('success', 'Notas de visita guardadas exitosamente');
      onSave?.(notes);
    } catch (error: any) {
      addNotification('error', error.message || 'Error al guardar notas');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDoctor()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p>⚠️ Solo doctores pueden crear notas de visita</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notas de Visita
          </label>
          <span className="text-xs text-gray-500">
            {charCount}/2000 caracteres
          </span>
        </div>
        <textarea
          id="notes"
          value={notes}
          onChange={handleNotesChange}
          placeholder="Documenta los hallazgos, síntomas, exámenes realizados, diagnósticos preliminares..."
          disabled={isLoading}
          maxLength={2000}
          rows={10}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-600">
          Mínimo 10 caracteres. Máximo 2000 caracteres.
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading || charCount < 10}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isLoading ? 'Guardando...' : 'Guardar notas'}
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

export default VisitNotesForm;
