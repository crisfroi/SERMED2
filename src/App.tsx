import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProfessionalRegistration from "./pages/ProfessionalRegistration";
import PublicSearch from "./pages/PublicSearch";
import NotFound from "./pages/NotFound";
import SolicitudEstablecimiento from "./pages/SolicitudEstablecimiento";
import DynamicForms from "./pages/DynamicForms";
import PublicForm from "./pages/PublicForm";
import Auth from "./pages/Auth";
import ErrorBoundary from "@/components/ui/error-boundary";
import "./utils/authErrorHandler";
import "./utils/storageCleanup";
import { initResizeObserverErrorHandling } from "./utils/resizeObserverHandler";

// New Hospital System Pages
import HospitalLogin from "./pages/Hospital/HospitalLogin";
import HospitalLayout from "./components/hospital/HospitalLayout";
import HospitalDashboard from "./pages/Hospital/HospitalDashboard";

// ASIS Clinical Modules (lazy-loaded wrappers)
import { lazy, Suspense } from "react";

const ObstetriciaModule = lazy(() => import("./components/ASIS_04_Obstetricia/GestationMonitor"));
const CREDModule = lazy(() => import("./components/ASIS_05_CRED/CREDMonitoringDashboard").catch(() => ({ default: () => <div className="p-4">Módulo CRED - En desarrollo</div> })));
const CirugiaModule = lazy(() => import("./components/ASIS_7_Cirugia/SurgeryScheduler").catch(() => ({ default: () => <div className="p-4">Módulo Cirugía - En desarrollo</div> })));
const DieteticaModule = lazy(() => import("./components/ASIS_8_Dietetica/MealPlanViewer").catch(() => ({ default: () => <div className="p-4">Módulo Dietética - En desarrollo</div> })));
const InmunizacionModule = lazy(() => import("./components/ASIS_08_Inmunizacion/ImmunizationRecordForm").catch(() => ({ default: () => <div className="p-4">Módulo Inmunización - En desarrollo</div> })));
const LaboratorioModule = lazy(() => import("./components/ASIS_08_Laboratorio/LabOrderForm").catch(() => ({ default: () => <div className="p-4">Módulo Laboratorio - En desarrollo</div> })));
const FarmaciaModule = lazy(() => import("./components/ASIS_09_Farmacia/InventoryDashboard").catch(() => ({ default: () => <div className="p-4">Módulo Farmacia - En desarrollo</div> })));
const MedicamentosModule = lazy(() => import("./components/ASIS_10_Medicamentos/MedicationOrderForm").catch(() => ({ default: () => <div className="p-4">Módulo Medicamentos - En desarrollo</div> })));
const ReferenciaModule = lazy(() => import("./components/ASIS_11_Referencia/ReferralDashboard").catch(() => ({ default: () => <div className="p-4">Módulo Referencia - En desarrollo</div> })));
const FarmacoterapiaModule = lazy(() => import("./components/ASIS_12_Farmacoterapia/PharmacotherapyDashboard").catch(() => ({ default: () => <div className="p-4">Módulo Farmacoterapia - En desarrollo</div> })));
const DiagnosticoModule = lazy(() => import("./components/ASIS_14_Diagnostico/DiagnosisForm").catch(() => ({ default: () => <div className="p-4">Módulo Diagnóstico - En desarrollo</div> })));
const ImagenesModule = lazy(() => import("./components/ASIS_15_Imagenes/DicomViewer").catch(() => ({ default: () => <div className="p-4">Módulo Imágenes - En desarrollo</div> })));
const EHRModule = lazy(() => import("./components/ASIS_13_EHR/ElectronicHealthRecordDashboard").catch(() => ({ default: () => <div className="p-4">Módulo HME - En desarrollo</div> })));

// Admin Modules
const HRModule = lazy(() => import("./components/ADMIN_1_HR/HRDashboard").catch(() => ({ default: () => <div className="p-4">Módulo RRHH - En desarrollo</div> })));
const WaitingRoomModule = lazy(() => import("./components/ADMIN_2_WAITING_ROOMS/WaitingRoomDashboard").catch(() => ({ default: () => <div className="p-4">Módulo Salas Espera - En desarrollo</div> })));

// Initialize ResizeObserver error handling
initResizeObserverErrorHandling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    }
  }
});

const ModuleLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
    {children}
  </Suspense>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider defaultRole="SUPER_ADMINISTRADOR">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/old-home" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/register" element={<ProfessionalRegistration />} />
                <Route path="/search" element={<PublicSearch />} />
                <Route path="/solicitud-establecimiento" element={<SolicitudEstablecimiento />} />
                <Route path="/dynamic-forms" element={<DynamicForms />} />
                <Route path="/form/:publicUrl" element={<PublicForm />} />

                {/* Hospital System Routes */}
                <Route path="/hosix/login" element={<HospitalLogin />} />
                <Route path="/hosix" element={<HospitalLayout />}>
                  <Route index element={<HospitalDashboard />} />
                  <Route path="obstetricia" element={<ModuleLoader><ObstetriciaModule /></ModuleLoader>} />
                  <Route path="cred" element={<ModuleLoader><CREDModule /></ModuleLoader>} />
                  <Route path="cirugia" element={<ModuleLoader><CirugiaModule /></ModuleLoader>} />
                  <Route path="dietetica" element={<ModuleLoader><DieteticaModule /></ModuleLoader>} />
                  <Route path="inmunizacion" element={<ModuleLoader><InmunizacionModule /></ModuleLoader>} />
                  <Route path="laboratorio" element={<ModuleLoader><LaboratorioModule /></ModuleLoader>} />
                  <Route path="farmacia" element={<ModuleLoader><FarmaciaModule /></ModuleLoader>} />
                  <Route path="medicamentos" element={<ModuleLoader><MedicamentosModule /></ModuleLoader>} />
                  <Route path="referencia" element={<ModuleLoader><ReferenciaModule /></ModuleLoader>} />
                  <Route path="farmacoterapia" element={<ModuleLoader><FarmacoterapiaModule /></ModuleLoader>} />
                  <Route path="diagnostico" element={<ModuleLoader><DiagnosticoModule /></ModuleLoader>} />
                  <Route path="imagenes" element={<ModuleLoader><ImagenesModule /></ModuleLoader>} />
                  <Route path="ehr" element={<ModuleLoader><EHRModule /></ModuleLoader>} />
                  <Route path="rrhh" element={<ModuleLoader><HRModule /></ModuleLoader>} />
                  <Route path="salas-espera" element={<ModuleLoader><WaitingRoomModule /></ModuleLoader>} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
