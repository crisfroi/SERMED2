// @ts-nocheck
// src/components/ASIS_9_Inmunizacion/VaccinationScheduleForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Syringe, Calendar, AlertTriangle, CheckCircle, Loader2, Clock } from 'lucide-react';

const vaccinationScheduleSchema = z.object({
  patient_id: z.string().min(1, 'Patient ID required'),
  date_of_birth: z.string().min(1, 'DOB required'),
  next_vaccine: z.string().min(1, 'Select vaccine'),
  scheduled_date: z.string().min(1, 'Schedule date required'),
  vaccine_location: z.enum(['left_arm', 'right_arm', 'left_leg', 'right_leg', 'other']),
  facility_name: z.string().min(1, 'Facility name required'),
  reminder_preference: z.enum(['email', 'sms', 'both', 'none']),
  consent_acknowledged: z.boolean().refine(val => val === true, 'Consent must be acknowledged'),
  contraindications_checked: z.boolean().refine(val => val === true, 'Contraindications must be checked'),
  special_considerations: z.string().optional(),
  parent_guardian_name: z.string().optional(),
  notes: z.string().optional()
});

type VaccinationScheduleData = z.infer<typeof vaccinationScheduleSchema>;

interface VaccinationScheduleFormProps {
  patientId: string;
  patientDOB?: string;
  onSuccess?: () => void;
}

const VACCINE_OPTIONS = [
  { name: 'DTaP', age_months: '2,4,6,15-18', contraindications: 'Severe allergic reaction to vaccine component' },
  { name: 'IPV', age_months: '2,4,6,12-18', contraindications: 'Anaphylaxis to vaccine component' },
  { name: 'Hepatitis B', age_months: '0,1,6', contraindications: 'Yeast allergy (for Engerix-B)' },
  { name: 'Hepatitis A', age_months: '12,18', contraindications: 'Severe allergic reaction' },
  { name: 'MMR', age_months: '12,4-6yr', contraindications: 'Pregnancy, severe immunocompromise' },
  { name: 'Varicella', age_months: '12,4-6yr', contraindications: 'Pregnancy, immunocompromise' },
  { name: 'Rotavirus', age_months: '2,4,6', contraindications: 'Intussusception history' },
  { name: 'PCV13', age_months: '2,4,6,12-15', contraindications: 'Severe reaction to vaccine' },
  { name: 'Influenza', age_months: 'annually 6+', contraindications: 'Egg allergy (some formulations)' },
  { name: 'HPV', age_months: '60m for girls, 60m for boys', contraindications: 'Severe allergy to vaccine' },
  { name: 'Meningococcal (MenACWY)', age_months: '11-12yr', contraindications: 'Severe allergic reaction' },
  { name: 'Tdap', age_months: '4-6yr, 11-12yr', contraindications: 'Severe allergic reaction to toxoid' },
];

const CONTRAINDICATION_DATABASE: { [key: string]: string[] } = {
  'MMR': ['Pregnancy', 'AIDS', 'Cancer treatment', 'Recent immunoglobulin'],
  'Varicella': ['Pregnancy', 'Severe immunocompromise', 'Thrombocytopenia'],
  'Live attenuated influenza': ['Pregnancy', 'Severe immunocompromise', 'Asthma'],
  'Rotavirus': ['Intussusception history', 'SCID', 'Severe immunocompromise'],
};

export const VaccinationScheduleForm: React.FC<VaccinationScheduleFormProps> = ({
  patientId,
  patientDOB,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedVaccine, setSelectedVaccine] = useState('');
  const [contraindications, setContraindications] = useState<string[]>([]);
  const [contraindicated, setContraindicated] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<VaccinationScheduleData>({
    resolver: zodResolver(vaccinationScheduleSchema),
    defaultValues: {
      patient_id: patientId,
      date_of_birth: patientDOB || '',
      vaccine_location: 'left_arm',
      reminder_preference: 'email'
    }
  });

  const watchVaccine = watch('next_vaccine');

  React.useEffect(() => {
    if (watchVaccine) {
      setSelectedVaccine(watchVaccine);
      const potentialContraindications = CONTRAINDICATION_DATABASE[watchVaccine] || [];
      setContraindications(potentialContraindications);
    }
  }, [watchVaccine]);

  const onSubmit = async (data: VaccinationScheduleData) => {
    if (contraindicated) {
      alert('Cannot schedule: Active contraindications present');
      return;
    }

    setIsLoading(true);
    try {
      // API call here
      setSuccessMessage(`${data.next_vaccine} scheduled for ${data.scheduled_date}`);
      onSuccess?.();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Scheduling error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = () => {
    if (!patientDOB) return null;
    const dob = new Date(patientDOB);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const patientAge = calculateAge();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Syringe className="w-5 h-5 text-red-500" />
        <h2 className="text-xl font-bold">Vaccination Schedule</h2>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Patient Info Summary */}
        {patientAge !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Patient Age: </span>
              {patientAge} years old (DOB: {patientDOB})
            </p>
          </div>
        )}

        {/* Vaccine Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Vaccine *
          </label>
          <select
            {...register('next_vaccine')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">-- Choose vaccine --</option>
            {VACCINE_OPTIONS.map((vaccine) => (
              <option key={vaccine.name} value={vaccine.name}>
                {vaccine.name} (Age: {vaccine.age_months} months)
              </option>
            ))}
          </select>
          {errors.next_vaccine && (
            <p className="mt-1 text-sm text-red-600">{errors.next_vaccine.message}</p>
          )}
        </div>

        {/* Contraindications Check */}
        {selectedVaccine && contraindications.length > 0 && (
          <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Screening for Contraindications</h3>
                <p className="text-sm text-orange-800 mb-3">
                  Confirm that patient does NOT have any of these conditions:
                </p>
                <div className="space-y-2">
                  {contraindications.map((contra, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        onChange={(e) => setContraindicated(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-orange-900">{contra}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Special Considerations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Considerations
          </label>
          <textarea
            {...register('special_considerations')}
            placeholder="e.g., Recent illness, medications, immunocompromised status"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Scheduled Date and Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date *
            </label>
            <input
              type="date"
              {...register('scheduled_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.scheduled_date && (
              <p className="mt-1 text-sm text-red-600">{errors.scheduled_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Injection Site *
            </label>
            <select
              {...register('vaccine_location')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="left_arm">Left Arm</option>
              <option value="right_arm">Right Arm</option>
              <option value="left_leg">Left Leg</option>
              <option value="right_leg">Right Leg</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Facility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Facility Name *
          </label>
          <input
            type="text"
            {...register('facility_name')}
            placeholder="e.g., City Health Center"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          {errors.facility_name && (
            <p className="mt-1 text-sm text-red-600">{errors.facility_name.message}</p>
          )}
        </div>

        {/* Reminder Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Preference
          </label>
          <select
            {...register('reminder_preference')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="email">Email Reminder</option>
            <option value="sms">SMS Reminder</option>
            <option value="both">Email & SMS</option>
            <option value="none">No Reminder</option>
          </select>
        </div>

        {/* Parent/Guardian Name (if applicable) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent/Guardian Name (if applicable)
          </label>
          <input
            type="text"
            {...register('parent_guardian_name')}
            placeholder="Name of parent or guardian"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('contraindications_checked')}
              className="w-4 h-4 mt-1"
            />
            <span className="text-sm font-medium text-gray-700">
              I have reviewed and confirmed there are no contraindications for this vaccine *
            </span>
          </label>
          {errors.contraindications_checked && (
            <p className="text-sm text-red-600">{errors.contraindications_checked.message}</p>
          )}

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('consent_acknowledged')}
              className="w-4 h-4 mt-1"
            />
            <span className="text-sm font-medium text-gray-700">
              Patient/Guardian consent obtained and documented *
            </span>
          </label>
          {errors.consent_acknowledged && (
            <p className="text-sm text-red-600">{errors.consent_acknowledged.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinical Notes
          </label>
          <textarea
            {...register('notes')}
            placeholder="Any additional clinical notes"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || contraindicated}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              Schedule Vaccination
            </>
          )}
        </button>
      </form>
    </div>
  );
};
