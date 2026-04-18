/**
 * HOSIX - Module 14: usePermissions Hook
 * Hook para verificar permisos del usuario actual
 */

import { useApp } from '@hosix/hooks/shared';
import { checkPermissions } from '@sermed2/shared/services/auth';

export function usePermissions() {
  const { auth } = useApp();

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  const hasPermission = (permission: string): boolean => {
    if (!auth?.user) return false;
    return auth.user.permissions?.includes(permission) || false;
  };

  /**
   * Verificar si el usuario tiene al menos uno de los permisos
   */
  const hasAnyPermission = (...permissions: string[]): boolean => {
    if (!auth?.user) return false;
    return permissions.some(p => auth.user.permissions?.includes(p));
  };

  /**
   * Verificar si el usuario tiene todos los permisos
   */
  const hasAllPermissions = (...permissions: string[]): boolean => {
    if (!auth?.user) return false;
    return permissions.every(p => auth.user.permissions?.includes(p));
  };

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = (role: string): boolean => {
    if (!auth?.user) return false;
    return auth.user.role === role;
  };

  /**
   * Verificar si el usuario es administrador
   */
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  /**
   * Verificar si el usuario es doctor
   */
  const isDoctor = (): boolean => {
    return hasRole('doctor');
  };

  /**
   * Verificar si el usuario es paciente
   */
  const isPatient = (): boolean => {
    return hasRole('patient');
  };

  /**
   * Verificar si el usuario es staff
   */
  const isStaff = (): boolean => {
    return hasRole('staff');
  };

  /**
   * Obtener los permisos del usuario
   */
  const getPermissions = (): string[] => {
    return auth?.user?.permissions || [];
  };

  /**
   * Obtener el rol del usuario
   */
  const getRole = (): string => {
    return auth?.user?.role || 'guest';
  };

  /**
   * Verificar si el usuario está autenticado
   */
  const isAuthenticated = (): boolean => {
    return auth?.isAuthenticated || false;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isDoctor,
    isPatient,
    isStaff,
    getPermissions,
    getRole,
    isAuthenticated,
  };
}

export default usePermissions;
