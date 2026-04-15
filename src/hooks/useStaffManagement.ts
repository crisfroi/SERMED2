// @ts-nocheck
// WEEK 11 ADMIN 1: Custom Hooks
// Hook: useStaffManagement
// Purpose: CRUD operations on staff_records
// Currency: XAF (Francos CFA)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export interface Staff {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  position_id: string;
  department_id: string;
  hire_date: string;
  contract_type: string;
  employment_status: 'activo' | 'licencia' | 'suspendido' | 'jubilado';
  base_salary_xaf: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateStaffInput {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  identification_number: string;
  position_id: string;
  department_id: string;
  hire_date: string;
  contract_type: string;
  base_salary_xaf: number;
}

interface UseStaffManagementReturn {
  // Queries
  allStaff: Staff[] | undefined;
  staffLoading: boolean;
  staffError: Error | null;
  staffById: (id: string) => Staff | undefined;
  staffByDepartment: (deptId: string) => Staff[];
  activeStaff: Staff[];
  searchStaff: (term: string) => Staff[];

  // Mutations
  createStaff: (data: CreateStaffInput) => Promise<Staff>;
  updateStaff: (id: string, data: Partial<CreateStaffInput>) => Promise<Staff>;
  deleteStaff: (id: string) => Promise<void>;
  changeEmploymentStatus: (id: string, status: string) => Promise<void>;

  // State
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createError: Error | null;
  updateError: Error | null;
}

export const useStaffManagement = (): UseStaffManagementReturn => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all staff
  const { data: allStaff, isLoading: staffLoading, error: staffError } = useQuery<Staff[]>({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const response = await fetch('/api/v1/hr/staff', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Create Staff Mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateStaffInput) => {
      const response = await fetch('/api/v1/hr/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create staff');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
  });

  // Update Staff Mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateStaffInput>;
    }) => {
      const response = await fetch(`/api/v1/hr/staff/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update staff');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
  });

  // Delete Staff Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/hr/staff/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete staff');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
  });

  // Change Employment Status Mutation
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const response = await fetch(`/api/v1/hr/staff/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ employment_status: status }),
      });
      if (!response.ok) throw new Error('Failed to update employment status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
  });

  // Helper functions
  const staffById = (id: string): Staff | undefined => {
    return (allStaff || []).find((s) => s.id === id);
  };

  const staffByDepartment = (deptId: string): Staff[] => {
    return (allStaff || []).filter((s) => s.department_id === deptId);
  };

  const activeStaff = (allStaff || []).filter((s) => s.employment_status === 'activo');

  const searchStaff = (term: string): Staff[] => {
    const lower = term.toLowerCase();
    return (allStaff || []).filter(
      (s) =>
        s.full_name.toLowerCase().includes(lower) ||
        s.employee_id.includes(term) ||
        s.email.toLowerCase().includes(lower)
    );
  };

  return {
    // Queries
    allStaff,
    staffLoading,
    staffError: staffError as Error | null,
    staffById,
    staffByDepartment,
    activeStaff,
    searchStaff,

    // Mutations
    createStaff: (data) => createMutation.mutateAsync(data),
    updateStaff: (id, data) =>
      updateMutation.mutateAsync({ id, data }),
    deleteStaff: (id) => deleteMutation.mutateAsync(id),
    changeEmploymentStatus: (id, status) =>
      statusMutation.mutateAsync({ id, status }),

    // State
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error as Error | null,
    updateError: updateMutation.error as Error | null,
  };
};

export default useStaffManagement;
