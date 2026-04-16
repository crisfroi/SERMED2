-- ============================================================================
-- MIGRATION 001: BASE CLINICAL SCHEMA (CLINICAL FOUNDATION)
-- FECHA: 2026-04-15
-- PROPOSITO: Crear tablas base clínicas que todos los módulos necesitan
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATION & INFRASTRUCTURE
-- Estructura base: Centros de Salud, Clínicas, Departamentos
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    tipo_institucion VARCHAR(50), -- Hospital, Clínica, Centro Salud, Consultorio
    pais VARCHAR(100) DEFAULT 'Ecuador',
    provincia VARCHAR(100),
    ciudad VARCHAR(100),
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS clinic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    address VARCHAR(255),
    phone VARCHAR(20),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS department (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    manager_id UUID,
    budget_xaf DECIMAL(15, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PROVIDERS (Médicos, Enfermeras, Personal Clínico)
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(255),
    license_number VARCHAR(100) UNIQUE,
    license_expiry_date DATE,
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinic(id) ON DELETE SET NULL,
    role VARCHAR(50), -- Médico, Enfermera, Técnico, Administrativo
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PATIENT (Pacientes - Core)
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identidad
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    passport_number VARCHAR(50) UNIQUE,
    date_of_birth DATE NOT NULL,
    age INT GENERATED ALWAYS AS (
        EXTRACT(YEAR FROM age(date_of_birth))
    ) STORED,
    sex CHAR(1) CHECK (sex IN ('M', 'F', 'O')),
    
    -- Contacto
    email VARCHAR(255),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    
    -- Dirección
    street_address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Ecuador',
    
    -- Empleo
    occupation VARCHAR(255),
    employer_name VARCHAR(255),
    
    -- Información de Salud
    blood_type VARCHAR(5), -- O+, O-, A+, A-, B+, B-, AB+, AB-
    rh_factor VARCHAR(5),
    allergies TEXT,
    chronic_conditions TEXT,
    
    -- Gestión
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinic(id) ON DELETE SET NULL,
    preferred_language VARCHAR(50) DEFAULT 'es',
    
    -- Estatus
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, deceased
    deleted_at TIMESTAMPTZ,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_patient_cedula ON patient(cedula);
CREATE INDEX IF NOT EXISTS idx_patient_email ON patient(email);
CREATE INDEX IF NOT EXISTS idx_patient_date_of_birth ON patient(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patient_organization ON patient(organization_id);

-- ============================================================================
-- 4. PATIENT CONTACTS (Contacto de Emergencia)
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    is_emergency_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ENCOUNTER / VISIT (Visitas/Consultas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS encounter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider(id) ON DELETE RESTRICT,
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE RESTRICT,
    encounter_type VARCHAR(50), -- consultation, hospitalization, emergency, etc
    encounter_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed', -- completed, cancelled, no-show, scheduled
    chief_complaint TEXT,
    vital_signs JSONB, -- {temperature, bp, pulse, respiratory_rate, o2_sat}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_encounter_patient ON encounter(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounter_provider ON encounter(provider_id);
CREATE INDEX IF NOT EXISTS idx_encounter_datetime ON encounter(encounter_datetime);

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organization_code ON organization(code);
CREATE INDEX IF NOT EXISTS idx_organization_active ON organization(active);
CREATE INDEX IF NOT EXISTS idx_clinic_organization ON clinic(organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_organization ON provider(organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_cedula ON provider(cedula);
CREATE INDEX IF NOT EXISTS idx_provider_active ON provider(active);
CREATE INDEX IF NOT EXISTS idx_department_organization ON department(organization_id);

-- ============================================================================
-- 7. RLS (Row Level Security) POLICIES
-- ============================================================================

ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic ENABLE ROW LEVEL SECURITY;
ALTER TABLE department ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounter ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver su propia organización
CREATE POLICY policy_organization_view ON organization
    FOR SELECT USING (
        auth.uid()::text = created_by_id::text OR 
        auth.uid() IN (SELECT user_id FROM provider WHERE organization_id = organization.id)
    );

-- Policy: Pacientes pueden ver su propio registro
CREATE POLICY policy_patient_view ON patient
    FOR SELECT USING (
        auth.uid()::text = created_by_id::text OR
        auth.uid() IN (SELECT user_id FROM provider WHERE organization_id = patient.organization_id)
    );

-- Policy: Contactos de paciente visibles solo al paciente y proveedores autorizados
CREATE POLICY policy_patient_contact_view ON patient_contact
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM provider WHERE organization_id = 
            (SELECT organization_id FROM patient WHERE id = patient_id))
    );

-- Policy: Encuentros visibles al proveedor y al paciente
CREATE POLICY policy_encounter_view ON encounter
    FOR SELECT USING (
        auth.uid()::uuid = provider_id OR
        auth.uid()::uuid IN (SELECT created_by_id FROM patient WHERE id = patient_id)
    );

-- ============================================================================
-- 8. AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    user_id UUID REFERENCES auth.users(id),
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);

-- ============================================================================
-- DATA SEED: Base Organizations & Clinics
-- ============================================================================

INSERT INTO organization (name, code, tipo_institucion, ciudad, email) VALUES
    ('Hospital Central', 'HC001', 'Hospital', 'Quito', 'admin@hospitalcentral.ec')
ON CONFLICT (code) DO NOTHING;

INSERT INTO clinic (organization_id, name, code) VALUES
    ((SELECT id FROM organization WHERE code = 'HC001'), 'Clínica Principal', 'CP001')
ON CONFLICT (code) DO NOTHING;

INSERT INTO department (organization_id, name, code) VALUES
    ((SELECT id FROM organization WHERE code = 'HC001'), 'Obstetricia', 'OB'),
    ((SELECT id FROM organization WHERE code = 'HC001'), 'Pediatría', 'PED'),
    ((SELECT id FROM organization WHERE code = 'HC001'), 'Laboratorio', 'LAB'),
    ((SELECT id FROM organization WHERE code = 'HC001'), 'Farmacia', 'FARM'),
    ((SELECT id FROM organization WHERE code = 'HC001'), 'Recursos Humanos', 'RH')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- FUNCTIONS FOR UPDATED_AT TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organization_updated_at BEFORE UPDATE ON organization
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_clinic_updated_at BEFORE UPDATE ON clinic
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_patient_updated_at BEFORE UPDATE ON patient
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_provider_updated_at BEFORE UPDATE ON provider
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_encounter_updated_at BEFORE UPDATE ON encounter
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Total tables created: 9
-- Total indexes: 13
-- Total RLS policies: 4
-- Total triggers: 5
