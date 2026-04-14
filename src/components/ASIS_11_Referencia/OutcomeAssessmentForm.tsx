import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, Check, BarChart3 } from 'lucide-react';

const outcomeSchema = z.object({
  closure_reason: z.enum(['resolved', 'improved', 'referred_elsewhere', 'lost_to_followup', 'transferred_care', 'deceased', 'unknown']),
  clinical_outcome: z.enum(['improved', 'stable', 'worsened', 'no_change', 'unknown']),
  symptom_resolution: z.boolean(),
  diagnostic_confirmation: z.boolean(),
  treatment_effectiveness: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']),
  complications_developed: z.boolean(),
  complications_description: z.string().optional().default(''),
  readmittance_required: z.boolean(),
  readmittance_reason: z.string().optional().default(''),
  quality_of_care_rating: z.number().min(1).max(5),
  patient_satisfaction_rating: z.number().min(1).max(5),
  recommendations: z.string().optional().default('')
});

type OutcomeFormData = z.infer<typeof outcomeSchema>;

interface Props {
  patientId: string;
  referralId: string;
  onSubmit: (data: OutcomeFormData) => Promise<void>;
}

export const OutcomeAssessmentForm: React.FC<Props> = ({ patientId, referralId, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<OutcomeFormData>({
    resolver: zodResolver(outcomeSchema),
    defaultValues: {
      symptom_resolution: false,
      diagnostic_confirmation: false,
      complications_developed: false,
      readmittance_required: false,
      quality_of_care_rating: 3,
      patient_satisfaction_rating: 3
    }
  });

  const handleFormSubmit = async (data: OutcomeFormData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      setSuccessMessage('Evaluación de resultado guardada exitosamente');
      reset();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const complicationsDeveloped = watch('complications_developed');
  const readmittanceRequired = watch('readmittance_required');
  const qualityRating = watch('quality_of_care_rating');
  const satisfactionRating = watch('patient_satisfaction_rating');
  const clinicalOutcome = watch('clinical_outcome');

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'improved': return 'bg-green-50 border-l-green-500';
      case 'worsened': return 'bg-red-50 border-l-red-600';
      case 'stable': return 'bg-blue-50 border-l-blue-500';
      default: return 'bg-gray-50 border-l-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Evaluación de Resultado de Referencia</h2>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Clinical Outcome */}
        <div className={`p-4 border-l-4 rounded-lg ${getOutcomeColor(clinicalOutcome)}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resultado Clínico General *
          </label>
          <select
            {...register('clinical_outcome')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione el resultado</option>
            <option value="improved">✓ Mejorado</option>
            <option value="stable">➡️ Estable</option>
            <option value="worsened">⚠️ Empeorado</option>
            <option value="no_change">— Sin cambios</option>
            <option value="unknown">? Desconocido</option>
          </select>
          {errors.clinical_outcome && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="w-4 h-4" />
              {errors.clinical_outcome.message}
            </div>
          )}
        </div>

        {/* Closure Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo de Cierre de Referencia *
          </label>
          <select
            {...register('closure_reason')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione motivo</option>
            <option value="resolved">Problema resuelto</option>
            <option value="improved">Paciente mejorado</option>
            <option value="referred_elsewhere">Referido a otro especialista</option>
            <option value="lost_to_followup">Pérdida de seguimiento</option>
            <option value="transferred_care">Transferencia de cuidados</option>
            <option value="deceased">Falleció</option>
            <option value="unknown">Desconocido</option>
          </select>
        </div>

        {/* Symptom & Diagnosis */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('symptom_resolution')}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Síntomas resueltos</span>
            </label>
            {errors.symptom_resolution && (
              <p className="text-red-600 text-sm mt-1">{errors.symptom_resolution.message}</p>
            )}
          </div>
          
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('diagnostic_confirmation')}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Diagnóstico confirmado</span>
            </label>
            {errors.diagnostic_confirmation && (
              <p className="text-red-600 text-sm mt-1">{errors.diagnostic_confirmation.message}</p>
            )}
          </div>
        </div>

        {/* Treatment Effectiveness */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Efectividad del Tratamiento Recomendado *
          </label>
          <select
            {...register('treatment_effectiveness')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione</option>
            <option value="excellent">⭐⭐⭐⭐⭐ Excelente</option>
            <option value="good">⭐⭐⭐⭐ Buena</option>
            <option value="fair">⭐⭐⭐ Regular</option>
            <option value="poor">⭐⭐ Pobre</option>
            <option value="unknown">? Desconocida</option>
          </select>
        </div>

        {/* Complications */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              {...register('complications_developed')}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-700">¿Se desarrollaron complicaciones?</span>
          </label>

          {complicationsDeveloped && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de Complicaciones
              </label>
              <textarea
                {...register('complications_description')}
                placeholder="Describa las complicaciones desarrolladas..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Readmittance */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              {...register('readmittance_required')}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-700">¿Requiere reingreso?</span>
          </label>

          {readmittanceRequired && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del Reingreso
              </label>
              <textarea
                {...register('readmittance_reason')}
                placeholder="Explique la razón del reingreso..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Quality and Satisfaction Ratings */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Calidad de Atención del Especialista
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <label key={rating} className="cursor-pointer">
                  <input
                    type="radio"
                    {...register('quality_of_care_rating', { valueAsNumber: true })}
                    value={rating}
                    className="hidden"
                  />
                  <span className={`inline-block w-10 h-10 rounded-lg flex items-center justify-center font-bold transition ${
                    qualityRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-100'
                  }`}>
                    {rating}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Satisfacción del Paciente
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <label key={rating} className="cursor-pointer">
                  <input
                    type="radio"
                    {...register('patient_satisfaction_rating', { valueAsNumber: true })}
                    value={rating}
                    className="hidden"
                  />
                  <span className={`inline-block w-10 h-10 rounded-lg flex items-center justify-center font-bold transition ${
                    satisfactionRating === rating
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-green-300 text-green-600 hover:bg-green-100'
                  }`}>
                    {rating}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recomendaciones para Futuras Referencias
          </label>
          <textarea
            {...register('recommendations')}
            placeholder="Incluya sugerencias sobre investigaciones adicionales, seguimiento, cambios de manejo, etc..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Summary Card */}
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
          <h4 className="font-semibold text-amber-900 mb-2">📊 Resumen de Evaluación</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>✓ Resultado clínico: <span className="font-medium">{clinicalOutcome || 'No seleccionado'}</span></li>
            <li>✓ Síntomas resueltos: <span className="font-medium">{watch('symptom_resolution') ? 'Sí' : 'No'}</span></li>
            <li>✓ Efectividad: <span className="font-medium">{watch('treatment_effectiveness') || 'No evaluada'}</span></li>
            <li>✓ Satisfacción paciente: <span className="font-medium">{satisfactionRating}/5</span></li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading || isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              Guardar Evaluación de Resultado
            </>
          )}
        </button>
      </form>
    </div>
  );
};
