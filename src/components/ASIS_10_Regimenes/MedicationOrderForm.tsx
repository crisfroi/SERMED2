// ============================================================================
// MedicationOrderForm.tsx - Medication/Prescription Form Component
// ASIS 10.0 - Regímenes de Medicación
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useMedicationOrder } from '@/hooks/useMedicationOrder';
import { AlertCircle, Loader2, Check } from 'lucide-react';

interface MedicationOrderFormProps {
  patientId: string;
  onSuccess?: (order: any) => void;
  onCancel?: () => void;
}

export const MedicationOrderForm: React.FC<MedicationOrderFormProps> = ({
  patientId,
  onSuccess,
  onCancel,
}) => {
  const {
    createOrder,
    selectMedications,
    validateInteractions,
    availableMedications,
    selectedMedications,
    loading,
    error,
    interactions,
  } = useMedicationOrder(patientId);

  const [formData, setFormData] = useState({
    medication: '',
    dose: '',
    unit: 'mg',
    frequency: 'once_daily',
    duration: '',
    indication: '',
    contraindications: [],
    specialInstructions: '',
    refills: 0,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [showInteractions, setShowInteractions] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.medication) errors.medication = 'Medication is required';
    if (!formData.dose || isNaN(Number(formData.dose))) errors.dose = 'Valid dose required';
    if (!formData.frequency) errors.frequency = 'Frequency is required';
    if (!formData.indication) errors.indication = 'Indication is required';
    if (selectedMeds.length === 0) errors.medications = 'Select at least one medication';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMedicationSelect = (medId: string) => {
    if (selectedMeds.includes(medId)) {
      setSelectedMeds(selectedMeds.filter((m) => m !== medId));
    } else {
      if (selectedMeds.length < 10) {
        setSelectedMeds([...selectedMeds, medId]);
        selectMedications(medId);
      }
    }
  };

  const handleCheckInteractions = async () => {
    if (selectedMeds.length > 0) {
      const result = await validateInteractions(selectedMeds);
      setShowInteractions(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const orderData = {
        medications: selectedMeds,
        dose: parseFloat(formData.dose),
        unit: formData.unit,
        frequency: formData.frequency,
        duration: formData.duration,
        indication: formData.indication,
        specialInstructions: formData.specialInstructions,
        refills: formData.refills,
      };

      await createOrder(orderData);
      onSuccess?.(orderData);

      // Reset form
      setFormData({
        medication: '',
        dose: '',
        unit: 'mg',
        frequency: 'once_daily',
        duration: '',
        indication: '',
        contraindications: [],
        specialInstructions: '',
        refills: 0,
      });
      setSelectedMeds([]);
      setFormErrors({});
    } catch (err) {
      setFormErrors({ submit: 'Failed to create medication order' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear Orden de Medicación</CardTitle>
          <CardDescription>Seleccionar medicamentos y configurar dosis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Medication Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Medicamentos Disponibles</Label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
                {availableMedications?.map((med: any) => (
                  <div key={med.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={med.id}
                      checked={selectedMeds.includes(med.id)}
                      onCheckedChange={() => handleMedicationSelect(med.id)}
                      disabled={selectedMeds.length >= 10 && !selectedMeds.includes(med.id)}
                    />
                    <label
                      htmlFor={med.id}
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {med.name}
                      <span className="text-xs text-gray-500 block">{med.strength}</span>
                    </label>
                  </div>
                ))}
              </div>
              {formErrors.medications && (
                <p className="text-sm text-red-500">{formErrors.medications}</p>
              )}
              <p className="text-xs text-gray-500">
                {selectedMeds.length}/10 medicamentos seleccionados
              </p>
            </div>

            {/* Dose */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="dose">Dosis</Label>
                <Input
                  id="dose"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 500"
                  value={formData.dose}
                  onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                  aria-invalid={!!formErrors.dose}
                />
                {formErrors.dose && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.dose}</p>
                )}
              </div>
              <div>
                <Label htmlFor="unit">Unidad</Label>
                <Select value={formData.unit} onValueChange={(val) => setFormData({ ...formData, unit: val })}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="mcg">mcg</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="unit">Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <Label htmlFor="frequency">Frecuencia</Label>
              <Select
                value={formData.frequency}
                onValueChange={(val) => setFormData({ ...formData, frequency: val })}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once_daily">Una vez al día</SelectItem>
                  <SelectItem value="twice_daily">Dos veces al día</SelectItem>
                  <SelectItem value="three_times_daily">Tres veces al día</SelectItem>
                  <SelectItem value="four_times_daily">Cuatro veces al día</SelectItem>
                  <SelectItem value="every_6_hours">Cada 6 horas</SelectItem>
                  <SelectItem value="every_8_hours">Cada 8 horas</SelectItem>
                  <SelectItem value="every_12_hours">Cada 12 horas</SelectItem>
                  <SelectItem value="as_needed">Según sea necesario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duración (días)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="Ej: 7"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="refills">Recargas</Label>
                <Input
                  id="refills"
                  type="number"
                  min="0"
                  max="5"
                  value={formData.refills}
                  onChange={(e) => setFormData({ ...formData, refills: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Indication */}
            <div>
              <Label htmlFor="indication">Indicación</Label>
              <Textarea
                id="indication"
                placeholder="Razón clínica para este medicamento"
                value={formData.indication}
                onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                aria-invalid={!!formErrors.indication}
              />
              {formErrors.indication && (
                <p className="text-sm text-red-500 mt-1">{formErrors.indication}</p>
              )}
            </div>

            {/* Special Instructions */}
            <div>
              <Label htmlFor="instructions">Instrucciones Especiales</Label>
              <Textarea
                id="instructions"
                placeholder="Ej: Tomar con comida, evitar lácteos, etc."
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
              />
            </div>

            {/* Interactions Check */}
            {selectedMeds.length > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckInteractions}
                className="w-full"
              >
                Verificar Interacciones
              </Button>
            )}

            {showInteractions && interactions?.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Interacciones Detectadas:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {interactions.map((interaction, idx) => (
                      <li key={idx} className="text-sm">
                        {interaction.medication1} + {interaction.medication2}: {interaction.severity}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Crear Orden
                  </>
                )}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicationOrderForm;
