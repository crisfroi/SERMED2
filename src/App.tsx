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

// New Hospital System
import HospitalLogin from "./pages/Hospital/HospitalLogin";
import HospitalLayout from "./components/hospital/HospitalLayout";
import HospitalDashboard from "./pages/Hospital/HospitalDashboard";

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

// Simple placeholder for modules not yet wired
const ModulePlaceholder = ({ name }: { name: string }) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-2">{name}</h2>
    <p className="text-muted-foreground">Módulo en desarrollo. Los componentes ASIS están disponibles en src/components/.</p>
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
                <Route path="/" element={<Home />} />
                <Route path="/old-home" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/register" element={<ProfessionalRegistration />} />
                <Route path="/search" element={<PublicSearch />} />
                <Route path="/solicitud-establecimiento" element={<SolicitudEstablecimiento />} />
                <Route path="/dynamic-forms" element={<DynamicForms />} />
                <Route path="/form/:publicUrl" element={<PublicForm />} />

                {/* Hospital System */}
                <Route path="/hosix/login" element={<HospitalLogin />} />
                <Route path="/hosix" element={<HospitalLayout />}>
                  <Route index element={<HospitalDashboard />} />
                  <Route path="obstetricia" element={<ModulePlaceholder name="Obstetricia (ASIS 4)" />} />
                  <Route path="cred" element={<ModulePlaceholder name="CRED (ASIS 5)" />} />
                  <Route path="cirugia" element={<ModulePlaceholder name="Cirugía (ASIS 7)" />} />
                  <Route path="dietetica" element={<ModulePlaceholder name="Dietética (ASIS 8)" />} />
                  <Route path="inmunizacion" element={<ModulePlaceholder name="Inmunización (ASIS 8)" />} />
                  <Route path="laboratorio" element={<ModulePlaceholder name="Laboratorio (ASIS 8/10)" />} />
                  <Route path="farmacia" element={<ModulePlaceholder name="Farmacia (ASIS 9)" />} />
                  <Route path="medicamentos" element={<ModulePlaceholder name="Medicamentos (ASIS 10)" />} />
                  <Route path="referencia" element={<ModulePlaceholder name="Referencia (ASIS 11)" />} />
                  <Route path="farmacoterapia" element={<ModulePlaceholder name="Farmacoterapia (ASIS 12)" />} />
                  <Route path="diagnostico" element={<ModulePlaceholder name="Diagnóstico (ASIS 14)" />} />
                  <Route path="imagenes" element={<ModulePlaceholder name="Imágenes (ASIS 15)" />} />
                  <Route path="ehr" element={<ModulePlaceholder name="Historia Clínica Electrónica (ASIS 13)" />} />
                  <Route path="rrhh" element={<ModulePlaceholder name="Recursos Humanos (ADMIN 1)" />} />
                  <Route path="salas-espera" element={<ModulePlaceholder name="Salas de Espera (ADMIN 2)" />} />
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
