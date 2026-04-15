// @ts-nocheck
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
import { lazy, Suspense } from "react";

// Hospital System
import HospitalLogin from "./pages/Hospital/HospitalLogin";
import HospitalLayout from "./components/hospital/HospitalLayout";
import HospitalDashboard from "./pages/Hospital/HospitalDashboard";

// ASIS Clinical Modules (lazy loaded)
const ObstetriciaModule = lazy(() => import("./pages/Hospital/modules/ObstetriciaModule"));
const CREDModule = lazy(() => import("./pages/Hospital/modules/CREDModule"));
const CirugiaModule = lazy(() => import("./pages/Hospital/modules/CirugiaModule"));
const DieteticaModule = lazy(() => import("./pages/Hospital/modules/DieteticaModule"));
const InmunizacionModule = lazy(() => import("./pages/Hospital/modules/InmunizacionModule"));
const LaboratorioModule = lazy(() => import("./pages/Hospital/modules/LaboratorioModule"));
const FarmaciaModule = lazy(() => import("./pages/Hospital/modules/FarmaciaModule"));
const MedicamentosModule = lazy(() => import("./pages/Hospital/modules/MedicamentosModule"));
const ReferenciaModule = lazy(() => import("./pages/Hospital/modules/ReferenciaModule"));
const FarmacoterapiaModule = lazy(() => import("./pages/Hospital/modules/FarmacoterapiaModule"));
const DiagnosticoModule = lazy(() => import("./pages/Hospital/modules/DiagnosticoModule"));
const ImagenesModule = lazy(() => import("./pages/Hospital/modules/ImagenesModule"));
const EHRModule = lazy(() => import("./pages/Hospital/modules/EHRModule"));
const RRHHModule = lazy(() => import("./pages/Hospital/modules/RRHHModule"));
const SalasEsperaModule = lazy(() => import("./pages/Hospital/modules/SalasEsperaModule"));

initResizeObserverErrorHandling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: { retry: 1 },
  }
});

const Loading = () => (
  <div className="flex items-center justify-center p-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
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
                {/* RENAPROSA - Professional Registry */}
                <Route path="/" element={<Home />} />
                <Route path="/old-home" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/register" element={<ProfessionalRegistration />} />
                <Route path="/search" element={<PublicSearch />} />
                <Route path="/solicitud-establecimiento" element={<SolicitudEstablecimiento />} />
                <Route path="/dynamic-forms" element={<DynamicForms />} />
                <Route path="/form/:publicUrl" element={<PublicForm />} />

                {/* HOSIX - Hospital Management System (separate Supabase project) */}
                <Route path="/hosix/login" element={<HospitalLogin />} />
                <Route path="/hosix" element={<HospitalLayout />}>
                  <Route index element={<HospitalDashboard />} />
                  <Route path="obstetricia" element={<Suspense fallback={<Loading />}><ObstetriciaModule /></Suspense>} />
                  <Route path="cred" element={<Suspense fallback={<Loading />}><CREDModule /></Suspense>} />
                  <Route path="cirugia" element={<Suspense fallback={<Loading />}><CirugiaModule /></Suspense>} />
                  <Route path="dietetica" element={<Suspense fallback={<Loading />}><DieteticaModule /></Suspense>} />
                  <Route path="inmunizacion" element={<Suspense fallback={<Loading />}><InmunizacionModule /></Suspense>} />
                  <Route path="laboratorio" element={<Suspense fallback={<Loading />}><LaboratorioModule /></Suspense>} />
                  <Route path="farmacia" element={<Suspense fallback={<Loading />}><FarmaciaModule /></Suspense>} />
                  <Route path="medicamentos" element={<Suspense fallback={<Loading />}><MedicamentosModule /></Suspense>} />
                  <Route path="referencia" element={<Suspense fallback={<Loading />}><ReferenciaModule /></Suspense>} />
                  <Route path="farmacoterapia" element={<Suspense fallback={<Loading />}><FarmacoterapiaModule /></Suspense>} />
                  <Route path="diagnostico" element={<Suspense fallback={<Loading />}><DiagnosticoModule /></Suspense>} />
                  <Route path="imagenes" element={<Suspense fallback={<Loading />}><ImagenesModule /></Suspense>} />
                  <Route path="ehr" element={<Suspense fallback={<Loading />}><EHRModule /></Suspense>} />
                  <Route path="rrhh" element={<Suspense fallback={<Loading />}><RRHHModule /></Suspense>} />
                  <Route path="salas-espera" element={<Suspense fallback={<Loading />}><SalasEsperaModule /></Suspense>} />
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
