import { createContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { User, AuthState, Notification } from '../types';

interface AppContextType {
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
  currentFacility?: string;
  setCurrentFacility: (facility: string) => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const [currentFacility, setCurrentFacility] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  // Load auth from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('authState');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuth({
          ...parsed,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error parsing auth state:', error);
        setAuth((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuth((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Persist auth to localStorage
  useEffect(() => {
    if (!auth.isLoading) {
      localStorage.setItem('authState', JSON.stringify({
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        error: auth.error,
      }));
    }
  }, [auth]);

  const addNotification = useCallback((notification: Notification) => {
    const id = notification.id || Date.now().toString();
    const newNotif = { ...notification, id };
    setNotifications((prev) => [...prev, newNotif]);

    if (notification.duration !== -1) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleSetTheme = useCallback((newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }, []);

  const value: AppContextType = {
    auth,
    setAuth,
    currentFacility,
    setCurrentFacility,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    theme,
    setTheme: handleSetTheme,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
