import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, Check, AlertTriangle } from 'lucide-react';

const prescriptionSchema = z.object({
  medication_id: z.string().min(1, 'Seleccione un medicamento'),
  dose_value: z.number().positive('Dosis debe ser positiva'),
  dose_unit: z.enum(['mg', 'ml', 'units'], { errorMap: () => ({ message: 'Seleccione unidad válida' }) }),
  frequency: z.string().min(1, 'Especifique la frecuencia'),
  route: z.enum(['oral', 'IV', 'IM', 'sublingual', 'topical', 'inhalation'], { errorMap: () => ({ message: 'Seleccione ruta válida' }) }),
  duration_days: z.number().positive('Duración debe ser positiva').optional().default(7),
  number_of_refills: z.number().min(0).default(0),
  indication: z.string().min(10, 'Indique la razón clínica mínimo 10 caracteres'),
  special_instructions: z.string().optional().default(''),
  is_preventive: z.boolean().default(false),
  is_essential_medication: z.boolean().default(false)
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

interface Medication {
  id: string;
  generic_name: string;
  brand_name?: string;
  therapeutic_class: string;
  strength: string;
  pregnancy_category: string;
  breastfeeding_compatibility: string;
  contraindications?: string;
}

interface Props {
  patientId: string;
  onSubmit: (data: PrescriptionFormData) => Promise<void>;
  medications?: Medication[];
}

export const PrescriptionForm: React.FC<Props> = ({ patientId, onSubmit, medications = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      frequency: 'once daily',
      route: 'oral',
      duration_days: 7,
      number_of_refills: 0,
      is_preventive: false,
      is_essential_medication: false
    }
  });

  const medicationId = watch('medication_id');

  useEffect(() => {
    const selected = medications.find(m => m.id === medicationId);
    setSelectedMedication(selected || null);
  }, [medicationId, medications]);

  const handleFormSubmit = async (data: PrescriptionFormData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      setSuccessMessage('Prescripción creada exitosamente');
      reset();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating prescription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const frequencyOptions = [
    { value: 'once daily', label: 'Una vez al día' },
    { value: 'twice daily', label: 'Dos veces al día' },
    { value: 'three times daily', label: 'Tres veces al día' },
    { value: 'four times daily', label: 'Cuatro veces al día' },
    { value: 'every 6 hours', label: 'Cada 6 horas' },
    { value: 'every 8 hours', label: 'Cada 8 horas' },
    { value: 'every 12 hours', label: 'Cada 12 horas' },
    { value: 'as needed', label: 'Según sea necesario' },
    { value: 'at bedtime', label: 'Al acostarse' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nueva Prescripción</h2>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Medication Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medicamento *
          </label>
          <select
            {...register('medication_id')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un medicamento</option>
            {medications.map(med => (
              <option key={med.id} value={med.id}>
                {med.generic_name} {med.brand_name ? `(${med.brand_name})` : ''} - {med.strength}
              </option>
            ))}
          </select>
          {errors.medication_id && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="w-4 h-4" />
              {errors.medication_id.message}
            </div>
          )}
        </div>

        {/* Medication Details */}
        {selectedMedication && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Clase Terapéutica</p>
                <p className="font-medium">{selectedMedication.therapeutic_class}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoría en Embarazo</p>
                <p className={`font-medium ${selectedMedication.pregnancy_category === 'X' ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedMedication.pregnancy_category}
                </p>
              </div>
              {selectedMedication.contraindications && (
                <div className="col-span-2 p-3 bg-red-100 border-l-4 border-red-500 rounded text-sm text-red-800">
                  ⚠️ <span className="font-semibold">Contraindicaciones:</span> {selectedMedication.contraindications}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dosage Information */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosis *
            </label>
            <input
              type="number"
              step="0.1"
              {...register('dose_value', { valueAsNumber: true })}
              placeholder="ej: 500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dose_value && (
              <div className="flex items-center gap-2 text-red-600 text-xs mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors.dose_value.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidad *
            </label>
            <select
              {...register('dose_unit')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mg">mg</option>
              <option value="ml">ml</option>
              <option value="units">units</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ruta de Administración *
            </label>
            <select
              {...register('route')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="oral">Oral</option>
              <option value="IV">IV</option>
              <option value="IM">IM</option>
              <option value="sublingual">Sublingual</option>
              <option value="topical">Tópico</option>
              <option value="inhalation">Inhalación</option>
            </select>
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frecuencia *
          </label>
          <select
            {...register('frequency')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {frequencyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Duration & Refills */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (días) *
            </label>
            <input
              type="number"
              {...register('duration_days', { valueAsNumber: true })}
              placeholder="ej: 7"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Renovaciones
            </label>
            <input
              type="number"
              {...register('number_of_refills', { valueAsNumber: true })}
              placeholder="ej: 3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Clinical Indication */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Indicación Clínica *
          </label>
          <textarea
            {...register('indication')}
            placeholder="Indique el diagnóstico o problema a tratar..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.indication && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="w-4 h-4" />
              {errors.indication.message}
            </div>
          )}
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instrucciones Especiales
          </label>
          <textarea
            {...register('special_instructions')}
            placeholder="Ej: Tomar con alimentos, evitar alcohol, etc..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Flags */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_preventive')}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Medicación Preventiva</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_essential_medication')}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Medicación Esencial</span>
          </label>
        </div>

        {/* Important Notes */}
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Antes de Prescribir:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Verificar interacciones medicamentosas</li>
                <li>Revisar alergias conocidas del paciente</li>
                <li>Confirmar categoría de embarazo si aplica</li>
                <li>Validar contraindicaciones</li>
              </ul>
            </div>
          </div>
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
              Procesando...
            </>
          ) : (
            'Crear Prescripción'
          )}
        </button>
      </form>
    </div>
  );
};
