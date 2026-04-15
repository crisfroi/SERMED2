// @ts-nocheck
// WEEK 11 ADMIN 1: HR Dashboard
// Component: HRDashboard (Main Dashboard)
// Purpose: Overview de personal, nómina, turnos, KPIs
// Currency: XAF (Francos CFA)

import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Settings,
  Download,
  Plus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface StaffStats {
  total_active: number;
  total_on_leave: number;
  new_this_month: number;
  turnover_rate: number;
}

interface PayrollStats {
  total_pending_xaf: number;
  total_approved_xaf: number;
  total_paid_this_month_xaf: number;
  avg_salary_xaf: number;
}

interface ScheduleStats {
  scheduled_today: number;
  absent_today: number;
  on_leave_today: number;
  conflicts: number;
}

export const HRDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  );

  // Fetch Staff Statistics
  const { data: staffStats, isLoading: staffLoading } = useQuery<StaffStats>({
    queryKey: ['hr-staff-stats'],
    queryFn: async () => {
      const response = await fetch('/api/v1/hr/staff-statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch staff stats');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch Payroll Statistics
  const { data: payrollStats, isLoading: payrollLoading } = useQuery<PayrollStats>({
    queryKey: ['hr-payroll-stats', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/hr/payroll-statistics?period=${selectedPeriod}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch payroll stats');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Schedule Statistics
  const { data: scheduleStats, isLoading: scheduleLoading } = useQuery<ScheduleStats>({
    queryKey: ['hr-schedule-stats'],
    queryFn: async () => {
      const response = await fetch('/api/v1/hr/schedule-statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch schedule stats');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time updates
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const isLoading = staffLoading || payrollLoading || scheduleLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Gestión de Recursos Humanos
            </h1>
            <p className="text-gray-600 mt-2">
              Dashboard administrativo - Período: {selectedPeriod}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition">
              <RefreshCw size={20} />
              Actualizar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:shadow-md transition">
              <Plus size={20} />
              Nuevo Empleado
            </button>
          </div>
        </div>

        {/* KPI Cards Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Staff Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Personal Activo</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {staffLoading ? '...' : staffStats?.total_active || 0}
                </p>
                <p className="text-green-600 text-sm mt-1">
                  {staffStats?.new_this_month || 0} nuevos este mes
                </p>
              </div>
              <Users className="text-blue-500" size={40} />
            </div>
          </div>

          {/* Payroll Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Nómina Pendiente (XAF)</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {payrollLoading ? '...' : formatCurrency(payrollStats?.total_pending_xaf || 0)}
                </p>
                <p className="text-amber-600 text-sm mt-1">
                  Esperando aprobación
                </p>
              </div>
              <DollarSign className="text-amber-500" size={40} />
            </div>
          </div>

          {/* Scheduled Today */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Turno Hoy</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {scheduleLoading ? '...' : scheduleStats?.scheduled_today || 0}
                </p>
                <p className="text-red-600 text-sm mt-1">
                  {scheduleStats?.absent_today || 0} ausentes
                </p>
              </div>
              <Calendar className="text-green-500" size={40} />
            </div>
          </div>

          {/* Turnover Rate */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tasa Rotación</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {staffLoading ? '...' : (staffStats?.turnover_rate || 0).toFixed(1)}%
                </p>
                <p className="text-purple-600 text-sm mt-1">
                  Anual
                </p>
              </div>
              <TrendingUp className="text-indigo-500" size={40} />
            </div>
          </div>
        </div>

        {/* Average Salary & Payroll Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Salario Promedio (XAF)</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {payrollLoading ? '...' : formatCurrency(payrollStats?.avg_salary_xaf || 0)}
            </p>
            <p className="text-gray-600 text-sm mt-2">Calculado para período actual</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nómina Pagada Este Mes (XAF)</h3>
            <p className="text-3xl font-bold text-green-600">
              {payrollLoading ? '...' : formatCurrency(payrollStats?.total_paid_this_month_xaf || 0)}
            </p>
            <p className="text-gray-600 text-sm mt-2">Pagos completados</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conflictos de Horario</h3>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-red-600">
                {scheduleLoading ? '...' : scheduleStats?.conflicts || 0}
              </p>
              {(scheduleStats?.conflicts || 0) > 0 && (
                <AlertCircle className="text-red-500" size={24} />
              )}
            </div>
            <p className="text-gray-600 text-sm mt-2">Requieren resolución</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-left">
              <Users size={24} className="text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Gestionar Personal</p>
            </button>
            <button className="p-4 border-2 border-amber-200 rounded-lg hover:bg-amber-50 transition text-left">
              <DollarSign size={24} className="text-amber-600 mb-2" />
              <p className="font-medium text-gray-900">Nueva Nómina</p>
            </button>
            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-left">
              <Calendar size={24} className="text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Programar Turnos</p>
            </button>
            <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-left">
              <Download size={24} className="text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Reportes</p>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {scheduleStats && scheduleStats.conflicts > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-red-900">Conflictos de Horario Detectados</h3>
              <p className="text-red-700 mt-1">
                Existen {scheduleStats.conflicts} conflictos de horario que requieren atención inmediata.
                Por favor revise la sección de Turnos.
              </p>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> El sistema de Control de Asistencia estará disponible en la siguiente fase.
            Actualmente, las horas de trabajo se ingresan manualmente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
