// @ts-nocheck
// WEEK 11 ADMIN 1: Reports & Analytics Component
// Component: ReportsAndAnalytics
// Purpose: Generate reports in XAF, payroll analytics
// Currency: XAF (Francos CFA)

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ReportData {
  total_employees: number;
  total_payroll_xaf: number;
  avg_salary_xaf: number;
  payroll_by_department: Array<{
    department: string;
    total_xaf: number;
    headcount: number;
  }>;
  payroll_trend: Array<{
    period: string;
    total_xaf: number;
  }>;
}

export const ReportsAndAnalytics: React.FC = () => {
  const [reportType, setReportType] = useState<'payroll' | 'staff' | 'costs'>('payroll');
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  // Fetch Report Data
  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ['hr-reports', reportType, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/hr/reports/${reportType}?period=${selectedPeriod}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch report data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/v1/hr/reports/${reportType}/export?format=${exportFormat}&period=${selectedPeriod}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${reportType}-${selectedPeriod}.${
        exportFormat === 'excel' ? 'xlsx' : exportFormat
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error al exportar reporte');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600 mt-1">Visualice datos de nómina, personal y costos en XAF</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={reportType}
                onChange={(e) =>
                  setReportType(e.target.value as 'payroll' | 'staff' | 'costs')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="payroll">Nómina</option>
                <option value="staff">Personal</option>
                <option value="costs">Costos</option>
              </select>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de Exportación
              </label>
              <select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <Download size={20} />
              Exportar {exportFormat.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        {reportData && !isLoading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Employees */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Empleados</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {reportData.total_employees}
                    </p>
                  </div>
                  <BarChart3 className="text-blue-500" size={40} />
                </div>
              </div>

              {/* Total Payroll */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Nómina Total (XAF)</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {formatCurrency(reportData.total_payroll_xaf)}
                    </p>
                  </div>
                  <DollarSign className="text-green-500" size={40} />
                </div>
              </div>

              {/* Average Salary */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Salario Promedio (XAF)</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                      {formatCurrency(reportData.avg_salary_xaf)}
                    </p>
                  </div>
                  <TrendingUp className="text-indigo-500" size={40} />
                </div>
              </div>

              {/* Period */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Período Reportado</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                      {selectedPeriod}
                    </p>
                  </div>
                  <Calendar className="text-purple-500" size={40} />
                </div>
              </div>
            </div>

            {/* Payroll by Department */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Nómina por Departamento (XAF)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">
                        Departamento
                      </th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">
                        Personal
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-700">
                        Total Nómina (XAF)
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-700">
                        % del Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.payroll_by_department.map((dept) => (
                      <tr key={dept.department} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {dept.department}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {dept.headcount}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(dept.total_xaf)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {((dept.total_xaf / reportData.total_payroll_xaf) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payroll Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tendencia de Nómina (Últimos 12 Meses, XAF)
              </h2>
              <div className="space-y-3">
                {reportData.payroll_trend.map((trend) => {
                  const maxAmount = Math.max(
                    ...reportData.payroll_trend.map((t) => t.total_xaf)
                  );
                  const percentage = (trend.total_xaf / maxAmount) * 100;

                  return (
                    <div key={trend.period}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {trend.period}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(trend.total_xaf)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-center transition-all"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 30 && (
                            <span className="text-xs font-bold text-white">
                              {percentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {isLoading && (
          <div className="text-center text-gray-500 py-8">Cargando datos del reporte...</div>
        )}

        {/* Footer Note */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <FileText className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-blue-900">Nota sobre Reportes</p>
              <p className="text-sm text-blue-700 mt-1">
                Todos los reportes se generan en XAF (Francos CFA). Los datos se actualizan
                cuando se procesan las nóminas. Para análisis más detallados, utilice la opción
                de exportación a Excel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAndAnalytics;
