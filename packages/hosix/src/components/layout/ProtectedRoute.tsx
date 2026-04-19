import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { AppLayout } from './AppLayout';
import { useApp } from '@hosix/hooks/shared';
import { mapHosixApiUserToContextUser } from '@hosix/utils/mapHosixApiUserToContextUser';

function hasValidHosixUser(): boolean {
  const raw = localStorage.getItem('hosix_user');
  if (!raw) return false;
  try {
    const u = JSON.parse(raw) as Record<string, unknown>;
    return Boolean(u && (u.id || u.email || u.username));
  } catch {
    return false;
  }
}

export const ProtectedRoute = () => {
  const { auth, setAuth } = useApp();

  // Tras F5 o pestaña nueva: rellenar AppContext desde `hosix_user` (el login ya lo hace en submit).
  useEffect(() => {
    if (auth.isLoading) return;
    if (!hasValidHosixUser()) return;
    try {
      const raw = localStorage.getItem('hosix_user');
      if (!raw) return;
      const apiUser = JSON.parse(raw) as Record<string, unknown>;
      const mapped = mapHosixApiUserToContextUser(apiUser);
      if (!auth.isAuthenticated || auth.user?.id !== mapped.id) {
        setAuth({
          user: mapped,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch {
      /* ignore JSON corrupto */
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user?.id, setAuth]);

  // Hosix: no usar JWT de sesión en localStorage; acceso según usuario guardado tras login (Supabase se llama con anon key del env).
  const isAuthenticated = useMemo(() => {
    return hasValidHosixUser();
  }, [auth?.isAuthenticated]);

  if (auth?.isLoading) {
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
