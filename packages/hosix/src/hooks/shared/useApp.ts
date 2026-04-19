import { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { AuthContext, useAuth as useAuthContext } from '@/contexts/AuthContext';

/**
 * useApp Hook - Acceso a información general de la aplicación
 * Proporciona contexto de hospital, usuario y configuración global
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

/**
 * useAuth Hook - Acceso a información de autenticación
 */
export const useAuth = () => {
  try {
    return useAuthContext();
  } catch (error) {
    // Si no está en AuthProvider, intenta desde AppContext
    const { auth, setAuth } = useApp();
    return { auth, setAuth };
  }
};

/**
 * useNotifications Hook - Acceso a sistema de notificaciones
 */
export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useApp();
  return { notifications, addNotification, removeNotification, clearNotifications };
};

/**
 * useTheme Hook - Acceso a configuración de tema
 */
export const useTheme = () => {
  const { theme, setTheme } = useApp();
  return { theme, setTheme };
};
