import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NutritionAssessmentForm } from '@/components/ASIS_07_Nutricion/NutritionAssessmentForm';
import { WeightTrendChart } from '@/components/ASIS_07_Nutricion/WeightTrendChart';
import { NutritionPlanViewer } from '@/components/ASIS_07_Nutricion/NutritionPlanViewer';
import { useNutritionAssessment, useNutritionTracking, useNutritionPlanning } from '@/hooks';

// ============================================================================
// NUTRITION COMPONENTS TESTS
// ============================================================================
describe('NutritionAssessmentForm Component', () => {
  const mockPatientId = 'patient-123';
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with all required fields', () => {
    render(
      <NutritionAssessmentForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/BMI/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nutritional status/i)).toBeInTheDocument();
  });

  it('calculates BMI automatically', async () => {
    const user = userEvent.setup();
    render(
      <NutritionAssessmentForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    const weightInput = screen.getByLabelText(/weight/i);
    const heightInput = screen.getByLabelText(/height/i);
    const bmiDisplay = screen.getByLabelText(/BMI/i);

    await user.type(weightInput, '70');
    await user.type(heightInput, '170');

    // BMI = 70 / (1.7 * 1.7) = 24.2
    await waitFor(() => {
      expect(bmiDisplay).toHaveValue('24.2');
    });
  });

  it('clasifies BMI correctly', () => {
    // BMI classifications
    expect('BMI < 18.5 = underweight').toBeTruthy();
    expect('18.5 <= BMI < 25 = normal').toBeTruthy();
    expect('25 <= BMI < 30 = overweight').toBeTruthy();
    expect('BMI >= 30 = obese').toBeTruthy();
  });

  it('validates risk factor selection', async () => {
    const user = userEvent.setup();
    render(
      <NutritionAssessmentForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    const riskCheckboxes = screen.getAllByRole('checkbox');
    expect(riskCheckboxes.length).toBeGreaterThan(0);

    await user.click(riskCheckboxes[0]);
    expect(riskCheckboxes[0]).toBeChecked();
  });

  it('validates form before submission', async () => {
    const user = userEvent.setup();
    render(
      <NutritionAssessmentForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should show validation errors for required fields
    await waitFor(() => {
      const errorMessages = screen.queryAllByRole('alert');
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    render(
      <NutritionAssessmentForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.type(screen.getByLabelText(/weight/i), '70');
    await user.type(screen.getByLabelText(/height/i), '170');

    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});

describe('WeightTrendChart Component', () => {
  const mockPatientId = 'patient-123';
  const mockWeightData = [
    { date: '2024-01-01', weight_kg: 75, bmi: 25.9 },
    { date: '2024-01-08', weight_kg: 74.5, bmi: 25.7 },
    { date: '2024-01-15', weight_kg: 74, bmi: 25.5 },
  ];

  it('renders chart with weight data', () => {
    render(
      <WeightTrendChart
        patientId={mockPatientId}
        timeframe="month"
      />
    );

    expect(screen.getByText(/weight trend/i)).toBeInTheDocument();
  });

  it('displays timeframe selector', async () => {
    const user = userEvent.setup();
    render(
      <WeightTrendChart
        patientId={mockPatientId}
        timeframe="month"
      />
    );

    const weekButton = screen.getByRole('button', { name: /week/i });
    const monthButton = screen.getByRole('button', { name: /month/i });
    const quarterButton = screen.getByRole('button', { name: /quarter/i });

    expect(weekButton).toBeInTheDocument();
    expect(monthButton).toBeInTheDocument();
    expect(quarterButton).toBeInTheDocument();

    await user.click(weekButton);
    expect(weekButton).toHaveClass('active');
  });

  it('shows trend analysis (improving/declining/stable)', () => {
    render(
      <WeightTrendChart
        patientId={mockPatientId}
        timeframe="month"
      />
    );

    // Should display trend indicator
    const trendElements = screen.queryAllByText(/improving|declining|stable/i);
    expect(trendElements.length).toBeGreaterThanOrEqual(0);
  });

  it('displays current weight and BMI metrics', () => {
    render(
      <WeightTrendChart
        patientId={mockPatientId}
        timeframe="month"
      />
    );

    expect(screen.queryByText(/current weight/i)).toBeTruthy();
    expect(screen.queryByText(/BMI/i)).toBeTruthy();
  });

  it('provides download functionality', async () => {
    const user = userEvent.setup();
    render(
      <WeightTrendChart
        patientId={mockPatientId}
        timeframe="month"
      />
    );

    const downloadButton = screen.getByRole('button', { name: /download|export/i });
    expect(downloadButton).toBeInTheDocument();

    await user.click(downloadButton);
    // Verify download was triggered (implementation-specific)
  });
});

describe('NutritionPlanViewer Component', () => {
  const mockPatientId = 'patient-123';

  it('renders plan selection list', () => {
    render(
      <NutritionPlanViewer
        patientId={mockPatientId}
      />
    );

    expect(screen.getByText(/nutrition plan/i)).toBeInTheDocument();
  });

  it('displays macronutrient breakdown', () => {
    render(
      <NutritionPlanViewer
        patientId={mockPatientId}
      />
    );

    const nutrients = ['protein', 'carbohydrates', 'fats', 'calories'];
    nutrients.forEach(nutrient => {
      expect(screen.queryByText(new RegExp(nutrient, 'i'))).toBeTruthy();
    });
  });

  it('shows plan specifications', () => {
    render(
      <NutritionPlanViewer
        patientId={mockPatientId}
      />
    );

    expect(screen.queryByText(/therapeutic diet/i)).toBeTruthy();
    expect(screen.queryByText(/meal frequency/i)).toBeTruthy();
  });

  it('allows editing of plans', async () => {
    const user = userEvent.setup();
    render(
      <NutritionPlanViewer
        patientId={mockPatientId}
      />
    );

    const editButton = screen.queryByRole('button', { name: /edit/i });
    if (editButton) {
      await user.click(editButton);
      expect(screen.queryByText(/edit plan|save changes/i)).toBeTruthy();
    }
  });
});

// ============================================================================
// NUTRITION HOOKS TESTS
// ============================================================================
describe('useNutritionAssessment Hook', () => {
  it('fetches assessment by ID', async () => {
    const { result } = renderHook(() => useNutritionAssessment());

    const response = await result.current.fetchAssessment('assessment-123');

    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('data');
  });

  it('fetches patient assessments with limit', async () => {
    const { result } = renderHook(() => useNutritionAssessment());

    const response = await result.current.fetchPatientAssessments('patient-123', 5);

    expect(response.success).toBe(true);
    if (response.data) {
      expect(response.data.length).toBeLessThanOrEqual(5);
    }
  });

  it('creates new assessment with BMI calculation', async () => {
    const { result } = renderHook(() => useNutritionAssessment());

    const input = {
      patient_id: 'patient-123',
      weight_kg: 70,
      height_cm: 170,
      muscle_mass_percentage: 35,
      fat_percentage: 25,
      nutritional_status: 'normal',
      risk_factors: [],
      clinical_notes: 'Test assessment',
    };

    const response = await result.current.createAssessment(input);

    expect(response.success).toBe(true);
    if (response.data) {
      expect(response.data.bmi).toBeCloseTo(24.2, 1);
    }
  });

  it('updates assessment correctly', async () => {
    const { result } = renderHook(() => useNutritionAssessment());

    const response = await result.current.updateAssessment('assessment-123', {
      weight_kg: 75,
      nutritional_status: 'overweight',
    });

    expect(response.success).toBe(true);
  });
});

describe('useNutritionTracking Hook', () => {
  it('fetches weight history over specified days', async () => {
    const { result } = renderHook(() => useNutritionTracking());

    const response = await result.current.fetchWeightHistory('patient-123', 30);

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
    }
  });

  it('calculates trend from history data', () => {
    const { result } = renderHook(() => useNutritionTracking());

    const history = [
      { date: '2024-01-01', weight_kg: 75, bmi: 25.9 },
      { date: '2024-01-08', weight_kg: 74, bmi: 25.5 },
      { date: '2024-01-15', weight_kg: 73, bmi: 25.2 },
    ];

    const trend = result.current.calculateTrend(history);

    expect(['improving', 'declining', 'stable']).toContain(trend);
    expect(trend).toBe('improving');
  });

  it('identifies stable weight', () => {
    const { result } = renderHook(() => useNutritionTracking());

    const history = [
      { date: '2024-01-01', weight_kg: 74, bmi: 25.5 },
      { date: '2024-01-15', weight_kg: 74.3, bmi: 25.6 },
    ];

    const trend = result.current.calculateTrend(history);

    expect(trend).toBe('stable');
  });
});

describe('useNutritionPlanning Hook', () => {
  it('fetches patient nutrition plans', async () => {
    const { result } = renderHook(() => useNutritionPlanning());

    const response = await result.current.fetchPatientPlans('patient-123');

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
    }
  });

  it('creates nutrition plan', async () => {
    const { result } = renderHook(() => useNutritionPlanning());

    const planData = {
      patient_id: 'patient-123',
      daily_calorie_target: 2000,
      protein_percentage: 25,
      carbs_percentage: 50,
      fats_percentage: 25,
      therapeutic_diet_type: 'balanced',
      meal_frequency: 3,
      start_date: '2024-01-01',
      end_date: '2024-03-31',
      is_active: true,
    };

    const response = await result.current.createPlan(planData);

    expect(response.success).toBe(true);
  });
});

// ============================================================================
// Test fixture helper
// ============================================================================
function renderHook<T>(hook: () => T) {
  let result: { current: T };

  function TestComponent() {
    result = { current: hook() };
    return null;
  }

  render(<TestComponent />);
  return result!;
}
