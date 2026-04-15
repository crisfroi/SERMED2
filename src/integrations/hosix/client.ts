/**
 * HOSIX Supabase Client
 * Separate Supabase project for hospital management (HOSIX)
 * RENAPROSA project ref: wdieynendfjbkbhfovrx (professional registry)
 * HOSIX project ref: dfqefbkxounzmtggnfsc (hospital management)
 */
import { createClient } from '@supabase/supabase-js';

const HOSIX_URL = 'https://dfqefbkxounzmtggnfsc.supabase.co';
const HOSIX_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcWVmYmt4b3Vuem10Z2duZnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTA0ODUsImV4cCI6MjA5MTQyNjQ4NX0.bekwHgla4lG7W0RIiSqZoGgq0kSl9h2hxl-SeB7P8tU';

export const hosixClient = createClient(HOSIX_URL, HOSIX_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'hosix.auth.token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: { 'X-Client-Info': 'hosix-hospital-system' },
  },
  db: { schema: 'public' },
});

export const HOSIX_PROJECT_REF = 'dfqefbkxounzmtggnfsc';

// Auth helpers for HOSIX
export const hosixAuth = {
  signIn: (email: string, password: string) =>
    hosixClient.auth.signInWithPassword({ email, password }),
  signOut: () => hosixClient.auth.signOut(),
  getUser: () => hosixClient.auth.getUser(),
  getSession: () => hosixClient.auth.getSession(),
  onAuthStateChange: (callback: Parameters<typeof hosixClient.auth.onAuthStateChange>[0]) =>
    hosixClient.auth.onAuthStateChange(callback),
};
