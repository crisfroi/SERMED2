import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRoute } from '@hosix/components/auth/RoleBasedRoute';
import { BILLING_ROLE_STRINGS, CLINICAL_ROLE_STRINGS } from '@hosix/config/hosixMenu';

import LoginPage from '@hosix/pages/LoginPage';
import DashboardPage from '@hosix/pages/DashboardPage';
import NotFoundPage from '@hosix/pages/NotFoundPage';
import ModulePlaceholderPage from '@hosix/pages/ModulePlaceholderPage';
import PatientsListPage from '@hosix/pages/PatientsListPage';
import PatientDetailPage from '@hosix/pages/PatientDetailPage';
import AppointmentsListPage from '@hosix/pages/AppointmentsListPage';
import OrdersListPage from '@hosix/pages/OrdersListPage';
import ClinicalLayout from '@hosix/pages/clinical/ClinicalLayout';
import ClinicalHubPage from '@hosix/pages/clinical/ClinicalHubPage';
import ClinicalObstetricsPage from '@hosix/pages/clinical/ClinicalObstetricsPage';
import ClinicalPediatricsPage from '@hosix/pages/clinical/ClinicalPediatricsPage';
import ClinicalLaboratoryPage from '@hosix/pages/clinical/ClinicalLaboratoryPage';
import ClinicalPharmacyPage from '@hosix/pages/clinical/ClinicalPharmacyPage';

/**
 * HosixRoutes - Exports only Routes (no BrowserRouter)
 * This allows parent app to manage the router at top level
 * Following React Router v6+ best practices for nested routing
 */
export const HosixRoutes = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="patients" element={<PatientsListPage />} />
          <Route path="patients/:patientId" element={<PatientDetailPage />} />
          <Route path="appointments" element={<AppointmentsListPage />} />
          <Route path="orders" element={<OrdersListPage />} />

          <Route
            path="clinical"
            element={
              <RoleBasedRoute allowedRoles={CLINICAL_ROLE_STRINGS}>
                <ClinicalLayout />
              </RoleBasedRoute>
            }
          >
            <Route index element={<ClinicalHubPage />} />
            <Route path="obstetricia" element={<ClinicalObstetricsPage />} />
            <Route path="pediatria" element={<ClinicalPediatricsPage />} />
            <Route path="laboratorio" element={<ClinicalLaboratoryPage />} />
            <Route path="farmacia" element={<ClinicalPharmacyPage />} />
          </Route>

          <Route
            path="billing"
            element={
              <RoleBasedRoute allowedRoles={BILLING_ROLE_STRINGS}>
                <ModulePlaceholderPage
                  title="Facturación y cobros"
                  description="Tarifas, cuentas de paciente y cobranza."
                  trytonRefs={['tryton/health_insurance', 'tryton/health_services']}
                />
              </RoleBasedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ModulePlaceholderPage
                title="Reportes e indicadores"
                description="Cuadros de mando, reportes regulatorios y exportación."
                trytonRefs={['tryton/health_reporting']}
              />
            }
          />
        </Route>

        <Route path="" element={<Navigate to="login" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
};

export const AppRouter = HosixRoutes;
