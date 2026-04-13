import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface QCRun {
  id: string;
  test_type: string;
  control_level: 'low' | 'normal' | 'high';
  expected_value: number;
  observed_value: number;
  cv_percentage: number;
  result_date: string;
  qc_status: 'pending' | 'passed' | 'failed' | 'requires_investigation';
}

interface Props {
  patientId?: string;
  qcRuns?: QCRun[];
  isLoading?: boolean;
}

const statusConfig = {
  passed: { color: 'bg-green-50', borderColor: 'border-l-green-500', icon: CheckCircle, textColor: 'text-green-700' },
  failed: { color: 'bg-red-50', borderColor: 'border-l-red-600', icon: AlertTriangle, textColor: 'text-red-700' },
  requires_investigation: { color: 'bg-amber-50', borderColor: 'border-l-amber-500', icon: AlertCircle, textColor: 'text-amber-700' },
  pending: { color: 'bg-gray-50', borderColor: 'border-l-gray-500', icon: AlertCircle, textColor: 'text-gray-700' }
};

export const QualityControlDashboard: React.FC<Props> = ({ qcRuns = [], isLoading = false }) => {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [cvTrendData, setCvTrendData] = useState<any[]>([]);

  useEffect(() => {
    // Prepare CV trend data
    const testGroups = new Map<string, QCRun[]>();
    qcRuns.forEach(run => {
      if (!testGroups.has(run.test_type)) {
        testGroups.set(run.test_type, []);
      }
      testGroups.get(run.test_type)!.push(run);
    });

    const trends: any[] = [];
    testGroups.forEach((runs, testType) => {
      const sortedRuns = runs.sort((a, b) => new Date(a.result_date).getTime() - new Date(b.result_date).getTime());
      sortedRuns.slice(-10).forEach(run => {
        trends.push({
          date: new Date(run.result_date).toLocaleDateString('es-ES'),
          test: testType,
          cv: run.cv_percentage,
          status: run.qc_status
        });
      });
    });
    setCvTrendData(trends);
  }, [qcRuns]);

  const testTypes = Array.from(new Set(qcRuns.map(r => r.test_type)));
  const filteredRuns = selectedTest 
    ? qcRuns.filter(r => r.test_type === selectedTest)
    : qcRuns;

  const stats = {
    total: qcRuns.length,
    passed: qcRuns.filter(r => r.qc_status === 'passed').length,
    failed: qcRuns.filter(r => r.qc_status === 'failed').length,
    requires_investigation: qcRuns.filter(r => r.qc_status === 'requires_investigation').length
  };

  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
  const averageCV = stats.total > 0 ? (qcRuns.reduce((sum, r) => sum + r.cv_percentage, 0) / stats.total).toFixed(2) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Control de Calidad del Laboratorio</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Corridas</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Aprobadas</p>
          <p className="text-2xl font-bold text-green-700">{stats.passed}</p>
          <p className="text-xs text-green-600 mt-1">Tasa: {passRate}%</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-600">
          <p className="text-sm text-gray-600">Rechazadas</p>
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
          <p className="text-sm text-gray-600">CV Promedio</p>
          <p className="text-2xl font-bold text-amber-700">{averageCV}%</p>
          <p className="text-xs text-amber-600 mt-1">Meta: &lt;3%</p>
        </div>
      </div>

      {/* Test Type Filter */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Filtrar por Prueba</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTest(null)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              selectedTest === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Todas ({testTypes.length})
          </button>
          {testTypes.map(test => (
            <button
              key={test}
              onClick={() => setSelectedTest(test)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                selectedTest === test ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {test}
            </button>
          ))}
        </div>
      </div>

      {/* CV Trend Chart */}
      {cvTrendData.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Tendencia de Variabilidad (CV%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cvTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="cv"
                stroke="#3b82f6"
                dot={{ r: 4 }}
                name="Coeficiente Variación (%)"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-600 mt-2">
            💡 Meta de aseguramiento de calidad: CV &lt; 3% (rojo), 3-5% (amarillo), &gt;5% (crítico)
          </p>
        </div>
      )}

      {/* QC Runs List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 mb-3">Últimas Corridas ({filteredRuns.length})</h3>
        
        {filteredRuns.slice(0, 10).map(run => {
          const config = statusConfig[run.qc_status];
          const IconComponent = config.icon;
          const accuracy = Math.abs(((run.expected_value - run.observed_value) / run.expected_value) * 100);
          const cvStatus = run.cv_percentage < 3 ? 'acceptable' : run.cv_percentage < 5 ? 'warning' : 'critical';

          return (
            <div
              key={run.id}
              className={`${config.color} border-l-4 ${config.borderColor} p-4 rounded-lg`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-5 h-5 ${config.textColor}`} />
                  <div>
                    <h4 className="font-semibold text-gray-900">{run.test_type}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(run.result_date).toLocaleDateString('es-ES')} - Nivel {run.control_level}
                    </p>
                  </div>
                </div>
                <span className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                  run.qc_status === 'passed' ? 'bg-green-200 text-green-800' :
                  run.qc_status === 'failed' ? 'bg-red-200 text-red-800' :
                  'bg-amber-200 text-amber-800'
                }`}>
                  {run.qc_status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Esperado</p>
                  <p className="font-bold">{run.expected_value}</p>
                </div>
                <div>
                  <p className="text-gray-600">Observado</p>
                  <p className="font-bold">{run.observed_value}</p>
                </div>
                <div>
                  <p className="text-gray-600">CV (%)</p>
                  <p className={`font-bold ${
                    cvStatus === 'acceptable' ? 'text-green-600' :
                    cvStatus === 'warning' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {run.cv_percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Exactitud</p>
                  <p className={`font-bold ${accuracy < 5 ? 'text-green-600' : accuracy < 10 ? 'text-amber-600' : 'text-red-600'}`}>
                    {(100 - accuracy).toFixed(1)}%
                  </p>
                </div>
              </div>

              {cvStatus === 'critical' && (
                <div className="mt-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                  ⚠️ CV crítico - Requiere investigación inmediata
                </div>
              )}
            </div>
          );
        })}

        {filteredRuns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay corridas de control encontradas
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Recomendaciones</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Realizar control de calidad diariamente antes de procesar muestras</li>
          <li>✓ Documentar cualquier mantenimiento o calibración de equipos</li>
          <li>✓ Investigar variabilidades &gt; 5% antes de continuar procesamiento</li>
          <li>✓ Revisar regularmente tendencias para anticipar derivas de calibración</li>
        </ul>
      </div>
    </div>
  );
};
