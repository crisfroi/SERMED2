// @ts-nocheck
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { useImmunizationRecord } from '@/hooks/useImmunizationRecord';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================
const immunizationFormSchema = z.object({
  vaccineName: z.string().uuid('Selecciona una vacuna válida'),
  doseNumber: z.string().transform(Number).refine((n) => n > 0, 'Número de dosis inválido'),
  vaccinationDate: z.string().refine((d) => new Date(d) <= new Date(), 'Fecha no puede ser en el futuro'),
  lotNumber: z.string().min(3, 'Número de lote inválido').max(50),
  injectionSite: z.enum(['left_arm', 'right_arm', 'left_leg', 'right_leg', 'left_shoulder', 'right_shoulder']),
  routeOfAdministration: z.enum(['intradermal', 'subcutaneous', 'intramuscular', 'oral']),
  immediateReaction: z.boolean().default(false),
  reactionDescription: z.string().optional(),
  clinicalNotes: z.string().max(500).optional(),
});

type ImmunizationFormValues = z.infer<typeof immunizationFormSchema>;

// ============================================================================
// COMPONENT
// ============================================================================
export const ImmunizationRecordForm: React.FC<{
  patientId: string;
  onSuccess?: (recordId: string) => void;
}> = ({ patientId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { recordVaccination } = useImmunizationRecord();

  const form = useForm<ImmunizationFormValues>({
    resolver: zodResolver(immunizationFormSchema),
    defaultValues: {
      patientId,
      doseNumber: '1',
      vaccinationDate: new Date().toISOString().split('T')[0],
      immediateReaction: false,
    },
  });

  const onSubmit = async (values: ImmunizationFormValues) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const result = await recordVaccination({
        patient_id: patientId,
        vaccine_id: values.vaccineName,
        dose_number: values.doseNumber,
        vaccination_date: values.vaccinationDate,
        lot_number: values.lotNumber,
        injection_site: values.injectionSite,
        route_of_administration: values.routeOfAdministration,
        immediate_reaction: values.immediateReaction,
        reaction_description: values.reactionDescription,
        clinical_notes: values.clinicalNotes,
      });

      if (result.success) {
        setSubmitSuccess(true);
        form.reset();
        if (onSuccess) onSuccess(result.recordId);
      } else {
        setSubmitError(result.error);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Registro de Vacunación</h2>
      <p className="text-sm text-gray-600 mb-6">Paciente ID: {patientId}</p>

      {submitError && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">{submitError}</AlertDescription>
        </Alert>
      )}

      {submitSuccess && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">Vacunación registrada correctamente</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Vaccine Selection */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900">Información de la Vacuna</h3>

            <FormField
              control={form.control}
              name="vaccineName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vacuna *</FormLabel>
                  <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vacuna" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bcg">BCG (Tuberculosis)</SelectItem>
                      <SelectItem value="polio">OPV (Polio)</SelectItem>
                      <SelectItem value="pentaval">Pentavalente</SelectItem>
                      <SelectItem value="mmr">MMR (Sarampión, Paperas, Rubeola)</SelectItem>
                      <SelectItem value="varicela">Varicela</SelectItem>
                      <SelectItem value="rotavirus">Rotavirus</SelectItem>
                      <SelectItem value="pcv">PCV13 (Neumonía)</SelectItem>
                      <SelectItem value="influenza">Influenza Estacional</SelectItem>
                      <SelectItem value="fiebre_amarilla">Fiebre Amarilla</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="doseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Dosis *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vaccinationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Vacunación *</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Lote *</FormLabel>
                  <FormControl>
                    <Input placeholder="P123456" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormDescription>Número de lote de la vacuna</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Administration Details */}
          <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-gray-900">Detalles de Administración</h3>

            <FormField
              control={form.control}
              name="injectionSite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio de Inyección *</FormLabel>
                  <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="left_arm">Brazo Izquierdo</SelectItem>
                      <SelectItem value="right_arm">Brazo Derecho</SelectItem>
                      <SelectItem value="left_leg">Pierna Izquierda</SelectItem>
                      <SelectItem value="right_leg">Pierna Derecha</SelectItem>
                      <SelectItem value="left_shoulder">Hombro Izquierdo</SelectItem>
                      <SelectItem value="right_shoulder">Hombro Derecho</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="routeOfAdministration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vía de Administración *</FormLabel>
                  <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="intradermal">Intradérmica</SelectItem>
                      <SelectItem value="subcutaneous">Subcutánea</SelectItem>
                      <SelectItem value="intramuscular">Intramuscular</SelectItem>
                      <SelectItem value="oral">Oral</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Reaction Assessment */}
          <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-gray-900">Evaluación de Reacciones</h3>

            <FormField
              control={form.control}
              name="immediateReaction"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">¿Reacción inmediata observada?</FormLabel>
                </FormItem>
              )}
            />

            {form.watch('immediateReaction') && (
              <FormField
                control={form.control}
                name="reactionDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de la Reacción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describir síntomas observados..."
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Clinical Notes */}
          <FormField
            control={form.control}
            name="clinicalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Clínicas Adicionales</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observaciones importante del registro..."
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Máximo 500 caracteres</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Vacunación'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isSubmitting}>
              Limpiar
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default ImmunizationRecordForm;
