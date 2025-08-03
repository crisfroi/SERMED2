// Configuración optimizada para conexiones lentas (Guinea Ecuatorial -> Supabase)
export const SLOW_CONNECTION_CONFIG = {
  // Timeouts más largos para latencia alta
  queries: {
    // Tiempo antes de considerar una query como fallida
    timeout: 30000, // 30 segundos (era 8s)
    
    // Tiempo antes de refetch automático
    staleTime: 10 * 60 * 1000, // 10 minutos (era 0)
    
    // Tiempo que los datos permanecen en cache
    cacheTime: 15 * 60 * 1000, // 15 minutos
    
    // Reintento más agresivo
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    
    // No refetch automáticamente
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    
    // Configuración de red
    networkMode: 'online', // Solo cuando hay red
  },
  
  // Configuración para mutations
  mutations: {
    timeout: 45000, // 45 segundos para operaciones de escritura
    retry: 2,
    retryDelay: 2000,
  }
};

// Configuración específica para hooks problemáticos
export const PROBLEMATIC_HOOKS_CONFIG = {
  // Para useEstadisticasAvanzadas
  estadisticasAvanzadas: {
    timeout: 60000, // 1 minuto
    staleTime: 5 * 60 * 1000, // 5 minutos sin refetch
    retry: 5, // Más reintentos
    enabled: true, // Siempre habilitado
  },
  
  // Para useSupabaseConnectivity  
  connectivity: {
    timeout: 15000, // 15 segundos
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 3,
  },
  
  // Para useEstadisticasTest
  test: {
    timeout: 20000, // 20 segundos
    staleTime: 30 * 1000, // 30 segundos
    retry: 2,
  }
};

// Helper para aplicar configuración según el tipo de query
export const getQueryConfig = (queryType: keyof typeof PROBLEMATIC_HOOKS_CONFIG) => {
  return {
    ...SLOW_CONNECTION_CONFIG.queries,
    ...PROBLEMATIC_HOOKS_CONFIG[queryType]
  };
};

// Configuración para el QueryClient principal
export const getSlowConnectionQueryClient = () => {
  return {
    defaultOptions: {
      queries: SLOW_CONNECTION_CONFIG.queries,
      mutations: SLOW_CONNECTION_CONFIG.mutations,
    },
  };
};
