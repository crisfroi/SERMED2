// @ts-nocheck
// src/components/ASIS_7_Cirugia/SurgeryScheduleForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, AlertCircle, CheckCircle, Loader2, MapPin, Users } from 'lucide-react';

const surgeryScheduleSchema = z.object({
  surgical_procedure_id: z.string().min(1, 'Procedure required'),
  booking_date: z.string().min(1, 'Booking date required'),
  scheduled_surgery_date: z.string().min(1, 'Surgery date required'),
  expected_duration_minutes: z.number().min(15, 'Minimum 15 minutes').max(480, 'Maximum 480 minutes'),
  priority: z.enum(['routine', 'urgent', 'emergency']),
  surgical_site_location: z.string().min(3, 'Location required'),
  laterality: z.enum(['left', 'right', 'bilateral', 'midline']),
  surgeon_id: z.string().optional(),
  anesthesiologist_id: z.string().optional(),
  pre_op_notes: z.string().min(10, 'At least 10 characters'),
  special_equipment_needed: z.string().optional(),
  medications_to_avoid: z.string().optional(),
  allergies: z.string().optional()
});

type SurgeryScheduleFormData = z.infer<typeof surgeryScheduleSchema>;

interface SurgeryScheduleFormProps {
  patientId: string;
  onSuccess?: () => void;
}

export const SurgeryScheduleForm: React.FC<SurgeryScheduleFormProps> = ({ patientId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [procedures, setProcedures] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<SurgeryScheduleFormData>({
    resolver: zodResolver(surgeryScheduleSchema)
  });

  const priority = watch('priority');

  const onSubmit = async (data: SurgeryScheduleFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      setSuccessMessage('Surgery scheduled successfully');
      onSuccess?.();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Scheduling error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const priorityColors = {
    routine: 'bg-blue-50 border-blue-300',
    urgent: 'bg-orange-50 border-orange-300',
    emergency: 'bg-red-50 border-red-300'
  };

  const priorityTimeframes = {
    routine: '5-7 days',
    urgent: '24-48 hours',
    emergency: 'Immediate'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-blue-500" />
        <h2 className="text-xl font-bold">Schedule Surgery</h2>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Procedure Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Surgical Procedure *
          </label>
          <select
            {...register('surgical_procedure_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select procedure...</option>
            <option value="appendectomy">Appendectomy</option>
            <option value="cholecystectomy">Cholecystectomy</option>
            <option value="knee_replacement">Total Knee Replacement</option>
            <option value="cataract">Cataract Surgery</option>
          </select>
          {errors.surgical_procedure_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.surgical_procedure_id.message}
            </p>
          )}
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['routine', 'urgent', 'emergency'] as const).map((p) => (
              <label key={p} className={`p-3 border-2 rounded-lg cursor-pointer transition ${priorityColors[p]} ${priority === p ? 'ring-2 ring-offset-1' : ''}`}>
                <input
                  type="radio"
                  {...register('priority')}
                  value={p}
                  className="mr-2"
                />
                <span className="capitalize font-medium">{p}</span>
                <div className="text-xs text-gray-600 mt-1">{priorityTimeframes[p]}</div>
              </label>
            ))}
          </div>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
          )}
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Date *
            </label>
            <input
              type="datetime-local"
              {...register('booking_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {errors.booking_date && (
              <p className="mt-1 text-sm text-red-600">{errors.booking_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surgery Date *
            </label>
            <input
              type="datetime-local"
              {...register('scheduled_surgery_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {errors.scheduled_surgery_date && (
              <p className="mt-1 text-sm text-red-600">{errors.scheduled_surgery_date.message}</p>
            )}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Duration (minutes) *
          </label>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <input
              type="number"
              {...register('expected_duration_minutes', { valueAsNumber: true })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="45"
            />
          </div>
          {errors.expected_duration_minutes && (
            <p className="mt-1 text-sm text-red-600">{errors.expected_duration_minutes.message}</p>
          )}
        </div>

        {/* Surgical Site */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Surgical Site Location *
          </label>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              {...register('surgical_site_location')}
              placeholder="e.g., Operating Room 2"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Laterality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Laterality *
          </label>
          <select
            {...register('laterality')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="midline">Midline</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="bilateral">Bilateral</option>
          </select>
        </div>

        {/* Team Assignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Surgeon
          </label>
          <input
            type="text"
            {...register('surgeon_id')}
            placeholder="Surgeon name or ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Pre-op Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pre-operative Notes *
          </label>
          <textarea
            {...register('pre_op_notes')}
            placeholder="Any pre-operative findings, considerations, or special instructions"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          {errors.pre_op_notes && (
            <p className="mt-1 text-sm text-red-600">{errors.pre_op_notes.message}</p>
          )}
        </div>

        {/* Special Requirements */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Equipment Needed
            </label>
            <input
              type="text"
              {...register('special_equipment_needed')}
              placeholder="e.g., Microscope, Laparoscopic tools"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medications to Avoid
            </label>
            <input
              type="text"
              {...register('medications_to_avoid')}
              placeholder="Comma-separated list"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Known Allergies
          </label>
          <input
            type="text"
              {...register('allergies')}
            placeholder="List patient allergies"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50"
          />
        </div>

        {/* Pre-surgical Checklist */}
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <h3 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Pre-surgical Checklist Reminder
          </h3>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>✓ Patient NPO (nothing by mouth) per protocol</li>
            <li>✓ Pre-operative labs completed</li>
            <li>✓ Informed consent obtained</li>
            <li>✓ Allergies and contraindications documented</li>
            <li>✓ Medication reconciliation completed</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Schedule Surgery
            </>
          )}
        </button>
      </form>
    </div>
  );
};
