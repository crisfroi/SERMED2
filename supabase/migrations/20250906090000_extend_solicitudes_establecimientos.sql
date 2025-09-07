-- Add numero_solicitud column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'solicitudes_establecimientos' 
      AND column_name = 'numero_solicitud'
  ) THEN
    ALTER TABLE public.solicitudes_establecimientos
      ADD COLUMN numero_solicitud TEXT UNIQUE;
  END IF;
END $$;

-- Relax and recreate check constraint for estado_solicitud to include additional statuses
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.solicitudes_establecimientos'::regclass
    AND contype = 'c'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.solicitudes_establecimientos DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE public.solicitudes_establecimientos
    ADD CONSTRAINT solicitudes_establecimientos_estado_chk
    CHECK (estado_solicitud IN (
      'Recibida',
      'Revisando Expediente',
      'En Revisión',
      'Pendiente de Firma',
      'Aprobada',
      'Rechazada',
      'Requiere Información'
    ));
END $$;
