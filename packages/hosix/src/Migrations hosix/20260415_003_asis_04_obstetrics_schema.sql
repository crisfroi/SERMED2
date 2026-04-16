-- ============================================================================
-- MIGRATION 004: ASIS_04 - OBSTETRICS (OBSTETRICIA)
-- FECHA: 2026-04-15
-- PROPOSITO: Gestión de embarazos, partos, neonatos, complicaciones obstétricas
-- ============================================================================

-- ============================================================================
-- 1. PREGNANCY (Embarazos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pregnancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    
    -- Date Information
    lmp_date DATE NOT NULL COMMENT 'Last Menstrual Period - Fecha última menstruación',
    edd DATE COMMENT 'Expected Delivery Date - Fecha probable de parto',
    gestational_age_weeks INT,
    
    -- Status & Risk
    status VARCHAR(50) DEFAULT 'ongoing', -- ongoing, delivered, terminated, miscarriage
    risk_level INT DEFAULT 0 CHECK (risk_level >= 0 AND risk_level <= 100),
    critical_condition BOOLEAN DEFAULT false,
    
    -- Clinical Data
    complications TEXT[], -- Array de complicaciones
    blood_type VARCHAR(5),
    rh_factor VARCHAR(5),
    previous_pregnancies INT DEFAULT 0,
    previous_cesareans INT DEFAULT 0,
    
    -- Ultrasound Data
    last_ultrasound_date DATE,
    fetal_weight_estimated_g INT,
    amniotic_fluid_amount VARCHAR(50), -- normal, polyhydramnios, oligohydramnios
    
    -- Follow-up
    last_checkup_date DATE,
    next_checkup_date DATE,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_status CHECK (status IN ('ongoing', 'delivered', 'terminated', 'miscarriage'))
);

CREATE INDEX idx_pregnancy_patient ON pregnancy(patient_id);
CREATE INDEX idx_pregnancy_status ON pregnancy(status);
CREATE INDEX idx_pregnancy_edd ON pregnancy(edd);

-- ============================================================================
-- 2. DELIVERY (Eventos de Parto/Nacimiento)
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregnancy_id UUID NOT NULL REFERENCES pregnancy(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider(id) ON DELETE RESTRICT,
    
    -- Event Details
    delivery_datetime TIMESTAMPTZ NOT NULL,
    delivery_mode VARCHAR(50) NOT NULL, -- vaginal, cesarean, assisted_vaginal, forceps
    location VARCHAR(100),
    
    -- Anesthesia
    anesthesia_type VARCHAR(100), -- none, local, regional, general, epidural
    anesthesiologist_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Maternal Data
    blood_loss_ml INT,
    episiotomy BOOLEAN DEFAULT false,
    episiotomy_degree INT, -- 1st, 2nd, 3rd, 4th
    maternal_complications TEXT[],
    maternal_notes TEXT,
    
    -- Fetal Data
    fetal_weight_actual_g INT,
    fetal_length_cm INT,
    fetal_head_circumference_cm INT,
    fetal_complications TEXT[],
    fetal_outcome VARCHAR(50), -- live_birth, stillbirth, miscarriage
    
    -- Follow-up
    postpartum_status VARCHAR(50), -- stable, at_risk, ICU
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delivery_pregnancy ON delivery(pregnancy_id);
CREATE INDEX idx_delivery_provider ON delivery(provider_id);
CREATE INDEX idx_delivery_datetime ON delivery(delivery_datetime);

-- ============================================================================
-- 3. NEWBORN ASSESSMENT (Evaluación de Neonato)
-- ============================================================================

CREATE TABLE IF NOT EXISTS newborn_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES delivery(id) ON DELETE CASCADE,
    
    -- Vital Assessment
    apgar_score_1min INT CHECK (apgar_score_1min >= 0 AND apgar_score_1min <= 10),
    apgar_score_5min INT CHECK (apgar_score_5min >= 0 AND apgar_score_5min <= 10),
    apgar_score_10min INT CHECK (apgar_score_10min >= 0 AND apgar_score_10min <= 10),
    
    -- Physical Measurements
    weight_kg DECIMAL(4, 2),
    height_cm DECIMAL(5, 2),
    head_circumference_cm DECIMAL(5, 2),
    chest_circumference_cm DECIMAL(5, 2),
    
    -- Reflexes & Screening
    primitive_reflexes_present BOOLEAN DEFAULT true,
    hearing_screening_status VARCHAR(50), -- passed, failed, pending
    newborn_screening_blood_test BOOLEAN DEFAULT false,
    
    -- Complications
    birth_complications TEXT[],
    congenital_anomalies TEXT,
    nicu_admission BOOLEAN DEFAULT false,
    oxygen_requirement BOOLEAN DEFAULT false,
    
    -- Initial Assessment Notes
    general_condition VARCHAR(50), -- vigorous, depressed, critically_ill
    notes TEXT,
    
    assessment_datetime TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_newborn_delivery ON newborn_assessment(delivery_id);

-- ============================================================================
-- 4. OBSTETRIC COMPLICATIONS (Complicaciones Obstétricas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS obstetric_complication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregnancy_id UUID REFERENCES pregnancy(id) ON DELETE CASCADE,
    delivery_id UUID REFERENCES delivery(id) ON DELETE CASCADE,
    
    complication_type VARCHAR(100) NOT NULL, -- preeclampsia, gestational_diabetes, placental_abruption, etc
    severity VARCHAR(50), -- mild, moderate, severe, critical
    date_detected DATE NOT NULL,
    
    -- Management
    management_type VARCHAR(50), -- monitoring, medication, intervention, emergency
    management_notes TEXT,
    managed_by_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Outcome
    resolved BOOLEAN DEFAULT false,
    resolution_date DATE,
    resolution_outcome VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_obstetric_complication_pregnancy ON obstetric_complication(pregnancy_id);
CREATE INDEX idx_obstetric_complication_severity ON obstetric_complication(severity);

-- ============================================================================
-- 5. POSTPARTUM CARE (Cuidado Postparto)
-- ============================================================================

CREATE TABLE IF NOT EXISTS postpartum_care (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES delivery(id) ON DELETE CASCADE,
    
    -- Timeline
    postpartum_day INT NOT NULL,
    assessment_date DATE NOT NULL,
    assessed_by_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Physical Assessment
    lochia_amount VARCHAR(50), -- scant, moderate, heavy, excessive
    lochia_color VARCHAR(50), -- red, burgundy, brown, yellow
    uterine_involution_cm INT,
    episiotomy_healing VARCHAR(50), -- intact, good, delayed, infected
    perineal_edema BOOLEAN DEFAULT false,
    perineal_edema_location VARCHAR(100),
    
    -- Psychological State
    mood VARCHAR(50), -- normal, sad, anxious, depressed
    bonding_with_baby VARCHAR(50), -- good, delayed, poor
    
    -- Complications
    complications TEXT[],
    fever BOOLEAN DEFAULT false,
    hemorrhage BOOLEAN DEFAULT false,
    infection_signs TEXT,
    
    -- Notes
    clinical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_postpartum_delivery ON postpartum_care(delivery_id);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_pregnancy_updated_at BEFORE UPDATE ON pregnancy
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_delivery_updated_at BEFORE UPDATE ON delivery
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_obstetric_complication_updated_at BEFORE UPDATE ON obstetric_complication
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TOTAL: 6 tables created
-- ============================================================================
