/**
 * usePermissions Hook - Acceso a permisos del usuario actual
 * Verifica si el usuario actual tiene permisos para realizar ciertas acciones
 */

import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const auth = useAuth();

  const hasPermission = (table: string, action: string): boolean => {
    if (!auth?.permissions) return false;
    return auth.permissions.some(p => p.table === table && p.action === action);
  };

  const isAuthenticated = (): boolean => !!auth?.user;

  const hasRole = (requiredRole: string): boolean => {
    if (!auth?.role) return false;
    const roleHierarchy: Record<string, number> = {
      'admin': 100,
      'doctor': 80,
      'nurse': 60,
      'receptionist': 40,
      'patient': 20,
      'guest': 0,
    };
    return (roleHierarchy[auth.role] || 0) >= (roleHierarchy[requiredRole] || 0);
  };

  return {
    permissions: auth?.permissions || [],
    role: auth?.role,
    user: auth?.user,
    isAuthenticated,
    hasPermission: (table: string, action: string) => hasPermission(table, action),
    hasRole,
    canSelect: (table: string) => hasPermission(table, 'SELECT'),
    canInsert: (table: string) => hasPermission(table, 'INSERT'),
    canUpdate: (table: string) => hasPermission(table, 'UPDATE'),
    canDelete: (table: string) => hasPermission(table, 'DELETE'),
  };
};

export default usePermissions;
