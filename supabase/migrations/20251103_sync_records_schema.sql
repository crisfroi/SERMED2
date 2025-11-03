-- Synchronize records table schema with Flask SQLAlchemy model
-- This migration ensures all required columns exist with correct names

BEGIN;

-- Add missing columns to records table if they don't exist
ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS int_out INTEGER;

ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS verify_mode INTEGER;

ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS year INTEGER;

ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS month INTEGER;

ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS day INTEGER;

ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS hour INTEGER;

ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS minute INTEGER;

ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS second INTEGER;

ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS workcode INTEGER;

ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS reserved INTEGER;

-- Ensure temperature is numeric type for better compatibility
ALTER TABLE public.records
ALTER COLUMN temperature TYPE DOUBLE PRECISION USING temperature::DOUBLE PRECISION;

-- Ensure created_at has default timestamp
ALTER TABLE public.records
ALTER COLUMN created_at SET DEFAULT NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_record_enroll_id ON public.records(enroll_id);
CREATE INDEX IF NOT EXISTS idx_record_device_serial ON public.records(device_serial_num);
CREATE INDEX IF NOT EXISTS idx_record_time ON public.records(records_time);

COMMIT;
