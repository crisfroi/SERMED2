-- Permissions helper for dispensar_prescripcion
-- Run this as a privileged user (project owner / psql with service role) in Supabase SQL editor.

-- 1) Ensure function is SECURITY DEFINER (if not already)
ALTER FUNCTION public.dispensar_prescripcion(text, text, uuid, text, numeric, text, text, timestamptz, uuid, numeric, uuid, text, uuid)
  SECURITY DEFINER;

-- 2) Grant execute to the role used by frontend (change 'anon' to the appropriate role if needed)
GRANT EXECUTE ON FUNCTION public.dispensar_prescripcion(text, text, uuid, text, numeric, text, text, timestamptz, uuid, numeric, uuid, text, uuid) TO anon;

-- 3) (Optional) If you prefer to expose via a dedicated role, create role and grant execute
-- CREATE ROLE hosix_rpc_executor;
-- GRANT EXECUTE ON FUNCTION public.dispensar_prescripcion(...) TO hosix_rpc_executor;

-- 4) Notes:
-- - The function owner must have INSERT/UPDATE privileges on target tables.
-- - Do NOT grant direct INSERT/UPDATE on production tables to 'anon'.
-- - If RLS policies refer to auth.uid(), consider using a mechanism to forward the calling user (e.g., set_config and use security definer function to read current_setting).
