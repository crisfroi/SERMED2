// @ts-nocheck
// WEEK 11 ADMIN 1: Payroll Management Component
// Component: PayrollManagement
// Purpose: Create, edit, approve, and process payroll in XAF
// Currency: XAF (Francos CFA)

import React, { useState } from 'react';
import {
  Edit,
  Trash2,
  Check,
  X,
  Download,
  Send,
  ChevronDown,
  Plus,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Payroll {
  id: string;
  staff_name: string;
  payroll_period: string;
  base_salary_xaf: number;
  bonuses_xaf: number;
  deductions_xaf: number;
  gross_salary_xaf: number;
  total_deductions_xaf: number;
  net_salary_xaf: number;
  status: 'draft' | 'submitted' | 'approved' | 'processed' | 'paid';
  created_at: string;
}

interface PayrollForm {
  staffId: string;
  period: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  socialSecurity: number;
  healthInsurance: number;
  incomeTax: number;
}

export const PayrollManagement: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PayrollForm>({
    staffId: '',
    period: selectedPeriod,
    baseSalary: 0,
    bonuses: 0,
    deductions: 0,
    socialSecurity: 0,
    healthInsurance: 0,
    incomeTax: 0,
  });

  const queryClient = useQueryClient();

  // Fetch Payroll List
  const { data: payrollList, isLoading } = useQuery<Payroll[]>({
    queryKey: ['payroll-list', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/hr/payroll?period=${selectedPeriod}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch payroll');
      return response.json();
    },
    staleTime: 3 * 60 * 1000,
  });

  // Create/Update Payroll Mutation
  const createPayrollMutation = useMutation({
    mutationFn: async (data: PayrollForm) => {
      const response = await fetch(
        editingId ? `/api/v1/hr/payroll/${editingId}` : '/api/v1/hr/payroll',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to save payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
      setShowForm(false);
      setEditingId(null);
      setFormData({
        staffId: '',
        period: selectedPeriod,
        baseSalary: 0,
        bonuses: 0,
        deductions: 0,
        socialSecurity: 0,
        healthInsurance: 0,
        incomeTax: 0,
      });
    },
  });

  // Delete Payroll Mutation
  const deletePayrollMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/hr/payroll/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  // Approve Payroll Mutation
  const approvePayrollMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/hr/payroll/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to approve payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateNetSalary = () => {
    return (
      formData.baseSalary +
      formData.bonuses -
      formData.deductions -
      formData.socialSecurity -
      formData.healthInsurance -
      formData.incomeTax
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-200 text-gray-800',
      submitted: 'bg-blue-200 text-blue-800',
      approved: 'bg-green-200 text-green-800',
      processed: 'bg-purple-200 text-purple-800',
      paid: 'bg-emerald-200 text-emerald-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-200 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Nómina</h1>
            <p className="text-gray-600 mt-1">Procesar y gestionar pagos en XAF</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={20} />
            Nueva Nómina
          </button>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período (YYYY-MM)
          </label>
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* New Payroll Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Editar Nómina' : 'Crear Nueva Nómina'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empleado
                </label>
                <select
                  value={formData.staffId}
                  onChange={(e) =>
                    setFormData({ ...formData, staffId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar empleado...</option>
                  <option value="emp-001">Juan Pérez</option>
                  <option value="emp-002">María García</option>
                  <option value="emp-003">Carlos López</option>
                </select>
              </div>

              {/* Base Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salario Base (XAF)
                </label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      baseSalary: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Bonuses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonificaciones (XAF)
                </label>
                <input
                  type="number"
                  value={formData.bonuses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bonuses: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Deductions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuentos (XAF)
                </label>
                <input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deductions: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Social Security */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seguridad Social (XAF)
                </label>
                <input
                  type="number"
                  value={formData.socialSecurity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialSecurity: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Health Insurance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seguro de Salud (XAF)
                </label>
                <input
                  type="number"
                  value={formData.healthInsurance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      healthInsurance: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Income Tax */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impuesto a la Renta (XAF)
                </label>
                <input
                  type="number"
                  value={formData.incomeTax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      incomeTax: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Calculated Net Salary */}
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm font-medium text-gray-700">Salario Neto a Pagar (XAF):</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(calculateNetSalary())}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => createPayrollMutation.mutate(formData)}
                disabled={createPayrollMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {createPayrollMutation.isPending
                  ? 'Guardando...'
                  : editingId
                  ? 'Actualizar'
                  : 'Crear Nómina'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    staffId: '',
                    period: selectedPeriod,
                    baseSalary: 0,
                    bonuses: 0,
                    deductions: 0,
                    socialSecurity: 0,
                    healthInsurance: 0,
                    incomeTax: 0,
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Payroll List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Nóminas - {selectedPeriod}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Cargando...</div>
          ) : payrollList && payrollList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      Base (XAF)
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      Bonos (XAF)
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      Deducciones (XAF)
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      Neto (XAF)
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payrollList.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {payroll.staff_name}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {formatCurrency(payroll.base_salary_xaf)}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600">
                        {formatCurrency(payroll.bonuses_xaf)}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600">
                        {formatCurrency(payroll.total_deductions_xaf)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(payroll.net_salary_xaf)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            payroll.status
                          )}`}
                        >
                          {payroll.status.charAt(0).toUpperCase() +
                            payroll.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {payroll.status === 'draft' && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(payroll.id);
                                  setShowForm(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  deletePayrollMutation.mutate(payroll.id)
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                          {payroll.status === 'submitted' && (
                            <button
                              onClick={() =>
                                approvePayrollMutation.mutate(payroll.id)
                              }
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No hay nóminas para este período
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollManagement;
