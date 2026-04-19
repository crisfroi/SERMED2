/**
 * @hosix/services/auth.ts
 * Servicios de autenticación específicos para HOSIX
 * Usa credenciales y URL de HOSIX, no de Renaprosa
 */

import type { User } from '../types/index.js';

/**
 * Autenticarse via Edge Function (HOSIX)
 * Usa las credenciales y URL específicas de HOSIX
 */
export async function loginViaHosixEdgeFunction(
  username: string,
  password: string
): Promise<{ user: User } | null> {
  try {
    const hosixUrl = import.meta.env.VITE_HOSIX_SUPABASE_URL;
    const hosixKey = import.meta.env.VITE_HOSIX_SUPABASE_ANON_KEY;

    if (!hosixUrl || !hosixKey) {
      throw new Error('HOSIX Supabase credentials not configured');
    }

    console.log('🔐 HOSIX Login - Using URL:', hosixUrl);

    const response = await fetch(
      `${hosixUrl}/functions/v1/hosix-auth-login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hosixKey}`,
        },
        body: JSON.stringify({ username, password }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ HOSIX Authentication failed:', error);
      throw new Error(error.message || 'Authentication failed');
    }

    const data = await response.json();
    console.log('✅ HOSIX Authentication successful for:', username);

    return {
      user: data.user,
    };
  } catch (error) {
    console.error('❌ HOSIX Authentication error:', error);
    return null;
  }
}

/**
 * Obtener usuario actual de HOSIX
 */
export async function getCurrentHosixUser(): Promise<User | null> {
  try {
    const userStr = localStorage.getItem('hosix_user');
    if (!userStr) {
      return null;
    }

    // El usuario está guardado como JSON en localStorage
    const userData = JSON.parse(userStr);
    return userData as User;
  } catch (error) {
    console.error('Error getting current HOSIX user:', error);
    return null;
  }
}

/**
 * Logout de HOSIX
 */
export async function logoutFromHosix(): Promise<void> {
  localStorage.removeItem('hosix_token');
  localStorage.removeItem('hosix_user');
  localStorage.removeItem('authToken'); // Limpiar también la clave antigua por seguridad
  console.log('✅ HOSIX logout successful');
}
