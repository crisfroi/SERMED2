/**
 * @file AppRouter.tsx
 * @module routing
 * @description HOSIX - Enrutador principal de la aplicación
 * Define todas las rutas de la aplicación con protección de autenticación
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@hosix/modules/00-core/auth/components';
import { LoginForm, VerifyTwoFA } from '@hosix/modules/00-core/auth/components';
import { PatientSearch, PatientProfile } from '@hosix/modules/00-core/patients/components';

// Placeholder for future dashboard component
const Dashboard: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard HOSIX</h1>
      <p className="text-gray-600">Bienvenido al sistema de gestión hospitalaria</p>
    </div>
  </div>
);

// Not found page
const NotFound: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
      <a
        href="/hosix/dashboard"
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Volver al Dashboard
      </a>
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes - Not Protected */}
        <Route path="/hosix/login" element={<LoginForm />} />
        <Route path="/hosix/verify-2fa" element={<VerifyTwoFA />} />

        {/* Protected Routes */}
        <Route
          path="/hosix/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Patient Routes */}
        <Route
          path="/hosix/patients"
          element={
            <ProtectedRoute requiredRole="doctor">
              <PatientSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hosix/patients/:patientId"
          element={
            <ProtectedRoute requiredRole="doctor">
              <PatientProfile />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/hosix/dashboard" replace />} />
        <Route path="/hosix" element={<Navigate to="/hosix/dashboard" replace />} />

        {/* Catch all - 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
