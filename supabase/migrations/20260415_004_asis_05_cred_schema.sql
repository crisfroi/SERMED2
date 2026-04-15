-- ============================================================================
-- MIGRATION 005: ASIS_05 - CRED (CRECIMIENTO Y DESARROLLO)
-- FECHA: 2026-04-15
-- PROPOSITO: Control de crecimiento pediátrico, vacunaciones, hitos del desarrollo
-- ============================================================================

-- ============================================================================
-- 1. GROWTH CONTROLS (Control de Crecimiento)
-- ============================================================================

CREATE TABLE IF NOT EXISTS growth_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Visit Information
    visit_date DATE NOT NULL,
    age_months INT NOT NULL,
    
    -- Measurements
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    head_circumference_cm DECIMAL(5, 2) COMMENT 'Para menores de 2 años',
    bmi DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN height_cm > 0 THEN (weight_kg / ((height_cm / 100) * (height_cm / 100))) ELSE NULL END
    ) STORED,
    
    -- WHO Reference Data
    who_percentile_weight INT,
    who_percentile_height INT,
    who_percentile_bmi INT,
    who_z_score_weight DECIMAL(5, 2),
    who_z_score_height DECIMAL(5, 2),
    
    -- Nutritional Status
    nutritional_status VARCHAR(50), -- adequate, at_risk, stunted, wasted, overweight, obese
    
    -- Clinical Assessment
    clinician_notes TEXT,
    abnormalities_detected TEXT,
    counseling_provided TEXT,
    follow_up_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_growth_control_patient ON growth_control(patient_id);
CREATE INDEX idx_growth_control_visit_date ON growth_control(visit_date);
CREATE INDEX idx_growth_control_age_months ON growth_control(age_months);

-- ============================================================================
-- 2. VACCINE ADMINISTRATION (Administración de Vacunas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vaccine_administration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Vaccine Information
    vaccine_name VARCHAR(100) NOT NULL, -- BCG, DPT, OPV, Rotavirus, etc
    vaccine_code VARCHAR(20),
    dose_number INT DEFAULT 1,
    
    -- Scheduling
    scheduled_age_months INT,
    scheduled_date DATE,
    administered_date DATE NOT NULL,
    is_late BOOLEAN DEFAULT false,
    days_late INT,
    
    -- Vaccine Details
    batch_number VARCHAR(50),
    expiry_date DATE,
    lot_number VARCHAR(50),
    manufacturer VARCHAR(100),
    route VARCHAR(50), -- IM, SC, PO, intranasal, etc
    anatomical_site VARCHAR(100), -- left arm, right arm, left thigh, etc
    
    -- Status & Follow-up
    status VARCHAR(50) DEFAULT 'administered', -- scheduled, administered, missed, contraindicated
    next_dose_date DATE,
    
    -- Adverse Events
    adverse_effects TEXT,
    adverse_event_days INT,
    serious_adverse_event BOOLEAN DEFAULT false,
    
    -- Administration Details
    administered_by_name VARCHAR(100),
    facility_name VARCHAR(100),
    clinic_id UUID REFERENCES clinic(id) ON DELETE SET NULL,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vaccine_admin_patient ON vaccine_administration(patient_id);
CREATE INDEX idx_vaccine_admin_date ON vaccine_administration(administered_date);
CREATE INDEX idx_vaccine_admin_vaccine ON vaccine_administration(vaccine_name);

-- ============================================================================
-- 3. DEVELOPMENT MILESTONES (Hitos del Desarrollo)
-- ============================================================================

CREATE TABLE IF NOT EXISTS development_milestone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    
    -- Milestone Information
    age_months INT NOT NULL,
    milestone_category VARCHAR(50), -- motor, language, cognitive, social, self_care
    milestone_description VARCHAR(255) NOT NULL,
    
    -- Assessment
    achieved BOOLEAN DEFAULT false,
    achieved_date DATE,
    screening_status VARCHAR(50), -- normal, delayed, concerning
    
    -- Provider Assessment
    provider_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    assessment_date DATE,
    assessment_notes TEXT,
    
    -- Referral Flag
    referral_indicated BOOLEAN DEFAULT false,
    referral_type VARCHAR(50), -- developmental_specialist, speech_therapy, occupational_therapy
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_development_patient ON development_milestone(patient_id);
CREATE INDEX idx_development_category ON development_milestone(milestone_category);
CREATE INDEX idx_development_age ON development_milestone(age_months);

-- ============================================================================
-- 4. BREASTFEEDING STATUS (Estado de Lactancia)
-- ============================================================================

CREATE TABLE IF NOT EXISTS breastfeeding_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    
    -- Breastfeeding Information
    breastfeeding_status VARCHAR(50), -- exclusively, predominant, partial, none
    duration_months INT,
    started_date DATE,
    ended_date DATE,
    
    -- History
    assessment_date DATE NOT NULL,
    provider_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Issues & Support
    breastfeeding_problems TEXT,
    support_offered TEXT,
    referral_to_specialist BOOLEAN DEFAULT false,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_breastfeeding_patient ON breastfeeding_status(patient_id);

-- ============================================================================
-- 5. NUTRITIONAL SUPPLEMENTATION (Suplementación)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutritional_supplement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    
    supplement_name VARCHAR(100) NOT NULL, -- Iron, Vitamin A, Zinc, Folate, etc
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    reason TEXT, -- anemia, deficiency, malnutrition, etc
    
    status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued
    provider_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplement_patient ON nutritional_supplement(patient_id);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_growth_control_updated_at BEFORE UPDATE ON growth_control
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_vaccine_admin_updated_at BEFORE UPDATE ON vaccine_administration
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_development_milestone_updated_at BEFORE UPDATE ON development_milestone
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_breastfeeding_updated_at BEFORE UPDATE ON breastfeeding_status
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_supplement_updated_at BEFORE UPDATE ON nutritional_supplement
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TOTAL: 5 tables created
-- ============================================================================
