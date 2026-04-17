import { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const useAuth = () => {
  const { auth, setAuth } = useApp();
  return { auth, setAuth };
};

export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useApp();
  return { notifications, addNotification, removeNotification, clearNotifications };
};

export const useTheme = () => {
  const { theme, setTheme } = useApp();
  return { theme, setTheme };
};
