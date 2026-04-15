// @ts-nocheck
// src/components/ASIS_8_Dietetica/NutritionAssessmentForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Apple, TrendingDown, AlertCircle, CheckCircle, Loader2, BarChart3 } from 'lucide-react';

const nutritionAssessmentSchema = z.object({
  weight_kg: z.number().min(20, 'Weight must be at least 20 kg').max(300),
  height_cm: z.number().min(100, 'Height must be at least 100 cm').max(250),
  bmi: z.number().optional(),
  nutritional_status: z.enum(['well_nourished', 'at_risk', 'malnourished', 'overweight', 'obese']).optional(),
  dietary_restrictions: z.string().optional(),
  food_allergies: z.string().min(1, 'List allergies or select "None"'),
  appetite_level: z.enum(['excellent', 'good', 'fair', 'poor']),
  chewing_difficulties: z.boolean(),
  swallowing_difficulties: z.boolean(),
  gastrointestinal_issues: z.string().optional(),
  typical_daily_calories: z.number().min(500).max(5000),
  exercise_frequency: z.enum(['sedentary', 'light', 'moderate', 'vigorous']),
  alcohol_consumption: z.enum(['none', 'minimal', 'moderate', 'heavy']),
  nutritional_concerns: z.string().min(10, 'At least 10 characters'),
  goals_short_term: z.string().optional(),
  goals_long_term: z.string().optional()
});

type NutritionAssessmentData = z.infer<typeof nutritionAssessmentSchema>;

interface NutritionAssessmentFormProps {
  patientId: string;
  onSuccess?: () => void;
}

export const NutritionAssessmentForm: React.FC<NutritionAssessmentFormProps> = ({ patientId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [calculatedBMI, setCalculatedBMI] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<NutritionAssessmentData>({
    resolver: zodResolver(nutritionAssessmentSchema),
    defaultValues: {
      appetite_level: 'good',
      exercise_frequency: 'moderate',
      alcohol_consumption: 'none'
    }
  });

  const weight = watch('weight_kg');
  const height = watch('height_cm');

  React.useEffect(() => {
    if (weight && height) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      setCalculatedBMI(Math.round(bmi * 10) / 10);
    }
  }, [weight, height]);

  const getBMICategory = (bmi: number | null) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (bmi < 25) return { category: 'Normal Weight', color: 'text-green-600', bg: 'bg-green-50' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { category: 'Obese', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const onSubmit = async (data: NutritionAssessmentData) => {
    setIsLoading(true);
    try {
      // API call here
      setSuccessMessage('Nutrition assessment completed successfully');
      onSuccess?.();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Assessment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const bmiCategory = getBMICategory(calculatedBMI);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Apple className="w-5 h-5 text-green-500" />
        <h2 className="text-xl font-bold">Nutrition Assessment</h2>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Anthropometric Measurements */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Body Measurements
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('weight_kg', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="70"
              />
              {errors.weight_kg && (
                <p className="mt-1 text-sm text-red-600">{errors.weight_kg.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm) *
              </label>
              <input
                type="number"
                {...register('height_cm', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="170"
              />
              {errors.height_cm && (
                <p className="mt-1 text-sm text-red-600">{errors.height_cm.message}</p>
              )}
            </div>
          </div>

          {/* BMI Display */}
          {calculatedBMI && bmiCategory && (
            <div className={`${bmiCategory.bg} border border-gray-300 rounded-lg p-4`}>
              <p className="text-sm text-gray-700 mb-1">Body Mass Index (BMI)</p>
              <p className={`text-3xl font-bold ${bmiCategory.color}`}>{calculatedBMI}</p>
              <p className={`text-sm font-medium ${bmiCategory.color} mt-1`}>{bmiCategory.category}</p>
            </div>
          )}
        </div>

        {/* Dietary Information */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4">Dietary Information</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Allergies *
            </label>
            <input
              type="text"
              {...register('food_allergies')}
              placeholder="e.g., Peanuts, Shellfish, or 'None'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50"
            />
            {errors.food_allergies && (
              <p className="mt-1 text-sm text-red-600">{errors.food_allergies.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions
            </label>
            <input
              type="text"
              {...register('dietary_restrictions')}
              placeholder="e.g., Vegetarian, Gluten-free, Kosher"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appetite Level *
              </label>
              <select
                {...register('appetite_level')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Calorie Intake *
              </label>
              <input
                type="number"
                {...register('typical_daily_calories', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="2000"
              />
            </div>
          </div>
        </div>

        {/* Health Considerations */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('chewing_difficulties')}
              id="chewing"
              className="w-4 h-4"
            />
            <label htmlFor="chewing" className="ml-2 text-sm font-medium text-gray-700">
              Chewing difficulties
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('swallowing_difficulties')}
              id="swallowing"
              className="w-4 h-4"
            />
            <label htmlFor="swallowing" className="ml-2 text-sm font-medium text-gray-700">
              Swallowing difficulties
            </label>
          </div>
        </div>

        {/* Lifestyle Factors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exercise Frequency *
            </label>
            <select
              {...register('exercise_frequency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="vigorous">Vigorous</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alcohol Consumption *
            </label>
            <select
              {...register('alcohol_consumption')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="none">None</option>
              <option value="minimal">Minimal</option>
              <option value="moderate">Moderate</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
        </div>

        {/* Concerns and Goals */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nutritional Concerns *
          </label>
          <textarea
            {...register('nutritional_concerns')}
            placeholder="Describe any nutritional or dietary concerns"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          {errors.nutritional_concerns && (
            <p className="mt-1 text-sm text-red-600">{errors.nutritional_concerns.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short-term Goals
            </label>
            <textarea
              {...register('goals_short_term')}
              placeholder="1-3 month goals"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Long-term Goals
            </label>
            <textarea
              {...register('goals_long_term')}
              placeholder="6-12 month goals"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Submission Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Complete Assessment
            </>
          )}
        </button>
      </form>
    </div>
  );
};
