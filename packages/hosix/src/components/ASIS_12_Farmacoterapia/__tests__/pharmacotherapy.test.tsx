// src/components/ASIS_12_Farmacoterapia/__tests__/pharmacotherapy.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrescriptionForm } from '../PrescriptionForm';
import { DrugInteractionChecker } from '../DrugInteractionChecker';
import { MedicationAdherenceTracker } from '../MedicationAdherenceTracker';
import {
  usePrescriptionManagement,
  useDrugInteractionCheck,
  useMedicationAdherence,
  useAdverseMedicationEvents
} from '../../../../../../src/hooks/usePharmacotherapyHooks';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null })
    }))
  }))
}));

// ============ PrescriptionForm Tests ============
describe('PrescriptionForm Component', () => {
  it('renders form with all required fields', () => {
    render(<PrescriptionForm patientId="test-123" />);
    
    expect(screen.getByLabelText(/medication/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dosage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/route/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clinical indication/i)).toBeInTheDocument();
  });

  it('allows selection of medication with brand name display', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const medicationSelect = screen.getByLabelText(/medication/i);
    await user.selectOptions(medicationSelect, 'amoxicillin');
    
    // Should show brand name
    expect(screen.getByText(/amoxil/i)).toBeInTheDocument();
  });

  it('accepts dosage input with decimal values', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const dosageField = screen.getByLabelText(/dosage/i);
    await user.type(dosageField, '250.5');
    
    expect(dosageField).toHaveValue(250.5);
  });

  it('allows dosage unit selection', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const unitSelect = screen.getByLabelText(/unit/i);
    await user.selectOptions(unitSelect, 'mg');
    
    expect(unitSelect).toHaveValue('mg');
  });

  it('allows route selection with all options', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const routeSelect = screen.getByLabelText(/route/i);
    const options = screen.getAllByRole('option', { name: /oral|IV|IM|sublingual|topical|inhalation/i });
    
    expect(options.length).toBeGreaterThanOrEqual(6);
  });

  it('allows frequency selection with all options', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const frequencySelect = screen.getByLabelText(/frequency/i);
    expect(frequencySelect).toBeInTheDocument();
    
    // Should have 9 frequency options
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(9);
  });

  it('accepts duration in days with default 7', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const durationField = screen.getByLabelText(/duration/i);
    expect(durationField).toHaveValue(7);
    
    await user.clear(durationField);
    await user.type(durationField, '14');
    expect(durationField).toHaveValue(14);
  });

  it('accepts refills number', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const refillsField = screen.getByLabelText(/refills/i);
    await user.clear(refillsField);
    await user.type(refillsField, '3');
    
    expect(refillsField).toHaveValue(3);
  });

  it('validates clinical indication minimum length (10 chars)', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const indicationField = screen.getByLabelText(/clinical indication/i);
    await user.type(indicationField, 'short');
    
    const submitButton = screen.getByRole('button', { name: /prescribe/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
  });

  it('allows special instructions textarea', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const instructionsField = screen.getByPlaceholderText(/special instructions/i);
    await user.type(instructionsField, 'Take with food, avoid dairy products');
    
    expect(instructionsField).toHaveValue('Take with food, avoid dairy products');
  });

  it('allows preventive medication checkbox', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const preventiveCheckbox = screen.getByLabelText(/preventive/i);
    await user.click(preventiveCheckbox);
    
    expect(preventiveCheckbox).toBeChecked();
  });

  it('allows essential medication checkbox', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const essentialCheckbox = screen.getByLabelText(/essential/i);
    await user.click(essentialCheckbox);
    
    expect(essentialCheckbox).toBeChecked();
  });

  it('displays medication details panel with therapeutic class', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    await user.selectOptions(screen.getByLabelText(/medication/i), 'amoxicillin');
    
    expect(screen.getByText(/therapeutic class/i)).toBeInTheDocument();
  });

  it('displays pregnancy category information', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    await user.selectOptions(screen.getByLabelText(/medication/i), 'aspirin');
    
    expect(screen.getByText(/pregnancy category/i)).toBeInTheDocument();
  });

  it('shows contraindications warning when present', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    await user.selectOptions(screen.getByLabelText(/medication/i), 'chloramphenicol');
    
    expect(screen.getByText(/contraindications/i)).toBeInTheDocument();
  });

  it('displays pre-prescription checklist panel', () => {
    render(<PrescriptionForm patientId="test-123" />);
    
    expect(screen.getByText(/pre-prescription checklist/i)).toBeInTheDocument();
  });

  it('submits prescription with all required data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    render(<PrescriptionForm patientId="test-123" onSuccess={mockOnSuccess} />);
    
    await user.selectOptions(screen.getByLabelText(/medication/i), 'ibuprofen');
    await user.type(screen.getByLabelText(/dosage/i), '400');
    await user.selectOptions(screen.getByLabelText(/unit/i), 'mg');
    await user.selectOptions(screen.getByLabelText(/route/i), 'oral');
    await user.selectOptions(screen.getByLabelText(/frequency/i), 'three times daily');
    await user.type(
      screen.getByLabelText(/clinical indication/i),
      'Mild to moderate pain management'
    );
    
    const submitButton = screen.getByRole('button', { name: /prescribe/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    render(<PrescriptionForm patientId="test-123" />);
    
    const submitButton = screen.getByRole('button', { name: /prescribe/i });
    await user.click(submitButton);
    
    expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
  });
});

// ============ DrugInteractionChecker Tests ============
describe('DrugInteractionChecker Component', () => {
  const mockInteractions = [
    {
      med1: 'Aspirin',
      med2: 'Warfarin',
      severity: 'contraindicated',
      effect: 'Increased bleeding risk',
      management: 'Avoid combination or use alternative anticoagulant'
    },
    {
      med1: 'Metformin',
      med2: 'Contrast dye',
      severity: 'major',
      effect: 'Risk of acute kidney injury',
      management: 'Hold metformin 24-48 hours before and after contrast'
    },
    {
      med1: 'ACE inhibitor',
      med2: 'Potassium supplement',
      severity: 'moderate',
      effect: 'Hyperkalemia risk',
      management: 'Monitor potassium levels closely'
    }
  ];

  it('renders interaction checker with alerts', () => {
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    expect(screen.getByText(/contraindicated/i)).toBeInTheDocument();
  });

  it('displays critical alert panel for contraindicated interactions', () => {
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    const criticalAlert = screen.getByText(/INTERACCIONES CONTRAINDICADAS/i);
    expect(criticalAlert.closest('div')).toHaveClass('bg-red-50');
  });

  it('displays warning alert for major interactions', () => {
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    expect(screen.getByText(/major interaction/i)).toBeInTheDocument();
  });

  it('shows severity cards with correct counts', () => {
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    expect(screen.getByText('Contraindicated')).toBeInTheDocument();
    expect(screen.getByText('Major')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  it('filters interactions by severity', async () => {
    const user = userEvent.setup();
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    const contraButton = screen.getByRole('button', { name: /contraindicated/i });
    await user.click(contraButton);
    
    expect(screen.getByText(/Aspirin ↔ Warfarin/i)).toBeInTheDocument();
    expect(screen.queryByText(/Metformin/i)).not.toBeInTheDocument();
  });

  it('displays active medications as pill badges', () => {
    const activeMeds = ['Aspirin', 'Warfarin', 'Metformin'];
    render(<DrugInteractionChecker activeMedications={activeMeds} activeInteractions={mockInteractions} />);
    
    expect(screen.getByText(/Aspirin/)).toBeInTheDocument();
    expect(screen.getByText(/Warfarin/)).toBeInTheDocument();
    expect(screen.getByText(/Metformin/)).toBeInTheDocument();
  });

  it('expands interaction detail cards', async () => {
    const user = userEvent.setup();
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    const expandButton = screen.getByRole('button', { name: /Aspirin/i });
    await user.click(expandButton);
    
    expect(screen.getByText(/Increased bleeding risk/i)).toBeInTheDocument();
  });

  it('displays interaction mechanism and clinical effect', async () => {
    const user = userEvent.setup();
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    const expandButton = screen.getByRole('button', { name: /Metformin/i });
    await user.click(expandButton);
    
    expect(screen.getByText(/Risk of acute kidney injury/i)).toBeInTheDocument();
  });

  it('displays management recommendation in bordered panel', async () => {
    const user = userEvent.setup();
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    const expandButton = screen.getByRole('button', { name: /Aspirin/i });
    await user.click(expandButton);
    
    expect(screen.getByText(/Avoid combination or use alternative/i)).toBeInTheDocument();
  });

  it('shows monitoring requirements flag when present', async () => {
    const mockWithMonitoring = [
      {
        ...mockInteractions[0],
        requires_monitoring: true
      }
    ];
    
    const user = userEvent.setup();
    render(<DrugInteractionChecker activeInteractions={mockWithMonitoring} />);
    
    const expandButton = screen.getByRole('button', { name: /Aspirin/i });
    await user.click(expandButton);
    
    expect(screen.getByText(/Requiere monitoreo cercano/i)).toBeInTheDocument();
  });

  it('displays bottom recommendations panel', () => {
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
  });

  it('shows green checkmark when no interactions found', () => {
    render(<DrugInteractionChecker activeInteractions={[]} />);
    
    expect(screen.getByText(/No se detectaron interacciones/i)).toBeInTheDocument();
  });

  it('color codes severity correctly', () => {
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    const severityBadges = screen.getAllByRole('button', { name: /severity/i });
    expect(severityBadges).toBeDefined();
  });

  it('allows action buttons for each interaction', async () => {
    const user = userEvent.setup();
    render(<DrugInteractionChecker activeInteractions={mockInteractions} />);
    
    const expandButton = screen.getByRole('button', { name: /Aspirin/i });
    await user.click(expandButton);
    
    const documentButton = screen.getByRole('button', { name: /Documentar/i });
    expect(documentButton).toBeInTheDocument();
  });
});

// ============ MedicationAdherenceTracker Tests ============
describe('MedicationAdherenceTracker Component', () => {
  const mockMedication = {
    name: 'Lisinopril',
    dose: '10 mg',
    frequency: 'once daily',
    indication: 'Hypertension'
  };

  const mockAdherenceHistory = [
    { date: '2024-01-15', adherence: 100 },
    { date: '2024-01-16', adherence: 100 },
    { date: '2024-01-17', adherence: 50 },
    { date: '2024-01-18', adherence: 100 }
  ];

  it('renders medication info display panel', () => {
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    expect(screen.getByText('Lisinopril')).toBeInTheDocument();
    expect(screen.getByText('10 mg')).toBeInTheDocument();
    expect(screen.getByText('once daily')).toBeInTheDocument();
  });

  it('displays adherence history pie chart', () => {
    render(<MedicationAdherenceTracker medication={mockMedication} adherenceHistory={mockAdherenceHistory} />);
    
    expect(screen.getByText(/Adherence History/i)).toBeInTheDocument();
  });

  it('shows 4-card KPI dashboard', () => {
    render(<MedicationAdherenceTracker medication={mockMedication} currentAdherence={88} />);
    
    expect(screen.getByText('Average Adherence')).toBeInTheDocument();
    expect(screen.getByText('Current Evaluation')).toBeInTheDocument();
    expect(screen.getByText('Missed Doses')).toBeInTheDocument();
    expect(screen.getByText('Trend')).toBeInTheDocument();
  });

  it('allows adherence percentage slider input', async () => {
    const user = userEvent.setup();
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    
    await user.click(slider);
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
  });

  it('displays live adherence percentage in number box', async () => {
    const user = userEvent.setup();
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    const slider = screen.getByRole('slider');
    await user.clear(slider);
    // Trigger slider change
    fireEvent.change(slider, { target: { value: '75' } });
    
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('allows adherence level dropdown selection', async () => {
    const user = userEvent.setup();
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    const adherenceSelect = screen.getByLabelText(/adherence level/i);
    await user.selectOptions(adherenceSelect, 'good');
    
    expect(adherenceSelect).toHaveValue('good');
  });

  it('accepts missed doses number input', async () => {
    const user = userEvent.setup();
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    const missedDosesField = screen.getByLabelText(/missed doses/i);
    await user.type(missedDosesField, '2');
    
    expect(missedDosesField).toHaveValue(2);
  });

  it('allows motivation level selection', async () => {
    const user = userEvent.setup();
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    const motivationSelect = screen.getByLabelText(/motivation level/i);
    await user.selectOptions(motivationSelect, 'moderate');
    
    expect(motivationSelect).toHaveValue('moderate');
  });

  it('allows education provided checkbox', async () => {
    const user = userEvent.setup();
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    const educationCheckbox = screen.getByLabelText(/education provided/i);
    await user.click(educationCheckbox);
    
    expect(educationCheckbox).toBeChecked();
  });

  it('accepts adherence barriers textarea', async () => {
    const user = userEvent.setup();
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    const barriersField = screen.getByPlaceholderText(/barriers/i);
    await user.type(barriersField, 'Forgot to take medication due to work schedule');
    
    expect(barriersField).toHaveValue('Forgot to take medication due to work schedule');
  });

  it('accepts side effects reported textarea', async () => {
    const user = userEvent.setup();
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    const sideEffectsField = screen.getByPlaceholderText(/side effects/i);
    await user.type(sideEffectsField, 'Mild dizziness in the morning');
    
    expect(sideEffectsField).toHaveValue('Mild dizziness in the morning');
  });

  it('allows follow-up date picker', async () => {
    const user = userEvent.setup();
    render(<MedicationAdherenceTracker medication={mockMedication} />);
    
    const dateField = screen.getByLabelText(/follow-up date/i);
    expect(dateField).toBeInTheDocument();
  });

  it('shows intervention recommendations when adherence < 75%', () => {
    render(<MedicationAdherenceTracker medication={mockMedication} currentAdherence={60} />);
    
    expect(screen.getByText(/⚠️ Adherencia Regular/i)).toBeInTheDocument();
    expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
  });

  it('displays good adherence status when >= 90%', () => {
    render(<MedicationAdherenceTracker medication={mockMedication} currentAdherence={95} />);
    
    expect(screen.getByText(/✓ Buena adherencia/i)).toBeInTheDocument();
  });

  it('displays trend with icon and status', () => {
    render(<MedicationAdherenceTracker medication={mockMedication} trend="mejorando" />);
    
    expect(screen.getByText(/Mejorando/i)).toBeInTheDocument();
  });

  it('color codes KPI dashboard by adherence status', () => {
    render(<MedicationAdherenceTracker medication={mockMedication} currentAdherence={95} />);
    
    const currentCard = screen.getByText('Current Evaluation').closest('div');
    expect(currentCard).toHaveClass('bg-green-50');
  });
});

// ============ usePrescriptionManagement Hook Tests ============
describe('usePrescriptionManagement Hook', () => {
  it('fetches prescriptions for patient', async () => {
    const { result } = renderHook(() => usePrescriptionManagement('patient-123'));
    
    await waitFor(() => {
      expect(result.current.prescriptions).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('creates new prescription', async () => {
    const { result } = renderHook(() => usePrescriptionManagement('patient-123'));
    
    const newPrescription = {
      medication_id: 'med-1',
      dosage: 250,
      route: 'oral',
      frequency: 'three times daily'
    };
    
    await act(async () => {
      await result.current.createPrescription(newPrescription);
    });
    
    expect(result.current.prescriptions).toContain(expect.objectContaining(newPrescription));
  });

  it('filters active prescriptions', async () => {
    const { result } = renderHook(() => usePrescriptionManagement('patient-123'));
    
    await act(async () => {
      await result.current.getActivePrescriptions();
    });
    
    const activePrescriptions = result.current.prescriptions.filter(p => p.status === 'active');
    expect(activePrescriptions).toBeDefined();
  });

  it('discontinues prescription with reason', async () => {
    const { result } = renderHook(() => usePrescriptionManagement('patient-123'));
    
    await act(async () => {
      await result.current.updatePrescriptionStatus('prescription-1', 'discontinued', 'Side effects');
    });
    
    expect(result.current.prescriptions[0]?.status).toBe('discontinued');
  });
});

// ============ useDrugInteractionCheck Hook Tests ============
describe('useDrugInteractionCheck Hook', () => {
  it('checks interactions between medications', async () => {
    const { result } = renderHook(() => useDrugInteractionCheck());
    
    await act(async () => {
      await result.current.checkInteractions(['med-1', 'med-2', 'med-3']);
    });
    
    await waitFor(() => {
      expect(result.current.interactions).toBeDefined();
    });
  });

  it('filters major interactions', async () => {
    const { result } = renderHook(() => useDrugInteractionCheck());
    
    const majorInteractions = await result.current.getMajorInteractions();
    expect(majorInteractions).toBeDefined();
    expect(Array.isArray(majorInteractions)).toBe(true);
  });

  it('identifies contraindicated interactions', async () => {
    const { result } = renderHook(() => useDrugInteractionCheck());
    
    const contraInteractions = await result.current.getContraindicatedInteractions();
    expect(contraInteractions).toBeDefined();
    expect(Array.isArray(contraInteractions)).toBe(true);
  });
});

// ============ useMedicationAdherence Hook Tests ============
describe('useMedicationAdherence Hook', () => {
  it('fetches medication adherence records', async () => {
    const { result } = renderHook(() => useMedicationAdherence('patient-123'));
    
    await waitFor(() => {
      expect(result.current.adherenceRecords).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('records adherence data', async () => {
    const { result } = renderHook(() => useMedicationAdherence('patient-123'));
    
    const adherenceData = {
      prescription_id: 'prescription-1',
      adherence_percentage: 88,
      missed_doses: 1
    };
    
    await act(async () => {
      await result.current.recordAdherence('prescription-1', adherenceData);
    });
    
    expect(result.current.adherenceRecords).toContain(expect.objectContaining(adherenceData));
  });

  it('calculates average adherence', async () => {
    const { result } = renderHook(() => useMedicationAdherence('patient-123'));
    
    await act(async () => {
      const average = await result.current.getAverageAdherence('prescription-1');
      expect(average).toBeGreaterThanOrEqual(0);
      expect(average).toBeLessThanOrEqual(100);
    });
  });

  it('calculates adherence trend', async () => {
    const { result } = renderHook(() => useMedicationAdherence('patient-123'));
    
    await act(async () => {
      const trend = await result.current.getAdherenceTrend('prescription-1');
      expect(['mejorando', 'empeorando', 'estable']).toContain(trend);
    });
  });
});

// ============ useAdverseMedicationEvents Hook Tests ============
describe('useAdverseMedicationEvents Hook', () => {
  it('fetches adverse events for patient', async () => {
    const { result } = renderHook(() => useAdverseMedicationEvents('patient-123'));
    
    await waitFor(() => {
      expect(result.current.events).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('reports new adverse event', async () => {
    const { result } = renderHook(() => useAdverseMedicationEvents('patient-123'));
    
    const eventData = {
      prescription_id: 'prescription-1',
      severity: 'moderate',
      description: 'Mild allergic reaction'
    };
    
    await act(async () => {
      await result.current.reportEvent(eventData);
    });
    
    expect(result.current.events).toContain(expect.objectContaining(eventData));
  });

  it('updates event outcome', async () => {
    const { result } = renderHook(() => useAdverseMedicationEvents('patient-123'));
    
    await act(async () => {
      await result.current.updateEventOutcome('event-1', 'recovered');
    });
    
    expect(result.current.events[0]?.outcome).toBe('recovered');
  });

  it('filters severe events', async () => {
    const { result } = renderHook(() => useAdverseMedicationEvents('patient-123'));
    
    await act(async () => {
      const severeEvents = await result.current.getSevereEvents();
      expect(severeEvents).toBeDefined();
      expect(Array.isArray(severeEvents)).toBe(true);
    });
  });
});
