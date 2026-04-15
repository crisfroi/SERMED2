import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * HospitalContext
 * 
 * Gestiona datos globales compartidos:
 * - Hospital actual (si es HOSIX)
 * - Departamento/Servicio actual
 * - Usuario del sistema y su rol
 * - Datos relacionados del hospital
 * 
 * Se integra con:
 * - RENAPROSA: Para datos de profesionales
 * - HOSIX: Para datos del hospital y servicios
 */

export interface HospitalContextType {
  // Hospital/Sistema principal
  currentHospital: {
    id: string;
    nombre: string;
    codigo?: string;
    tipo?: 'hosix' | 'renaprosa' | 'admin';
  } | null;
  
  // Departamento/Servicio actual
  currentDepartment: {
    id: string;
    nombre: string;
    codigo?: string;
  } | null;
  
  // Usuario actual (puede venir de AuthContext o enriquecerse aquí)
  currentUser: {
    id: string;
    email: string;
    nombre?: string;
    rol?: string;
    hospitalId?: string;
  } | null;
  
  // Profesionales disponibles (RENAPROSA integration)
  professionals: Array<{
    id: string;
    nombre: string;
    licencia: string;
    especialidad?: string;
  }>;
  
  // Métodos
  setCurrentHospital: (hospital: HospitalContextType['currentHospital']) => void;
  setCurrentDepartment: (dept: HospitalContextType['currentDepartment']) => void;
  loadProfessionalsFromRENAPROSA: (hospitalId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

interface HospitalProviderProps {
  children: ReactNode;
}

export function HospitalProvider({ children }: HospitalProviderProps) {
  const { user } = useAuth();
  const [currentHospital, setCurrentHospital] = useState<HospitalContextType['currentHospital']>(null);
  const [currentDepartment, setCurrentDepartment] = useState<HospitalContextType['currentDepartment']>(null);
  const [professionals, setProfessionals] = useState<HospitalContextType['professionals']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar datos del usuario
  useEffect(() => {
    if (user) {
      // Aquí puedes cargar datos iniciales del hospital del usuario
      // Por ejemplo, si el usuario está asociado a un hospital específico
      const initializeUserHospital = async () => {
        try {
          setLoading(true);
          
          // Buscar hospital del usuario (si existe en metadata)
          // const userData = await supabase
          //   .from('usuarios')
          //   .select('hospital_id')
          //   .eq('id', user.id)
          //   .single();
          
          // Por ahora, solo inicializar el contexto vacío
          setError(null);
        } catch (err: any) {
          setError(err.message || 'Error inicializando hospital context');
          console.error('Error en HospitalProvider:', err);
        } finally {
          setLoading(false);
        }
      };

      initializeUserHospital();
    }
  }, [user]);

  /**
   * Carga profesionales desde RENAPROSA para un hospital específico
   * 
   * Usa edge function para consultar proyecto RENAPROSA sin redundancia
   * Alternativas:
   * - Webhook si RENAPROSA notifica cambios
   * - FDW si bases de datos en misma org
   * - HTTP request a API de RENAPROSA
   */
  const loadProfessionalsFromRENAPROSA = async (hospitalId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Opción 1: Usar edge function como intermediario
      const { data, error: fnError } = await supabase.functions.invoke(
        'get-renaprosa-professionals',
        {
          body: {
            hospital_id: hospitalId,
            // Parámetros adicionales según necesidad
          },
        }
      );

      if (fnError) throw fnError;

      setProfessionals(data?.professionals || []);
    } catch (err: any) {
      const errorMsg = err.message || 'Error cargando profesionales de RENAPROSA';
      setError(errorMsg);
      console.error('Error en loadProfessionalsFromRENAPROSA:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HospitalContext.Provider
      value={{
        currentHospital,
        currentDepartment,
        currentUser: user ? {
          id: user.id,
          email: user.email || '',
          nombre: user.user_metadata?.nombre,
          rol: user.user_metadata?.rol,
        } : null,
        professionals,
        setCurrentHospital,
        setCurrentDepartment,
        loadProfessionalsFromRENAPROSA,
        loading,
        error,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (context === undefined) {
    throw new Error('useHospital debe usarse dentro de HospitalProvider');
  }
  return context;
}

export default HospitalContext;
