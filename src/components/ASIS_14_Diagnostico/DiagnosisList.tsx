// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDiagnosisManagement } from '@/hooks/useDiagnosisManagement';

interface DiagnosisItem {
  id: string;
  icd10Code: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'suspected' | 'resolved' | 'excluded' | 'ruled_out' | 'remission';
  onsetType: 'acute' | 'chronic' | 'subacute' | 'remote';
  admissionDate: string;
  resolutionDate?: string;
  clinicalPresentation: string;
  primaryDiagnosis: boolean;
  category: string;
}

interface DiagnosisListProps {
  patientId: string;
  onEdit?: (diagnosisId: string) => void;
  statusFilter?: DiagnosisItem['status'];
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  suspected: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-blue-100 text-blue-800',
  excluded: 'bg-gray-100 text-gray-800',
  ruled_out: 'bg-purple-100 text-purple-800',
  remission: 'bg-indigo-100 text-indigo-800',
};

const STATUS_LABELS = {
  active: 'Activo',
  suspected: 'Sospechado',
  resolved: 'Resuelto',
  excluded: 'Excluido',
  ruled_out: 'Descartado',
  remission: 'Remisión',
};

const SEVERITY_COLORS = {
  mild: 'text-green-700',
  moderate: 'text-yellow-700',
  severe: 'text-red-700',
};

const SEVERITY_LABELS = {
  mild: 'Leve',
  moderate: 'Moderada',
  severe: 'Severa',
};

export function DiagnosisList({
  patientId,
  onEdit,
  statusFilter,
}: DiagnosisListProps) {
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDiagnosis, setExpandedDiagnosis] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(statusFilter || 'all');
  const [error, setError] = useState<string | null>(null);

  const { fetchDiagnoses, deleteDiagnosis } = useDiagnosisManagement(patientId);

  useEffect(() => {
    loadDiagnoses();
  }, [patientId, selectedStatus]);

  const loadDiagnoses = async () => {
    try {
      setLoading(true);
      const data = await fetchDiagnoses(selectedStatus === 'all' ? undefined : selectedStatus as any);
      setDiagnoses(data);
    } catch (err: any) {
      setError(err.message || 'Error loading diagnoses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (diagnosisId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este diagnóstico?')) {
      return;
    }

    try {
      await deleteDiagnosis(diagnosisId);
      setDiagnoses(diagnoses.filter((d) => d.id !== diagnosisId));
    } catch (err: any) {
      setError(err.message || 'Error deleting diagnosis');
    }
  };

  const primaryDiagnosis = diagnoses.find((d) => d.primaryDiagnosis);
  const secondaryDiagnoses = diagnoses.filter((d) => !d.primaryDiagnosis);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando diagnósticos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Diagnósticos del Paciente</h2>
          <p className="mt-1 text-sm text-gray-600">
            {diagnoses.length} diagnóstico{diagnoses.length !== 1 ? 's' : ''} registrado{diagnoses.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="suspected">Sospechados</SelectItem>
              <SelectItem value="resolved">Resueltos</SelectItem>
              <SelectItem value="ruled_out">Descartados</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadDiagnoses}>
            ↻
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="ml-2 text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {diagnoses.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-gray-600">No hay diagnósticos registrados</p>
        </Card>
      ) : (
        <>
          {/* Primary Diagnosis */}
          {primaryDiagnosis && (
            <Card className="border-2 border-primary bg-primary/5">
              <div
                className="flex cursor-pointer items-center justify-between border-b bg-gradient-to-r from-primary/10 to-transparent px-4 py-3"
                onClick={() =>
                  setExpandedDiagnosis(
                    expandedDiagnosis === primaryDiagnosis.id ? null : primaryDiagnosis.id
                  )
                }
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">★</span>
                    <h3 className="font-bold text-lg">
                      {primaryDiagnosis.icd10Code} - {primaryDiagnosis.description}
                    </h3>
                    <Badge className={STATUS_COLORS[primaryDiagnosis.status]}>
                      {STATUS_LABELS[primaryDiagnosis.status]}
                    </Badge>
                    <Badge variant="secondary">
                      Diagnóstico Principal
                    </Badge>
                  </div>
                </div>

                {expandedDiagnosis === primaryDiagnosis.id ? (
                  <ChevronUp className="h-5 w-5 text-primary" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-primary" />
                )}
              </div>

              {expandedDiagnosis === primaryDiagnosis.id && (
                <CardContent className="pt-4 space-y-4">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
                    <div>
                      <span className="font-medium">Severidad:</span>
                      <p className={SEVERITY_COLORS[primaryDiagnosis.severity]}>
                        {SEVERITY_LABELS[primaryDiagnosis.severity]}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Tipo de Inicio:</span>
                      <p>{primaryDiagnosis.onsetType === 'acute' ? 'Agudo' : primaryDiagnosis.onsetType === 'chronic' ? 'Crónico' : 'Otro'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Registro:</span>
                      {new Date(primaryDiagnosis.admissionDate).toLocaleDateString()}
                    </div>
                    {primaryDiagnosis.resolutionDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Resolución:</span>
                        {new Date(primaryDiagnosis.resolutionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Clinical Info */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-900">Presentación Clínica:</p>
                    <p className="text-sm text-blue-800 mt-1">
                      {primaryDiagnosis.clinicalPresentation}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit?.(primaryDiagnosis.id)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(primaryDiagnosis.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Secondary Diagnoses */}
          {secondaryDiagnoses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Diagnósticos Secundarios ({secondaryDiagnoses.length})
              </h3>

              {secondaryDiagnoses.map((diagnosis) => (
                <Card key={diagnosis.id}>
                  <div
                    className="flex cursor-pointer items-center justify-between border-b bg-gray-50 px-4 py-3 hover:bg-gray-100"
                    onClick={() =>
                      setExpandedDiagnosis(
                        expandedDiagnosis === diagnosis.id ? null : diagnosis.id
                      )
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">
                          {diagnosis.icd10Code} - {diagnosis.description}
                        </h3>
                        <Badge className={STATUS_COLORS[diagnosis.status]}>
                          {STATUS_LABELS[diagnosis.status]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={SEVERITY_COLORS[diagnosis.severity]}
                        >
                          {SEVERITY_LABELS[diagnosis.severity]}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {diagnosis.category}
                      </p>
                    </div>

                    {expandedDiagnosis === diagnosis.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    )}
                  </div>

                  {expandedDiagnosis === diagnosis.id && (
                    <CardContent className="pt-4 space-y-4">
                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
                        <div>
                          <span className="font-medium">Tipo de Inicio:</span>
                          <p>{diagnosis.onsetType}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(diagnosis.admissionDate).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Clinical Info */}
                      <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm font-medium text-blue-900">Presentación Clínica:</p>
                        <p className="text-sm text-blue-800 mt-1">
                          {diagnosis.clinicalPresentation}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit?.(diagnosis.id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(diagnosis.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DiagnosisList;
