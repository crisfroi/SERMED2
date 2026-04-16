/**
 * HOSIX - Module 15: Medical History Card
 * Componente para mostrar el historial médico del paciente
 */

import React from 'react';
import { formatDate } from '@sermed2/shared/utils/formatters';
import type { MedicalRecord } from '@sermed2/shared/types';

export interface MedicalHistoryCardProps {
  records: MedicalRecord[];
  isLoading?: boolean;
  onRecordClick?: (record: MedicalRecord) => void;
}

export const MedicalHistoryCard: React.FC<MedicalHistoryCardProps> = ({
  records = [],
  isLoading = false,
  onRecordClick,
}) => {
  const getIconForType = (
    type: string
  ): { icon: string; color: string; label: string } => {
    switch (type) {
      case 'visit':
        return { icon: '📋', color: 'bg-blue-100', label: 'Visita' };
      case 'diagnosis':
        return { icon: '🏥', color: 'bg-red-100', label: 'Diagnóstico' };
      case 'prescription':
        return { icon: '💊', color: 'bg-green-100', label: 'Prescripción' };
      case 'lab':
        return { icon: '🔬', color: 'bg-purple-100', label: 'Examen Lab' };
      case 'imaging':
        return { icon: '📷', color: 'bg-orange-100', label: 'Imagen' };
      default:
        return { icon: '📄', color: 'bg-gray-100', label: 'Registro' };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Historial Médico</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial Médico</h3>

      {records.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>No hay registros médicos disponibles</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {records.map((record, idx) => {
            const { icon, color, label } = getIconForType(record.recordType);

            return (
              <div
                key={record.id || idx}
                onClick={() => onRecordClick?.(record)}
                className={`p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition ${color}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{label}</p>
                        <p className="text-sm text-gray-600">
                          Médico: {record.doctorId || 'N/A'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(record.date)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {record.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryCard;
