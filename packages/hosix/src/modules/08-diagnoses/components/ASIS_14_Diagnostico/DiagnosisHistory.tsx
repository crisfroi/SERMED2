// ============================================================================
// DiagnosisHistory.tsx - Diagnosis Timeline & History Tracking
// ASIS 14.0 - Diagnóstico Unificado
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDiagnosisHistory } from '@/hooks/useDiagnosisHistory';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  Download,
  Share2,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingDown,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DiagnosisItem {
  id: string;
  icdCode: string;
  diagnosisName: string;
  onsetDate: string;
  resolutionDate?: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'suspected';
  clinicalContext: string;
  notes?: string;
  expanded: boolean;
}

interface DiagnosisHistoryProps {
  patientId: string;
  onAdd?: () => void;
  onEdit?: (diagnosis: DiagnosisItem) => void;
}

export const DiagnosisHistory: React.FC<DiagnosisHistoryProps> = ({
  patientId,
  onAdd,
  onEdit,
}) => {
  const { diagnoses, loading, error, deleteDiagnosis, exportHistory, refetchHistory } =
    useDiagnosisHistory(patientId);

  const [filteredDiagnoses, setFilteredDiagnoses] = useState<DiagnosisItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'suspected'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'name'>('date');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    processAndFilterDiagnoses();
  }, [diagnoses, statusFilter, sortBy]);

  const processAndFilterDiagnoses = () => {
    let filtered = diagnoses || [];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((d: DiagnosisItem) => d.status === statusFilter);
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort(
        (a: DiagnosisItem, b: DiagnosisItem) =>
          new Date(b.onsetDate).getTime() - new Date(a.onsetDate).getTime()
      );
    } else if (sortBy === 'severity') {
      const severityOrder = { severe: 0, moderate: 1, mild: 2 };
      filtered.sort(
        (a: DiagnosisItem, b: DiagnosisItem) =>
          severityOrder[a.severity] - severityOrder[b.severity]
      );
    } else if (sortBy === 'name') {
      filtered.sort((a: DiagnosisItem, b: DiagnosisItem) =>
        a.diagnosisName.localeCompare(b.diagnosisName)
      );
    }

    setFilteredDiagnoses(filtered.map((d: DiagnosisItem) => ({ ...d, expanded: false })));
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const activeDiagnoses = (diagnoses || []).filter((d: DiagnosisItem) => d.status === 'active');
  const resolvedDiagnoses = (diagnoses || []).filter((d: DiagnosisItem) => d.status === 'resolved');
  const suspectedDiagnoses = (diagnoses || []).filter(
    (d: DiagnosisItem) => d.status === 'suspected'
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'moderate':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'mild':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'severe':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'moderate':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'mild':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'suspected':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const timelineData = filteredDiagnoses.map((d: DiagnosisItem) => ({
    diagnosis: d.diagnosisName.substring(0, 15),
    month: new Date(d.onsetDate).toLocaleDateString('es-ES', { month: 'short' }),
    count: 1,
  }));

  const handleDelete = async (id: string) => {
    await deleteDiagnosis(id);
    await refetchHistory();
  };

  const handleExport = () => {
    const exported = exportHistory(filteredDiagnoses);
    // Trigger download
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(exported, null, 2))
    );
    element.setAttribute('download', `diagnosis-history-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Diagnósticos</p>
                <p className="text-3xl font-bold">{diagnoses?.length || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Activos</p>
                <p className="text-3xl font-bold text-blue-600">{activeDiagnoses.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Resueltos</p>
                <p className="text-3xl font-bold text-green-600">{resolvedDiagnoses.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sospechados</p>
                <p className="text-3xl font-bold text-yellow-600">{suspectedDiagnoses.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      {!loading && timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cronología de Diagnósticos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Diagnósticos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters & Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historial de Diagnósticos
              </CardTitle>
              <CardDescription>Ver y administrar historial completo de diagnósticos</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
              <Button size="sm" onClick={onAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'active', 'resolved', 'suspected'].map((filter) => (
          <Button
            key={filter}
            size="sm"
            variant={statusFilter === filter ? 'default' : 'outline'}
            onClick={() => setStatusFilter(filter as any)}
            className="flex items-center gap-1"
          >
            {filter === 'all' && `Todas (${diagnoses?.length || 0})`}
            {filter === 'active' && `Activos (${activeDiagnoses.length})`}
            {filter === 'resolved' && `Resueltos (${resolvedDiagnoses.length})`}
            {filter === 'suspected' && `Sospechados (${suspectedDiagnoses.length})`}
          </Button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex gap-2">
        <span className="text-sm text-gray-600 flex items-center">Ordenar por:</span>
        {['date', 'severity', 'name'].map((sort) => (
          <Button
            key={sort}
            size="sm"
            variant={sortBy === sort ? 'default' : 'outline'}
            onClick={() => setSortBy(sort as any)}
          >
            {sort === 'date' && 'Fecha'}
            {sort === 'severity' && 'Severidad'}
            {sort === 'name' && 'Nombre'}
          </Button>
        ))}
      </div>

      {/* Diagnosis Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredDiagnoses.length > 0 ? (
          filteredDiagnoses.map((diagnosis: DiagnosisItem) => (
            <div
              key={diagnosis.id}
              className={`border-2 rounded-lg overflow-hidden ${getSeverityColor(diagnosis.severity)}`}
            >
              {/* Header */}
              <button
                onClick={() => toggleExpanded(diagnosis.id)}
                className="w-full p-4 flex items-start justify-between hover:bg-black hover:bg-opacity-5 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getSeverityIcon(diagnosis.severity)}
                  <div className="text-left">
                    <h4 className="font-semibold text-lg">{diagnosis.diagnosisName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {diagnosis.icdCode}
                      </Badge>
                      {getStatusIcon(diagnosis.status)}
                      <span className="text-xs font-medium">
                        {diagnosis.status === 'active'
                          ? 'Activo'
                          : diagnosis.status === 'resolved'
                            ? 'Resuelto'
                            : 'Sospechado'}
                      </span>
                    </div>
                  </div>
                </div>
                {expandedIds.includes(diagnosis.id) ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {/* Expanded Content */}
              {expandedIds.includes(diagnosis.id) && (
                <div className="border-t border-current opacity-50 p-4 space-y-3 bg-black bg-opacity-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold mb-1">FECHA DE INICIO:</p>
                      <p className="text-sm">
                        {new Date(diagnosis.onsetDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    {diagnosis.resolutionDate && (
                      <div>
                        <p className="text-xs font-semibold mb-1">FECHA DE RESOLUCIÓN:</p>
                        <p className="text-sm">
                          {new Date(diagnosis.resolutionDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold mb-1">CONTEXTO CLÍNICO:</p>
                    <p className="text-sm">{diagnosis.clinicalContext}</p>
                  </div>

                  {diagnosis.notes && (
                    <div>
                      <p className="text-xs font-semibold mb-1">NOTAS:</p>
                      <p className="text-sm">{diagnosis.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit?.(diagnosis)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(diagnosis.id)}
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay diagnósticos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosisHistory;
