/**
 * HOSIX - Module 14: Permission Guard Component
 * Guard componente para proteger rutas basadas en permisos
 */

import React from 'react';
import { useApp } from '@hosix/hooks/shared';
import { usePermissions } from '@hosix/hooks/shared';

export interface PermissionGuardProps {
  requiredPermission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
  permissions?: string[];
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredPermission,
  children,
  fallback = <AccessDenied />,
  requireAll = false,
  permissions,
}) => {
  const { auth } = useApp();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (!auth.isAuthenticated) {
    return fallback;
  }

  // Si se proporciona un array de permisos
  if (permissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(...permissions)
      : hasAnyPermission(...permissions);
    return hasAccess ? <>{children}</> : fallback;
  }

  // Verificar permiso individual
  const hasAccess = hasPermission(requiredPermission);

  return hasAccess ? <>{children}</> : fallback;
};

/**
 * Componente de acceso denegado
 */
export const AccessDenied: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center space-y-4">
      <div className="text-6xl">🔒</div>
      <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
      <p className="text-gray-600">
        No tienes permiso para acceder a esta sección.
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Volver atrás
      </button>
    </div>
  </div>
);

/**
 * HOC para envolver componentes con protección de permisos
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  fallback?: React.ReactNode
): React.FC<P> {
  return (props: P) => (
    <PermissionGuard requiredPermission={permission} fallback={fallback}>
      <Component {...props} />
    </PermissionGuard>
  );
}

export default PermissionGuard;
