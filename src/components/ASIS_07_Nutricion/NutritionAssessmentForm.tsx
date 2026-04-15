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
import { useNutritionAssessment } from '@/hooks/useNutritionAssessment';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================
const nutritionAssessmentSchema = z.object({
  patientId: z.string().uuid('ID de paciente inválido'),
  weight: z.string().transform(Number).refine((n) => n > 0 && n < 300, 'Peso debe estar entre 1 y 300 kg'),
  height: z.string().transform(Number).refine((n) => n > 50 && n < 250, 'Altura debe estar entre 50 y 250 cm'),
  muscularMass: z.string().transform(Number).refine((n) => n >= 0 && n <= 100, 'Porcentaje inválido'),
  fatPercentage: z.string().transform(Number).refine((n) => n >= 0 && n <= 100, 'Porcentaje inválido'),
  hemoglobin: z.string().optional().transform(v => v ? Number(v) : undefined),
  albumin: z.string().optional().transform(v => v ? Number(v) : undefined),
  nutritionalStatus: z.enum(['well-nourished', 'mild', 'moderate', 'severe']),
  feedingDifficulty: z.boolean().default(false),
  swallowingDifficulty: z.boolean().default(false),
  malabsorption: z.boolean().default(false),
  appetiteLoss: z.boolean().default(false),
  clinicalNotes: z.string().max(1000),
});

type NutritionAssessmentFormValues = z.infer<typeof nutritionAssessmentSchema>;

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================
interface NutritionAssessmentFormProps {
  patientId: string;
  onSuccess?: (assessmentId: string) => void;
  existingAssessment?: Partial<NutritionAssessmentFormValues>;
  readOnly?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const NutritionAssessmentForm: React.FC<NutritionAssessmentFormProps> = ({
  patientId,
  onSuccess,
  existingAssessment,
  readOnly = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const { createNutritionAssessment } = useNutritionAssessment();

  const form = useForm<NutritionAssessmentFormValues>({
    resolver: zodResolver(nutritionAssessmentSchema),
    defaultValues: {
      patientId,
      weight: existingAssessment?.weight?.toString() || '',
      height: existingAssessment?.height?.toString() || '',
      muscularMass: existingAssessment?.muscularMass?.toString() || '50',
      fatPercentage: existingAssessment?.fatPercentage?.toString() || '25',
      hemoglobin: existingAssessment?.hemoglobin?.toString() || '',
      albumin: existingAssessment?.albumin?.toString() || '',
      nutritionalStatus: existingAssessment?.nutritionalStatus || 'well-nourished',
      feedingDifficulty: existingAssessment?.feedingDifficulty || false,
      swallowingDifficulty: existingAssessment?.swallowingDifficulty || false,
      malabsorption: existingAssessment?.malabsorption || false,
      appetiteLoss: existingAssessment?.appetiteLoss || false,
      clinicalNotes: existingAssessment?.clinicalNotes || '',
    },
  });

  // Calculate BMI based on weight and height
  const weight = form.watch('weight');
  const height = form.watch('height');
  let bmi = null;
  if (weight && height) {
    bmi = Number((weight / ((height / 100) ** 2)).toFixed(1));
  }

  const getBMIClassification = (bmi: number): string => {
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obeso';
  };

  const onSubmit = async (values: NutritionAssessmentFormValues) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      const result = await createNutritionAssessment({
        patient_id: patientId,
        weight_kg: values.weight,
        height_cm: values.height,
        muscle_mass_percentage: values.muscularMass,
        fat_percentage: values.fatPercentage,
        hemoglobin_g_dl: values.hemoglobin,
        albumin_g_dl: values.albumin,
        nutritional_status: values.nutritionalStatus,
        feeding_difficulty: values.feedingDifficulty,
        swallowing_difficulty: values.swallowingDifficulty,
        nutrient_malabsorption: values.malabsorption,
        appetite_loss: values.appetiteLoss,
        clinical_assessment: values.clinicalNotes,
      });

      if (result.success) {
        setSubmitSuccess(true);
        form.reset();
        if (onSuccess) {
          onSuccess(result.assessmentId);
        }
      } else {
        setSubmitError(result.error || 'Error al guardar la evaluación');
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Evaluación Nutricional</h2>
          <p className="text-sm text-gray-600 mt-1">Paciente ID: {patientId}</p>
        </div>

        {/* BMI Summary */}
        {bmi !== null && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>IMC: {bmi}</strong> ({getBMIClassification(bmi)})
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {submitError && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {submitSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              Evaluación nutricional guardada correctamente
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Anthropometric Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Medidas Antropométricas</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="70.5"
                          disabled={readOnly || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="175"
                          disabled={readOnly || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="muscularMass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Masa Muscular (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          disabled={readOnly || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje Graso (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          disabled={readOnly || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Biochemical Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900">Marcadores Bioquímicos</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hemoglobin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hemoglobina (g/dl)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="13.0"
                          disabled={readOnly || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="albumin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Albúmina (g/dl)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="3.5"
                          disabled={readOnly || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Clinical Assessment */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900">Evaluación Clínica</h3>
              
              <FormField
                control={form.control}
                name="nutritionalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Nutricional *</FormLabel>
                    <Select disabled={readOnly || isSubmitting} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="well-nourished">Bien nutrido</SelectItem>
                        <SelectItem value="mild">Desnutrición leve</SelectItem>
                        <SelectItem value="moderate">Desnutrición moderada</SelectItem>
                        <SelectItem value="severe">Desnutrición severa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Risk Factors */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Factores de Riesgo</h4>
                
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="feedingDifficulty"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={readOnly || isSubmitting}
                            className="h-4 w-4 rounded border gray-300"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Dificultad de alimentación</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="swallowingDifficulty"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={readOnly || isSubmitting}
                            className="h-4 w-4 rounded border gray-300"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Dificultad para tragar</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="malabsorption"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={readOnly || isSubmitting}
                            className="h-4 w-4 rounded border gray-300"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Malabsorción</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="appetiteLoss"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={readOnly || isSubmitting}
                            className="h-4 w-4 rounded border gray-300"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Pérdida de apetito</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Clinical Notes */}
            <FormField
              control={form.control}
              name="clinicalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Clínicas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      disabled={readOnly || isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Máximo 1000 caracteres</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                type="submit"
                disabled={readOnly || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Evaluación'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={readOnly || isSubmitting}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
};

export default NutritionAssessmentForm;
