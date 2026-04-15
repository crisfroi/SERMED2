// @ts-nocheck
// WEEK 11 ADMIN 1: Custom Hooks
// Hook: usePayrollProcessing  
// Purpose: Create, edit, approve payroll (XAF calculations)
// Currency: XAF (Francos CFA)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Payroll {
  id: string;
  staff_id: string;
  staff_name: string;
  payroll_period: string; // YYYY-MM
  base_salary_xaf: number;
  bonuses_xaf: number;
  deductions_xaf: number;
  social_security_xaf: number;
  health_insurance_xaf: number;
  income_tax_xaf: number;
  gross_salary_xaf: number;
  total_deductions_xaf: number;
  net_salary_xaf: number;
  status: 'draft' | 'submitted' | 'approved' | 'processed' | 'paid';
  payment_date?: string;
  notes?: string;
  created_at: string;
}

export interface CreatePayrollInput {
  staff_id: string;
  payroll_period: string;
  base_salary_xaf: number;
  bonuses_xaf?: number;
  deductions_xaf?: number;
  social_security_xaf?: number;
  health_insurance_xaf?: number;
  income_tax_xaf?: number;
  notes?: string;
}

interface UsePayrollProcessingReturn {
  // Query
  payrollList: Payroll[] | undefined;
  payrollLoading: boolean;
  payrollError: Error | null;
  payrollById: (id: string) => Payroll | undefined;
  payrollByPeriod: (period: string) => Payroll[];
  payrollByStaff: (staffId: string) => Payroll[];

  // Mutations
  createPayroll: (data: CreatePayrollInput) => Promise<Payroll>;
  updatePayroll: (id: string, data: Partial<CreatePayrollInput>) => Promise<Payroll>;
  deletePayroll: (id: string) => Promise<void>;
  submitPayroll: (id: string) => Promise<Payroll>;
  approvePayroll: (id: string) => Promise<Payroll>;
  rejectPayroll: (id: string, reason: string) => Promise<Payroll>;
  processPayroll: (id: string) => Promise<Payroll>;
  markAsPaid: (id: string, paymentDate: string) => Promise<Payroll>;

  // Calculations
  calculateNetSalary: (payroll: Partial<CreatePayrollInput>) => number;
  calculateGrossSalary: (payroll: Partial<CreatePayrollInput>) => number;

  // State
  isCreating: boolean;
  isUpdating: boolean;
  isApproving: boolean;
  createError: Error | null;
  updateError: Error | null;
}

export const usePayrollProcessing = (period?: string): UsePayrollProcessingReturn => {
  const queryClient = useQueryClient();

  // Fetch payroll list
  const { data: payrollList, isLoading: payrollLoading, error: payrollError } = useQuery<
    Payroll[]
  >({
    queryKey: ['payroll-list', period],
    queryFn: async () => {
      const params = period ? `?period=${period}` : '';
      const response = await fetch(`/api/v1/hr/payroll${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payroll');
      return response.json();
    },
    staleTime: 3 * 60 * 1000,
  });

  // Create Payroll
  const createMutation = useMutation({
    mutationFn: async (data: CreatePayrollInput) => {
      // Calculate totals before sending
      const gross = calculateGrossSalary(data);
      const net = calculateNetSalary(data);
      const totalDeductions =
        (data.deductions_xaf || 0) +
        (data.social_security_xaf || 0) +
        (data.health_insurance_xaf || 0) +
        (data.income_tax_xaf || 0);

      const response = await fetch('/api/v1/hr/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          ...data,
          gross_salary_xaf: gross,
          total_deductions_xaf: totalDeductions,
          net_salary_xaf: net,
        }),
      });
      if (!response.ok) throw new Error('Failed to create payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  // Update Payroll
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreatePayrollInput>;
    }) => {
      // Recalculate if any salary component changed
      const existing = payrollById(id);
      if (existing) {
        const merged = { ...existing, ...data };
        const gross = calculateGrossSalary(merged);
        const net = calculateNetSalary(merged);

        data = {
          ...data,
          gross_salary_xaf: gross,
          net_salary_xaf: net,
        };
      }

      const response = await fetch(`/api/v1/hr/payroll/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  // Delete Payroll
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/hr/payroll/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  // Submit Payroll
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/hr/payroll/${id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to submit payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  // Approve Payroll
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/hr/payroll/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to approve payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  // Reject Payroll
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/v1/hr/payroll/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  // Process Payroll
  const processMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/hr/payroll/${id}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to process payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  // Mark as Paid
  const paidMutation = useMutation({
    mutationFn: async ({ id, paymentDate }: { id: string; paymentDate: string }) => {
      const response = await fetch(`/api/v1/hr/payroll/${id}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ payment_date: paymentDate }),
      });
      if (!response.ok) throw new Error('Failed to mark as paid');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
  });

  // Helper functions
  const payrollById = (id: string): Payroll | undefined => {
    return (payrollList || []).find((p) => p.id === id);
  };

  const payrollByPeriod = (p: string): Payroll[] => {
    return (payrollList || []).filter((pr) => pr.payroll_period === p);
  };

  const payrollByStaff = (staffId: string): Payroll[] => {
    return (payrollList || []).filter((p) => p.staff_id === staffId);
  };

  // Calculation functions
  const calculateGrossSalary = (data: Partial<CreatePayrollInput>): number => {
    return (
      (data.base_salary_xaf || 0) +
      (data.bonuses_xaf || 0)
    );
  };

  const calculateNetSalary = (data: Partial<CreatePayrollInput>): number => {
    const gross = calculateGrossSalary(data);
    const deductions =
      (data.deductions_xaf || 0) +
      (data.social_security_xaf || 0) +
      (data.health_insurance_xaf || 0) +
      (data.income_tax_xaf || 0);
    return gross - deductions;
  };

  return {
    // Query
    payrollList,
    payrollLoading,
    payrollError: payrollError as Error | null,
    payrollById,
    payrollByPeriod,
    payrollByStaff,

    // Mutations
    createPayroll: (data) => createMutation.mutateAsync(data),
    updatePayroll: (id, data) => updateMutation.mutateAsync({ id, data }),
    deletePayroll: (id) => deleteMutation.mutateAsync(id),
    submitPayroll: (id) => submitMutation.mutateAsync(id),
    approvePayroll: (id) => approveMutation.mutateAsync(id),
    rejectPayroll: (id, reason) => rejectMutation.mutateAsync({ id, reason }),
    processPayroll: (id) => processMutation.mutateAsync(id),
    markAsPaid: (id, paymentDate) => paidMutation.mutateAsync({ id, paymentDate }),

    // Calculations
    calculateNetSalary,
    calculateGrossSalary,

    // State
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isApproving: approveMutation.isPending,
    createError: createMutation.error as Error | null,
    updateError: updateMutation.error as Error | null,
  };
};

export default usePayrollProcessing;
