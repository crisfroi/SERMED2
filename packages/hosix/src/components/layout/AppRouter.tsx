import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ProtectedRoute } from './ProtectedRoute';

// Pages - lazy loaded for performance
import LoginPage from '@hosix/pages/LoginPage';
import DashboardPage from '@hosix/pages/DashboardPage';
import NotFoundPage from '@hosix/pages/NotFoundPage';

/**
 * HosixRoutes - Exports only Routes (no BrowserRouter)
 * This allows parent app to manage the router at top level
 * Following React Router v6+ best practices for nested routing
 */
export const HosixRoutes = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          {/* More routes will be added here in subsequent modules */}
        </Route>

        {/* Redirect root to login by default */}
        <Route path="" element={<Navigate to="login" />} />

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
};

// Keep AppRouter export for backward compatibility (if needed elsewhere)
export const AppRouter = HosixRoutes;
