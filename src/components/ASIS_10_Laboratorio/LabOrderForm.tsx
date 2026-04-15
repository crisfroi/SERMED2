// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, Check } from 'lucide-react';

const labOrderSchema = z.object({
  test_type_id: z.string().min(1, 'Seleccione un tipo de prueba'),
  clinical_indication: z.string().min(10, 'Indique la razón clínica mínimo 10 caracteres'),
  priority: z.enum(['routine', 'urgent', 'STAT'], {
    errorMap: () => ({ message: 'Seleccione una prioridad válida' })
  }),
  specimen_type: z.string().min(1, 'Seleccione tipo de muestra'),
  specimen_volume_ml: z.number().positive('Volumen debe ser positivo'),
  fasting_required: z.boolean(),
  collection_date: z.string().refine(date => new Date(date) <= new Date(), {
    message: 'Fecha no puede ser futura'
  }),
  clinical_history: z.string().optional().default(''),
  medications_current: z.string().optional().default(''),
  allergies: z.string().optional().default('')
});

type LabOrderFormData = z.infer<typeof labOrderSchema>;

interface TestType {
  id: string;
  test_name: string;
  specimen_type: string;
  requires_fasting: boolean;
  reference_unit: string;
  turnaround_time_hours: number;
}

interface Props {
  patientId: string;
  onSubmit: (data: LabOrderFormData) => Promise<void>;
  testTypes?: TestType[];
}

export const LabOrderForm: React.FC<Props> = ({ patientId, onSubmit, testTypes = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedTest, setSelectedTest] = useState<TestType | null>(null);
  
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<LabOrderFormData>({
    resolver: zodResolver(labOrderSchema),
    defaultValues: {
      priority: 'routine',
      fasting_required: false,
      collection_date: new Date().toISOString().split('T')[0]
    }
  });

  const testTypeId = watch('test_type_id');
  const fastingRequired = watch('fasting_required');

  // Update selectedTest based on selection
  useEffect(() => {
    const selected = testTypes.find(t => t.id === testTypeId);
    setSelectedTest(selected || null);
  }, [testTypeId, testTypes]);

  const handleFormSubmit = async (data: LabOrderFormData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      setSuccessMessage('Orden de laboratorio creada exitosamente');
      reset();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating lab order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nueva Orden de Laboratorio</h2>
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Test Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Prueba *
          </label>
          <select
            {...register('test_type_id')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione una prueba</option>
            {testTypes.map(test => (
              <option key={test.id} value={test.id}>
                {test.test_name} - {test.specimen_type} ({test.turnaround_time_hours}h)
              </option>
            ))}
          </select>
          {errors.test_type_id && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="w-4 h-4" />
              {errors.test_type_id.message}
            </div>
          )}
        </div>

        {/* Test Details Display */}
        {selectedTest && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm text-gray-600">Tipo de muestra:</span>
                <p className="font-medium">{selectedTest.specimen_type}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tiempo resultado:</span>
                <p className="font-medium">{selectedTest.turnaround_time_hours} horas</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-600">Ayuno requerido:</span>
                <p className="font-medium">{selectedTest.requires_fasting ? 'Sí' : 'No'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Indication */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Indicación Clínica *
          </label>
          <textarea
            {...register('clinical_indication')}
            placeholder="Describa la razón clínica para la prueba..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.clinical_indication && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="w-4 h-4" />
              {errors.clinical_indication.message}
            </div>
          )}
        </div>

        {/* Clinical History */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Historia Clínica Relevante
          </label>
          <textarea
            {...register('clinical_history')}
            placeholder="Antecedentes relevantes..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Priority & Collection Details Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad *
            </label>
            <select
              {...register('priority')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="routine">Rutina (5-7 días)</option>
              <option value="urgent">Urgente (24-48 horas)</option>
              <option value="STAT">STAT (2-4 horas)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Recolección *
            </label>
            <input
              type="date"
              {...register('collection_date')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Specimen Type & Volume Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Muestra *
            </label>
            <select
              {...register('specimen_type')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione</option>
              <option value="blood">Sangre</option>
              <option value="urine">Orina</option>
              <option value="stool">Heces</option>
              <option value="csf">LCR</option>
              <option value="sputum">Esputo</option>
            </select>
            {errors.specimen_type && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.specimen_type.message}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volumen (ml) *
            </label>
            <input
              type="number"
              step="0.1"
              {...register('specimen_volume_ml', { valueAsNumber: true })}
              placeholder="ej: 5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.specimen_volume_ml && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.specimen_volume_ml.message}
              </div>
            )}
          </div>
        </div>

        {/* Fasting Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('fasting_required')}
            id="fasting"
            className="w-4 h-4 rounded"
          />
          <label htmlFor="fasting" className="text-sm font-medium text-gray-700">
            Requerido ayuno previo
          </label>
        </div>

        {fastingRequired && (
          <div className="p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-700">
            <p className="text-sm">⚠️ Paciente debe estar en ayuno de mínimo 8 horas</p>
          </div>
        )}

        {/* Medications & Allergies */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicamentos Actuales
            </label>
            <textarea
              {...register('medications_current')}
              placeholder="Medicamentos en uso..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alergias Conocidas
            </label>
            <textarea
              {...register('allergies')}
              placeholder="Alergias a medicamentos o sustancias..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            'Crear Orden de Laboratorio'
          )}
        </button>
      </form>
    </div>
  );
};
