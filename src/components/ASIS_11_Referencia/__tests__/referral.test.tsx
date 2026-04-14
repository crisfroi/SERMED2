// @ts-nocheck
// src/components/ASIS_11_Referencia/__tests__/referral.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReferralRequestForm } from '../ReferralRequestForm';
import { ReferralTrackingViewer } from '../ReferralTrackingViewer';
import { OutcomeAssessmentForm } from '../OutcomeAssessmentForm';
import { 
  useReferralManagement, 
  useSpecialistResponses, 
  useReferralFollowup,
  useReferralOutcomes 
} from '../../../hooks/useReferralHooks';

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

// ============ ReferralRequestForm Tests ============
describe('ReferralRequestForm Component', () => {
  it('renders form with all required fields', () => {
    render(<ReferralRequestForm patientId="test-123" />);
    
    expect(screen.getByLabelText(/referral type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/specialist facility/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clinical indication/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  });

  it('validates clinical indication minimum length (20 chars)', async () => {
    const user = userEvent.setup();
    render(<ReferralRequestForm patientId="test-123" />);
    
    const indicationField = screen.getByLabelText(/clinical indication/i);
    await user.type(indicationField, 'short');
    
    const submitButton = screen.getByRole('button', { name: /send/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument();
  });

  it('filters specialist facilities by referral type', async () => {
    const user = userEvent.setup();
    render(<ReferralRequestForm patientId="test-123" />);
    
    const typeSelect = screen.getByLabelText(/referral type/i);
    await user.selectOptions(typeSelect, 'cardiology');
    
    // Facility dropdown should now be enabled
    const facilitySelect = screen.getByLabelText(/specialist facility/i);
    expect(facilitySelect).not.toBeDisabled();
  });

  it('disables facility select until type is selected', () => {
    render(<ReferralRequestForm patientId="test-123" />);
    
    const facilitySelect = screen.getByLabelText(/specialist facility/i);
    expect(facilitySelect).toBeDisabled();
  });

  it('displays selected type details panel', async () => {
    const user = userEvent.setup();
    render(<ReferralRequestForm patientId="test-123" />);
    
    await user.selectOptions(screen.getByLabelText(/referral type/i), 'cardiology');
    
    expect(screen.getByText(/specialty:/i)).toBeInTheDocument();
    expect(screen.getByText(/average response time:/i)).toBeInTheDocument();
  });

  it('shows priority options with time expectations', async () => {
    const user = userEvent.setup();
    render(<ReferralRequestForm patientId="test-123" />);
    
    const prioritySelect = screen.getByLabelText(/priority/i);
    expect(prioritySelect).toBeInTheDocument();
    
    // Check that priority options have descriptions
    const options = screen.getAllByRole('option');
    expect(options.some(o => o.textContent?.includes('5-7 days'))).toBe(true);
  });

  it('submits referral with all required data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    render(<ReferralRequestForm patientId="test-123" onSuccess={mockOnSuccess} />);
    
    await user.selectOptions(screen.getByLabelText(/referral type/i), 'cardiology');
    await user.selectOptions(screen.getByLabelText(/specialist facility/i), 'facility-1');
    await user.type(
      screen.getByLabelText(/clinical indication/i),
      'Patient needs cardiology evaluation for persistent arrhythmia'
    );
    await user.selectOptions(screen.getByLabelText(/priority/i), 'routine');
    
    const submitButton = screen.getByRole('button', { name: /send/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    render(<ReferralRequestForm patientId="test-123" />);
    
    const submitButton = screen.getByRole('button', { name: /send/i });
    await user.click(submitButton);
    
    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
  });

  it('captures insurance authorization code', async () => {
    const user = userEvent.setup();
    render(<ReferralRequestForm patientId="test-123" />);
    
    const authField = screen.getByLabelText(/authorization code/i);
    await user.type(authField, 'AUTH-123456');
    
    expect(authField).toHaveValue('AUTH-123456');
  });

  it('records clinical history and medications', async () => {
    const user = userEvent.setup();
    render(<ReferralRequestForm patientId="test-123" />);
    
    const clinicalHistoryField = screen.getByPlaceholderText(/clinical history/i);
    const medicationsField = screen.getByPlaceholderText(/medications/i);
    
    await user.type(clinicalHistoryField, 'Hypertension diagnosed 5 years ago');
    await user.type(medicationsField, 'Lisinopril 10mg daily, Aspirin 81mg');
    
    expect(clinicalHistoryField).toHaveValue('Hypertension diagnosed 5 years ago');
    expect(medicationsField).toHaveValue('Lisinopril 10mg daily, Aspirin 81mg');
  });

  it('displays pre-prescription checklist panel', () => {
    render(<ReferralRequestForm patientId="test-123" />);
    
    expect(screen.getByText(/important notes:/i)).toBeInTheDocument();
  });

  it('prevents submission without required fields', async () => {
    const user = userEvent.setup();
    render(<ReferralRequestForm patientId="test-123" />);
    
    const submitButton = screen.getByRole('button', { name: /send/i });
    await user.click(submitButton);
    
    expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
  });
});

// ============ ReferralTrackingViewer Tests ============
describe('ReferralTrackingViewer Component', () => {
  const mockReferrals = [
    {
      id: '1',
      referral_number: 'REF-001',
      specialist_type: 'Cardiology',
      clinical_indication: 'Persistent arrhythmia evaluation and management',
      status: 'pending',
      request_date: '2024-01-15',
      expected_response_date: '2024-01-22',
      days_remaining: 5,
      timeline_step: 2
    },
    {
      id: '2',
      referral_number: 'REF-002',
      specialist_type: 'Neurology',
      clinical_indication: 'Migraine management consultation',
      status: 'completed',
      request_date: '2024-01-10',
      expected_response_date: '2024-01-17',
      days_remaining: 0,
      timeline_step: 5,
      specialist_response: {
        findings: 'Tension-type migraine',
        recommendations: 'Prophylactic therapy with propranolol'
      }
    },
    {
      id: '3',
      referral_number: 'REF-003',
      specialist_type: 'Trauma',
      clinical_indication: 'Orthopedic injury assessment',
      status: 'overdue',
      request_date: '2024-01-05',
      expected_response_date: '2024-01-12',
      days_remaining: -3,
      timeline_step: 3
    }
  ];

  it('renders summary statistics cards', () => {
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('En Proceso')).toBeInTheDocument();
    expect(screen.getByText('Completadas')).toBeInTheDocument();
  });

  it('displays correct count for each status', () => {
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    const pendingCard = screen.getByText('Pendientes').closest('div');
    expect(within(pendingCard!).getByText('1')).toBeInTheDocument();
  });

  it('filters referrals by status', async () => {
    const user = userEvent.setup();
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    const completedButton = screen.getByRole('button', { name: /completadas/i });
    await user.click(completedButton);
    
    expect(screen.getByText('REF-002')).toBeInTheDocument();
    expect(screen.queryByText('REF-001')).not.toBeInTheDocument();
  });

  it('expands referral card to show details', async () => {
    const user = userEvent.setup();
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    const expandButton = screen.getByRole('button', { name: /REF-001/i });
    await user.click(expandButton);
    
    expect(screen.getByText(/Persistent arrhythmia evaluation/i)).toBeInTheDocument();
  });

  it('shows overdue status with warning color', () => {
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    const overdueCard = screen.getByText('REF-003').closest('article');
    expect(overdueCard).toHaveClass('border-red-300');
  });

  it('displays days remaining with appropriate coloring', () => {
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    const pendingCard = screen.getByText('REF-001').closest('article');
    const daysText = within(pendingCard!).getByText(/5 days/i);
    expect(daysText).toHaveClass('text-green-600');
  });

  it('shows timeline visualization for referral process', () => {
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    expect(screen.getAllByText(/Solicitada/)).toBeDefined();
    expect(screen.getAllByText(/Completada/)).toBeDefined();
  });

  it('displays specialist response information when available', () => {
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    const completedCard = screen.getByText('REF-002').closest('article');
    
    // Expand to see details
    fireEvent.click(completedCard!);
    
    expect(screen.getByText(/Tension-type migraine/)).toBeInTheDocument();
    expect(screen.getByText(/Prophylactic therapy/)).toBeInTheDocument();
  });

  it('shows action buttons for pending referrals', async () => {
    const user = userEvent.setup();
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    const expandButton = screen.getByRole('button', { name: /REF-001/i });
    await user.click(expandButton);
    
    expect(screen.getByRole('button', { name: /Ver Detalles/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contactar/i })).toBeInTheDocument();
  });

  it('calculates and displays completion rate', () => {
    render(<ReferralTrackingViewer referrals={mockReferrals} />);
    
    expect(screen.getByText(/33%/)).toBeInTheDocument();
  });

  it('handles empty referrals list', () => {
    render(<ReferralTrackingViewer referrals={[]} />);
    
    expect(screen.getByText(/no referrals/i)).toBeInTheDocument();
  });
});

// ============ OutcomeAssessmentForm Tests ============
describe('OutcomeAssessmentForm Component', () => {
  it('renders form with all assessment fields', () => {
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    expect(screen.getByLabelText(/clinical outcome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/closure reason/i)).toBeInTheDocument();
    expect(screen.getByText(/treatment effectiveness/i)).toBeInTheDocument();
  });

  it('allows selection of clinical outcome', async () => {
    const user = userEvent.setup();
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    const improvedButton = screen.getByRole('button', { name: /improved/i });
    await user.click(improvedButton);
    
    expect(improvedButton).toHaveClass('bg-green-100');
  });

  it('displays closure reason dropdown with valid options', () => {
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    const closureReasonSelect = screen.getByLabelText(/closure reason/i);
    expect(closureReasonSelect).toBeInTheDocument();
  });

  it('allows symptom resolution checkbox', async () => {
    const user = userEvent.setup();
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    const checkbox = screen.getByLabelText(/symptom resolution/i);
    await user.click(checkbox);
    
    expect(checkbox).toBeChecked();
  });

  it('displays treatment effectiveness 5-star rating', () => {
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    const stars = screen.getAllByRole('button', { name: /star/i });
    expect(stars.length).toBeGreaterThanOrEqual(5);
  });

  it('conditionally shows complications textarea', async () => {
    const user = userEvent.setup();
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    const complicationsCheckbox = screen.getByLabelText(/complications/i);
    await user.click(complicationsCheckbox);
    
    const textarea = screen.getByPlaceholderText(/describe complications/i);
    expect(textarea).toBeVisible();
  });

  it('hides complications textarea when unchecked', async () => {
    const user = userEvent.setup();
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    const complicationsCheckbox = screen.getByLabelText(/complications/i);
    await user.click(complicationsCheckbox);
    
    let textarea = screen.getByPlaceholderText(/describe complications/i);
    expect(textarea).toBeVisible();
    
    await user.click(complicationsCheckbox);
    expect(textarea).not.toBeVisible();
  });

  it('conditionally shows readmittance reason field', async () => {
    const user = userEvent.setup();
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    const readmittanceCheckbox = screen.getByLabelText(/readmittance required/i);
    await user.click(readmittanceCheckbox);
    
    const textarea = screen.getByPlaceholderText(/reason for readmittance/i);
    expect(textarea).toBeVisible();
  });

  it('allows quality of care rating (1-5 slider)', async () => {
    const user = userEvent.setup();
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    const qualityButtons = screen.getAllByRole('button', { name: /^[1-5]$/ });
    expect(qualityButtons.length).toBeGreaterThanOrEqual(5);
    
    await user.click(qualityButtons[4]); // Click 5
    expect(qualityButtons[4]).toHaveClass('bg-blue-500');
  });

  it('allows patient satisfaction rating (1-5 slider)', async () => {
    const user = userEvent.setup();
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    const satisfactionButtons = screen.getAllByRole('button', { name: /^[1-5]$/ });
    await user.click(satisfactionButtons[2]); // Click 3
    
    expect(satisfactionButtons[2]).toHaveClass('bg-blue-500');
  });

  it('displays intervention recommendations when score < 75%', () => {
    render(<OutcomeAssessmentForm referralId="ref-123" qualityScore={60} />);
    
    expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
  });

  it('shows summary card with current values', () => {
    render(<OutcomeAssessmentForm referralId="ref-123" />);
    
    expect(screen.getByText(/evaluation summary/i)).toBeInTheDocument();
  });

  it('submits outcome assessment with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    render(<OutcomeAssessmentForm referralId="ref-123" onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /improved/i }));
    await user.selectOptions(screen.getByLabelText(/closure reason/i), 'resolved');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});

// ============ useReferralManagement Hook Tests ============
describe('useReferralManagement Hook', () => {
  it('fetches referrals for patient', async () => {
    const { result } = renderHook(() => useReferralManagement('patient-123'));
    
    await waitFor(() => {
      expect(result.current.referrals).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('creates new referral', async () => {
    const { result } = renderHook(() => useReferralManagement('patient-123'));
    
    const newReferral = {
      referral_type: 'cardiology',
      specialist_facility_id: 'facility-1',
      clinical_indication: 'Persistent arrhythmia evaluation'
    };
    
    await act(async () => {
      await result.current.createReferral(newReferral);
    });
    
    await waitFor(() => {
      expect(result.current.referrals).toContain(expect.objectContaining(newReferral));
    });
  });

  it('detects overdue referrals', async () => {
    const { result } = renderHook(() => useReferralManagement('patient-123'));
    
    await waitFor(async () => {
      const overdueReferrals = await result.current.getOverdueReferrals();
      expect(overdueReferrals).toBeDefined();
      expect(Array.isArray(overdueReferrals)).toBe(true);
    });
  });

  it('updates referral status', async () => {
    const { result } = renderHook(() => useReferralManagement('patient-123'));
    
    await act(async () => {
      await result.current.updateReferralStatus('referral-1', 'completed');
    });
    
    expect(result.current.referrals[0]?.status).toBe('completed');
  });
});

// ============ useSpecialistResponses Hook Tests ============
describe('useSpecialistResponses Hook', () => {
  it('fetches specialist responses for patient', async () => {
    const { result } = renderHook(() => useSpecialistResponses('patient-123'));
    
    await waitFor(() => {
      expect(result.current.responses).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('records specialist response', async () => {
    const { result } = renderHook(() => useSpecialistResponses('patient-123'));
    
    const response = {
      referral_id: 'referral-1',
      findings: 'Tension-type migraine',
      recommendations: 'Prophylactic therapy with propranolol'
    };
    
    await act(async () => {
      await result.current.recordResponse('referral-1', response);
    });
    
    expect(result.current.responses).toContain(expect.objectContaining(response));
  });

  it('marks response as reviewed', async () => {
    const { result } = renderHook(() => useSpecialistResponses('patient-123'));
    
    await act(async () => {
      await result.current.markResponseReviewed('response-1');
    });
    
    expect(result.current.responses[0]?.is_reviewed).toBe(true);
  });
});

// ============ useReferralFollowup Hook Tests ============
describe('useReferralFollowup Hook', () => {
  it('fetches referral followups', async () => {
    const { result } = renderHook(() => useReferralFollowup('referral-123'));
    
    await waitFor(() => {
      expect(result.current.followups).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('creates followup task', async () => {
    const { result } = renderHook(() => useReferralFollowup('referral-123'));
    
    const followup = {
      referral_id: 'referral-123',
      task_type: 'patient_call',
      scheduled_date: '2024-02-15'
    };
    
    await act(async () => {
      await result.current.createFollowup(followup);
    });
    
    expect(result.current.followups).toContain(expect.objectContaining(followup));
  });

  it('completes followup with outcomes', async () => {
    const { result } = renderHook(() => useReferralFollowup('referral-123'));
    
    const outcomes = {
      patient_compliance: true,
      outcome_notes: 'Patient started prescribed treatment'
    };
    
    await act(async () => {
      await result.current.completeFollowup('followup-1', outcomes);
    });
    
    expect(result.current.followups[0]?.is_completed).toBe(true);
  });
});

// ============ useReferralOutcomes Hook Tests ============
describe('useReferralOutcomes Hook', () => {
  it('fetches referral outcome', async () => {
    const { result } = renderHook(() => useReferralOutcomes('referral-123'));
    
    await waitFor(() => {
      expect(result.current.outcome).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('records referral outcome', async () => {
    const { result } = renderHook(() => useReferralOutcomes('referral-123'));
    
    const outcome = {
      referral_id: 'referral-123',
      clinical_outcome: 'improved',
      closure_reason: 'resolved'
    };
    
    await act(async () => {
      await result.current.recordOutcome(outcome);
    });
    
    expect(result.current.outcome).toEqual(expect.objectContaining(outcome));
  });
});
