// Optimizador de conexión Supabase para conexiones lentas desde África
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_OPTIMIZATION_CONFIG = {
  // Configuración optimizada para conexiones intercontinentales
  db: {
    schema: 'public',
  },
  auth: {
    // Aumentar timeouts para auth
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Deshabilitar para mejorar rendimiento
    flowType: 'pkce',
  },
  global: {
    // Headers optimizados
    headers: {
      'x-client-info': 'supabase-js-web',
      'Cache-Control': 'max-age=300', // Cache por 5 minutos
    },
  },
  // Configuración de fetch optimizada
  fetch: (url: string, options: any) => {
    return fetch(url, {
      ...options,
      // Timeout más largo para requests
      signal: AbortSignal.timeout(60000), // 60 segundos
      // Headers adicionales para optimización
      headers: {
        ...options.headers,
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=60, max=1000',
      },
    });
  },
};

// Cliente Supabase optimizado para conexiones lentas
export const createOptimizedSupabaseClient = (url: string, key: string) => {
  return createClient(url, key, SUPABASE_OPTIMIZATION_CONFIG);
};

// Utilidades para manejar timeouts y reintentos
export class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager;
  private connectionStatus: 'idle' | 'connecting' | 'connected' | 'error' = 'idle';
  private lastConnectionTest: Date | null = null;
  private connectionSpeed: 'fast' | 'medium' | 'slow' | 'unknown' = 'unknown';

  static getInstance(): SupabaseConnectionManager {
    if (!SupabaseConnectionManager.instance) {
      SupabaseConnectionManager.instance = new SupabaseConnectionManager();
    }
    return SupabaseConnectionManager.instance;
  }

  // Test de velocidad de conexión
  async testConnectionSpeed(supabaseUrl: string, apiKey: string): Promise<'fast' | 'medium' | 'slow'> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(10000) // 10 segundos máximo
      });
      
      const duration = performance.now() - startTime;
      
      if (duration < 500) return 'fast';
      if (duration < 2000) return 'medium';
      return 'slow';
      
    } catch (error) {
      console.warn('Connection speed test failed:', error);
      return 'slow'; // Asumir conexión lenta si falla
    }
  }

  // Configuración dinámica basada en velocidad de conexión
  getOptimalQueryConfig(connectionSpeed: 'fast' | 'medium' | 'slow') {
    switch (connectionSpeed) {
      case 'fast':
        return {
          timeout: 10000,
          staleTime: 2 * 60 * 1000,
          retry: 2,
        };
      case 'medium':
        return {
          timeout: 30000,
          staleTime: 5 * 60 * 1000,
          retry: 3,
        };
      case 'slow':
        return {
          timeout: 60000, // 1 minuto
          staleTime: 15 * 60 * 1000, // 15 minutos
          retry: 5,
          retryDelay: (attemptIndex: number) => Math.min(2000 * 2 ** attemptIndex, 10000),
        };
    }
  }

  // Wrapper para queries con manejo automático de timeout
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // No reintentar errores de autenticación
        if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
          throw error;
        }
        
        // Esperar antes del siguiente intento
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Intento ${attempt + 1} falló, reintentando en ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  // Health check con información detallada
  async performHealthCheck(supabaseUrl: string, apiKey: string) {
    const startTime = performance.now();
    this.connectionStatus = 'connecting';
    
    try {
      // Test 1: Basic connectivity
      const basicResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(15000)
      });
      
      const basicDuration = performance.now() - startTime;
      
      if (!basicResponse.ok) {
        throw new Error(`HTTP ${basicResponse.status}: ${basicResponse.statusText}`);
      }
      
      // Test 2: Simple query test
      const queryStart = performance.now();
      const queryResponse = await fetch(`${supabaseUrl}/rest/v1/profesionales_sanitarios?select=id&limit=1`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(20000)
      });
      
      const queryDuration = performance.now() - queryStart;
      const totalDuration = performance.now() - startTime;
      
      // Determinar velocidad de conexión
      this.connectionSpeed = this.determineConnectionSpeed(basicDuration, queryDuration);
      this.connectionStatus = 'connected';
      this.lastConnectionTest = new Date();
      
      return {
        status: 'success',
        basicLatency: Math.round(basicDuration),
        queryLatency: Math.round(queryDuration),
        totalDuration: Math.round(totalDuration),
        connectionSpeed: this.connectionSpeed,
        timestamp: this.lastConnectionTest,
        recommendations: this.getRecommendations(this.connectionSpeed, basicDuration)
      };
      
    } catch (error: any) {
      this.connectionStatus = 'error';
      
      return {
        status: 'error',
        error: error.message,
        duration: Math.round(performance.now() - startTime),
        connectionSpeed: 'slow',
        recommendations: [
          'Verificar configuraciones de Supabase',
          'Aumentar Max request duration en Supabase',
          'Considerar cambiar región del proyecto',
          'Usar datos mock mientras se resuelve'
        ]
      };
    }
  }

  private determineConnectionSpeed(basicLatency: number, queryLatency: number): 'fast' | 'medium' | 'slow' {
    const avgLatency = (basicLatency + queryLatency) / 2;
    
    if (avgLatency < 300) return 'fast';
    if (avgLatency < 1500) return 'medium';
    return 'slow';
  }

  private getRecommendations(speed: 'fast' | 'medium' | 'slow', latency: number): string[] {
    const recommendations: string[] = [];
    
    if (speed === 'slow') {
      recommendations.push('🌍 Conexión intercontinental detectada');
      recommendations.push('⚙️ Aumentar Max request duration en Supabase a 60s');
      recommendations.push('🔄 Habilitar cache agresivo (15+ minutos)');
      recommendations.push('📍 Considerar proyecto en región EU (más cerca de África)');
    }
    
    if (latency > 1000) {
      recommendations.push('⏱️ Latencia alta detectada (>1s)');
      recommendations.push('💾 Usar datos locales cuando sea posible');
      recommendations.push('🔁 Configurar reintentos automáticos');
    }
    
    return recommendations;
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      speed: this.connectionSpeed,
      lastTest: this.lastConnectionTest
    };
  }
}

export default SupabaseConnectionManager;
