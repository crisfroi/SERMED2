/**
 * @file src/lib/supabase.ts
 * @description Re-export Supabase client for backward compatibility
 * This file exists to support both import paths:
 * - import { supabase } from '@/lib/supabase'
 * - import { supabase } from '@/services/supabaseClient'
 */

export { supabase, supabaseAdmin } from '@/services/supabaseClient';
