/**
 * @sermed2/shared/services/env.ts
 * Manejo de variables de entorno
 */

export interface EnvConfig {
  API_BASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  VITE_NODE_ENV: string;
}

export function getEnv(): EnvConfig {
  return {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    VITE_NODE_ENV: import.meta.env.MODE || 'development',
  };
}
