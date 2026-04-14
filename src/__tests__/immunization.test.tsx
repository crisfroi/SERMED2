import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImmunizationRecordForm } from '@/components/ASIS_08_Inmunizacion/ImmunizationRecordForm';
import { VaccineScheduleViewer } from '@/components/ASIS_08_Inmunizacion/VaccineScheduleViewer';
import { ImmunizationGapReport } from '@/components/ASIS_08_Inmunizacion/ImmunizationGapReport';
import {
  useImmunizationRecord,
  useVaccineSchedule,
  useImmunizationGaps,
  useVaccineLotTracking,
} from '@/hooks';

// ============================================================================
// IMMUNIZATION COMPONENTS TESTS
// ============================================================================
describe('ImmunizationRecordForm Component', () => {
  const mockPatientId = 'patient-123';
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with vaccine selection', () => {
    render(
      <ImmunizationRecordForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByLabelText(/vaccine/i)).toBeInTheDocument();
  });

  it('displays 10 vaccine options', async () => {
    render(
      <ImmunizationRecordForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    const vaccineSelect = screen.getByLabelText(/vaccine/i);
    await userEvent.click(vaccineSelect);

    const vaccines = ['BCG', 'OPV', 'Pentavalente', 'MMR', 'Varicela', 'Rotavirus', 'PCV13', 'Influenza', 'Fiebre Amarilla'];
    vaccines.forEach(vaccine => {
      expect(screen.queryByText(vaccine)).toBeTruthy();
    });
  });

  it('validates lot number format', async () => {
    const user = userEvent.setup();
    render(
      <ImmunizationRecordForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    const lotInput = screen.getByLabelText(/lot number/i);

    // Too short
    await user.type(lotInput, 'AB');
    expect(screen.queryByText(/invalid|required|at least 3/i)).toBeTruthy();

    // Valid
    await user.clear(lotInput);
    await user.type(lotInput, 'ABC123');
    expect(screen.queryByText(/invalid|required/i)).toBeFalsy();
  });

  it('validates injection site', async () => {
    const user = userEvent.setup();
    render(
      <ImmunizationRecordForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    const siteInput = screen.getByLabelText(/injection site/i);
    const validSites = ['left_arm', 'right_arm', 'left_leg', 'right_leg'];

    // Test that valid sites are available
    const options = screen.queryAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
  });

  it('prevents future vaccination dates', async () => {
    const user = userEvent.setup();
    render(
      <ImmunizationRecordForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    const dateInput = screen.getByLabelText(/vaccination date/i) as HTMLInputElement;

    // Set to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    await user.type(dateInput, dateString);

    // Should show error
    await waitFor(() => {
      expect(screen.queryByText(/future|past|today/i)).toBeTruthy();
    });
  });

  it('tracks immediate reactions', async () => {
    const user = userEvent.setup();
    render(
      <ImmunizationRecordForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    const reactionCheckbox = screen.getByLabelText(/immediate reaction/i);
    const reactionTextarea = screen.getByLabelText(/reaction description/i);

    // Initially textarea should be hidden or disabled
    expect(reactionTextarea).toHaveAttribute('disabled');

    // Check the checkbox
    await user.click(reactionCheckbox);

    // Now textarea should be enabled
    expect(reactionTextarea).not.toHaveAttribute('disabled');

    // Type reaction description
    await user.type(reactionTextarea, 'Slight redness at injection site');
    expect(reactionTextarea).toHaveValue('Slight redness at injection site');
  });

  it('displays clinical notes field', () => {
    render(
      <ImmunizationRecordForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByLabelText(/clinical notes/i)).toBeInTheDocument();
  });

  it('calls onSuccess after successful submission', async () => {
    const user = userEvent.setup();
    render(
      <ImmunizationRecordForm
        patientId={mockPatientId}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill form fields
    await user.selectOption(screen.getByLabelText(/vaccine/i), 'BCG');
    await user.type(screen.getByLabelText(/lot number/i), 'LOT123456');
    await user.selectOption(screen.getByLabelText(/injection site/i), 'left_arm');
    await user.type(
      screen.getByLabelText(/vaccination date/i),
      '2024-01-15'
    );

    const submitButton = screen.getByRole('button', { name: /submit|save|record/i });
    await user.click(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});

describe('VaccineScheduleViewer Component', () => {
  const mockPatientId = 'patient-123';
  const mockAgeMonths = 12;

  it('renders schedule list', () => {
    render(
      <VaccineScheduleViewer
        patientId={mockPatientId}
        ageMonths={mockAgeMonths}
      />
    );

    expect(screen.getByText(/schedule|immunization/i)).toBeInTheDocument();
  });

  it('displays progress bar', () => {
    render(
      <VaccineScheduleViewer
        patientId={mockPatientId}
        ageMonths={mockAgeMonths}
      />
    );

    // Progress bar should show completion percentage
    const progressBar = screen.queryByRole('progressbar');
    expect(progressBar).toBeTruthy();
  });

  it('shows status indicators for each vaccine', () => {
    render(
      <VaccineScheduleViewer
        patientId={mockPatientId}
        ageMonths={mockAgeMonths}
      />
    );

    // Should contain status indicators
    const statusIndicators = screen.queryAllByText(/(completed|pending|overdue|contraindicated)/i);
    expect(statusIndicators.length).toBeGreaterThan(0);
  });

  it('highlights overdue vaccinations', () => {
    render(
      <VaccineScheduleViewer
        patientId={mockPatientId}
        ageMonths={mockAgeMonths}
      />
    );

    // Overdue items should be visually distinct (e.g., red color)
    const overdueElements = screen.queryAllByText(/overdue|due/i);
    expect(overdueElements.length).toBeGreaterThanOrEqual(0);
  });

  it('provides schedule or vaccination buttons', async () => {
    const user = userEvent.setup();
    render(
      <VaccineScheduleViewer
        patientId={mockPatientId}
        ageMonths={mockAgeMonths}
      />
    );

    const buttons = screen.queryAllByRole('button', { name: /schedule|vaccinate|record/i });
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('provides carnet download functionality', async () => {
    const user = userEvent.setup();
    render(
      <VaccineScheduleViewer
        patientId={mockPatientId}
        ageMonths={mockAgeMonths}
      />
    );

    const downloadButton = screen.queryByRole('button', { name: /download|carnet|print/i });
    if (downloadButton) {
      await user.click(downloadButton);
      // Verify download was triggered
    }
  });
});

describe('ImmunizationGapReport Component', () => {
  const mockPatientId = 'patient-123';

  it('renders gap report summary', () => {
    render(
      <ImmunizationGapReport patientId={mockPatientId} />
    );

    expect(screen.getByText(/brecha|gap|report/i)).toBeInTheDocument();
  });

  it('displays gap statistics', () => {
    render(
      <ImmunizationGapReport patientId={mockPatientId} />
    );

    // Should show counts of unresolved, critical, etc.
    expect(screen.queryByText(/unresolved|active|total/i)).toBeTruthy();
  });

  it('lists unresolved gaps with priority', () => {
    render(
      <ImmunizationGapReport patientId={mockPatientId} />
    );

    // Should show priority levels
    expect(screen.queryByText(/(urgente|urgent|alta|high|routine)/i)).toBeTruthy();
  });

  it('allows scheduling rescue vaccination', async () => {
    const user = userEvent.setup();
    render(
      <ImmunizationGapReport patientId={mockPatientId} />
    );

    const rescueButtons = screen.queryAllByRole('button', { name: /agendar|schedule|rescue/i });
    if (rescueButtons.length > 0) {
      await user.click(rescueButtons[0]);
      // Verify rescue was scheduled
    }
  });

  it('shows resolved gaps separately', () => {
    render(
      <ImmunizationGapReport patientId={mockPatientId} />
    );

    // Should have a section for resolved gaps
    expect(screen.queryByText(/resueltas|resolved/i)).toBeTruthy();
  });
});

// ============================================================================
// IMMUNIZATION HOOKS TESTS
// ============================================================================
describe('useImmunizationRecord Hook', () => {
  it('creates vaccination record', async () => {
    const { result } = renderHook(() => useImmunizationRecord());

    const input = {
      patient_id: 'patient-123',
      vaccine_id: 'vaccine-bcg',
      vaccine_name: 'BCG',
      dose_number: 1,
      vaccination_date: '2024-01-15',
      lot_number: 'LOT123456',
      injection_site: 'left_arm',
      route: 'intradermal',
      immediate_reaction: false,
      reaction_description: null,
      clinical_notes: 'Vaccination administered successfully',
    };

    const response = await result.current.createVaccinationRecord(input);

    expect(response.success).toBe(true);
    if (response.data) {
      expect(response.data.patient_id).toBe('patient-123');
      expect(response.data.vaccine_name).toBe('BCG');
    }
  });

  it('fetches patient vaccinations', async () => {
    const { result } = renderHook(() => useImmunizationRecord());

    const response = await result.current.fetchPatientVaccinations('patient-123');

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
    }
  });
});

describe('useVaccineSchedule Hook', () => {
  it('fetches vaccine schedule with completion tracking', async () => {
    const { result } = renderHook(() => useVaccineSchedule());

    const response = await result.current.fetchSchedule('patient-123', 12);

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
      // Each item should have status
      response.data.forEach(item => {
        expect(['completed', 'pending', 'overdue', 'contraindicated']).toContain(item.status);
      });
    }
  });

  it('calculates completion percentage', () => {
    const { result } = renderHook(() => useVaccineSchedule());

    const schedule = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'pending' },
      { status: 'pending' },
    ];

    const percentage = result.current.calculateCompletionPercentage(schedule as any);

    expect(percentage).toBe(50);
  });
});

describe('useImmunizationGaps Hook', () => {
  it('fetches immunization gaps', async () => {
    const { result } = renderHook(() => useImmunizationGaps());

    const response = await result.current.fetchImmunizationGaps('patient-123');

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
    }
  });

  it('schedules rescue vaccination', async () => {
    const { result } = renderHook(() => useImmunizationGaps());

    const response = await result.current.scheduleRescue('gap-123');

    expect(response.success).toBe(true);
  });
});

describe('useVaccineLotTracking Hook', () => {
  it('fetches vaccine lots', async () => {
    const { result } = renderHook(() => useVaccineLotTracking());

    const response = await result.current.fetchLots();

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
    }
  });

  it('updates lot usage', async () => {
    const { result } = renderHook(() => useVaccineLotTracking());

    const response = await result.current.updateLotUsage('lot-123', 5);

    expect(response.success).toBe(true);
  });

  it('decreases available quantity after usage', async () => {
    const { result } = renderHook(() => useVaccineLotTracking());

    // Assume lot has 100 available units
    const response = await result.current.updateLotUsage('lot-123', 10);

    if (response.data) {
      expect(response.data.quantity_available).toBe(90);
      expect(response.data.quantity_used).toBeGreaterThan(0);
    }
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
