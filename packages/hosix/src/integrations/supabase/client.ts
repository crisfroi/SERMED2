// HOSIX Supabase Client
// This is a separate client for the HOSIX project
// Uses independent credentials from the main Renaprosa project

import { createClient } from '@supabase/supabase-js';

// HOSIX Project Credentials (Independent from Renaprosa)
export const HOSIX_SUPABASE_URL = import.meta.env.VITE_HOSIX_SUPABASE_URL || "https://dfqefbkxounzmtggnfsc.supabase.co";
export const HOSIX_SUPABASE_ANON_KEY = import.meta.env.VITE_HOSIX_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcWVmYmt4b3Vuem10Z2duZnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTA0ODUsImV4cCI6MjA5MTQyNjQ4NX0.bekwHgla4lG7W0RIiSqZoGgq0kSl9h2hxl-SeB7P8tU";

// Validate HOSIX environment variables
if (!HOSIX_SUPABASE_URL) {
  console.error('❌ VITE_HOSIX_SUPABASE_URL is not defined');
  throw new Error('Missing VITE_HOSIX_SUPABASE_URL environment variable');
}

if (!HOSIX_SUPABASE_ANON_KEY) {
  console.error('❌ VITE_HOSIX_SUPABASE_ANON_KEY is not defined');
  throw new Error('Missing VITE_HOSIX_SUPABASE_ANON_KEY environment variable');
}

console.log('✅ HOSIX Supabase client initialized with:', {
  url: HOSIX_SUPABASE_URL,
  hasKey: HOSIX_SUPABASE_ANON_KEY ? 'Yes' : 'No',
  keyLength: HOSIX_SUPABASE_ANON_KEY?.length || 0
});

// Save the original fetch before we override it
const originalFetch = typeof window !== 'undefined' ? window.fetch : fetch;

const resilientFetch: typeof fetch = async (input, init = {}) => {
  const maxAttempts = 3;
  const baseTimeoutMs = 12000;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), baseTimeoutMs * (attempt + 1));
    try {
      const resp = await originalFetch(input, {
        ...init,
        cache: 'no-store',
        keepalive: true,
        signal: controller.signal,
        headers: {
          ...(init.headers || {}),
          'X-Client-Info': 'hosix-health-dashboard',
        },
      });

      clearTimeout(timeout);

      // Detect transient errors
      const isTransient = [429, 502, 503, 504].includes(resp.status);

      if (!resp.ok && isTransient && attempt < maxAttempts - 1) {
        lastError = `HTTP ${resp.status} (transient error)`;
        const delayMs = (attempt + 1) * 1000;
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      return resp;
    } catch (error: any) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delayMs = (attempt + 1) * 1000;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  throw lastError;
};

// Create HOSIX Supabase client
export const hosixSupabase = createClient(
  HOSIX_SUPABASE_URL,
  HOSIX_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      fetch: resilientFetch,
      headers: {
        'X-Client-Info': 'hosix-health-dashboard',
      },
    },
  }
);

export default hosixSupabase;
