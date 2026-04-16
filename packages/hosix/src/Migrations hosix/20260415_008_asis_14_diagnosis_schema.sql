-- ============================================================================
-- MIGRATION 009: ASIS_14 - DIAGNOSIS (DIAGNÓSTICOS Y CODIFICACIÓN ICD-10)
-- FECHA: 2026-04-15
-- PROPOSITO: Gestión de diagnósticos, códigos ICD-10, comorbilidades, planes de tratamiento
-- ============================================================================

-- ============================================================================
-- 1. ICD-10 CODES CATALOG (Catálogo ICD-10 - 70,000+ codes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS icd10_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL, -- A00-Z99.99
    code_full VARCHAR(20),
    description VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Clinical Classification
    diagnosis_type VARCHAR(50), -- primary, secondary, complication
    severity_default VARCHAR(20), -- mild, moderate, severe
    
    -- Clinical Attributes
    chronic BOOLEAN DEFAULT false,
    infectious BOOLEAN DEFAULT false,
    congenital BOOLEAN DEFAULT false,
    mental_health BOOLEAN DEFAULT false,
    occupational_related BOOLEAN DEFAULT false,
    trauma_related BOOLEAN DEFAULT false,
    preventable BOOLEAN DEFAULT false,
    reportable BOOLEAN DEFAULT false, -- Public health reporting
    
    -- Relationships
    parent_code VARCHAR(10),
    related_codes VARCHAR(10)[],
    excludes1 VARCHAR(10)[],
    excludes2 VARCHAR(10)[],
    includes VARCHAR(255)[],
    
    -- Clinical Guidelines
    chapter_number INT,
    block_number INT,
    
    -- Epidemiology
    prevalence_per_100k INT,
    mortality_rate DECIMAL(5, 2),
    
    -- Query Optimization
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_severity CHECK (severity_default IN ('mild', 'moderate', 'severe'))
);

CREATE INDEX idx_icd10_code ON icd10_code(code);
CREATE INDEX idx_icd10_description ON icd10_code USING GIN (to_tsvector('spanish', description));
CREATE INDEX idx_icd10_category ON icd10_code(category);
CREATE INDEX idx_icd10_chronic ON icd10_code(chronic);
CREATE INDEX idx_icd10_infectious ON icd10_code(infectious);

-- ============================================================================
-- 2. PATIENT DIAGNOSES (Diagnósticos del Paciente)
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_diagnosis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES encounter(id) ON DELETE SET NULL,
    
    icd10_id UUID NOT NULL REFERENCES icd10_code(id) ON DELETE RESTRICT,
    
    -- Diagnosis Context
    diagnosis_status VARCHAR(50) DEFAULT 'confirmed', -- provisional, confirmed, resolved, ruled_out
    admission_date DATE NOT NULL,
    resolution_date DATE,
    
    -- Severity & Complexity
    severity VARCHAR(20), -- mild, moderate, severe, critical
    complexity INT, -- 1-3 scale for comorbidity calculations
    
    -- Clinical Notes
    clinical_presentation TEXT,
    diagnostic_criteria TEXT,
    
    -- Relationships
    primary_diagnosis BOOLEAN DEFAULT false,
    complication_of_diagnosis_id UUID REFERENCES patient_diagnosis(id) ON DELETE SET NULL,
    
    -- Management
    treatment_plan_id UUID,
    monitoring_required BOOLEAN DEFAULT true,
    monitoring_frequency VARCHAR(50), -- e.g., "weekly", "monthly"
    
    -- Flags
    requires_specialist_consultation BOOLEAN DEFAULT false,
    specialist_type VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patient_diagnosis_patient ON patient_diagnosis(patient_id);
CREATE INDEX idx_patient_diagnosis_provider ON patient_diagnosis(provider_id);
CREATE INDEX idx_patient_diagnosis_icd10 ON patient_diagnosis(icd10_id);
CREATE INDEX idx_patient_diagnosis_status ON patient_diagnosis(diagnosis_status);
CREATE INDEX idx_patient_diagnosis_admission ON patient_diagnosis(admission_date);

-- ============================================================================
-- 3. COMORBIDITY ASSESSMENT (Evaluación de Comorbilidades)
-- ============================================================================

CREATE TABLE IF NOT EXISTS comorbidity_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    assessment_date DATE NOT NULL,
    
    -- Comorbidity Indices
    charlson_comorbidity_index INT, -- 0-33+ score
    elixhauser_comorbidity_score INT,
    
    -- Patient-Specific Comorbidities
    diagnoses_count INT DEFAULT 0,
    chronic_diagnoses_count INT DEFAULT 0,
    mental_health_diagnoses BOOLEAN DEFAULT false,
    substance_use_disorder BOOLEAN DEFAULT false,
    
    -- Risk Assessment
    overall_risk_level VARCHAR(50), -- low, medium, high, very_high
    mortality_risk_percentage DECIMAL(5, 2),
    hospitalization_risk_percentage DECIMAL(5, 2),
    
    -- Impact on Treatment
    contraindicated_medications TEXT,
    requires_adjusted_dosing JSONB, -- {medication: dose_adjustment}
    special_monitoring_required TEXT,
    
    -- Clinical Recommendations
    recommendations TEXT,
    follow_up_frequency VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comorbidity_patient ON comorbidity_assessment(patient_id);
CREATE INDEX idx_comorbidity_date ON comorbidity_assessment(assessment_date);

-- ============================================================================
-- 4. TREATMENT PLANS (Planes de Tratamiento)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treatment_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    primary_diagnosis_id UUID REFERENCES patient_diagnosis(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES provider(id) ON DELETE RESTRICT,
    
    -- Plan Details
    plan_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    estimated_duration_days INT,
    
    -- Treatment Goals
    goals TEXT,
    expected_outcomes TEXT,
    success_criteria TEXT,
    
    -- Interventions
    medications_prescribed JSONB, -- [{medication_id, reason}, ...]
    procedures_planned TEXT,
    referrals_needed TEXT,
    
    -- Monitoring
    monitoring_parameters TEXT[],
    monitoring_frequency VARCHAR(50),
    
    -- Follow-up
    follow_up_date DATE,
    follow_up_method VARCHAR(50), -- in_person, telehealth, phone
    
    -- Status
    plan_status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued, suspended
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_treatment_plan_patient ON treatment_plan(patient_id);
CREATE INDEX idx_treatment_plan_diagnosis ON treatment_plan(primary_diagnosis_id);

-- ============================================================================
-- 5. SPECIALIST REFERRALS (Derivaciones a Especialistas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS specialist_referral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    referring_provider_id UUID NOT NULL REFERENCES provider(id) ON DELETE RESTRICT,
    
    diagnosis_id UUID REFERENCES patient_diagnosis(id) ON DELETE SET NULL,
    
    -- Referral Details
    specialty_requested VARCHAR(100) NOT NULL,
    referral_date DATE NOT NULL,
    urgency VARCHAR(50) DEFAULT 'routine', -- routine, urgent, emergent
    
    -- Clinical Information
    clinical_indication TEXT NOT NULL,
    clinical_history TEXT,
    relevant_tests_results TEXT,
    current_medications TEXT,
    
    -- Referral Status
    referral_status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, completed
    appointment_date DATE,
    consultant_name VARCHAR(255),
    consultant_feedback TEXT,
    
    -- Authorization
    insurance_authorization_code VARCHAR(50),
    authorization_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_patient ON specialist_referral(patient_id);
CREATE INDEX idx_referral_provider ON specialist_referral(referring_provider_id);
CREATE INDEX idx_referral_status ON specialist_referral(referral_status);

-- ============================================================================
-- 6. DIAGNOSIS HISTORY (Historial de Diagnósticos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS diagnosis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_diagnosis_id UUID NOT NULL REFERENCES patient_diagnosis(id) ON DELETE CASCADE,
    
    -- Change Record
    change_date DATE NOT NULL,
    change_type VARCHAR(50), -- created, status_changed, severity_changed, resolved, reactivated
    changed_by_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Previous Values
    previous_status VARCHAR(50),
    previous_severity VARCHAR(20),
    previous_resolution_date DATE,
    
    -- Current Values
    new_status VARCHAR(50),
    new_severity VARCHAR(20),
    new_resolution_date DATE,
    
    -- Notes
    change_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diagnosis_history_diagnosis ON diagnosis_history(patient_diagnosis_id);

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_patient_diagnosis_updated_at BEFORE UPDATE ON patient_diagnosis
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_comorbidity_assessment_updated_at BEFORE UPDATE ON comorbidity_assessment
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_treatment_plan_updated_at BEFORE UPDATE ON treatment_plan
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_specialist_referral_updated_at BEFORE UPDATE ON specialist_referral
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 8. INITIAL ICD-10 CODES (Common Diagnoses)
-- ============================================================================

INSERT INTO icd10_code (code, description, category, diagnosis_type, severity_default, chronic, infectious, preventable) VALUES
    ('E11', 'Type 2 diabetes mellitus', 'Endocrine', 'primary', 'moderate', true, false, true),
    ('I10', 'Essential (primary) hypertension', 'Circulatory', 'primary', 'moderate', true, false, true),
    ('J45.9', 'Unspecified asthma with (acute) exacerbation', 'Respiratory', 'primary', 'moderate', true, false, true),
    ('K21.9', 'Unspecified gastro-esophageal reflux disease', 'Digestive', 'primary', 'mild', true, false, false),
    ('M79.3', 'Panniculitis, unspecified', 'Musculoskeletal', 'primary', 'mild', false, false, false),
    ('F41.1', 'Generalized anxiety disorder', 'Mental', 'primary', 'moderate', false, false, false),
    ('J06.9', 'Acute upper respiratory infection, unspecified', 'Respiratory', 'secondary', 'mild', false, true, false),
    ('Z00.00', 'Encounter for general adult medical examination without abnormal findings', 'Contact factors', 'primary', 'mild', false, false, false),
    ('O80', 'Encounter for full-term uncomplicated delivery', 'Pregnancy', 'primary', 'mild', false, false, false),
    ('Z23', 'Encounter for immunization', 'Contact factors', 'primary', 'mild', false, false, false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- TOTAL: 6 tables created
-- ============================================================================
