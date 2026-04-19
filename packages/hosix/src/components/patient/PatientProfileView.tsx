/**
 * HOSIX - Module 15: Patient Profile View
 * Vista completa del perfil del paciente
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '@hosix/hooks/shared';
import { formatDate, formatPhone } from '@sermed2/shared/utils/formatters';
import type { Patient } from '@sermed2/shared/types';

export interface PatientProfileViewProps {
  patient: Patient;
  editable?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patient,
  editable = false,
  onEdit,
  onDelete,
}) => {
  const { addNotification } = useApp();
  const [displayedPatient, setDisplayedPatient] = useState(patient);

  useEffect(() => {
    setDisplayedPatient(patient);
  }, [patient]);

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {displayedPatient.firstName} {displayedPatient.lastName}
          </h1>
          <p className="text-gray-600">ID: {displayedPatient.id}</p>
        </div>
        {editable && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Información Personal
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Fecha de Nacimiento</label>
            <p className="text-gray-900 font-medium">
              {formatDate(displayedPatient.dateOfBirth)} (
              {calculateAge(displayedPatient.dateOfBirth)} años)
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Género</label>
            <p className="text-gray-900 font-medium">
              {displayedPatient.gender === 'M'
                ? 'Masculino'
                : displayedPatient.gender === 'F'
                ? 'Femenino'
                : 'Otro'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="text-gray-900 font-medium">{displayedPatient.email || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Teléfono</label>
            <p className="text-gray-900 font-medium">
              {displayedPatient.phone
                ? formatPhone(displayedPatient.phone)
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Address */}
      {displayedPatient.address && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dirección</h2>
          <p className="text-gray-900">{displayedPatient.address}</p>
        </div>
      )}

      {/* Emergency Contact */}
      {displayedPatient.emergencyContact && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contacto de Emergencia
          </h2>
          <p className="text-gray-900">{displayedPatient.emergencyContact}</p>
        </div>
      )}

      {/* Medical Information */}
      <div className="bg-blue-50 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Información Médica
        </h2>

        {/* Allergies */}
        {displayedPatient.allergies && displayedPatient.allergies.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-600">Alergias</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {displayedPatient.allergies.map((allergy, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  ⚠️ {allergy}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chronic Diseases */}
        {displayedPatient.chronicDiseases &&
          displayedPatient.chronicDiseases.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Enfermedades Crónicas
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {displayedPatient.chronicDiseases.map((disease, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                  >
                    💊 {disease}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Medical History */}
        {displayedPatient.medicalHistory &&
          displayedPatient.medicalHistory.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Historial Médico Relevante
              </label>
              <ul className="list-disc list-inside space-y-1 mt-2 text-gray-700">
                {displayedPatient.medicalHistory.map((history, idx) => (
                  <li key={idx}>{history}</li>
                ))}
              </ul>
            </div>
          )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
        <p>Creado: {formatDate(displayedPatient.createdAt)}</p>
        <p>Actualizado: {formatDate(displayedPatient.updatedAt)}</p>
      </div>
    </div>
  );
};

export default PatientProfileView;
