import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Employee {
  id: string;
  name: string;
  role: 'doctor' | 'nurse' | 'staff' | 'admin' | 'technician';
  department: string;
  clinic_id: string;
  salary_base: number;
  salary_frequency: 'monthly' | 'biweekly' | 'weekly';
  hire_date: string;
  status: 'active' | 'on_leave' | 'terminated';
  bank_account?: string;
  tax_id: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  bonus: number;
  deductions: number;
  taxes: number;
  net_salary: number;
  status: 'draft' | 'approved' | 'processed' | 'paid';
  payment_date?: string;
  notes?: string;
}

export interface PayrollDeduction {
  id: string;
  payroll_id: string;
  deduction_type: 'health_insurance' | 'pension' | 'tax' | 'loan' | 'other';
  amount: number;
  description: string;
}

interface PayrollStats {
  totalEmployees: number;
  activeEmployees: number;
  totalMonthlyPayroll: number;
  averageSalary: number;
  pendingPayrolls: number;
}

export const useHRDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all employees
  const getEmployees = useCallback(
    async (status?: 'active' | 'on_leave' | 'terminated'): Promise<Employee[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from('employees').select('*').order('name', { ascending: true });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error: err } = await query;

        if (err) throw err;
        return (data || []) as Employee[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get employees';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create payroll
  const createPayroll = useCallback(
    async (payrollData: Partial<Payroll>): Promise<Payroll | null> => {
      try {
        setLoading(true);
        setError(null);

        // Calculate net salary
        const grossSalary =
          payrollData.base_salary! + payrollData.bonus! + payrollData.overtime_hours! * payrollData.overtime_rate!;
        const totalDeductions = payrollData.taxes! + payrollData.deductions!;
        const netSalary = grossSalary - totalDeductions;

        const { data, error: err } = await supabase
          .from('payrolls')
          .insert({
            ...payrollData,
            net_salary: netSalary,
            status: 'draft',
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'payroll',
          entity_id: data.id,
          action: 'create',
          changed_by: 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Payroll created for employee ${payrollData.employee_id}`,
          severity: 'low',
        });

        return data as Payroll;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create payroll';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get payroll for period
  const getPayrollForPeriod = useCallback(
    async (startDate: string, endDate: string): Promise<Payroll[]> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('payrolls')
          .select('*')
          .gte('period_end', startDate)
          .lte('period_start', endDate)
          .order('period_end', { ascending: false });

        if (err) throw err;
        return (data || []) as Payroll[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get payroll';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Approve payroll
  const approvePayroll = useCallback(
    async (payrollId: string, userId: string = 'system'): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('payrolls')
          .update({ status: 'approved' })
          .eq('id', payrollId);

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'payroll',
          entity_id: payrollId,
          action: 'update',
          changed_by: userId,
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: 'Payroll approved',
          severity: 'low',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to approve payroll';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Process payroll (mark as paid)
  const processPayroll = useCallback(
    async (payrollId: string, userId: string = 'system'): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('payrolls')
          .update({
            status: 'paid',
            payment_date: new Date().toISOString(),
          })
          .eq('id', payrollId);

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'payroll',
          entity_id: payrollId,
          action: 'update',
          changed_by: userId,
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: 'Payroll processed and paid',
          severity: 'medium',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to process payroll';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get HR statistics
  const getHRStats = useCallback(async (): Promise<PayrollStats | null> => {
    try {
      setLoading(true);
      setError(null);

      const { count: totalCount, data: employees } = await supabase
        .from('employees')
        .select('salary_base', { count: 'exact' });

      const { count: activeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: pendingPayrolls, count: pendingCount } = await supabase
        .from('payrolls')
        .select('net_salary', { count: 'exact' })
        .eq('status', 'draft');

      const totalPayroll = (employees || []).reduce((sum, emp) => sum + (emp.salary_base || 0), 0);
      const avgSalary = (employees || []).length > 0 ? totalPayroll / (employees || []).length : 0;

      return {
        totalEmployees: totalCount || 0,
        activeEmployees: activeCount || 0,
        totalMonthlyPayroll: totalPayroll,
        averageSalary: avgSalary,
        pendingPayrolls: pendingCount || 0,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get HR statistics';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add deduction
  const addDeduction = useCallback(
    async (
      payrollId: string,
      deductionType: string,
      amount: number,
      description: string
    ): Promise<PayrollDeduction | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('payroll_deductions')
          .insert({
            payroll_id: payrollId,
            deduction_type: deductionType,
            amount,
            description,
          })
          .select()
          .single();

        if (err) throw err;
        return data as PayrollDeduction;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add deduction';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getEmployees,
    createPayroll,
    getPayrollForPeriod,
    approvePayroll,
    processPayroll,
    getHRStats,
    addDeduction,
  };
};
