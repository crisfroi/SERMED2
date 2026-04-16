/**
 * HOSIX - Module 14: RoleBasedRoute Component
 * Componente para proteger rutas basadas en roles
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { usePermissions } from '@/hooks/usePermissions';

export interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = '/login',
}) => {
  const { auth } = useApp();
  const { hasRole, isAuthenticated } = usePermissions();

  if (!isAuthenticated()) {
    return <Navigate to={fallbackPath} replace />;
  }

  const hasAccess = allowedRoles.some(role => hasRole(role));

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
          <p className="text-gray-600">
            Tu rol actual ({auth?.user?.role}) no tiene acceso a esta sección.
          </p>
          <p className="text-sm text-gray-500">
            Roles permitidos: {allowedRoles.join(', ')}
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
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
