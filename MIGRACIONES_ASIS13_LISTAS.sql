# 🗄️ MIGRACIONES SQL HOSIX - SOLO ASIS_13 (Electronic Health Record)

**Fecha:** 15 de Abril, 2026  
**Scope:** HOSIX únicamente (cuadrantes biométricos = RENAPROSA)  
**Status:** ✅ READY FOR SUPABASE  

---

## 📋 RESUMEN

3 tablas CRÍTICAS para ASIS_13:
1. `electronic_health_record` - Historia médica del paciente
2. `ehr_episode_links` - Episodios clínicos vinculados
3. `ehr_document_storage` - Almacenamiento de documentos médicos

---

## 🔴 TABLE 1: electronic_health_record (CRÍTICA)

```sql
-- Migration: supabase/migrations/20260415_001_electronic_health_record.sql

CREATE TABLE IF NOT EXISTS electronic_health_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identidad
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  
  -- Contenido Clínico (HIPAA)
  summary_note TEXT,
  active_problems JSONB DEFAULT '[]'::jsonb,
  medications_active JSONB DEFAULT '[]'::jsonb,
  allergies JSONB DEFAULT '[]'::jsonb,
  
  -- Integración GNU Health / THALAMUS
  thalamus_patient_id VARCHAR(50) UNIQUE,
  thalamus_synced_at TIMESTAMP WITH TIME ZONE,
  thalamus_sync_status VARCHAR(30) DEFAULT 'pending',
  thalamus_last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditoría
  audit_trail JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_thalamus_status 
    CHECK (thalamus_sync_status IN ('pending', 'syncing', 'synced', 'failed'))
);

-- Índices
CREATE INDEX idx_ehr_patient_id ON electronic_health_record(patient_id);
CREATE INDEX idx_ehr_hospital_id ON electronic_health_record(hospital_id);
CREATE INDEX idx_ehr_thalamus_patient ON electronic_health_record(thalamus_patient_id);
CREATE INDEX idx_ehr_created_at ON electronic_health_record(created_at DESC);
CREATE INDEX idx_ehr_deleted_at ON electronic_health_record(deleted_at);

-- RLS Policies (HIPAA-Compliant)
ALTER TABLE electronic_health_record ENABLE ROW LEVEL SECURITY;

-- Doctors view records
CREATE POLICY "view_hospital_records"
  ON electronic_health_record
  FOR SELECT
  USING (hospital_id IS NOT NULL);

-- Admins update records
CREATE POLICY "admins_update_records"
  ON electronic_health_record
  FOR UPDATE
  USING (hospital_id IS NOT NULL);

-- Trigger: Update timestamp
CREATE TRIGGER update_electronic_health_record_timestamp
  BEFORE UPDATE ON electronic_health_record
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Grants
GRANT SELECT, INSERT, UPDATE ON electronic_health_record TO service_role;
```

---

## TABLE 2: ehr_episode_links

```sql
-- Migration: supabase/migrations/20260415_002_ehr_episode_links.sql

CREATE TABLE IF NOT EXISTS ehr_episode_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
  episode_type VARCHAR(50) NOT NULL,
  related_id UUID,
  
  -- Episode metadata
  episode_date_start DATE NOT NULL,
  episode_date_end DATE,
  episode_description TEXT,
  
  -- Diagnosis codes (ICD-10)
  icd_10_codes JSONB DEFAULT '[]'::jsonb,
  
  -- Clinical context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_episode_type 
    CHECK (episode_type IN ('hospitalization', 'appointment', 'consult', 'procedure', 'surgery', 'emergency'))
);

-- Índices
CREATE INDEX idx_ehr_episode_ehr_id ON ehr_episode_links(ehr_id);
CREATE INDEX idx_ehr_episode_type ON ehr_episode_links(episode_type);
CREATE INDEX idx_ehr_episode_date_start ON ehr_episode_links(episode_date_start DESC);
CREATE INDEX idx_ehr_episode_deleted_at ON ehr_episode_links(deleted_at);

-- RLS Policies
ALTER TABLE ehr_episode_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_episodes"
  ON ehr_episode_links
  FOR SELECT
  USING (
    ehr_id IN (
      SELECT id FROM electronic_health_record 
      WHERE hospital_id IS NOT NULL
    )
  );

-- Trigger: Update timestamp
CREATE TRIGGER update_ehr_episode_links_timestamp
  BEFORE UPDATE ON ehr_episode_links
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

GRANT SELECT, INSERT, UPDATE ON ehr_episode_links TO service_role;
```

---

## TABLE 3: ehr_document_storage

```sql
-- Migration: supabase/migrations/20260415_003_ehr_document_storage.sql

CREATE TABLE IF NOT EXISTS ehr_document_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES ehr_episode_links(id) ON DELETE SET NULL,
  
  -- Document metadata
  document_type VARCHAR(100) NOT NULL,
  document_title VARCHAR(500),
  document_description TEXT,
  
  -- File storage
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes INT,
  file_mime_type VARCHAR(100),
  
  -- Document content (for indexing)
  document_content_text TEXT,
  
  -- Digital signatures
  signed_by UUID,
  signature_timestamp TIMESTAMP WITH TIME ZONE,
  signature_valid BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_document_type 
    CHECK (document_type IN ('lab_result', 'prescription', 'discharge', 'imaging', 'report', 'consultation', 'procedure', 'consent'))
);

-- Índices
CREATE INDEX idx_ehr_doc_ehr_id ON ehr_document_storage(ehr_id);
CREATE INDEX idx_ehr_doc_episode_id ON ehr_document_storage(episode_id);
CREATE INDEX idx_ehr_doc_type ON ehr_document_storage(document_type);
CREATE INDEX idx_ehr_doc_created_at ON ehr_document_storage(created_at DESC);
CREATE INDEX idx_ehr_doc_deleted_at ON ehr_document_storage(deleted_at);

-- Full-text search
CREATE INDEX idx_ehr_doc_content_fts 
  ON ehr_document_storage 
  USING GIN (to_tsvector('spanish', COALESCE(document_content_text, '')));

-- RLS Policies
ALTER TABLE ehr_document_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_documents"
  ON ehr_document_storage
  FOR SELECT
  USING (
    ehr_id IN (
      SELECT id FROM electronic_health_record 
      WHERE hospital_id IS NOT NULL
    )
  );

CREATE POLICY "users_delete_own_documents"
  ON ehr_document_storage
  FOR DELETE
  USING (created_by IS NOT NULL);

-- Trigger: Update timestamp
CREATE TRIGGER update_ehr_document_storage_timestamp
  BEFORE UPDATE ON ehr_document_storage
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

GRANT SELECT, INSERT, UPDATE, DELETE ON ehr_document_storage TO service_role;
```

---

## ✅ HELPER FUNCTIONS (si no existen)

```sql
-- Archivo: supabase/migrations/20260415_004_helper_functions.sql

-- Si no existe, crear:
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 DEPLOYMENT CHECKLIST

```
ANTES:
[ ] Backup Supabase completo
[ ] Leer las 3 tablas SQL arriba
[ ] Entender que cuadrantes_maestros NO está incluido (= RENAPROSA)

PASO 1: Staging
[ ] Copiar SQL de TABLE 1
[ ] Ir a Supabase UI → SQL Editor (staging)
[ ] Ejecutar
[ ] Verificar: SELECT COUNT(*) FROM electronic_health_record;

[ ] Copiar SQL de TABLE 2
[ ] Ejecutar
[ ] Verificar: SELECT COUNT(*) FROM ehr_episode_links;

[ ] Copiar SQL de TABLE 3
[ ] Ejecutar
[ ] Verificar: SELECT COUNT(*) FROM ehr_document_storage;

[ ] Copiar HELPER FUNCTIONS
[ ] Ejecutar

PASO 2: Validación
[ ] Revisar que RLS policies están creadas
[ ] Revisar que índices existen
[ ] Revisar que triggers funcionan

PASO 3: Producción
[ ] Backup de producción (double-check)
[ ] Repetir PASO 1 en producción
[ ] Monitorear 30 minutos
[ ] Notificar team
```

---

## 🔄 VALIDACIÓN FINAL

```sql
-- Query de validación (ejecutar después de deployment):

SELECT 'electronic_health_record' as table_name, COUNT(*) as row_count
FROM electronic_health_record
UNION ALL
SELECT 'ehr_episode_links' as table_name, COUNT(*) as row_count
FROM ehr_episode_links
UNION ALL
SELECT 'ehr_document_storage' as table_name, COUNT(*) as row_count
FROM ehr_document_storage;

-- Debe retornar 3 filas (aunque sean 0 registros, las tablas deben existir)
```

---

**Status:** ✅ LISTOS PARA COPIAR-PEGAR EN SUPABASE  
**Próximo paso:** Resolver build error + luego FDW para RENAPROSA integration
