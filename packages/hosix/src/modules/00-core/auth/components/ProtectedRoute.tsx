/**
 * @file ProtectedRoute.tsx
 * @module 00-core/auth
 * @description HOSIX - Componente para proteger rutas autenticadas
 * Verifica si el usuario está autenticado antes de permitir acceso
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallbackPath = '/hosix/login',
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg font-semibold text-gray-900">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Role-based access check
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      'admin': 100,
      'doctor': 80,
      'nurse': 60,
      'receptionist': 40,
      'patient': 20,
      'guest': 0,
    };

    const userRoleLevel = roleHierarchy[role || 'guest'] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center space-y-4">
            <div className="text-6xl">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
            <p className="text-gray-600 max-w-md">
              Tu rol ({role}) no tiene los permisos necesarios para acceder a esta página.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver Atrás
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
