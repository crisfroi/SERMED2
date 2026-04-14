import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react';

interface LabResult {
  id: string;
  test_name: string;
  result_value: number | null;
  result_unit: string;
  reference_range_text: string;
  flag: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'pending';
  result_date: string;
  quality_score: number;
  interpretation_comment?: string;
  is_final: boolean;
  previous_result?: number;
}

interface Props {
  patientId: string;
  results?: LabResult[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const flagConfig = {
  normal: { color: 'bg-green-50', borderColor: 'border-l-green-500', icon: CheckCircle, textColor: 'text-green-700' },
  low: { color: 'bg-amber-50', borderColor: 'border-l-amber-500', icon: TrendingDown, textColor: 'text-amber-700' },
  high: { color: 'bg-amber-50', borderColor: 'border-l-amber-500', icon: TrendingUp, textColor: 'text-amber-700' },
  critical_low: { color: 'bg-red-50', borderColor: 'border-l-red-600', icon: AlertTriangle, textColor: 'text-red-700' },
  critical_high: { color: 'bg-red-50', borderColor: 'border-l-red-600', icon: AlertTriangle, textColor: 'text-red-700' },
  pending: { color: 'bg-gray-50', borderColor: 'border-l-gray-500', icon: AlertCircle, textColor: 'text-gray-700' }
};

export const LabResultsViewer: React.FC<Props> = ({ patientId, results = [], isLoading = false, onRefresh }) => {
  const [filteredResults, setFilteredResults] = useState<LabResult[]>(results);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    let filtered = results;
    
    if (selectedFlag) {
      filtered = filtered.filter(r => r.flag === selectedFlag);
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.result_date).getTime();
      const dateB = new Date(b.result_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredResults(filtered);
  }, [results, selectedFlag, sortOrder]);

  const criticalCount = results.filter(r => r.flag.includes('critical')).length;
  const abnormalCount = results.filter(r => !r.flag.includes('normal') && !r.flag.includes('pending')).length;
  const compareWithPrevious = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null;
    const change = ((current - previous) / Math.abs(previous)) * 100;
    return change > 5 ? 'significant_increase' : change < -5 ? 'significant_decrease' : 'stable';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Resultados de Laboratorio</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Resultados</p>
          <p className="text-2xl font-bold text-blue-700">{results.length}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Normales</p>
          <p className="text-2xl font-bold text-green-700">
            {results.filter(r => r.flag === 'normal').length}
          </p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
          <p className="text-sm text-gray-600">Anormales</p>
          <p className="text-2xl font-bold text-amber-700">{abnormalCount}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-600">
          <p className="text-sm text-gray-600">Críticos</p>
          <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setSelectedFlag(null)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            selectedFlag === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Todos ({results.length})
        </button>
        <button
          onClick={() => setSelectedFlag('normal')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            selectedFlag === 'normal' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Normales
        </button>
        <button
          onClick={() => setSelectedFlag('critical_low')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            selectedFlag === 'critical_low' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Críticos
        </button>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.map(result => {
          const config = flagConfig[result.flag];
          const IconComponent = config.icon;
          const comparison = compareWithPrevious(result.result_value, result.previous_result);

          return (
            <div
              key={result.id}
              className={`${config.color} border-l-4 ${config.borderColor} p-4 rounded-lg`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3">
                  <IconComponent className={`w-5 h-5 flex-shrink-0 mt-1 ${config.textColor}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{result.test_name}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(result.result_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {!result.is_final && (
                    <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded font-medium">
                      Pendiente de Revisión
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-600">Resultado</p>
                  <p className="font-bold text-lg">
                    {result.result_value !== null ? `${result.result_value} ${result.result_unit}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Rango Referencia</p>
                  <p className="font-medium text-sm">{result.reference_range_text}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Calidad Análisis</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition ${
                          result.quality_score >= 80 ? 'bg-green-500' :
                          result.quality_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${result.quality_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{result.quality_score}%</span>
                  </div>
                </div>
              </div>

              {comparison && (
                <div className="mb-3 p-2 bg-blue-100 rounded text-sm text-blue-700">
                  📊 Comparado con resultado anterior:
                  {comparison === 'significant_increase' && ' ⬆️ Incremento significativo'}
                  {comparison === 'significant_decrease' && ' ⬇️ Disminución significativa'}
                  {comparison === 'stable' && ' ➡️ Estable'}
                </div>
              )}

              {result.interpretation_comment && (
                <div className="p-3 bg-white bg-opacity-50 rounded border border-gray-300">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Interpretación:</span> {result.interpretation_comment}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filteredResults.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No hay resultados disponibles</p>
          </div>
        )}
      </div>

      {/* Quality Indicators */}
      {results.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">Indicadores de Calidad</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Calidad Promedio: {(results.reduce((sum, r) => sum + r.quality_score, 0) / results.length).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-600">Resultados Finalizados: {results.filter(r => r.is_final).length} / {results.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
