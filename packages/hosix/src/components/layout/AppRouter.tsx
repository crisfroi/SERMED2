import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../hooks/useApp';

// Pages - lazy loaded for performance
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRouter = () => {
  const { auth } = useAuth();

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              auth.isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
            }
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* More routes will be added here in subsequent modules */}
          </Route>

          {/* Redirect root to dashboard or login */}
          <Route
            path="/"
            element={<Navigate to={auth.isAuthenticated ? '/dashboard' : '/login'} />}
          />

          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};
