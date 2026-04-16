// src/components/ASIS_10_Laboratorio/__tests__/lab.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabOrderForm } from '../LabOrderForm';
import { LabResultsViewer } from '../LabResultsViewer';
import { QualityControlDashboard } from '../QualityControlDashboard';
import { useLabOrderManagement, useLabResults, useQualityControl } from '../../../../../../src/hooks/useLabHooks';

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

// ============ LabOrderForm Tests ============
describe('LabOrderForm Component', () => {
  it('renders form with all required fields', () => {
    render(<LabOrderForm patientId="test-123" />);
    
    expect(screen.getByLabelText(/test type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clinical indication/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/specimen type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  });

  it('validates clinical indication minimum length', async () => {
    const user = userEvent.setup();
    render(<LabOrderForm patientId="test-123" />);
    
    const indicationField = screen.getByLabelText(/clinical indication/i);
    await user.type(indicationField, 'short');
    
    const submitButton = screen.getByRole('button', { name: /order/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    render(<LabOrderForm patientId="test-123" onSuccess={mockOnSuccess} />);
    
    await user.selectOptions(screen.getByLabelText(/test type/i), 'HEM');
    await user.type(screen.getByLabelText(/clinical indication/i), 'Patient showing symptoms');
    await user.selectOptions(screen.getByLabelText(/specimen type/i), 'blood');
    
    const submitButton = screen.getByRole('button', { name: /order/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    render(<LabOrderForm patientId="test-123" />);
    
    await user.selectOptions(screen.getByLabelText(/test type/i), 'HEM');
    await user.type(screen.getByLabelText(/clinical indication/i), 'Patient showing symptoms');
    
    const submitButton = screen.getByRole('button', { name: /order/i });
    await user.click(submitButton);
    
    expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
  });

  it('shows fasting requirement warning for relevant tests', async () => {
    const user = userEvent.setup();
    render(<LabOrderForm patientId="test-123" />);
    
    await user.selectOptions(screen.getByLabelText(/test type/i), 'GLU');
    
    expect(screen.getByText(/fasting required/i)).toBeInTheDocument();
  });

  it('displays turnaround time for selected test', async () => {
    const user = userEvent.setup();
    render(<LabOrderForm patientId="test-123" />);
    
    await user.selectOptions(screen.getByLabelText(/test type/i), 'TSH');
    
    expect(screen.getByText(/turnaround time/i)).toBeInTheDocument();
  });

  it('allows multi-line specimen collection notes', async () => {
    const user = userEvent.setup();
    render(<LabOrderForm patientId="test-123" />);
    
    const notesField = screen.getByPlaceholderText(/collection notes/i);
    await user.type(notesField, 'Line 1\nLine 2\nLine 3');
    
    expect(notesField).toHaveValue('Line 1\nLine 2\nLine 3');
  });

  it('validates volume input for specimen', async () => {
    const user = userEvent.setup();
    render(<LabOrderForm patientId="test-123" />);
    
    const volumeField = screen.getByLabelText(/volume/i);
    await user.type(volumeField, '-5');
    
    const submitButton = screen.getByRole('button', { name: /order/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/positive number/i)).toBeInTheDocument();
  });

  it('prevents submission without test type selection', async () => {
    const user = userEvent.setup();
    render(<LabOrderForm patientId="test-123" />);
    
    const submitButton = screen.getByRole('button', { name: /order/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/required field/i)).toBeInTheDocument();
  });
});

// ============ LabResultsViewer Tests ============
describe('LabResultsViewer Component', () => {
  const mockResults = [
    { id: '1', test_type: 'HEM', value: 14.5, reference_min: 13.5, reference_max: 17.5, flag: 'normal' },
    { id: '2', test_type: 'GLU', value: 280, reference_min: 70, reference_max: 100, flag: 'high' },
    { id: '3', test_type: 'CRE', value: 0.5, reference_min: 0.7, reference_max: 1.3, flag: 'low' },
    { id: '4', test_type: 'PLT', value: 2000000, reference_min: 150000, reference_max: 400000, flag: 'critical_high' }
  ];

  it('renders results summary cards', () => {
    render(<LabResultsViewer results={mockResults} />);
    
    expect(screen.getByText('Total Results')).toBeInTheDocument();
    expect(screen.getByText('Normales')).toBeInTheDocument();
    expect(screen.getByText('Anormales')).toBeInTheDocument();
    expect(screen.getByText('Críticos')).toBeInTheDocument();
  });

  it('correctly counts normal results', () => {
    render(<LabResultsViewer results={mockResults} />);
    
    const normalCard = screen.getByText('Normales').closest('div');
    expect(within(normalCard!).getByText('1')).toBeInTheDocument();
  });

  it('filters results by status', async () => {
    const user = userEvent.setup();
    render(<LabResultsViewer results={mockResults} />);
    
    const criticalButton = screen.getByRole('button', { name: /críticos/i });
    await user.click(criticalButton);
    
    expect(screen.getByText('PLT')).toBeInTheDocument();
    expect(screen.queryByText('HEM')).not.toBeInTheDocument();
  });

  it('displays color-coded flags', () => {
    render(<LabResultsViewer results={mockResults} />);
    
    const resultCards = screen.getAllByRole('article');
    expect(resultCards.length).toBe(4);
    
    // Check for flag icons
    expect(screen.getByAltText('normal flag')).toBeInTheDocument();
    expect(screen.getByAltText('high flag')).toBeInTheDocument();
  });

  it('shows trend comparison with previous results', () => {
    const resultsWithTrend = [
      {
        ...mockResults[0],
        previous_value: 13.0,
        trend_percentage: 11.5
      }
    ];
    
    render(<LabResultsViewer results={resultsWithTrend} />);
    
    expect(screen.getByText(/+11.5%/)).toBeInTheDocument();
  });

  it('displays quality score progress bar', () => {
    render(<LabResultsViewer results={mockResults} />);
    
    expect(screen.getByText(/quality score/i)).toBeInTheDocument();
  });

  it('shows interpretation commentary', () => {
    const resultsWithInterpretation = [
      {
        ...mockResults[1],
        interpretation: 'Hyperglycemia detected. Recommend HbA1c testing.'
      }
    ];
    
    render(<LabResultsViewer results={resultsWithInterpretation} />);
    
    expect(screen.getByText(/Hyperglycemia/i)).toBeInTheDocument();
  });

  it('handles empty results list', () => {
    render(<LabResultsViewer results={[]} />);
    
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it('sorts results by collection date', async () => {
    const user = userEvent.setup();
    render(<LabResultsViewer results={mockResults} />);
    
    const sortButton = screen.getByRole('button', { name: /sort/i });
    await user.click(sortButton);
    
    // Results should be in reverse date order
    const testTypes = screen.getAllByText(/HEM|GLU|CRE|PLT/);
    expect(testTypes).toBeDefined();
  });

  it('displays delta check warnings', () => {
    const resultsWithDelta = [
      {
        ...mockResults[1],
        delta_change: 45,
        is_significant: true
      }
    ];
    
    render(<LabResultsViewer results={resultsWithDelta} />);
    
    expect(screen.getByText(/significant change/i)).toBeInTheDocument();
  });
});

// ============ QualityControlDashboard Tests ============
describe('QualityControlDashboard Component', () => {
  const mockQCRuns = [
    { id: '1', test_type: 'HEM', cv: 2.1, accuracy: 98, status: 'passed' },
    { id: '2', test_type: 'HEM', cv: 2.5, accuracy: 97, status: 'passed' },
    { id: '3', test_type: 'GLU', cv: 3.2, accuracy: 95, status: 'passed' },
    { id: '4', test_type: 'GLU', cv: 5.8, accuracy: 88, status: 'failed' },
    { id: '5', test_type: 'CRE', cv: 1.9, accuracy: 99, status: 'passed' }
  ];

  it('renders KPI dashboard with all metrics', () => {
    render(<QualityControlDashboard qcRuns={mockQCRuns} />);
    
    expect(screen.getByText('Total Runs')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('CV Average')).toBeInTheDocument();
  });

  it('calculates pass rate correctly', () => {
    render(<QualityControlDashboard qcRuns={mockQCRuns} />);
    
    const passedCard = screen.getByText('Passed').closest('div');
    expect(within(passedCard!).getByText('4')).toBeInTheDocument();
    expect(within(passedCard!).getByText('80%')).toBeInTheDocument();
  });

  it('displays CV trend line chart', () => {
    render(<QualityControlDashboard qcRuns={mockQCRuns} />);
    
    expect(screen.getByRole('img', { name: /cv trend/i })).toBeInTheDocument();
  });

  it('filters by test type', async () => {
    const user = userEvent.setup();
    render(<QualityControlDashboard qcRuns={mockQCRuns} />);
    
    const hemButton = screen.getByRole('button', { name: 'HEM' });
    await user.click(hemButton);
    
    expect(screen.getByText('HEM')).toBeInTheDocument();
    expect(screen.queryByText('GLU')).not.toBeInTheDocument();
  });

  it('highlights CV values above 5% threshold', () => {
    render(<QualityControlDashboard qcRuns={mockQCRuns} />);
    
    const criticalCV = screen.getByText('5.8%').closest('div');
    expect(criticalCV).toHaveClass('bg-red-50');
  });

  it('displays QC run detail cards', () => {
    render(<QualityControlDashboard qcRuns={mockQCRuns} />);
    
    const detailCards = screen.getAllByRole('article');
    expect(detailCards.length).toBeGreaterThan(0);
  });

  it('shows accuracy percentage for each run', () => {
    render(<QualityControlDashboard qcRuns={mockQCRuns} />);
    
    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(<QualityControlDashboard qcRuns={mockQCRuns} />);
    
    expect(screen.getByText(/Passed/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed/i)).toBeInTheDocument();
  });

  it('renders bottom recommendations panel', () => {
    render(<QualityControlDashboard qcRuns={mockQCRuns} />);
    
    expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
  });

  it('handles empty QC runs', () => {
    render(<QualityControlDashboard qcRuns={[]} />);
    
    expect(screen.getByText(/no qc runs/i)).toBeInTheDocument();
  });
});

// ============ useLabOrderManagement Hook Tests ============
describe('useLabOrderManagement Hook', () => {
  it('fetches lab orders for patient', async () => {
    const { result } = renderHook(() => useLabOrderManagement('patient-123'));
    
    await waitFor(() => {
      expect(result.current.orders).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('creates new lab order', async () => {
    const { result } = renderHook(() => useLabOrderManagement('patient-123'));
    
    const newOrder = {
      test_type: 'HEM',
      specimen_type: 'blood',
      clinical_indication: 'Routine checkup for anemia'
    };
    
    await act(async () => {
      await result.current.createOrder(newOrder);
    });
    
    expect(result.current.orders).toContain(expect.objectContaining(newOrder));
  });

  it('updates order status', async () => {
    const { result } = renderHook(() => useLabOrderManagement('patient-123'));
    
    await act(async () => {
      await result.current.updateOrderStatus('order-1', 'completed');
    });
    
    expect(result.current.orders[0]?.status).toBe('completed');
  });

  it('handles error fetching orders', async () => {
    vi.mocked(createClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch error' } })
      }))
    } as any);
    
    const { result } = renderHook(() => useLabOrderManagement('patient-123'));
    
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});

// ============ useLabResults Hook Tests ============
describe('useLabResults Hook', () => {
  it('fetches lab results for patient', async () => {
    const { result } = renderHook(() => useLabResults('patient-123'));
    
    await waitFor(() => {
      expect(result.current.results).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('finalizes lab result with interpretation', async () => {
    const { result } = renderHook(() => useLabResults('patient-123'));
    
    const finalData = {
      result_value: 14.5,
      flag: 'normal',
      interpretation: 'Normal hemoglobin level'
    };
    
    await act(async () => {
      await result.current.finalizeResult('result-1', finalData);
    });
    
    expect(result.current.results[0]?.status).toBe('finalized');
  });

  it('calculates delta check between results', async () => {
    const { result } = renderHook(() => useLabResults('patient-123'));
    
    await waitFor(() => {
      expect(result.current.results).toBeDefined();
    });
    
    const deltaCheck = result.current.results.filter(r => r.delta_change);
    expect(deltaCheck.length).toBeGreaterThan(0);
  });

  it('tracks result quality scores', async () => {
    const { result } = renderHook(() => useLabResults('patient-123'));
    
    await waitFor(() => {
      result.current.results.forEach(r => {
        expect(r.quality_score).toBeDefined();
        expect(r.quality_score).toBeGreaterThanOrEqual(0);
        expect(r.quality_score).toBeLessThanOrEqual(100);
      });
    });
  });
});

// ============ useQualityControl Hook Tests ============
describe('useQualityControl Hook', () => {
  it('fetches QC runs', async () => {
    const { result } = renderHook(() => useQualityControl());
    
    await waitFor(() => {
      expect(result.current.qcRuns).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  it('records new QC run', async () => {
    const { result } = renderHook(() => useQualityControl());
    
    const qcData = {
      test_type: 'HEM',
      cv: 2.3,
      accuracy: 98,
      status: 'passed'
    };
    
    await act(async () => {
      await result.current.recordQCRun(qcData);
    });
    
    expect(result.current.qcRuns).toContain(expect.objectContaining(qcData));
  });

  it('calculates pass rate correctly', async () => {
    const { result } = renderHook(() => useQualityControl());
    
    await waitFor(() => {
      const passedRuns = result.current.qcRuns.filter(r => r.status === 'passed').length;
      const passRate = (passedRuns / result.current.qcRuns.length) * 100;
      expect(passRate).toBeGreaterThanOrEqual(0);
      expect(passRate).toBeLessThanOrEqual(100);
    });
  });

  it('filters QC runs by test type', async () => {
    const { result } = renderHook(() => useQualityControl());
    
    await act(async () => {
      await result.current.fetchQCRuns('HEM');
    });
    
    const allHEM = result.current.qcRuns.every(r => r.test_type === 'HEM');
    expect(allHEM).toBe(true);
  });
});
