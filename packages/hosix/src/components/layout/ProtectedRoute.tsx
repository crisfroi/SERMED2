import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AppLayout } from './AppLayout';

export const ProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is stored in localStorage
    const hosixUser = localStorage.getItem('hosix_user');
    const hosixToken = localStorage.getItem('hosix_token');
    
    if (hosixUser && hosixToken) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            borderTop: '4px solid #2563eb',
            borderRight: '4px solid transparent',
          }} />
          <p style={{ marginTop: '1rem', color: '#4b5563' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/hosix/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};
