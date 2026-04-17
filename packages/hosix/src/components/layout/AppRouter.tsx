import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@hosix/hooks/shared/useApp';

// Pages - lazy loaded for performance
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * HosixRoutes - Exports only Routes (no BrowserRouter)
 * This allows parent app to manage the router at top level
 * Following React Router v6+ best practices for nested routing
 */
export const HosixRoutes = () => {
  const { auth } = useAuth();

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route
          path="login"
          element={
            auth.isAuthenticated ? <Navigate to="dashboard" /> : <LoginPage />
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          {/* More routes will be added here in subsequent modules */}
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route
          path=""
          element={<Navigate to={auth.isAuthenticated ? 'dashboard' : 'login'} />}
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
};

// Keep AppRouter export for backward compatibility (if needed elsewhere)
export const AppRouter = HosixRoutes;
