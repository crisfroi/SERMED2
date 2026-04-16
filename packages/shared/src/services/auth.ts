/**
 * @sermed2/shared/services/auth.ts
 * Servicios de autenticación
 */

import { supabase, supabaseAuth } from './supabaseClient.js';
import { api } from './apiClient.js';
import type { User, AuthState } from '../types/index.js';

/**
 * Autenticarse via Edge Function
 */
export async function loginViaEdgeFunction(
  username: string,
  password: string
): Promise<{ user: User; token: string } | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hosix-auth-login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ username, password }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    const data = await response.json();
    return {
      user: data.user,
      token: data.token,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Verificar permisos via Edge Function
 */
export async function checkPermissions(
  userId: string,
  requiredPermission: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hosix-permisos-check`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userId, permission: requiredPermission }),
      }
    );

    const data = await response.json();
    return data.hasPermission || false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Obtener usuario actual desde Supabase
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await supabaseAuth.getCurrentUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username || '',
      firstName: user.user_metadata?.firstName,
      lastName: user.user_metadata?.lastName,
      avatar: user.user_metadata?.avatar,
      role: user.user_metadata?.role || 'guest',
      permissions: user.user_metadata?.permissions || [],
      createdAt: user.created_at || new Date().toISOString(),
      lastLogin: user.last_sign_in_at,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Hacer logout
 */
export async function logout(): Promise<void> {
  try {
    await supabaseAuth.signOut();
    localStorage.removeItem('authToken');
    localStorage.removeItem('authState');
  } catch (error) {
    console.error('Logout error:', error);
  }
}
