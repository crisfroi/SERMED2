-- ============================================================================
-- MIGRATION 008: ASIS_10 - MEDICATIONS & REGIMENS (MEDICAMENTOS Y REGÍMENES)
-- FECHA: 2026-04-15
-- PROPOSITO: Catálogo de medicamentos, prescripciones, regímenes, adherencia
-- ============================================================================

-- ============================================================================
-- 1. MEDICATIONS CATALOG (Catálogo de Medicamentos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generic_name VARCHAR(255) NOT NULL UNIQUE,
    brand_names TEXT[], -- Array of brand names
    atc_code VARCHAR(10), -- Anatomical Therapeutic Chemical
    strength VARCHAR(50),
    unit_dose VARCHAR(50), -- mg, g, mL, IU, etc
    pharmaceutical_form VARCHAR(50), -- tablet, capsule, injection, solution, suspension, cream, etc
    route VARCHAR(50), -- oral, IM, IV, SC, topical, inhaled, rectal, etc
    
    -- Therapeutic Information
    therapeutic_class VARCHAR(100),
    indication TEXT,
    contraindications TEXT,
    
    -- Pregnancy & Lactation
    pregnancy_category VARCHAR(5), -- A, B, C, D, X
    compatible_with_breastfeeding BOOLEAN,
    
    -- Drug Interactions (will link via drug_interaction table)
    -- Adverse Effects (will store in separate table if needed)
    
    -- Dosing
    recommended_dose_min DECIMAL(10, 3),
    recommended_dose_max DECIMAL(10, 3),
    max_daily_dose DECIMAL(10, 3),
    dose_unit VARCHAR(20),
    
    -- Storage & Handling
    storage_instructions TEXT,
    temperature_requirement VARCHAR(50),
    light_protected BOOLEAN DEFAULT false,
    
    -- Regulatory
    controlled_substance BOOLEAN DEFAULT false,
    requires_prescription BOOLEAN DEFAULT false,
    
    -- Availability
    active BOOLEAN DEFAULT true,
    cost_per_unit_xaf DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medication_generic ON medication(generic_name);
CREATE INDEX idx_medication_atc ON medication(atc_code);
CREATE INDEX idx_medication_active ON medication(active);

-- ============================================================================
-- 2. MEDICATION PRESCRIPTIONS (Prescripciones)
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication_prescription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES encounter(id) ON DELETE SET NULL,
    
    medication_id UUID NOT NULL REFERENCES medication(id) ON DELETE RESTRICT,
    
    -- Dosing Information
    dose_value DECIMAL(10, 3) NOT NULL,
    dose_unit VARCHAR(50) NOT NULL, -- mg, g, mL, etc
    frequency VARCHAR(100) NOT NULL, -- once daily, twice daily, every 8 hours, etc
    route VARCHAR(50),
    
    -- Duration
    duration_days INT,
    number_of_refills INT DEFAULT 0,
    
    -- Clinical Information
    indication TEXT NOT NULL,
    special_instructions TEXT,
    
    -- Flags
    is_preventive BOOLEAN DEFAULT false,
    is_essential_medication BOOLEAN DEFAULT true,
    
    -- Allergen Verification (checked at prescription time)
    allergy_checked BOOLEAN DEFAULT false,
    
    -- Drug Interaction Checking
    interactions_checked BOOLEAN DEFAULT false,
    interactions_found TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued, suspended
    
    -- Dates
    prescription_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    discontinued_date DATE,
    discontinued_reason VARCHAR(200),
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_med_prescription_patient ON medication_prescription(patient_id);
CREATE INDEX idx_med_prescription_provider ON medication_prescription(provider_id);
CREATE INDEX idx_med_prescription_medication ON medication_prescription(medication_id);
CREATE INDEX idx_med_prescription_status ON medication_prescription(status);
CREATE INDEX idx_med_prescription_dates ON medication_prescription(start_date, end_date);

-- ============================================================================
-- 3. MEDICATION REGIMENS (Regímenes/Esquemas de Tratamiento)
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication_regimen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    
    -- Regimen Details
    regimen_name VARCHAR(100),
    regimen_type VARCHAR(50), -- antihypertensive, antibiotic, antiretroviral, chemotherapy, etc
    
    -- Medications (will be listed via junction table or array)
    medications_json JSONB, -- [{medication_id, dose, frequency}, ...]
    
    -- Indication
    indication VARCHAR(255),
    indication_icd10 VARCHAR(10),
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    duration_days INT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, completed, paused, discontinued
    pause_reason VARCHAR(200),
    
    -- Monitoring
    requires_monitoring BOOLEAN DEFAULT true,
    monitoring_parameter VARCHAR(100), -- e.g., "CD4 count", "INR", "glucose"
    monitoring_frequency VARCHAR(50), -- e.g., "every week", "monthly"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regimen_patient ON medication_regimen(patient_id);
CREATE INDEX idx_regimen_status ON medication_regimen(status);

-- ============================================================================
-- 4. REGIMEN ADHERENCE TRACKING (Seguimiento de Adherencia)
-- ============================================================================

CREATE TABLE IF NOT EXISTS regimen_adherence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_prescription_id UUID NOT NULL REFERENCES medication_prescription(id) ON DELETE CASCADE,
    
    -- Adherence Record
    adherence_date DATE NOT NULL,
    dose_taken BOOLEAN NOT NULL,
    dose_time TIME,
    
    -- Why dose was missed
    dose_missed_reason VARCHAR(100), -- forgot, side_effects, cost, other
    
    -- Adverse Events
    adverse_event BOOLEAN DEFAULT false,
    adverse_event_description TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_adherence_prescription ON regimen_adherence(medication_prescription_id);
CREATE INDEX idx_adherence_date ON regimen_adherence(adherence_date);

-- ============================================================================
-- 5. DRUG INTERACTIONS (Interacciones Medicamentosas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS drug_interaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id_1 UUID NOT NULL REFERENCES medication(id) ON DELETE CASCADE,
    medication_id_2 UUID NOT NULL REFERENCES medication(id) ON DELETE CASCADE,
    
    interaction_type VARCHAR(50), -- moderate, significant, contraindicated
    mechanism TEXT,
    clinical_effect TEXT,
    management_recommendation TEXT,
    severity INT, -- 1-5 scale
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(medication_id_1, medication_id_2)
);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_medication_updated_at BEFORE UPDATE ON medication
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_med_prescription_updated_at BEFORE UPDATE ON medication_prescription
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_regimen_updated_at BEFORE UPDATE ON medication_regimen
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 7. INITIAL MEDICATIONS
-- ============================================================================

INSERT INTO medication (generic_name, strength, unit_dose, pharmaceutical_form, route, therapeutic_class, pregnancy_category, requires_prescription) VALUES
    ('Metformina', '500 mg', 'mg', 'tablet', 'oral', 'Antidiabético', 'B', true),
    ('Amoxicilina', '500 mg', 'mg', 'capsule', 'oral', 'Antibiótico', 'B', true),
    ('Propranolol', '40 mg', 'mg', 'tablet', 'oral', 'Antihipertensivo', 'C', true),
    ('Ibuprofeno', '200 mg', 'mg', 'tablet', 'oral', 'Analgésico', 'C', false),
    ('Vitamina C', '500 mg', 'mg', 'tablet', 'oral', 'Vitamina', 'A', false),
    ('Ácido Fólico', '1 mg', 'mg', 'tablet', 'oral', 'Vitamina', 'A', false),
    ('Ciprofloxacino', '500 mg', 'mg', 'tablet', 'oral', 'Antibiótico', 'C', true)
ON CONFLICT (generic_name) DO NOTHING;

-- ============================================================================
-- TOTAL: 5 tables created
-- ============================================================================
