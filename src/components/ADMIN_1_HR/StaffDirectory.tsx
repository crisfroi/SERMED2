// @ts-nocheck
// WEEK 11 ADMIN 1: Staff Directory Component
// Component: StaffDirectory
// Purpose: Manage employee records, contracts, documents
// Currency: XAF (Francos CFA)

import React, { useState } from 'react';
import {
  Search,
  Edit,
  Trash2,
  FileText,
  Phone,
  Mail,
  MapPin,
  Plus,
  Sheet,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Staff {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  employment_status: 'activo' | 'licencia' | 'suspendido' | 'jubilado';
  base_salary_xaf: number;
}

export const StaffDirectory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const queryClient = useQueryClient();

  // Fetch staff list
  const { data: staffList, isLoading } = useQuery<Staff[]>({
    queryKey: ['staff-directory', filterDepartment],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterDepartment) params.append('department', filterDepartment);
      const response = await fetch(
        `/api/v1/hr/staff?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredStaff = (staffList || []).filter((staff) =>
    staff.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.employee_id.includes(searchTerm) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    return {
      activo: 'text-green-600 bg-green-50',
      licencia: 'text-yellow-600 bg-yellow-50',
      suspendido: 'text-red-600 bg-red-50',
      jubilado: 'text-gray-600 bg-gray-50',
    }[status] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Directorio de Personal</h1>
            <p className="text-gray-600 mt-1">Gestione información de empleados</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Plus size={20} />
            Nuevo Empleado
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-3 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, ID o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los departamentos</option>
            <option value="clinical">Clínica</option>
            <option value="admin">Administración</option>
            <option value="logistics">Logística</option>
            <option value="finance">Finanzas</option>
          </select>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              Cargando...
            </div>
          ) : filteredStaff.length > 0 ? (
            filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {staff.full_name}
                    </h3>
                    <p className="text-sm text-gray-600">ID: {staff.employee_id}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      staff.employment_status
                    )}`}
                  >
                    {staff.employment_status}
                  </span>
                </div>

                {/* Position & Department */}
                <div className="space-y-2 mb-4 text-sm">
                  <p className="text-gray-700">
                    <strong>Posición:</strong> {staff.position}
                  </p>
                  <p className="text-gray-700">
                    <strong>Departamento:</strong> {staff.department}
                  </p>
                  <p className="text-gray-700">
                    <strong>Fecha Ingreso:</strong> {new Date(staff.hire_date).toLocaleDateString('es-ES')}
                  </p>
                </div>

                {/* Salary */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Salario (XAF)</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">
                    {formatCurrency(staff.base_salary_xaf)}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <a href={`mailto:${staff.email}`} className="text-blue-600 hover:underline">
                      {staff.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    {staff.phone}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition">
                    <Edit size={18} />
                    Editar
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition">
                    <FileText size={18} />
                    Docs
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              No hay empleados que coincidan con sus criterios de búsqueda
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Personal</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {(staffList || []).filter(s => s.employment_status === 'activo').length}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">En Licencia</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {(staffList || []).filter(s => s.employment_status === 'licencia').length}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Suspendidos</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {(staffList || []).filter(s => s.employment_status === 'suspendido').length}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {(staffList || []).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDirectory;
