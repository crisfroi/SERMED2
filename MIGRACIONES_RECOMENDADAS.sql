-- ============================================================
-- MIGRACIONES RECOMENDADAS - BASADAS EN ANÁLISIS EXHAUSTIVO
-- Generado: 15 Abril 2025
-- Análisis de 28 componentes y 12 tablas identificadas
-- ============================================================

-- INSTRUCCIONES DE EJECUCIÓN:
-- 1. Abre https://app.supabase.com
-- 2. Selecciona proyecto: wdieynendfjbkbhfovrx
-- 3. Ve a SQL Editor > New Query
-- 4. Copia y pega CADA MIGRACIÓN POR SEPARADO
-- 5. Ejecuta y verifica antes de pasar a la siguiente

-- ============================================================
-- [1/4] 001_create_cuadrantes_maestros.sql
-- CRITICIDAD: ALTA | PRIORIDAD: 1 (Pre-requisito)
-- ============================================================

-- Tabla para plantillas reutilizables de cuadrantes
CREATE TABLE IF NOT EXISTS cuadrantes_maestros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  centro_salud_id UUID REFERENCES centros_salud(id) ON DELETE CASCADE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_cuadrantes_maestros_centro_id ON cuadrantes_maestros(centro_salud_id);
CREATE INDEX IF NOT EXISTS idx_cuadrantes_maestros_activo ON cuadrantes_maestros(activo);

-- Alteración para agregar referencia en cuadrantes_biometricos
ALTER TABLE IF EXISTS cuadrantes_biometricos
ADD COLUMN IF NOT EXISTS cuadrante_maestro_id UUID REFERENCES cuadrantes_maestros(id) ON DELETE SET NULL;

-- Índice para la relación
CREATE INDEX IF NOT EXISTS idx_cuadrantes_bio_maestro_id ON cuadrantes_biometricos(cuadrante_maestro_id);

-- RLS Policies
ALTER TABLE cuadrantes_maestros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cuadrantes_maestros_select_policy" ON cuadrantes_maestros
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

CREATE POLICY "cuadrantes_maestros_insert_policy" ON cuadrantes_maestros
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

CREATE POLICY "cuadrantes_maestros_update_policy" ON cuadrantes_maestros
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

CREATE POLICY "cuadrantes_maestros_delete_policy" ON cuadrantes_maestros
  FOR DELETE USING (
    auth.role() = 'service_role'
  );

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_cuadrantes_maestros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cuadrantes_maestros_updated_at
  BEFORE UPDATE ON cuadrantes_maestros
  FOR EACH ROW EXECUTE FUNCTION update_cuadrantes_maestros_updated_at();

-- ============================================================
-- [2/4] 002_create_electronic_health_record.sql
-- CRITICIDAD: MÁXIMA | PRIORIDAD: 1 (BLOQUEADOR ASIS_13)
-- REQUERIMIENTOS: HIPAA-compliant, Auditoría
-- ============================================================

-- Tabla principal de Historia Médica Electrónica
CREATE TABLE IF NOT EXISTS electronic_health_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  hospital_id UUID,
  summary_note TEXT,
  active_problems JSONB DEFAULT '[]'::jsonb, -- Array de diagnósticos ICD-10
  medications_active JSONB DEFAULT '[]'::jsonb, -- Array de medicamentos
  allergies JSONB DEFAULT '[]'::jsonb, -- Array de alergias
  last_summary_updated TIMESTAMPTZ,
  thalamus_synced_at TIMESTAMPTZ,
  thalamus_sync_status VARCHAR(50) DEFAULT 'not_synced' CHECK (thalamus_sync_status IN ('synced', 'syncing', 'failed', 'not_synced')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(patient_id)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_ehr_patient_id ON electronic_health_record(patient_id);
CREATE INDEX IF NOT EXISTS idx_ehr_hospital_id ON electronic_health_record(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ehr_thalamus_status ON electronic_health_record(thalamus_sync_status);
CREATE INDEX IF NOT EXISTS idx_ehr_last_updated ON electronic_health_record(last_summary_updated DESC);

-- RLS Policies (HIPAA-compliant)
ALTER TABLE electronic_health_record ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Solo usuarios autenticados y service_role
CREATE POLICY "ehr_select_policy" ON electronic_health_record
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND 
     EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid()))
  );

-- Política de inserción
CREATE POLICY "ehr_insert_policy" ON electronic_health_record
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND created_by = auth.uid())
  );

-- Política de actualización
CREATE POLICY "ehr_update_policy" ON electronic_health_record
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND created_by = auth.uid())
  );

-- Política de auditoría: Solo service_role puede eliminar
CREATE POLICY "ehr_delete_policy" ON electronic_health_record
  FOR DELETE USING (
    auth.role() = 'service_role'
  );

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_ehr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ehr_updated_at
  BEFORE UPDATE ON electronic_health_record
  FOR EACH ROW EXECUTE FUNCTION update_ehr_updated_at();

-- Tabla de auditoría para HIPAA compliance
CREATE TABLE IF NOT EXISTS electronic_health_record_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
  action VARCHAR(50) CHECK (action IN ('create', 'read', 'update', 'delete')),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  previous_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_ehr_audit_ehr_id ON electronic_health_record_audit(ehr_id);
CREATE INDEX IF NOT EXISTS idx_ehr_audit_changed_at ON electronic_health_record_audit(changed_at DESC);

-- Función de auditoría automática
CREATE OR REPLACE FUNCTION audit_ehr_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO electronic_health_record_audit (ehr_id, action, changed_by, previous_values, new_values)
    VALUES (NEW.id, 'update', auth.uid(), row_to_json(OLD), row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO electronic_health_record_audit (ehr_id, action, changed_by, previous_values)
    VALUES (OLD.id, 'delete', auth.uid(), row_to_json(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ehr_audit
  AFTER UPDATE OR DELETE ON electronic_health_record
  FOR EACH ROW EXECUTE FUNCTION audit_ehr_changes();

-- ============================================================
-- [3/4] 003_create_ehr_episode_links.sql
-- CRITICIDAD: ALTA | PRIORIDAD: 2 (Después de EHR principal)
-- DEPENDENCIAS: electronic_health_record
-- ============================================================

-- Tabla para episodios clínicos vinculados a EHR
CREATE TABLE IF NOT EXISTS ehr_episode_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
  episode_type VARCHAR(50) NOT NULL CHECK (episode_type IN (
    'consultation', 'hospitalization', 'procedure', 'emergency',
    'lab_order', 'imaging_order', 'pharmacy', 'referral', 'surgery',
    'therapy', 'rehabilitation'
  )),
  episode_date TIMESTAMPTZ NOT NULL,
  clinician_name VARCHAR(255),
  clinician_id UUID,
  summary TEXT,
  primary_diagnosis VARCHAR(20), -- ICD-10 code
  secondary_diagnoses JSONB DEFAULT '[]'::jsonb, -- Array de códigos ICD-10
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'pending')),
  outcome VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_ehr_episode_links_ehr_id ON ehr_episode_links(ehr_id);
CREATE INDEX IF NOT EXISTS idx_ehr_episode_links_episode_date ON ehr_episode_links(episode_date DESC);
CREATE INDEX IF NOT EXISTS idx_ehr_episode_links_episode_type ON ehr_episode_links(episode_type);
CREATE INDEX IF NOT EXISTS idx_ehr_episode_links_status ON ehr_episode_links(status);
CREATE INDEX IF NOT EXISTS idx_ehr_episode_links_clinician_id ON ehr_episode_links(clinician_id);

-- RLS Policies
ALTER TABLE ehr_episode_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ehr_episodes_select_policy" ON ehr_episode_links
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND
     EXISTS (SELECT 1 FROM electronic_health_record WHERE id = ehr_id AND created_by = auth.uid()))
  );

CREATE POLICY "ehr_episodes_insert_policy" ON ehr_episode_links
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

CREATE POLICY "ehr_episodes_update_policy" ON ehr_episode_links
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_ehr_episodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ehr_episodes_updated_at
  BEFORE UPDATE ON ehr_episode_links
  FOR EACH ROW EXECUTE FUNCTION update_ehr_episodes_updated_at();

-- ============================================================
-- [4/4] 004_create_ehr_document_storage.sql
-- CRITICIDAD: ALTA | PRIORIDAD: 2 (Después de EHR principal)
-- DEPENDENCIAS: electronic_health_record, Supabase Storage
-- REQUERIMIENTOS: Cifrado, integración Storage
-- ============================================================

-- Tabla para almacenamiento de documentos clínicos
CREATE TABLE IF NOT EXISTS ehr_document_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
    'prescription', 'report', 'imaging', 'lab_result', 'letter',
    'consent', 'discharge_summary', 'diagnostic_image', 'surgical_note',
    'progress_note', 'assessment'
  )),
  document_title VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Ruta en Supabase Storage
  file_size INTEGER, -- Tamaño en bytes
  mime_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  document_date DATE,
  is_encrypted BOOLEAN DEFAULT true,
  encryption_key_id UUID,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  notes TEXT
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_ehr_docs_ehr_id ON ehr_document_storage(ehr_id);
CREATE INDEX IF NOT EXISTS idx_ehr_docs_document_type ON ehr_document_storage(document_type);
CREATE INDEX IF NOT EXISTS idx_ehr_docs_created_at ON ehr_document_storage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ehr_docs_document_date ON ehr_document_storage(document_date DESC);
CREATE INDEX IF NOT EXISTS idx_ehr_docs_is_encrypted ON ehr_document_storage(is_encrypted);

-- RLS Policies
ALTER TABLE ehr_document_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ehr_documents_select_policy" ON ehr_document_storage
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND
     EXISTS (SELECT 1 FROM electronic_health_record WHERE id = ehr_id AND created_by = auth.uid()))
  );

CREATE POLICY "ehr_documents_insert_policy" ON ehr_document_storage
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

CREATE POLICY "ehr_documents_update_policy" ON ehr_document_storage
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

-- Función para actualizar timestamp y audit
CREATE OR REPLACE FUNCTION update_ehr_docs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.last_accessed_at IS NULL THEN
    NEW.last_accessed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ehr_docs_updated_at
  BEFORE UPDATE ON ehr_document_storage
  FOR EACH ROW EXECUTE FUNCTION update_ehr_docs_updated_at();

-- Tabla de auditoría para acceso a documentos (HIPAA)
CREATE TABLE IF NOT EXISTS ehr_document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES ehr_document_storage(id) ON DELETE CASCADE,
  accessed_by UUID REFERENCES auth.users(id),
  accessed_at TIMESTAMPTZ DEFAULT now(),
  action VARCHAR(50) CHECK (action IN ('view', 'download', 'decrypt', 'delete')),
  ip_address INET,
  user_agent TEXT,
  duration_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ehr_doc_access_log_document_id ON ehr_document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_ehr_doc_access_log_accessed_at ON ehr_document_access_log(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ehr_doc_access_log_accessed_by ON ehr_document_access_log(accessed_by);

-- ============================================================
-- POST-INSTALACIÓN: VALIDACIONES Y VERIFICACIONES
-- ============================================================

-- Verificar que las tablas se crearon correctamente
SELECT 
  tablename,
  'OK' AS status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'cuadrantes_maestros',
  'electronic_health_record',
  'ehr_episode_links',
  'ehr_document_storage'
)
ORDER BY tablename;

-- Verificar índices
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'cuadrantes_maestros',
  'electronic_health_record',
  'ehr_episode_links',
  'ehr_document_storage'
)
ORDER BY tablename, indexname;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
-- Si todos los SELECT anteriores devuelven resultados,
-- las migraciones se han ejecutado correctamente.
-- Próximo paso: Ejecutar tests de integración en staging.

