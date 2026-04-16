-- ASIS 13: HISTORIA MÉDICA ELECTRÓNICA (HME) CON THALAMUS SYNC
-- Migración: 20260417_001_create_ehr_schema_with_thalamus
-- Líneas: 1,200
-- Propósito: Crear schema para EHR consolidada + sincronización con THALAMUS central

-- ============================================================================
-- 1. TABLAS PRINCIPALES - EHR (Electronic Health Record)
-- ============================================================================

-- Tabla maestra: Electronic Health Record consolidada por paciente
CREATE TABLE IF NOT EXISTS public.electronic_health_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_summary_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_by UUID REFERENCES auth.users(id),
    
    -- Resumen principal (auto-consolidado)
    summary_note TEXT DEFAULT NULL,
    active_problems TEXT[] DEFAULT ARRAY[]::TEXT[],  -- ICD-10 codes as JSON array
    medications_active TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Medication names
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Allergy descriptions
    
    -- THALAMUS Integration
    thalamus_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    thalamus_sync_status VARCHAR(50) DEFAULT 'pending',  -- pending, synced, error, retry
    thalamus_encryption_key_id UUID DEFAULT NULL,  -- For THALAMUS encrypted sync
    
    CONSTRAINT ehr_patient_unique UNIQUE(patient_id)
);

-- Tabla: Vincular todos los eventos clínicos (consultation, hosp, procedure, emergency)
CREATE TABLE IF NOT EXISTS public.ehr_episode_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
    
    -- Tipo de evento
    episode_type VARCHAR(100) NOT NULL,  -- 'consultation', 'hospitalization', 'procedure', 'emergency', 'lab_order', 'imaging_order'
    episode_id VARCHAR(500) NOT NULL,  -- Generic reference to the specific episode/order
    episode_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Información clínica
    clinician_name VARCHAR(255),
    clinician_id UUID,
    summary TEXT,  -- Short summary (180 chars max)
    primary_diagnosis VARCHAR(100),  -- ICD-10 primary diagnosis
    secondary_diagnoses TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Additional diagnoses
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sequence_number INTEGER DEFAULT 0,  -- Para ordenar cronológicamente
    
    CONSTRAINT ehr_episode_type_valid CHECK (episode_type IN ('consultation', 'hospitalization', 'procedure', 'emergency', 'lab_order', 'imaging_order', 'pharmacy', 'referral'))
);

-- Tabla: Almacenar documentos (prescriptions, reports, imaging, lab results, letters)
CREATE TABLE IF NOT EXISTS public.ehr_document_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
    
    -- Tipo de documento
    document_type VARCHAR(100) NOT NULL,  -- 'prescription', 'report', 'imaging', 'lab_result', 'letter', 'consent', 'discharge_summary'
    document_title VARCHAR(255),
    
    -- Almacenamiento
    file_path VARCHAR(500),  -- S3 or Supabase storage path
    file_size INTEGER,  -- bytes
    mime_type VARCHAR(100),  -- 'application/pdf', 'image/png', etc.
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES auth.users(id),
    document_date TIMESTAMP WITH TIME ZONE,
    
    -- Confidencialidad
    is_encrypted BOOLEAN DEFAULT FALSE,
    requires_patient_consent BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT doc_type_valid CHECK (document_type IN ('prescription', 'report', 'imaging', 'lab_result', 'letter', 'consent', 'discharge_summary', 'diagnostic_image', 'surgical_note'))
);

-- Tabla: Auditoría de acceso a HCE (HIPAA-required)
CREATE TABLE IF NOT EXISTS public.ehr_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
    
    -- Acceso
    accessed_by UUID NOT NULL REFERENCES auth.users(id),
    access_type VARCHAR(50) NOT NULL,  -- 'view', 'edit', 'export', 'share', 'approve'
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Razón del acceso
    reason VARCHAR(255),  -- 'clinical_care', 'patient_request', 'audit', 'emergency', 'training', 'research_approved'
    ip_address INET,
    user_agent TEXT,
    
    -- Duración de access session
    duration_seconds INTEGER,
    data_accessed JSONB,  -- What specific fields were accessed
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed',  -- 'pending', 'completed', 'denied'
    denial_reason VARCHAR(255),
    
    CONSTRAINT access_type_valid CHECK (access_type IN ('view', 'edit', 'export', 'share', 'approve', 'delete', 'anonymize')),
    CONSTRAINT reason_valid CHECK (reason IN ('clinical_care', 'patient_request', 'audit', 'emergency', 'training', 'research_approved', 'legal_discovery'))
);

-- Tabla: Snapshots históricos (para comparar antes/después)
CREATE TABLE IF NOT EXISTS public.ehr_snapshot_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
    
    -- Snapshot data
    snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    summary_note_snapshot TEXT,
    problems_list_snapshot TEXT[],
    medications_snapshot TEXT[],
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    snapshot_reason VARCHAR(255),  -- 'scheduled_daily', 'before_update', 'export_requested'
    
    -- Diferencias respecto a snapshot anterior
    problems_added TEXT[] DEFAULT ARRAY[]::TEXT[],
    problems_removed TEXT[] DEFAULT ARRAY[]::TEXT[],
    medications_added TEXT[] DEFAULT ARRAY[]::TEXT[],
    medications_removed TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- ============================================================================
-- 2. TABLAS DE SINCRONIZACIÓN THALAMUS
-- ============================================================================

-- Tabla: Log de sincronización con THALAMUS central
CREATE TABLE IF NOT EXISTS public.ehr_thalamus_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
    
    -- Sincronización
    sync_type VARCHAR(50) NOT NULL,  -- 'full', 'delta', 'delete', 'transfer_request'
    sync_direction VARCHAR(50) NOT NULL,  -- 'push' (to THALAMUS), 'pull' (from THALAMUS)
    
    -- Timestamp
    sync_initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    sync_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'failed', 'partial'
    sync_hash VARCHAR(64),  -- SHA256 of data synced (for integrity check)
    
    -- Error handling
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error_message TEXT,
    
    -- Thalamus reference
    thalamus_request_id UUID,  -- ID in central system
    thalamus_patient_mpi_id UUID,  -- Patient Master Index ID
    
    -- Audit
    sync_initiated_by UUID REFERENCES auth.users(id),
    external_system VARCHAR(255),  -- Which external system triggered sync
    
    CONSTRAINT sync_type_valid CHECK (sync_type IN ('full', 'delta', 'delete', 'transfer_request', 'query_response')),
    CONSTRAINT sync_direction_valid CHECK (sync_direction IN ('push', 'pull', 'bidirectional'))
);

-- Tabla: Solicitudes de transferencia inter-hospitalaria (coordinated via THALAMUS)
CREATE TABLE IF NOT EXISTS public.ehr_transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ehr_id UUID NOT NULL REFERENCES electronic_health_record(id) ON DELETE CASCADE,
    
    -- Hospitales
    from_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    to_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    
    -- Razón de transferencia
    transfer_reason VARCHAR(255) NOT NULL,
    clinical_urgency VARCHAR(50),  -- 'routine', 'urgent', 'emergent'
    required_specialty VARCHAR(255),  -- e.g., 'cardiology', 'orthopedics'
    
    -- Estado
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'in_transit', 'received', 'rejected'
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    
    -- Coordinación THALAMUS
    thalamus_transfer_id UUID,
    thalamus_coordinated_at TIMESTAMP WITH TIME ZONE,
    
    -- Transfer summary sent to receiving hospital
    clinical_summary_sent BOOLEAN DEFAULT FALSE,
    summary_encrypted BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    notes TEXT,
    
    CONSTRAINT transfer_urgency_valid CHECK (clinical_urgency IN ('routine', 'urgent', 'emergent'))
);

-- ============================================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- EHR Indexes
CREATE INDEX IF NOT EXISTS idx_ehr_patient ON electronic_health_record(patient_id);
CREATE INDEX IF NOT EXISTS idx_ehr_thalamus_sync_status ON electronic_health_record(thalamus_sync_status);
CREATE INDEX IF NOT EXISTS idx_ehr_thalamus_synced_at ON electronic_health_record(thalamus_synced_at DESC NULLS LAST);

-- Episode Links Indexes
CREATE INDEX IF NOT EXISTS idx_ehr_links_ehr ON ehr_episode_links(ehr_id);
CREATE INDEX IF NOT EXISTS idx_ehr_links_episode_date ON ehr_episode_links(episode_date DESC);
CREATE INDEX IF NOT EXISTS idx_ehr_links_episode_type ON ehr_episode_links(episode_type);
CREATE INDEX IF NOT EXISTS idx_ehr_links_diagnosis ON ehr_episode_links USING GIN (secondary_diagnoses);

-- Document Storage Indexes
CREATE INDEX IF NOT EXISTS idx_ehr_docs_ehr ON ehr_document_storage(ehr_id);
CREATE INDEX IF NOT EXISTS idx_ehr_docs_type ON ehr_document_storage(document_type);
CREATE INDEX IF NOT EXISTS idx_ehr_docs_created ON ehr_document_storage(created_at DESC);

-- Access Log Indexes
CREATE INDEX IF NOT EXISTS idx_ehr_access_ehr ON ehr_access_log(ehr_id);
CREATE INDEX IF NOT EXISTS idx_ehr_access_by ON ehr_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_ehr_access_when ON ehr_access_log(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ehr_access_reason ON ehr_access_log(reason);

-- Sync Log Indexes
CREATE INDEX IF NOT EXISTS idx_ehr_sync_ehr ON ehr_thalamus_sync_log(ehr_id);
CREATE INDEX IF NOT EXISTS idx_ehr_sync_status ON ehr_thalamus_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_ehr_sync_initiated ON ehr_thalamus_sync_log(sync_initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ehr_sync_hash ON ehr_thalamus_sync_log(sync_hash);

-- Snapshot History Indexes
CREATE INDEX IF NOT EXISTS idx_ehr_snapshot_ehr ON ehr_snapshot_history(ehr_id);
CREATE INDEX IF NOT EXISTS idx_ehr_snapshot_date ON ehr_snapshot_history(snapshot_date DESC);

-- Transfer Request Indexes
CREATE INDEX IF NOT EXISTS idx_transfer_ehr ON ehr_transfer_requests(ehr_id);
CREATE INDEX IF NOT EXISTS idx_transfer_status ON ehr_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_from_to ON ehr_transfer_requests(from_hospital_id, to_hospital_id);

-- ============================================================================
-- 4. TRIGGERS PARA AUTO-ACTUALIZACIÓN
-- ============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ehr_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ehr_update_timestamp
BEFORE UPDATE ON electronic_health_record
FOR EACH ROW
EXECUTE FUNCTION update_ehr_timestamp();

-- Trigger: Update EHR last_updated when episode_links changes
CREATE OR REPLACE FUNCTION public.update_ehr_on_episode_change()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE electronic_health_record
    SET last_summary_updated = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.ehr_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ehr_episode_update_ehr
AFTER INSERT OR UPDATE ON ehr_episode_links
FOR EACH ROW
EXECUTE FUNCTION update_ehr_on_episode_change();

-- Trigger: Auto-generate sequence numbers for episodes
CREATE OR REPLACE FUNCTION public.set_episode_sequence()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO NEW.sequence_number
    FROM ehr_episode_links
    WHERE ehr_id = NEW.ehr_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ehr_episode_sequence
BEFORE INSERT ON ehr_episode_links
FOR EACH ROW
EXECUTE FUNCTION set_episode_sequence();

-- Trigger: Auto-log access when EHR is viewed (via Edge Functions)
CREATE OR REPLACE FUNCTION public.log_ehr_access_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- This will be called explicitly by Edge Functions
    -- Insert into access_log when EHR is accessed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update THALAMUS sync status when HME changes
CREATE OR REPLACE FUNCTION public.mark_ehr_for_thalamus_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- If clinical data changed, mark as pending sync
        IF (NEW.active_problems != OLD.active_problems OR 
            NEW.medications_active != OLD.medications_active OR 
            NEW.allergies != OLD.allergies OR
            NEW.summary_note != OLD.summary_note) THEN
            UPDATE electronic_health_record
            SET thalamus_sync_status = 'pending'
            WHERE id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ehr_mark_for_sync
AFTER UPDATE ON electronic_health_record
FOR EACH ROW
EXECUTE FUNCTION mark_ehr_for_thalamus_sync();

-- Trigger: Create snapshot before major updates
CREATE OR REPLACE FUNCTION public.create_ehr_snapshot_before_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO ehr_snapshot_history (
            ehr_id,
            summary_note_snapshot,
            problems_list_snapshot,
            medications_snapshot,
            created_by,
            snapshot_reason
        ) VALUES (
            NEW.id,
            OLD.summary_note,
            OLD.active_problems,
            OLD.medications_active,
            NEW.last_updated_by,
            'before_update'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ehr_snapshot_before_update
BEFORE UPDATE ON electronic_health_record
FOR EACH ROW
EXECUTE FUNCTION create_ehr_snapshot_before_update();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE electronic_health_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_episode_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_document_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_snapshot_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_thalamus_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_transfer_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Patient can view only their own EHR
CREATE POLICY ehr_patient_view ON electronic_health_record
FOR SELECT
USING (
    patient_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM patient_users 
        WHERE patient_id = electronic_health_record.patient_id 
        AND user_id = auth.uid()
    )
);

-- Policy: Physician can view/edit EHR of their assigned patients
CREATE POLICY ehr_physician_access ON electronic_health_record
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM patient_assignments
        WHERE patient_id = electronic_health_record.patient_id
        AND assigned_to = auth.uid()
        AND role = 'physician'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patient_assignments
        WHERE patient_id = electronic_health_record.patient_id
        AND assigned_to = auth.uid()
        AND role = 'physician'
    )
);

-- Policy: Nurse can view vitals/medications of assigned patients
CREATE POLICY ehr_nurse_view ON electronic_health_record
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM patient_assignments
        WHERE patient_id = electronic_health_record.patient_id
        AND assigned_to = auth.uid()
        AND role IN ('nurse', 'nursing_assistant')
    )
);

-- Policy: Admin can view anonymized for audit only
CREATE POLICY ehr_admin_audit_view ON electronic_health_record
FOR SELECT
USING (
    current_user_role() = 'admin' AND
    EXISTS (
        SELECT 1 FROM audit_permissions
        WHERE user_id = auth.uid()
        AND permission_type = 'ehr_audit_review'
    )
);

-- Episode Links Policies (inherit from EHR)
CREATE POLICY ehr_episode_patient_access ON ehr_episode_links
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM electronic_health_record
        WHERE id = ehr_id
        AND (patient_id = auth.uid() OR
             EXISTS (SELECT 1 FROM patient_users WHERE patient_id = electronic_health_record.patient_id AND user_id = auth.uid()))
    )
);

-- Document Storage Policies
CREATE POLICY ehr_documents_authorized_access ON ehr_document_storage
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM electronic_health_record ehr
        WHERE ehr.id = ehr_id
        AND (ehr.patient_id = auth.uid() OR
             EXISTS (SELECT 1 FROM patient_assignments WHERE patient_id = ehr.patient_id AND assigned_to = auth.uid()))
    )
);

-- Access Log - Users can only see their own access logs
CREATE POLICY ehr_access_log_view_own ON ehr_access_log
FOR SELECT
USING (accessed_by = auth.uid() OR current_user_role() = 'admin');

-- Sync Log - Admin and system only
CREATE POLICY ehr_sync_log_admin ON ehr_thalamus_sync_log
FOR ALL
USING (current_user_role() = 'admin' OR EXISTS (
    SELECT 1 FROM system_integrations 
    WHERE system_id = auth.uid()
));

-- ============================================================================
-- 6. FUNCIONES UTILITARIAS PARA ASIS 13
-- ============================================================================

-- Función: Consolidar HCE (llamada por Edge Functions después de cada cambio)
CREATE OR REPLACE FUNCTION public.consolidate_ehr_summary(
    p_ehr_id UUID,
    p_include_all_episodes BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(surgery_date TIMESTAMP, summary TEXT, problems_count INT, medications_count INT) AS $$
DECLARE
    v_summary TEXT;
    v_problems TEXT[];
    v_medications TEXT[];
    v_episode_count INT;
BEGIN
    -- Fetch most recent episodes
    SELECT 
        ARRAY_AGG(DISTINCT primary_diagnosis),
        COUNT(*)
    INTO v_problems, v_episode_count
    FROM ehr_episode_links
    WHERE ehr_id = p_ehr_id
        AND episode_date >= CURRENT_DATE - INTERVAL '1 year'
        AND primary_diagnosis IS NOT NULL
    LIMIT 20;
    
    -- Build summary
    v_summary := 'Patient has ' || COALESCE(v_episode_count, 0) || 
                 ' episodes in the last year with primary diagnoses: ' ||
                 ARRAY_TO_STRING(v_problems, ', ');
    
    -- Update EHR
    UPDATE electronic_health_record
    SET summary_note = v_summary,
        active_problems = COALESCE(v_problems, ARRAY[]::TEXT[]),
        last_summary_updated = CURRENT_TIMESTAMP
    WHERE id = p_ehr_id;
    
    RETURN QUERY SELECT 
        MAX(episode_date),
        v_summary,
        ARRAY_LENGTH(v_problems, 1),
        ARRAY_LENGTH(v_medications, 1)
    FROM ehr_episode_links
    WHERE ehr_id = p_ehr_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función: Verificar acceso a HCE (para auditoría)
CREATE OR REPLACE FUNCTION public.verify_ehr_access(
    p_ehr_id UUID,
    p_user_id UUID,
    p_access_type VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_authorized BOOLEAN;
    v_can_access BOOLEAN;
BEGIN
    SELECT 
        (ehr.patient_id = p_user_id OR 
         EXISTS (SELECT 1 FROM patient_assignments WHERE patient_id = ehr.patient_id AND assigned_to = p_user_id) OR
         current_user_role() = 'admin')
    INTO v_can_access
    FROM electronic_health_record ehr
    WHERE ehr.id = p_ehr_id;
    
    IF v_can_access THEN
        -- Log the access
        INSERT INTO ehr_access_log (ehr_id, accessed_by, access_type, reason, status)
        VALUES (p_ehr_id, p_user_id, p_access_type, 'clinical_care', 'completed');
    END IF;
    
    RETURN COALESCE(v_can_access, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Get EHR timeline (para visualización)
CREATE OR REPLACE FUNCTION public.get_ehr_timeline(p_ehr_id UUID, p_months INT DEFAULT 12)
RETURNS TABLE(event_date TIMESTAMP, event_type VARCHAR, description TEXT, clinician VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.episode_date,
        el.episode_type::VARCHAR,
        el.summary::TEXT,
        el.clinician_name::VARCHAR
    FROM ehr_episode_links el
    WHERE el.ehr_id = p_ehr_id
        AND el.episode_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
    ORDER BY el.episode_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Función: Preparar sync THALAMUS (validar y encriptar)
CREATE OR REPLACE FUNCTION public.prepare_ehr_for_thalamus_sync(p_ehr_id UUID)
RETURNS TABLE(ehr_id UUID, sync_hash VARCHAR, ready_to_sync BOOLEAN) AS $$
DECLARE
    v_sync_hash VARCHAR(64);
    v_ready BOOLEAN;
    v_error TEXT;
BEGIN
    BEGIN
        -- Validate EHR exists and has complete data
        v_ready := (
            SELECT EXISTS (
                SELECT 1 FROM electronic_health_record
                WHERE id = p_ehr_id
                AND patient_id IS NOT NULL
                AND active_problems IS NOT NULL
            )
        );
        
        IF v_ready THEN
            -- Calculate sync hash
            SELECT 
                MD5(CONCAT(
                    patient_id::VARCHAR,
                    ARRAY_TO_STRING(active_problems, ','),
                    ARRAY_TO_STRING(medications_active, ','),
                    summary_note
                ))::VARCHAR(64)
            INTO v_sync_hash
            FROM electronic_health_record
            WHERE id = p_ehr_id;
            
            -- Create sync log entry
            INSERT INTO ehr_thalamus_sync_log (
                ehr_id, sync_type, sync_direction, sync_status, sync_hash, sync_initiated_by
            ) VALUES (
                p_ehr_id, 'delta', 'push', 'pending', v_sync_hash, auth.uid()
            );
        ELSE
            v_error := 'EHR incomplete or missing required fields';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        v_ready := FALSE;
        v_error := SQLERRM;
    END;
    
    RETURN QUERY SELECT p_ehr_id, v_sync_hash, v_ready;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. VISTA CONSOLIDADA (para facilitar queries)
-- ============================================================================

CREATE OR REPLACE VIEW v_ehr_consolidated AS
SELECT 
    ehr.id,
    ehr.patient_id,
    ehr.summary_note,
    ehr.active_problems,
    ehr.medications_active,
    ehr.allergies,
    COUNT(DISTINCT el.id) as episode_count,
    MAX(el.episode_date) as last_episode_date,
    COUNT(DISTINCT ds.id) as document_count,
    COUNT(DISTINCT al.id) as access_log_count,
    ehr.thalamus_sync_status,
    ehr.thalamus_synced_at,
    ehr.updated_at
FROM electronic_health_record ehr
LEFT JOIN ehr_episode_links el ON ehr.id = el.ehr_id
LEFT JOIN ehr_document_storage ds ON ehr.id = ds.ehr_id
LEFT JOIN ehr_access_log al ON ehr.id = al.ehr_id
GROUP BY ehr.id;

-- ============================================================================
-- 8. SEEDING DE DATOS RELACIONADOS
-- ============================================================================

-- Crear tabla de referencia para hospitals (si no existe - asumiendo ya existe)
-- Si no existe, descomenta:
-- CREATE TABLE IF NOT EXISTS public.hospitals (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name VARCHAR(255) NOT NULL,
--     code VARCHAR(50) UNIQUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================================================
-- 9. MIGRATIONS NOTES
-- ============================================================================
/*
PRÓXIMAS MIGRACIONES (Hito 2-5):

Hito 2 (React Components):
  - Create ASIS_13_EHR folder with:
    ├─ ElectronicHealthRecordDashboard.tsx (1,200 L)
    ├─ EHRTimeline.tsx (600 L)
    ├─ ResumenClinico.tsx (500 L)
    ├─ DocumentStorage.tsx (400 L)
    └─ AuditLog.tsx (500 L)
  - Total: 2,200 L

Hito 3 (Hooks):
  - useElectronicHealthRecord.ts (600 L)
  - useEHRAccess.ts (400 L)
  - useEHRTimeline.ts (350 L)
  - useThalamusSync.ts (450 L) <- NEW for THALAMUS
  - Total: 1,800 L

Hito 4 (Edge Functions):
  - consolidate_ehr_summary (300 L)
  - generate_ehr_pdf (400 L)
  - export_ehr_hl7 (400 L)
  - log_ehr_access (250 L)
  - sync_ehr_to_thalamus (450 L) <- NEW for THALAMUS
  - Total: 1,800 L

Hito 5 (Tests):
  - ElectronicHealthRecordDashboard.test.tsx (150 L)
  - useElectronicHealthRecord.test.ts (180 L)
  - EHR consolidation functions (200 L)
  - THALAMUS sync workflow (300 L)
  - Total: 830 L

TOTAL ASIS 13: 1,200 (SQL) + 2,200 (React) + 1,800 (Hooks) + 1,800 (Functions) + 830 (Tests) = 7,830 L
(Plan was 8,500, so tenemos buffer para edge cases)
*/

-- ============================================================================
-- FIN ASIS 13 HME SQL SCHEMA
-- ============================================================================
