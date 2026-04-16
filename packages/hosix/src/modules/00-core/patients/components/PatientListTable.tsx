/**
 * HOSIX - Module 15: Patient List Table
 * Tabla paginada de lista de pacientes
 */

import React, { useState } from 'react';
import { formatDate } from '@sermed2/shared/utils/formatters';
import type { Patient } from '@sermed2/shared/types';

export interface PatientListTableProps {
  patients: Patient[];
  isLoading?: boolean;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPatientSelect?: (patient: Patient) => void;
  onRowAction?: (action: 'edit' | 'delete' | 'view', patient: Patient) => void;
}

export const PatientListTable: React.FC<PatientListTableProps> = ({
  patients = [],
  isLoading = false,
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPatientSelect,
  onRowAction,
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'id'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (column: 'name' | 'date' | 'id') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1"
                >
                  Paciente {getSortIcon('name')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="font-semibold text-gray-700">Email</span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="font-semibold text-gray-700">Teléfono</span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="font-semibold text-gray-700">Género</span>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('date')}
                  className="font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1"
                >
                  Registrado {getSortIcon('date')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="font-semibold text-gray-700">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Cargando pacientes...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No hay pacientes disponibles
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer"
                  onClick={() => onPatientSelect?.(patient)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-sm text-gray-600">ID: {patient.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {patient.email || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {patient.phone || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {patient.gender === 'M' ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        Masculino
                      </span>
                    ) : patient.gender === 'F' ? (
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded">
                        Femenino
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                        Otro
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(patient.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onRowAction?.('view', patient)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => onRowAction?.('edit', patient)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onRowAction?.('delete', patient)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200">
          <button
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientListTable;
