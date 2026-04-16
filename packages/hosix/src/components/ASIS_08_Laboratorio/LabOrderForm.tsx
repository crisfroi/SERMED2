// ============================================================================
// Lab Order Form Component - ASIS 8.0 - Laboratory Orders
// Create and manage laboratory test orders with specimens and urgency
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Plus,
  Trash2,
  Send,
  CheckCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLabOrder } from '@/hooks/useLabOrder';

interface TestSelection {
  testId: string;
  testName: string;
  testCode: string;
  sampleTypeId: string;
  sampleTypeName: string;
  urgency: 'normal' | 'urgent' | 'stat';
}

interface LabOrderFormProps {
  patientId: string;
  patientName: string;
  onOrderCreated?: (orderId: string) => void;
}

export const LabOrderForm: React.FC<LabOrderFormProps> = ({
  patientId,
  patientName,
  onOrderCreated,
}) => {
  const [selectedTests, setSelectedTests] = useState<TestSelection[]>([]);
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'stat'>('normal');
  const [requestedForDate, setRequestedForDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showTestSelector, setShowTestSelector] = useState(false);

  const {
    availableTests,
    availableSampleTypes,
    createOrder,
    fetchAvailableTests,
  } = useLabOrder();

  useEffect(() => {
    fetchAvailableTests();
  }, [fetchAvailableTests]);

  const handleAddTest = (testId: string, testName: string, testCode: string) => {
    if (!selectedTests.find((t) => t.testId === testId)) {
      setSelectedTests([
        ...selectedTests,
        {
          testId,
          testName,
          testCode,
          sampleTypeId: '',
          sampleTypeName: '',
          urgency: 'normal',
        },
      ]);
      setShowTestSelector(false);
    }
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.testId !== testId));
  };

  const handleSampleTypeChange = (testId: string, sampleTypeId: string) => {
    setSelectedTests(
      selectedTests.map((t) =>
        t.testId === testId
          ? {
              ...t,
              sampleTypeId,
              sampleTypeName:
                availableSampleTypes.find((s) => s.id === sampleTypeId)?.name ||
                '',
            }
          : t
      )
    );
  };

  const handleUrgencyChange = (
    testId: string,
    urgency: 'normal' | 'urgent' | 'stat'
  ) => {
    setSelectedTests(
      selectedTests.map((t) =>
        t.testId === testId ? { ...t, urgency } : t
      )
    );
  };

  const handleSubmitOrder = async () => {
    setError(null);
    setSuccessMessage(null);

    // Validations
    if (selectedTests.length === 0) {
      setError('Debe seleccionar al menos una prueba');
      return;
    }

    if (!clinicalIndication.trim()) {
      setError('La indicación clínica es requerida');
      return;
    }

    if (selectedTests.some((t) => !t.sampleTypeId)) {
      setError('Todos los tests deben tener un tipo de muestra seleccionado');
      return;
    }

    setIsLoading(true);

    try {
      const orderId = await createOrder(
        patientId,
        clinicalIndication,
        selectedTests,
        priority,
        requestedForDate ? new Date(requestedForDate) : undefined
      );

      setSuccessMessage(
        `Orden creada exitosamente: ${orderId.slice(0, 8)}`
      );
      setSelectedTests([]);
      setClinicalIndication('');
      setPriority('normal');
      setRequestedForDate('');

      onOrderCreated?.(orderId);

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al crear la orden'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📋 Nueva Orden de Laboratorio
        </CardTitle>
        <CardDescription>
          Paciente: <strong>{patientName}</strong> | ID: {patientId.slice(0, 8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error/Success Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Clinical Indication */}
        <div className="space-y-2">
          <Label htmlFor="indication">Indicación Clínica</Label>
          <Textarea
            id="indication"
            placeholder="Ej: Evaluar anemia, sospecha de diabetes..."
            value={clinicalIndication}
            onChange={(e) => setClinicalIndication(e.target.value)}
            className="h-20"
          />
        </div>

        {/* Priority Selection */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (24h)</SelectItem>
                <SelectItem value="urgent">Urgente (4h)</SelectItem>
                <SelectItem value="stat">STAT (1h)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requested-date">Solicitar para (Fecha)</Label>
            <Input
              id="requested-date"
              type="date"
              value={requestedForDate}
              onChange={(e) => setRequestedForDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Selected Tests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Pruebas Seleccionadas ({selectedTests.length})
            </Label>
            <Dialog open={showTestSelector} onOpenChange={setShowTestSelector}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Prueba
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-96 overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Seleccionar Prueba de Laboratorio</DialogTitle>
                  <DialogDescription>
                    Busca y selecciona las pruebas que deseas realizar
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                  {availableTests.map((test) => (
                    <button
                      key={test.id}
                      onClick={() =>
                        handleAddTest(test.id, test.name, test.code)
                      }
                      className="rounded border border-gray-200 p-3 text-left hover:bg-blue-50"
                    >
                      <div className="font-semibold">{test.name}</div>
                      <div className="text-sm text-gray-600">
                        {test.code} • {test.category}
                      </div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {selectedTests.length > 0 ? (
            <div className="space-y-2 rounded-lg bg-gray-50 p-3">
              {selectedTests.map((test, idx) => (
                <div
                  key={test.testId}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{test.testName}</div>
                      <div className="text-sm text-gray-600">{test.testCode}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveTest(test.testId)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <Label className="text-xs">Tipo de Muestra</Label>
                      <Select
                        value={test.sampleTypeId}
                        onValueChange={(v) =>
                          handleSampleTypeChange(test.testId, v)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 text-sm">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSampleTypes.map((st) => (
                            <SelectItem key={st.id} value={st.id}>
                              {st.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Urgencia</Label>
                      <Select
                        value={test.urgency}
                        onValueChange={(v: any) =>
                          handleUrgencyChange(test.testId, v)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                          <SelectItem value="stat">STAT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
              No hay pruebas seleccionadas
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitOrder}
          disabled={isLoading || selectedTests.length === 0}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
          {isLoading ? 'Enviando orden...' : 'Crear Orden'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LabOrderForm;
