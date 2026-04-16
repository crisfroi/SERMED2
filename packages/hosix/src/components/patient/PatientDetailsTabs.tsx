/**
 * HOSIX - Module 15: Patient Details Tabs
 * Vista con tabs para detalles del paciente
 */

import React, { useState } from 'react';
import { PatientProfileView } from './PatientProfileView';
import { MedicalHistoryCard } from './MedicalHistoryCard';
import type { Patient, MedicalRecord, Appointment } from '@sermed2/shared/types';

export interface PatientDetailsTabsProps {
  patient: Patient;
  medicalRecords?: MedicalRecord[];
  appointments?: Appointment[];
  isLoading?: boolean;
  onEdit?: () => void;
  onAddRecord?: () => void;
  onAddAppointment?: () => void;
}

export const PatientDetailsTabs: React.FC<PatientDetailsTabsProps> = ({
  patient,
  medicalRecords = [],
  appointments = [],
  isLoading = false,
  onEdit,
  onAddRecord,
  onAddAppointment,
}) => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'medical' | 'appointments' | 'documents'
  >('profile');

  const tabs = [
    { id: 'profile', label: '👤 Perfil', count: 0 },
    { id: 'medical', label: '📋 Historial Médico', count: medicalRecords.length },
    { id: 'appointments', label: '📅 Citas', count: appointments.length },
    { id: 'documents', label: '📄 Documentos', count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && <span className="ml-1 text-xs">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <PatientProfileView patient={patient} editable onEdit={onEdit} />
        )}

        {activeTab === 'medical' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Historial Médico</h3>
              <button
                onClick={onAddRecord}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                + Nuevo Registro
              </button>
            </div>
            <MedicalHistoryCard
              records={medicalRecords}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Citas</h3>
              <button
                onClick={onAddAppointment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                + Nueva Cita
              </button>
            </div>
            {appointments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                <p>No hay citas registradas</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Motivo
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="border-b border-gray-200">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {apt.dateTime}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {apt.doctorId}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {apt.reason}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              apt.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : apt.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : apt.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            <p>Sección de documentos en desarrollo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailsTabs;
