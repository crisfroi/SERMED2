import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Eye,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMedicationRegimen } from '@/hooks/useMedicationRegimen';

interface RegimentItem {
  id: string;
  medicationName: string;
  genericName: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  indication: string;
}

interface Regimen {
  id: string;
  name: string;
  type: string;
  status: string;
  targetCondition: string;
  startDate: string;
  endDate?: string;
  items: RegimentItem[];
  createdBy: string;
}

interface RegimensListProps {
  patientId: string;
  onRefresh?: () => void;
  onEdit?: (regimenId: string) => void;
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  discontinued: 'bg-red-100 text-red-800',
};

const REGIMEN_TYPES = [
  { value: 'all', label: 'Todos' },
  { value: 'hypertension', label: 'Hipertensión' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'infection', label: 'Infección' },
  { value: 'cardiovascular', label: 'Cardiovascular' },
  { value: 'respiratory', label: 'Respiratorio' },
  { value: 'custom', label: 'Personalizado' },
];

export function RegimensList({
  patientId,
  onRefresh,
  onEdit,
}: RegimensListProps) {
  const [regimens, setRegimens] = useState<Regimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [expandedRegimen, setExpandedRegimen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { fetchRegimens, deleteRegimen } = useMedicationRegimen(patientId);

  useEffect(() => {
    loadRegimens();
  }, [patientId, selectedType]);

  const loadRegimens = async () => {
    try {
      setLoading(true);
      const data = await fetchRegimens(selectedType === 'all' ? undefined : selectedType);
      setRegimens(data);
    } catch (err: any) {
      setError(err.message || 'Error loading regimens');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (regimenId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este régimen?')) {
      return;
    }

    try {
      await deleteRegimen(regimenId);
      setRegimens(regimens.filter((r) => r.id !== regimenId));
      onRefresh?.();
    } catch (err: any) {
      setError(err.message || 'Error deleting regimen');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando regímenes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Regímenes de Medicamentos</h2>
          <p className="mt-1 text-sm text-gray-600">
            {regimens.length} régimen{regimens.length !== 1 ? 'es' : ''} activo{regimens.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIMEN_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadRegimens}>
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

      {regimens.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-gray-600">No hay regímenes para mostrar</p>
        </Card>
      ) : (
        regimens.map((regimen) => (
          <Card key={regimen.id} className="overflow-hidden">
            <div
              className="flex cursor-pointer items-center justify-between border-b bg-gray-50 px-4 py-3 hover:bg-gray-100"
              onClick={() =>
                setExpandedRegimen(
                  expandedRegimen === regimen.id ? null : regimen.id
                )
              }
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{regimen.name}</h3>
                  <Badge
                    className={STATUS_COLORS[regimen.status as keyof typeof STATUS_COLORS]}
                  >
                    {regimen.status === 'active' ? 'Activo' :
                     regimen.status === 'completed' ? 'Completado' :
                     regimen.status === 'suspended' ? 'Suspendido' :
                     'Descontinuado'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {regimen.targetCondition} • {regimen.items.length} medicamento{regimen.items.length !== 1 ? 's' : ''}
                </p>
              </div>

              {expandedRegimen === regimen.id ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </div>

            {expandedRegimen === regimen.id && (
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Regimen Info */}
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-3 text-sm">
                    <div>
                      <span className="font-medium">Inicio:</span>{' '}
                      {new Date(regimen.startDate).toLocaleDateString()}
                    </div>
                    {regimen.endDate && (
                      <div>
                        <span className="font-medium">Fin:</span>{' '}
                        {new Date(regimen.endDate).toLocaleDateString()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Tipo:</span> {regimen.type}
                    </div>
                    <div>
                      <span className="font-medium">Total medicamentos:</span>{' '}
                      {regimen.items.length}
                    </div>
                  </div>

                  {/* Medications Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Medicamento</th>
                          <th className="px-3 py-2 text-left font-medium">Dosis</th>
                          <th className="px-3 py-2 text-left font-medium">Frecuencia</th>
                          <th className="px-3 py-2 text-left font-medium">Vía</th>
                          <th className="px-3 py-2 text-left font-medium">Duración</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regimen.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="px-3 py-2">
                              <div>
                                <p className="font-medium">{item.medicationName}</p>
                                <p className="text-xs text-gray-500">
                                  {item.genericName}
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-2">{item.dose}</td>
                            <td className="px-3 py-2">{item.frequency}</td>
                            <td className="px-3 py-2">{item.route}</td>
                            <td className="px-3 py-2">{item.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Indication */}
                  <div className="rounded-lg bg-blue-50 p-3 text-sm">
                    <p className="font-medium text-blue-900">Indicación:</p>
                    <p className="mt-1 text-blue-800">{regimen.items[0]?.indication}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit?.(regimen.id)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(regimen.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

export default RegimensList;
