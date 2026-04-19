/**
 * useAuth Hook - Acceso simple al contexto de autenticación
 * Este hook proporciona acceso a la información de autenticación actual
 * y funciones de login/logout desde cualquier componente.
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

export default useAuth;
