-- Permitir subida anónima al bucket fotos-carnet
CREATE POLICY "Permitir subida anónima de fotos-carnet"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos-carnet');

-- Permitir subida anónima al bucket documentos-profesionales
CREATE POLICY "Permitir subida anónima de documentos-profesionales"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos-profesionales');

-- Añadir columna para experiencia laboral en profesionales_sanitarios
ALTER TABLE public.profesionales_sanitarios
ADD COLUMN IF NOT EXISTS experiencia_laboral JSONB DEFAULT '[]'::jsonb;

-- Añadir columna para tipo de profesional (sanitario vs no sanitario)
ALTER TABLE public.profesionales_sanitarios
ADD COLUMN IF NOT EXISTS tipo_profesional TEXT DEFAULT 'sanitario' CHECK (tipo_profesional IN ('sanitario', 'administrativo', 'camillero', 'subalterno', 'odepac', 'otro'));

-- Comentarios descriptivos
COMMENT ON COLUMN public.profesionales_sanitarios.experiencia_laboral IS 'Array JSON con hasta 3 experiencias laborales [{funcion, institucion, periodo}]';
COMMENT ON COLUMN public.profesionales_sanitarios.tipo_profesional IS 'Tipo de profesional: sanitario, administrativo, camillero, subalterno, odepac, otro';