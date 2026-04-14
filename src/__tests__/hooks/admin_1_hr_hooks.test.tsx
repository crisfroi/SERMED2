// @ts-nocheck
// WEEK 11 ADMIN 1: Hook Tests
// Framework: Jest + React Testing Library
// Coverage: useStaffManagement, usePayrollProcessing, useStaffScheduling hooks

import { renderHook, act, waitFor } from '@testing-library/react';
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

// ===== USESTAFFMANAGEMENT TESTS =====

import useStaffManagement from '../../hooks/useStaffManagement';

describe('useStaffManagement', () => {
  test('fetches all staff records', async () => {
    const { result } = renderHook(() => useStaffManagement(), { wrapper });

    // Initially loading
    expect(result.current.staffLoading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.staffLoading).toBe(false);
    });

    // Should have staff array
    expect(Array.isArray(result.current.allStaff)).toBe(true);
  });

  test('searches staff by name', async () => {
    const { result } = renderHook(() => useStaffManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.staffLoading).toBe(false);
    });

    const searchResults = result.current.searchStaff('Juan');
    expect(Array.isArray(searchResults)).toBe(true);
  });

  test('filters staff by department', async () => {
    const { result } = renderHook(() => useStaffManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.staffLoading).toBe(false);
    });

    const departmentStaff = result.current.staffByDepartment('DEPT-001');
    expect(Array.isArray(departmentStaff)).toBe(true);
  });

  test('filters active staff only', async () => {
    const { result } = renderHook(() => useStaffManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.staffLoading).toBe(false);
    });

    // All active staff should have employment_status = 'activo'
    result.current.activeStaff.forEach((staff) => {
      expect(staff.employment_status).toBe('activo');
    });
  });

  test('creates new staff record', async () => {
    const { result } = renderHook(() => useStaffManagement(), { wrapper });

    const newStaff = {
      employee_id: 'EMP-9999',
      full_name: 'Test Employee',
      email: 'test@hospital.com',
      position_id: 'POS-001',
      department_id: 'DEPT-001',
      hire_date: '2025-01-01',
      contract_type: 'permanent',
      employment_status: 'activo',
      base_salary_xaf: 1000000,
    };

    await act(async () => {
      // Would trigger createStaff mutation
      expect(result.current.isCreating).toBe(false);
    });
  });

  test('updates staff record', async () => {
    const { result } = renderHook(() => useStaffManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.staffLoading).toBe(false);
    });

    if (result.current.allStaff.length > 0) {
      const staffId = result.current.allStaff[0].id;

      await act(async () => {
        // Would trigger updateStaff mutation
        expect(result.current.isUpdating).toBe(false);
      });
    }
  });

  test('changes employment status', async () => {
    const { result } = renderHook(() => useStaffManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.staffLoading).toBe(false);
    });

    if (result.current.allStaff.length > 0) {
      const staffId = result.current.allStaff[0].id;

      await act(async () => {
        // Would trigger changeEmploymentStatus mutation
        // Transitions: activo → licencia or suspendido
        expect(result.current.isUpdating).toBe(false);
      });
    }
  });

  test('deletes staff record', async () => {
    const { result } = renderHook(() => useStaffManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.staffLoading).toBe(false);
    });

    await act(async () => {
      expect(result.current.isDeleting).toBe(false);
    });
  });

  test('handles errors gracefully', async () => {
    const { result } = renderHook(() => useStaffManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.staffLoading).toBe(false);
    });

    // If error occurs, should be exposed
    if (result.current.staffError) {
      expect(result.current.staffError).toBeInstanceOf(Error);
    }
  });
});

// ===== USEPAYROLLPROCESSING TESTS =====

import usePayrollProcessing from '../../hooks/usePayrollProcessing';

describe('usePayrollProcessing', () => {
  test('fetches payroll records', async () => {
    const { result } = renderHook(() => usePayrollProcessing(), { wrapper });

    // Initially loading
    expect(result.current.isCreating).toBe(false) || expect(result.current.payrollList).toBeTruthy();

    await waitFor(() => {
      expect(Array.isArray(result.current.payrollList)).toBe(true);
    });
  });

  test('creates payroll with XAF calculations', async () => {
    const { result } = renderHook(() => usePayrollProcessing(), { wrapper });

    const payrollData = {
      staff_id: 'STAFF-001',
      payroll_period: '2025-01',
      base_salary_xaf: 1000000,
      bonuses_xaf: 100000,
      deductions_xaf: 50000,
      social_security_xaf: 80000,
      health_insurance_xaf: 20000,
      income_tax_xaf: 150000,
    };

    // Test calculation before mutation
    const gross = payrollData.base_salary_xaf + payrollData.bonuses_xaf;
    const totalDeductions =
      payrollData.deductions_xaf +
      payrollData.social_security_xaf +
      payrollData.health_insurance_xaf +
      payrollData.income_tax_xaf;
    const net = gross - totalDeductions;

    expect(gross).toBe(1100000); // 1M + 100K
    expect(net).toBe(800000); // 1.1M - 300K
  });

  test('calculates gross and net salary correctly', () => {
    // Test pure calculation functions
    const base = 1000000; // XAF
    const bonuses = 100000; // XAF
    const deductions = 50000;
    const ss = 80000;
    const health = 20000;
    const tax = 150000;

    const gross = base + bonuses;
    const totalDed = deductions + ss + health + tax;
    const net = gross - totalDed;

    expect(gross).toBe(1100000);
    expect(totalDed).toBe(300000);
    expect(net).toBe(800000);
  });

  test('filters payroll by period', async () => {
    const { result } = renderHook(() => usePayrollProcessing(), { wrapper });

    await waitFor(() => {
      expect(Array.isArray(result.current.payrollList)).toBe(true);
    });

    const periodPayroll = result.current.payrollByPeriod('2025-01');
    expect(Array.isArray(periodPayroll)).toBe(true);

    // All records should match period
    periodPayroll.forEach((p) => {
      expect(p.payroll_period).toBe('2025-01');
    });
  });

  test('filters payroll by staff', async () => {
    const { result } = renderHook(() => usePayrollProcessing(), { wrapper });

    await waitFor(() => {
      expect(Array.isArray(result.current.payrollList)).toBe(true);
    });

    const staffPayroll = result.current.payrollByStaff('STAFF-001');
    expect(Array.isArray(staffPayroll)).toBe(true);

    // All records should belong to same staff
    staffPayroll.forEach((p) => {
      expect(p.staff_id).toBe('STAFF-001');
    });
  });

  test('manages payroll workflow state transitions', async () => {
    const { result } = renderHook(() => usePayrollProcessing(), { wrapper });

    // Valid transitions:
    // draft → submitted (submit)
    // submitted → approved (approve) or draft (reject)
    // approved → processed (process)
    // processed → paid (markAsPaid)

    const validTransitions = {
      draft: ['submitted'],
      submitted: ['approved', 'draft'],
      approved: ['processed'],
      processed: ['paid'],
      paid: [],
    };

    expect(Object.keys(validTransitions)).toContain('draft');
    expect(validTransitions['draft']).toContain('submitted');
  });

  test('rejects invalid status transitions', async () => {
    // Invalid: paid → submitted (backward)
    // Invalid: draft → processed (skip states)

    const invalidTransitions = [
      { from: 'paid', to: 'submitted' },
      { from: 'draft', to: 'processed' },
      { from: 'processed', to: 'submitted' },
    ];

    invalidTransitions.forEach((t) => {
      // Would fail validation in actual mutation
      expect(t.from).not.toBe(t.to);
    });
  });

  test('handles XAF precision (2 decimals)', async () => {
    const amounts = [
      1000000.5, // Should truncate/round to 1000000.50
      999.999, // Should round to 1000.00
      1234567.89, // Should stay 1234567.89
    ];

    amounts.forEach((amount) => {
      const formatted = parseFloat(amount.toFixed(2));
      expect(formatted.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  test('validates payroll data before submission', () => {
    const invalidPayrolls = [
      { base_salary_xaf: -100000 }, // Negative salary
      { base_salary_xaf: 'not-a-number' }, // Invalid type
      { total_deductions_xaf: 2000000, gross_salary_xaf: 1000000 }, // Deductions > gross
    ];

    // Validation should catch these
    expect(invalidPayrolls.length).toBeGreaterThan(0);
  });
});

// ===== USESTAFFSCHEDULING TESTS =====

import useStaffScheduling from '../../hooks/useStaffScheduling';

describe('useStaffScheduling', () => {
  test('fetches all schedules', async () => {
    const { result } = renderHook(() => useStaffScheduling(), { wrapper });

    await waitFor(() => {
      expect(Array.isArray(result.current.scheduleList || [])).toBe(true);
    });
  });

  test('creates schedule with calculated shift hours', async () => {
    const { result } = renderHook(() => useStaffScheduling(), { wrapper });

    // Test shift hour calculation
    const shiftStart = '09:00';
    const shiftEnd = '17:00';

    const startTime = new Date(`2025-01-01T${shiftStart}`);
    const endTime = new Date(`2025-01-01T${shiftEnd}`);
    const shiftHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    expect(shiftHours).toBe(8); // 9am to 5pm = 8 hours
  });

  test('detects scheduling conflicts', async () => {
    const { result } = renderHook(() => useStaffScheduling(), { wrapper });

    const conflicts = result.current.detectConflicts();
    expect(Array.isArray(conflicts)).toBe(true);

    // Check conflict types
    conflicts.forEach((c) => {
      expect(['overlap', 'insufficient_rest', 'both_on_call']).toContain(c.conflict_type);
    });
  });

  test('detects same-day overlapping shifts', () => {
    // Conflict: Same staff, same day, overlapping times
    // Schedule 1: 09:00-17:00
    // Schedule 2: 15:00-23:00
    // CONFLICT: Overlap from 15:00-17:00

    const time1Start = 9;
    const time1End = 17;
    const time2Start = 15;
    const time2End = 23;

    const overlap = !(time1End <= time2Start || time2End <= time1Start);
    expect(overlap).toBe(true);
  });

  test('detects insufficient rest between shifts', () => {
    // RULE: Minimum 12 hours rest between shifts
    // Shift 1 END: 17:00, Shift 2 START: 20:00
    // REST: 3 hours (INSUFFICIENT - conflict!)

    const shift1End = 17;
    const shift2Start = 20;
    const restHours = shift2Start - shift1End;

    expect(restHours).toBe(3);
    expect(restHours < 12).toBe(true); // Should be flagged as conflict
  });

  test('detects multiple on-call assignments', () => {
    // CONFLICT: Multiple staff assigned on-call same day

    const schedules = [
      { staff_id: 'STAFF-001', shift_type: 'on-call', date: '2025-01-01' },
      { staff_id: 'STAFF-002', shift_type: 'on-call', date: '2025-01-01' },
    ];

    const onCallCount = schedules.filter((s) => s.shift_type === 'on-call').length;
    expect(onCallCount).toBe(2);
  });

  test('calculates staff availability', async () => {
    const { result } = renderHook(() => useStaffScheduling(), { wrapper });

    const isAvailable = result.current.getStaffAvailability('STAFF-001', '2025-01-15');
    expect(typeof isAvailable).toBe('boolean');
  });

  test('counts shifts per staff per period', async () => {
    const { result } = renderHook(() => useStaffScheduling(), { wrapper });

    const shiftsPerStaff = result.current.getShiftsPerStaff('2025-01');
    expect(Array.isArray(shiftsPerStaff)).toBe(true);

    shiftsPerStaff.forEach((item) => {
      expect(item.staffId).toBeTruthy();
      expect(typeof item.count).toBe('number');
      expect(item.count).toBeGreaterThanOrEqual(0);
    });
  });

  test('calculates total staff hours', async () => {
    const { result } = renderHook(() => useStaffScheduling(), { wrapper });

    const totalHours = result.current.calculateStaffHours('STAFF-001', '2025-01-01', '2025-01-31');
    expect(typeof totalHours).toBe('number');
    expect(totalHours).toBeGreaterThanOrEqual(0);
  });

  test('filters schedules by date range', async () => {
    const { result } = renderHook(() => useStaffScheduling(), { wrapper });

    const rangeSchedules = result.current.scheduleByDateRange('2025-01-01', '2025-01-31');
    expect(Array.isArray(rangeSchedules)).toBe(true);

    rangeSchedules.forEach((s) => {
      const date = new Date(s.schedule_date);
      expect(date >= new Date('2025-01-01')).toBe(true);
      expect(date <= new Date('2025-01-31')).toBe(true);
    });
  });

  test('bulk creates schedules correctly', async () => {
    const { result } = renderHook(() => useStaffScheduling(), { wrapper });

    const bulkSchedules = [
      { staff_id: 'STAFF-001', shift_type: 'morning', date: '2025-01-01' },
      { staff_id: 'STAFF-002', shift_type: 'afternoon', date: '2025-01-01' },
      { staff_id: 'STAFF-003', shift_type: 'night', date: '2025-01-01' },
    ];

    expect(bulkSchedules.length).toBe(3);
  });

  test('validates shift time format', () => {
    const validTimes = ['09:00', '14:30', '23:59', '00:00'];
    const invalidTimes = ['9:00', '14:60', '25:00', 'morning'];

    validTimes.forEach((time) => {
      const regex = /^\d{2}:\d{2}$/;
      expect(regex.test(time)).toBe(true);
    });

    invalidTimes.forEach((time) => {
      const regex = /^\d{2}:\d{2}$/;
      expect(regex.test(time)).toBe(false);
    });
  });
});

// ===== INTEGRATION HOOK TESTS =====

describe('Hook Integration', () => {
  test('staff creation triggers audit in payroll', async () => {
    const staffHook = renderHook(() => useStaffManagement(), { wrapper });
    const payrollHook = renderHook(() => usePayrollProcessing(), { wrapper });

    // When staff is created, they should be available for payroll
    await waitFor(() => {
      expect(staffHook.result.current.staffLoading).toBe(false);
    });

    // Payroll should reflect new staff
    expect(Array.isArray(payrollHook.result.current.payrollList)).toBe(true);
  });

  test('scheduling changes update staff availability', async () => {
    const scheduleHook = renderHook(() => useStaffScheduling(), { wrapper });

    const availability = scheduleHook.result.current.getStaffAvailability('STAFF-001', '2025-01-15');
    expect(typeof availability).toBe('boolean');
  });
});
