import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, AlertTriangle, TrendingDown, BarChart3, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const adherenceSchema = z.object({
  adherence_level: z.enum(['excellent', 'good', 'fair', 'poor', 'not_assessed']),
  adherence_percentage: z.number().min(0).max(100),
  missed_doses: z.number().min(0),
  adherence_barriers: z.string().optional().default(''),
  side_effects_reported: z.string().optional().default(''),
  motivation_level: z.enum(['high', 'moderate', 'low']),
  education_provided: z.boolean(),
  follow_up_date: z.string().optional().default('')
});

type AdherenceFormData = z.infer<typeof adherenceSchema>;

interface Prescription {
  id: string;
  medication_name: string;
  dose: string;
  frequency: string;
  indication: string;
  prescription_date: string;
}

interface AdherenceRecord {
  id: string;
  adherence_percentage: number;
  adherence_level: string;
  assessment_date: string;
  barriers?: string[];
}

interface Props {
  patientId: string;
  prescription?: Prescription;
  adherenceHistory?: AdherenceRecord[];
  onSubmit: (data: AdherenceFormData) => Promise<void>;
}

export const MedicationAdherenceTracker: React.FC<Props> = ({
  patientId,
  prescription,
  adherenceHistory = [],
  onSubmit
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<AdherenceFormData>({
    resolver: zodResolver(adherenceSchema),
    defaultValues: {
      adherence_level: 'not_assessed',
      adherence_percentage: 0,
      missed_doses: 0,
      motivation_level: 'moderate',
      education_provided: false
    }
  });

  const adherencePercentage = watch('adherence_percentage');
  const adherenceLevel = watch('adherence_level');
  const missedDoses = watch('missed_doses');

  // Prepare chart data
  useEffect(() => {
    const data = adherenceHistory
      .sort((a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime())
      .map(record => ({
        date: new Date(record.assessment_date).toLocaleDateString('es-ES'),
        adherence: record.adherence_percentage
      }));
    setChartData(data);
  }, [adherenceHistory]);

  const handleFormSubmit = async (data: AdherenceFormData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      setSuccessMessage('Evaluación de adherencia registrada exitosamente');
      reset();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-blue-600 bg-blue-50';
    if (percentage >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getAdherenceStatus = (percentage: number) => {
    if (percentage >= 90) return '✓ Excelente adherencia';
    if (percentage >= 75) return '✓ Buena adherencia';
    if (percentage >= 50) return '⚠️ Adherencia Regular';
    return '❌ Adherencia Baja';
  };

  const adherenceDistribution = [
    { name: 'Cumple tomas', value: adherencePercentage, fill: '#10b981' },
    { name: 'Incumplimiento', value: 100 - adherencePercentage, fill: '#ef4444' }
  ];

  const averageAdherence = adherenceHistory.length > 0
    ? Math.round(adherenceHistory.reduce((sum, r) => sum + r.adherence_percentage, 0) / adherenceHistory.length)
    : 0;

  const trend = adherenceHistory.length > 1
    ? adherenceHistory[adherenceHistory.length - 1].adherence_percentage - adherenceHistory[0].adherence_percentage
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Seguimiento de Adherencia a Medicamentos</h2>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {/* Medication Info */}
      {prescription && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">{prescription.medication_name}</h3>
          <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <span className="font-medium">Dosis:</span> {prescription.dose}
            </div>
            <div>
              <span className="font-medium">Frecuencia:</span> {prescription.frequency}
            </div>
            <div>
              <span className="font-medium">Indicación:</span> {prescription.indication}
            </div>
          </div>
        </div>
      )}

      {/* Adherence History Chart */}
      {chartData.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Historial de Adherencia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={adherenceDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
              >
                {adherenceDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Adherencia Promedio</p>
          <p className="text-2xl font-bold text-green-700">{averageAdherence}%</p>
        </div>
        <div className={`p-4 rounded-lg border-l-4 ${adherencePercentage >= 90 ? 'bg-green-50 border-green-500' : adherencePercentage >= 75 ? 'bg-blue-50 border-blue-500' : 'bg-red-50 border-red-600'}`}>
          <p className="text-sm text-gray-600">Evaluación Actual</p>
          <p className={`text-2xl font-bold ${adherencePercentage >= 90 ? 'text-green-700' : adherencePercentage >= 75 ? 'text-blue-700' : 'text-red-700'}`}>
            {adherencePercentage}%
          </p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
          <p className="text-sm text-gray-600">Dosis Olvidadas</p>
          <p className="text-2xl font-bold text-amber-700">{missedDoses}</p>
        </div>
        <div className={`p-4 rounded-lg border-l-4 ${trend > 0 ? 'bg-green-50 border-green-500' : trend < 0 ? 'bg-red-50 border-red-600' : 'bg-gray-50 border-gray-500'}`}>
          <p className="text-sm text-gray-600">Tendencia</p>
          <div className="flex items-center gap-2 mt-1">
            {trend > 0 ? (
              <>
                <span className="text-2xl font-bold text-green-700">↑</span>
                <span className="text-sm text-green-700">Mejorando</span>
              </>
            ) : trend < 0 ? (
              <>
                <span className="text-2xl font-bold text-red-700">↓</span>
                <span className="text-sm text-red-700">Empeorando</span>
              </>
            ) : (
              <span className="text-sm text-gray-600">Estable</span>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Adherence Level */}
        <div className={`p-4 rounded-lg border-l-4 ${getAdherenceColor(adherencePercentage)}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de Adherencia Observado *
          </label>
          <select
            {...register('adherence_level')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione nivel</option>
            <option value="excellent">Excelente (≥90%)</option>
            <option value="good">Buena (75-89%)</option>
            <option value="fair">Regular (50-74%)</option>
            <option value="poor">&lt;50%)</option>
            <option value="not_assessed">No evaluada</option>
          </select>
        </div>

        {/* Adherence Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Porcentaje de Cumplimiento (0-100%) *
          </label>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                {...register('adherence_percentage', { valueAsNumber: true })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="text-right px-4 py-2 bg-gray-100 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{adherencePercentage}%</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{getAdherenceStatus(adherencePercentage)}</p>
        </div>

        {/* Missed Doses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Dosis Olvidadas en Última Semana *
          </label>
          <input
            type="number"
            min="0"
            {...register('missed_doses', { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Motivation Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Motivación del Paciente *
            </label>
            <select
              {...register('motivation_level')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="high">Alto</option>
              <option value="moderate">Moderado</option>
              <option value="low">Bajo</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-8">
              <input
                type="checkbox"
                {...register('education_provided')}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Educación proporcionada</span>
            </label>
          </div>
        </div>

        {/* Barriers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Barreras Identificadas para Adherencia
          </label>
          <textarea
            {...register('adherence_barriers')}
            placeholder="Ej: Olvida tomar medicamento, costo, efectos secundarios, complejidad del régimen..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Side Effects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Efectos Secundarios Reportados
          </label>
          <textarea
            {...register('side_effects_reported')}
            placeholder="Síntomas adversos que impactan adherencia..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Follow-up Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Seguimiento Recomendado
          </label>
          <input
            type="date"
            {...register('follow_up_date')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Intervention Recommendations */}
        {adherencePercentage < 75 && (
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">💡 Intervenciones Recomendadas</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>✓ Reforzar educación sobre importancia del tratamiento</li>
              <li>✓ Simplificar régimen medicamentoso si es posible</li>
              <li>✓ Utilizar recordatorios (alarmas, aplicaciones móviles)</li>
              <li>✓ Evaluar efectos secundarios y ajustar si es necesario</li>
              <li>✓ Considerar referencia a especialista si hay barreras psicosociales</li>
            </ul>
          </div>
        )}

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
              Registrar Evaluación de Adherencia
            </>
          )}
        </button>
      </form>
    </div>
  );
};
