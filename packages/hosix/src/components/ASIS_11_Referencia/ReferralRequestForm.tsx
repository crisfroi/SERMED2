import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, Check, Send } from 'lucide-react';

const referralRequestSchema = z.object({
  referral_type_id: z.string().min(1, 'Seleccione tipo de referencia'),
  specialist_facility_id: z.string().min(1, 'Seleccione establecimiento destino'),
  priority: z.enum(['routine', 'urgent', 'STAT']),
  clinical_indication: z.string().min(20, 'Indique la razón clínica mínimo 20 caracteres'),
  clinical_history: z.string().optional().default(''),
  relevant_exams: z.string().optional().default(''),
  medications_current: z.string().optional().default(''),
  allergies: z.string().optional().default(''),
  insurance_authorization_code: z.string().optional().default('')
});

type ReferralFormData = z.infer<typeof referralRequestSchema>;

interface ReferralType {
  id: string;
  type_name: string;
  specialty: string;
  average_response_days: number;
}

interface SpecialistFacility {
  id: string;
  facility_name: string;
  specialty: string;
  contact_phone: string;
  contact_email: string;
}

interface Props {
  patientId: string;
  onSubmit: (data: ReferralFormData) => Promise<void>;
  referralTypes?: ReferralType[];
  facilities?: SpecialistFacility[];
}

export const ReferralRequestForm: React.FC<Props> = ({
  patientId,
  onSubmit,
  referralTypes = [],
  facilities = []
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedType, setSelectedType] = useState<ReferralType | null>(null);
  const [filteredFacilities, setFilteredFacilities] = useState<SpecialistFacility[]>(facilities);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralRequestSchema),
    defaultValues: {
      priority: 'routine'
    }
  });

  const typeId = watch('referral_type_id');

  // Update selected type and filter facilities
  React.useEffect(() => {
    const selected = referralTypes.find(t => t.id === typeId);
    setSelectedType(selected || null);
    
    if (selected) {
      const filtered = facilities.filter(f => f.specialty === selected.specialty);
      setFilteredFacilities(filtered);
    }
  }, [typeId, referralTypes, facilities]);

  const handleFormSubmit = async (data: ReferralFormData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      setSuccessMessage('Referencia enviada exitosamente');
      reset();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating referral:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const priorityInfo = {
    routine: 'Respuesta esperada en 5-7 días',
    urgent: 'Respuesta esperada en 24-48 horas',
    STAT: 'Respuesta esperada en 2-4 horas'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nueva Solicitud de Referencia</h2>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Referral Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Referencia *
          </label>
          <select
            {...register('referral_type_id')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione tipo de referencia</option>
            {referralTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.type_name} - {type.specialty}
              </option>
            ))}
          </select>
          {errors.referral_type_id && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="w-4 h-4" />
              {errors.referral_type_id.message}
            </div>
          )}
        </div>

        {/* Referral Type Details */}
        {selectedType && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Especialidad</p>
                <p className="font-medium">{selectedType.specialty}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Tiempo esperado respuesta</p>
                <p className="font-medium text-blue-600">{selectedType.average_response_days} días</p>
              </div>
            </div>
          </div>
        )}

        {/* Facility Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Establecimiento de Destino *
          </label>
          <select
            {...register('specialist_facility_id')}
            disabled={!selectedType}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">
              {selectedType ? 'Seleccione establecimiento' : 'Primero seleccione tipo de referencia'}
            </option>
            {filteredFacilities.map(facility => (
              <option key={facility.id} value={facility.id}>
                {facility.facility_name} - {facility.contact_phone}
              </option>
            ))}
          </select>
          {errors.specialist_facility_id && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="w-4 h-4" />
              {errors.specialist_facility_id.message}
            </div>
          )}
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioridad de Referencia *
          </label>
          <select
            {...register('priority')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="routine">Rutina (5-7 días)</option>
            <option value="urgent">Urgente (24-48 horas)</option>
            <option value="STAT">STAT (2-4 horas)</option>
          </select>
          {watch('priority') && (
            <p className="text-sm text-blue-600 mt-1">
              ℹ️ {priorityInfo[watch('priority') as keyof typeof priorityInfo]}
            </p>
          )}
        </div>

        {/* Clinical Indication */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Indicación Clínica *
          </label>
          <textarea
            {...register('clinical_indication')}
            placeholder="Describa brevemente el motivo de la referencia..."
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
            placeholder="Antecedentes, diagnósticos previos, tratamientos realizados..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Examinations & Current Meds */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exámenes Relevantes Realizados
            </label>
            <textarea
              {...register('relevant_exams')}
              placeholder="Resultados de laboratorio, imagenología, etc..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicamentos Actuales
            </label>
            <textarea
              {...register('medications_current')}
              placeholder="Medicamentos en uso especialmente relevantes..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Allergies & Insurance */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alergias Conocidas
            </label>
            <input
              type="text"
              {...register('allergies')}
              placeholder="Medicamentos, alimentos, etc..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Autorización Seguros
            </label>
            <input
              type="text"
              {...register('insurance_authorization_code')}
              placeholder="Si aplica..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Important Notes */}
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
          <p className="text-sm text-amber-800">
            ⚠️ <span className="font-semibold">Nota importante:</span> La referencia será enviada al establecimiento seleccionado. 
            El paciente recibirá notificación de su estado mediante el medio registrado.
          </p>
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
            <>
              <Send className="w-4 h-4" />
              Enviar Referencia
            </>
          )}
        </button>
      </form>
    </div>
  );
};
