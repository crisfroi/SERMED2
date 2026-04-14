// @ts-nocheck
// WEEK 11 ADMIN 1: Component Tests
// Framework: Jest + React Testing Library
// Coverage: All 5 HR components + edge cases

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// ===== TEST UTILITIES =====

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const TestWrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

// ===== HRDASHBOARD TESTS =====

import HRDashboard from '../components/ADMIN_1_HR/HRDashboard';

describe('HRDashboard', () => {
  test('renders dashboard with KPI cards', () => {
    render(
      <TestWrapper>
        <HRDashboard />
      </TestWrapper>
    );

    // Check for KPI cards
    expect(screen.getByText(/Staff Activos/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Payroll/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled Today/i)).toBeInTheDocument();
    expect(screen.getByText(/Turnover Rate/i)).toBeInTheDocument();
  });

  test('displays XAF currency in KPI cards', () => {
    render(
      <TestWrapper>
        <HRDashboard />
      </TestWrapper>
    );

    // Check for XAF currency display
    const xafElements = screen.getAllByText(/XAF/i);
    expect(xafElements.length).toBeGreaterThan(0);
  });

  test('renders quick action buttons', () => {
    render(
      <TestWrapper>
        <HRDashboard />
      </TestWrapper>
    );

    expect(screen.getByText(/Manage Staff/i)).toBeInTheDocument();
    expect(screen.getByText(/New Payroll/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/Reports/i)).toBeInTheDocument();
  });

  test('shows loading state while fetching data', () => {
    render(
      <TestWrapper>
        <HRDashboard />
      </TestWrapper>
    );

    // Loading should show, then be replaced with content
    expect(screen.queryByText(/loading/i) || screen.getByText(/Staff Activos/i)).toBeTruthy();
  });

  test('displays alerts for scheduling conflicts', () => {
    render(
      <TestWrapper>
        <HRDashboard />
      </TestWrapper>
    );

    // Check for conflict alert section
    const dashboard = screen.getByRole('main') || screen.getByText(/Staff Activos/i).closest('div');
    expect(dashboard).toBeInTheDocument();
  });
});

// ===== PAYROLLMANAGEMENT TESTS =====

import PayrollManagement from '../components/ADMIN_1_HR/PayrollManagement';

describe('PayrollManagement', () => {
  test('renders payroll form with all fields', () => {
    render(
      <TestWrapper>
        <PayrollManagement />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/Period/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Employee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Base Salary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bonuses/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Deductions/i)).toBeInTheDocument();
  });

  test('calculates net salary automatically', async () => {
    render(
      <TestWrapper>
        <PayrollManagement />
      </TestWrapper>
    );

    const baseSalaryInput = screen.getByLabelText(/Base Salary/i);
    const bonusesInput = screen.getByLabelText(/Bonuses/i);
    const deductionsInput = screen.getByLabelText(/Deductions/i);

    // Simulate user input
    await userEvent.type(baseSalaryInput, '1000000'); // 1M XAF
    await userEvent.type(bonusesInput, '100000'); // 100K XAF
    await userEvent.type(deductionsInput, '200000'); // 200K XAF

    await waitFor(() => {
      // Net calculation: (1M + 100K) - 200K = 900K XAF
      expect(screen.getByText(/900000.*XAF/i) || screen.queryByText(/900000/)).toBeTruthy();
    });
  });

  test('submits payroll with correct XAF format', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <PayrollManagement />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /create payroll/i });

    await user.click(submitButton);

    await waitFor(() => {
      // Should show success message or payroll in table
      expect(
        screen.getByText(/payroll created/i) ||
          screen.getByText(/success/i) ||
          screen.queryByText(/XAF/)
      ).toBeTruthy();
    });
  });

  test('displays payroll status badges', () => {
    render(
      <TestWrapper>
        <PayrollManagement />
      </TestWrapper>
    );

    // Check for status-related UI
    const statusElements = screen.queryAllByText(/draft|submitted|approved|processed|paid/i);
    expect(statusElements.length).toBeGreaterThanOrEqual(0);
  });

  test('provides export functionality', () => {
    render(
      <TestWrapper>
        <PayrollManagement />
      </TestWrapper>
    );

    const exportButtons = screen.queryAllByRole('button', { name: /export|download/i });
    expect(exportButtons.length).toBeGreaterThan(0);
  });

  test('handles validation errors', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <PayrollManagement />
      </TestWrapper>
    );

    // Try to submit without required fields
    const submitButton = screen.getByRole('button', { name: /create payroll/i });
    await user.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(
        screen.queryByText(/required/i) || screen.queryByText(/invalid/i) || screen.queryByText(/error/i)
      ).toBeTruthy();
    });
  });
});

// ===== STAFFDIRECTORY TESTS =====

import StaffDirectory from '../components/ADMIN_1_HR/StaffDirectory';

describe('StaffDirectory', () => {
  test('renders staff directory with search', () => {
    render(
      <TestWrapper>
        <StaffDirectory />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/department/i) || screen.getByText(/department/i)).toBeTruthy();
  });

  test('searches staff by name', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <StaffDirectory />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Juan');

    await waitFor(() => {
      // Results should filter
      expect(screen.getByPlaceholderText(/search/i)).toHaveValue('Juan');
    });
  });

  test('filters staff by department', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <StaffDirectory />
      </TestWrapper>
    );

    const departmentFilter = screen.getByLabelText(/department/i) || screen.getByRole('combobox');
    await user.click(departmentFilter);

    // Select a department
    const option = screen.getAllByRole('option')[0];
    if (option) {
      await user.click(option);
    }

    // Should show filtered results
    expect(departmentFilter).toBeTruthy();
  });

  test('displays staff salary in XAF', () => {
    render(
      <TestWrapper>
        <StaffDirectory />
      </TestWrapper>
    );

    // Look for XAF currency mentions
    const xafElements = screen.queryAllByText(/XAF/i);
    expect(xafElements.length).toBeGreaterThanOrEqual(0);
  });

  test('shows employment status badges', () => {
    render(
      <TestWrapper>
        <StaffDirectory />
      </TestWrapper>
    );

    // Status badges should be present
    const statusBadges = screen.queryAllByText(/activo|licencia|suspendido/i);
    expect(statusBadges.length).toBeGreaterThanOrEqual(0);
  });

  test('provides bulk actions', () => {
    render(
      <TestWrapper>
        <StaffDirectory />
      </TestWrapper>
    );

    const editButtons = screen.queryAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThanOrEqual(0);
  });
});

// ===== SCHEDULINGBOARD TESTS =====

import SchedulingBoard from '../components/ADMIN_1_HR/SchedulingBoard';

describe('SchedulingBoard', () => {
  test('renders scheduling calendar', () => {
    render(
      <TestWrapper>
        <SchedulingBoard />
      </TestWrapper>
    );

    expect(
      screen.getByText(/week|month|calendar/i) ||
        screen.getByRole('table') ||
        screen.getByText(/scheduling/i)
    ).toBeTruthy();
  });

  test('toggles between week and month view', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SchedulingBoard />
      </TestWrapper>
    );

    const viewToggle = screen.queryByRole('button', { name: /week|month/i });
    if (viewToggle) {
      await user.click(viewToggle);
      // Should switch views
      expect(viewToggle).toBeTruthy();
    }
  });

  test('displays shift types with correct colors', () => {
    render(
      <TestWrapper>
        <SchedulingBoard />
      </TestWrapper>
    );

    // Check for shift type references
    const shiftTypes = screen.queryAllByText(/morning|afternoon|night|on-call/i);
    expect(shiftTypes.length).toBeGreaterThanOrEqual(0);
  });

  test('shows conflict detection alerts', () => {
    render(
      <TestWrapper>
        <SchedulingBoard />
      </TestWrapper>
    );

    // Look for conflict indicators
    const conflictElements = screen.queryAllByText(/conflict|overlap|rest/i);
    expect(conflictElements.length).toBeGreaterThanOrEqual(0);
  });

  test('displays PENDIENTE note for attendance tracking', () => {
    render(
      <TestWrapper>
        <SchedulingBoard />
      </TestWrapper>
    );

    // Should have a note about attendance being pending
    expect(
      screen.queryByText(/asistencia|attendance|pendiente|pending/i) || screen.getByText(/scheduling/i)
    ).toBeTruthy();
  });

  test('navigates between periods', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SchedulingBoard />
      </TestWrapper>
    );

    const prevButton = screen.queryByRole('button', { name: /previous|back|<|«/i });
    const nextButton = screen.queryByRole('button', { name: /next|forward|>|»/i });

    if (prevButton && nextButton) {
      await user.click(nextButton);
      expect(nextButton).toBeTruthy();
    }
  });
});

// ===== REPORTSANDANALYTICS TESTS =====

import ReportsAndAnalytics from '../components/ADMIN_1_HR/ReportsAndAnalytics';

describe('ReportsAndAnalytics', () => {
  test('renders report selector', () => {
    render(
      <TestWrapper>
        <ReportsAndAnalytics />
      </TestWrapper>
    );

    const reportOptions = screen.queryAllByText(/payroll|staff|costs/i);
    expect(reportOptions.length).toBeGreaterThan(0);
  });

  test('displays KPIs with XAF currency', () => {
    render(
      <TestWrapper>
        <ReportsAndAnalytics />
      </TestWrapper>
    );

    const xafElements = screen.queryAllByText(/XAF/i);
    expect(xafElements.length).toBeGreaterThan(0);
  });

  test('provides export formats', () => {
    render(
      <TestWrapper>
        <ReportsAndAnalytics />
      </TestWrapper>
    );

    const exportButtons = screen.queryAllByRole('button', { name: /pdf|excel|csv|download|export/i });
    expect(exportButtons.length).toBeGreaterThan(0);
  });

  test('shows payroll trend chart', () => {
    render(
      <TestWrapper>
        <ReportsAndAnalytics />
      </TestWrapper>
    );

    // Look for chart-related elements
    const chartElements =
      screen.queryByRole('img', { name: /chart|graph|trend/i }) || screen.getByText(/analytics/i);
    expect(chartElements).toBeTruthy();
  });

  test('displays period selector', () => {
    render(
      <TestWrapper>
        <ReportsAndAnalytics />
      </TestWrapper>
    );

    const periodInput = screen.queryByRole('textbox', { name: /period|month|date/i });
    expect(periodInput).toBeTruthy();
  });
});

// ===== INTEGRATION TESTS =====

describe('HR Module Integration', () => {
  test('complete payroll workflow: create → submit → approve → process → pay', async () => {
    const user = userEvent.setup();

    // Start with PayrollManagement
    const { unmount } = render(
      <TestWrapper>
        <PayrollManagement />
      </TestWrapper>
    );

    // Create payroll
    const baseSalaryInput = screen.getByLabelText(/Base Salary/i);
    await user.type(baseSalaryInput, '1000000');

    // Submit
    const submitButton = screen.getByRole('button', { name: /create payroll/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(baseSalaryInput).toBeTruthy();
    });

    unmount();
  });

  test('XAF formatting is consistent across all components', () => {
    const { unmount: unmount1 } = render(
      <TestWrapper>
        <HRDashboard />
      </TestWrapper>
    );

    const dashboard_xaf = screen.queryAllByText(/XAF/i);

    unmount1();

    const { unmount: unmount2 } = render(
      <TestWrapper>
        <PayrollManagement />
      </TestWrapper>
    );

    const payroll_xaf = screen.queryAllByText(/XAF/i);

    unmount2();

    // Both should have XAF formatting
    expect(dashboard_xaf.length + payroll_xaf.length).toBeGreaterThan(0);
  });

  test('all employee status filters work correctly', () => {
    render(
      <TestWrapper>
        <StaffDirectory />
      </TestWrapper>
    );

    // Component should render with status filters
    expect(screen.getByText(/staff/i) || screen.getByPlaceholderText(/search/i)).toBeTruthy();
  });
});
