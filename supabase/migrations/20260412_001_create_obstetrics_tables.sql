-- ============================================================================
-- MIGRATION: 20260412_001_create_obstetrics_tables.sql
-- DESCRIPTION: Crear tablas para módulo ASIS 4.0 - Obstetricia
-- BASADO EN: GNU Health health_obstetrics module (Tryton)
-- AUTHOR: GitHub Copilot (Executor Mode)
-- DATE: 2026-04-12
-- ============================================================================

-- ============================================================================
-- TABLE: pregnancy
-- Registra embarazos de pacientes
-- ============================================================================
CREATE TABLE IF NOT EXISTS pregnancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    
    -- Datos de embarazo
    lmp_date DATE COMMENT 'Last Menstrual Period - Fecha última menstruación',
    gestational_age_weeks INT COMMENT 'Edad gestacional en semanas',
    edd DATE COMMENT 'Expected Delivery Date - Fecha probable de parto',
    
    -- Estado
    status VARCHAR(50) NOT NULL DEFAULT 'ongoing' COMMENT 'ongoing, delivered, terminated, miscarriage',
    critical_condition BOOLEAN DEFAULT FALSE,
    risk_level INT DEFAULT 0 COMMENT '0-100 score de riesgo',
    
    -- Complicaciones (array)
    complications TEXT[] DEFAULT ARRAY[]::TEXT[] COMMENT 'Ej: preeclampsia, diabetes_gestacional, etc',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_status CHECK (status IN ('ongoing', 'delivered', 'terminated', 'miscarriage')),
    CONSTRAINT valid_risk CHECK (risk_level >= 0 AND risk_level <= 100)
);

CREATE INDEX idx_pregnancy_patient ON pregnancy(patient_id);
CREATE INDEX idx_pregnancy_status ON pregnancy(status);
CREATE INDEX idx_pregnancy_edd ON pregnancy(edd);

-- ============================================================================
-- TABLE: delivery
-- Registro de parto/nacimiento
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregnancy_id UUID NOT NULL REFERENCES pregnancy(id) ON DELETE CASCADE,
    
    -- Datos de parto
    delivery_datetime TIMESTAMP NOT NULL,
    delivery_mode VARCHAR(50) NOT NULL COMMENT 'vaginal, cesarean, assisted_vaginal',
    
    -- Anestesia
    anesthesia_type VARCHAR(100) COMMENT 'none, local, regional, general',
    anesthesiologist_id UUID REFERENCES physician(id),
    
    -- Complicaciones
    maternal_complications TEXT[] DEFAULT ARRAY[]::TEXT[],
    fetal_complications TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Datos del parto
    blood_loss_ml INT COMMENT 'Pérdida de sangre en ml',
    episiotomy BOOLEAN DEFAULT FALSE,
    tears_degree INT COMMENT '0=none, 1=superficial, 2=perineal, 3=sphincter, 4=complete',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    attended_by_id UUID REFERENCES physician(id),
    
    CONSTRAINT valid_mode CHECK (delivery_mode IN ('vaginal', 'cesarean', 'assisted_vaginal')),
    CONSTRAINT valid_tears CHECK (tears_degree >= 0 AND tears_degree <= 4)
);

CREATE INDEX idx_delivery_pregnancy ON delivery(pregnancy_id);
CREATE INDEX idx_delivery_datetime ON delivery(delivery_datetime);

-- ============================================================================
-- TABLE: puerperium
-- Estado postparto (después del parto)
-- ============================================================================
CREATE TABLE IF NOT EXISTS puerperium (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES delivery(id) ON DELETE CASCADE,
    
    -- Datos postparto
    days_postpartum INT DEFAULT 0,
    
    -- Signos y síntomas
    lochia_type VARCHAR(50) COMMENT 'normal, excessive, foul_smelling',
    bleeding_amount_ml INT,
    
    -- Complicaciones
    infection_sign BOOLEAN DEFAULT FALSE,
    thromboembolism_sign BOOLEAN DEFAULT FALSE,
    eclampsia_sign BOOLEAN DEFAULT FALSE,
    mastitis BOOLEAN DEFAULT FALSE,
    
    -- Estado psicológico
    depression_screening INT COMMENT 'Edinburgh Postnatal Depression Scale (0-30)',
    
    -- Status
    status VARCHAR(50) DEFAULT 'recovering' COMMENT 'recovering, complicated, discharged',
    notes TEXT,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_lochia CHECK (lochia_type IN ('normal', 'excessive', 'foul_smelling'))
);

CREATE INDEX idx_puerperium_delivery ON puerperium(delivery_id);

-- ============================================================================
-- TABLE: newborn_assessment
-- Evaluación del recién nacido
-- ============================================================================
CREATE TABLE IF NOT EXISTS newborn_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES delivery(id) ON DELETE CASCADE,
    
    -- Datos demográficos
    birth_datetime TIMESTAMP NOT NULL DEFAULT NOW(),
    sex CHAR(1) NOT NULL COMMENT 'M, F',
    
    -- Antropometría
    weight_g INT COMMENT 'Peso en gramos',
    length_cm DECIMAL(5,2) COMMENT 'Talla en cm',
    head_circumference_cm DECIMAL(5,2) COMMENT 'Perímetro cefálico en cm',
    
    -- APGAR Score (1 punto, 5 puntos, 10 puntos)
    apgar_1min INT COMMENT '0-10 score al 1 minuto',
    apgar_5min INT COMMENT '0-10 score a los 5 minutos',
    apgar_10min INT COMMENT '0-10 score a los 10 minutos',
    
    -- Complicaciones neonatales
    congenital_anomaly TEXT COMMENT 'Anomalía congénita si aplica',
    resuscitation_needed BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'alive' COMMENT 'alive, stillborn, early_death',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    created_by_id UUID REFERENCES physician(id),
    
    CONSTRAINT valid_apgar CHECK (apgar_1min >= 0 AND apgar_1min <= 10),
    CONSTRAINT valid_sex CHECK (sex IN ('M', 'F'))
);

CREATE INDEX idx_newborn_delivery ON newborn_assessment(delivery_id);

-- ============================================================================
-- TABLE: obstetric_complication
-- Complicaciones obstétricas - Lookup table
-- ============================================================================
CREATE TABLE IF NOT EXISTS obstetric_complication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) COMMENT 'pregnancy, delivery, puerperium, neonatal',
    severity VARCHAR(50) COMMENT 'mild, moderate, severe, critical',
    description TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO obstetric_complication (code, name, category, severity, description) VALUES
    ('gestational_diabetes', 'Diabetes Gestacional', 'pregnancy', 'moderate', 'Hiperglucemia durante el embarazo'),
    ('preeclampsia', 'Preeclampsia', 'pregnancy', 'severe', 'Hipertensión + proteinuria >20 semanas'),
    ('placental_abruption', 'Desprendimiento Placentario', 'delivery', 'critical', 'Separación prematura de placenta'),
    ('uterine_rupture', 'Ruptura Uterina', 'delivery', 'critical', 'Ruptura de pared uterina'),
    ('amniotic_fluid_embolism', 'Embolismo de Líquido Amniótico', 'delivery', 'critical', 'Complicación potencialmente mortal'),
    ('postpartum_hemorrhage', 'Hemorragia Postparto', 'puerperium', 'severe', 'Sangrado > 500ml post-vaginal, >1000ml post-cesárea'),
    ('retained_placenta', 'Placenta Retenida', 'puerperium', 'moderate', 'Placenta no expulsada en 30 minutos'),
    ('infection_puerperal', 'Infección Puerperal', 'puerperium', 'moderate', 'Fiebre postparto con signos de infección')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE pregnancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE puerperium ENABLE ROW LEVEL SECURITY;
ALTER TABLE newborn_assessment ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: PREGNANCY
-- ============================================================================

-- OB/GYN doctors see their pregnant patients
CREATE POLICY "Obstetricians see their pregnant patients"
    ON pregnancy FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patient_doctor pd
            WHERE pd.patient_id = pregnancy.patient_id
            AND pd.doctor_id = auth.uid()
            AND pd.specialization = 'obstetrics'
        )
    );

-- Pregnant patient sees own pregnancy
CREATE POLICY "Patient sees own pregnancy"
    ON pregnancy FOR SELECT
    USING (
        patient_id = auth.uid()
    );

-- Admins see all
CREATE POLICY "Admin sees all pregnancies"
    ON pregnancy FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_role ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- OB/GYN create pregnancy
CREATE POLICY "Obstetricians insert pregnancy"
    ON pregnancy FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM physician p
            WHERE p.id = auth.uid()
            AND p.specialization = 'obstetrics'
        )
    );

-- OB/GYN update their pregnancies
CREATE POLICY "Obstetricians update their pregnancies"
    ON pregnancy FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM patient_doctor pd
            WHERE pd.patient_id = pregnancy.patient_id
            AND pd.doctor_id = auth.uid()
            AND pd.specialization = 'obstetrics'
        )
    );

-- ============================================================================
-- RLS POLICIES: DELIVERY, PUERPERIUM, NEWBORN (similar to pregnancy)
-- ============================================================================

ALTER TABLE delivery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Obstetricians see deliveries they attended"
    ON delivery FOR SELECT
    USING (
        attended_by_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM pregnancy p
            WHERE p.id = delivery.pregnancy_id
            AND EXISTS (
                SELECT 1 FROM patient_doctor pd
                WHERE pd.patient_id = p.patient_id
                AND pd.doctor_id = auth.uid()
                AND pd.specialization = 'obstetrics'
            )
        )
    );

CREATE POLICY "Patient sees own delivery"
    ON delivery FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pregnancy p
            WHERE p.id = delivery.pregnancy_id
            AND p.patient_id = auth.uid()
        )
    );

-- Similar policies para puerperium y newborn_assessment
-- ...

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE pregnancy IS 'Registro de embarazos - Módulo ASIS 4.0 Obstetricia';
COMMENT ON TABLE delivery IS 'Registro de partos y nacimientos';
COMMENT ON TABLE puerperium IS 'Período postparto (después del parto)';
COMMENT ON TABLE newborn_assessment IS 'Evaluación neonatal y datos del recién nacido';

-- ============================================================================
-- END MIGRATION
-- ============================================================================
