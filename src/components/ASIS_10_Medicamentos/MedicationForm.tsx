// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { useMedicationOrder } from '@/hooks/useMedicationOrder';

const medicationFormSchema = z.object({
  medicationId: z.string().uuid('Selecciona un medicamento válido'),
  doseAmount: z.string().transform(Number).refine((n) => n > 0, 'La dosis debe ser mayor a 0'),
  doseUnit: z.enum(['mg', 'ml', 'g', 'tablet', 'capsule', 'drop', 'patch', 'iu']),
  frequency: z.enum(['4', '6', '8', '12', '24', '48'], { errorMap: () => ({ message: 'Frecuencia inválida' }) }),
  routeOfAdministration: z.enum(['oral', 'iv', 'im', 'topical', 'inhalation', 'transdermal', 'sublingual', 'rectal']),
  indication: z.string().min(10, 'La indicación debe tener al menos 10 caracteres').max(500),
  duration: z.string().transform(Number).refine((n) => n > 0, 'La duración debe ser mayor a 0'),
  specialInstructions: z.string().max(500).optional(),
  checkContraindications: z.boolean().default(false),
  checkInteractions: z.boolean().default(false),
});

type MedicationFormValues = z.infer<typeof medicationFormSchema>;

interface MedicationFormProps {
  patientId: string;
  onSuccess?: (prescriptionId: string) => void;
  existingMedications?: string[];
}

const DOSE_UNITS = [
  { value: 'mg', label: 'Miligramos (mg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'tablet', label: 'Comprimido' },
  { value: 'capsule', label: 'Cápsula' },
  { value: 'drop', label: 'Gota' },
  { value: 'patch', label: 'Parche' },
  { value: 'iu', label: 'Unidades Internacionales (UI)' },
];

const ROUTES = [
  { value: 'oral', label: 'Oral' },
  { value: 'iv', label: 'Intravenosa (IV)' },
  { value: 'im', label: 'Intramuscular (IM)' },
  { value: 'topical', label: 'Tópica' },
  { value: 'inhalation', label: 'Inhalación' },
  { value: 'transdermal', label: 'Transdérmica' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'rectal', label: 'Rectal' },
];

const FREQUENCIES = [
  { value: '4', label: 'Cada 4 horas (6x/día)' },
  { value: '6', label: 'Cada 6 horas (4x/día)' },
  { value: '8', label: 'Cada 8 horas (3x/día)' },
  { value: '12', label: 'Cada 12 horas (2x/día)' },
  { value: '24', label: 'Una vez al día' },
  { value: '48', label: 'Cada 2 días' },
];

export function MedicationForm({
  patientId,
  onSuccess,
  existingMedications = [],
}: MedicationFormProps) {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { createMedicationOrder, checkContraindications } = useMedicationOrder(patientId);

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      routeOfAdministration: 'oral',
      doseUnit: 'mg',
      frequency: '24',
      checkContraindications: false,
      checkInteractions: false,
    },
  });

  // Load medications
  useEffect(() => {
    const loadMedications = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('medication_types')
          .select('id, name, generic_name, code, therapeutic_class')
          .order('name')
          .limit(500);

        if (error) throw error;
        setMedications(data || []);
      } catch (err: any) {
        setErrors([err.message || 'Error loading medications']);
      } finally {
        setLoading(false);
      }
    };

    loadMedications();
  }, []);

  const onSubmit = async (values: MedicationFormValues) => {
    try {
      setSubmitLoading(true);
      setErrors([]);

      // Check for contraindications if enabled
      if (values.checkContraindications) {
        const contraindications = await checkContraindications(values.medicationId);
        if (contraindications.length > 0) {
          setErrors(contraindications.map((c) => `⚠️ ${c}`));
          return;
        }
      }

      // Create prescription
      const prescriptionId = await createMedicationOrder({
        medicationId: values.medicationId,
        doseAmount: values.doseAmount,
        doseUnit: values.doseUnit,
        frequencyHours: parseInt(values.frequency),
        routeOfAdministration: values.routeOfAdministration,
        indication: values.indication,
        durationDays: values.duration,
        specialInstructions: values.specialInstructions,
        checkInteractions: values.checkInteractions,
      });

      setSubmitSuccess(true);
      form.reset();
      onSuccess?.(prescriptionId);

      // Auto-dismiss success message
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setErrors([err.message || 'Error creating prescription']);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Cargando medicamentos...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Nueva Prescripción de Medicamento</h2>
        <p className="mt-1 text-sm text-gray-600">
          Complete los campos para crear una nueva prescripción
        </p>
      </div>

      {submitSuccess && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="ml-2 text-green-800">
            ¡Prescripción creada exitosamente!
          </AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <ul className="ml-2 space-y-1 text-red-800">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Medication Selection */}
          <FormField
            control={form.control}
            name="medicationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medicamento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un medicamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-64">
                    {medications.map((med) => (
                      <SelectItem key={med.id} value={med.id}>
                        {med.name} ({med.generic_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona de la lista de medicamentos disponibles
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dosage Grid */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="doseAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosis *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="500"
                      step="0.1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doseUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOSE_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Route and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="routeOfAdministration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vía de Administración *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROUTES.map((route) => (
                        <SelectItem key={route.value} value={route.value}>
                          {route.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración (días) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="7"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Número de días de tratamiento</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Indication */}
          <FormField
            control={form.control}
            name="indication"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Indicación Clínica *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe la razón clínica para esta prescripción (ej: Infección bacterial leve, fiebre persistente, etc.)"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Mínimo 10 caracteres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Special Instructions */}
          <FormField
            control={form.control}
            name="specialInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instrucciones Especiales</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: Tomar con comida, evitar alcohol, etc."
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Validation Checkboxes */}
          <div className="space-y-3 rounded-lg bg-blue-50 p-4">
            <FormField
              control={form.control}
              name="checkContraindications"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <FormLabel className="mb-0 text-sm font-normal">
                    Verificar contraindicaciones del paciente
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkInteractions"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <FormLabel className="mb-0 text-sm font-normal">
                    Verificar interacciones con medicamentos actuales
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={submitLoading}
              className="flex-1"
            >
              {submitLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creando prescripción...
                </>
              ) : (
                'Crear Prescripción'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Limpiar
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

export default MedicationForm;
