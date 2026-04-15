-- ============================================================================
-- MIGRATION 007: ASIS_08 - LABORATORY (LABORATORIO CLÍNICO)
-- FECHA: 2026-04-15
-- PROPOSITO: Órdenes de laboratorio, pruebas, resultados, gestión de muestras
-- ============================================================================

-- ============================================================================
-- 1. LAB TEST CATALOG (Catálogo de Pruebas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_test (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name VARCHAR(255) NOT NULL UNIQUE,
    test_code VARCHAR(20) UNIQUE,
    category VARCHAR(100), -- Chemistry, Hematology, Immunology, Microbiology, Parasitology, etc
    sample_type VARCHAR(100), -- Plasma, Serum, Whole Blood, Urine, CSF, etc
    normal_range_min DECIMAL(10, 3),
    normal_range_max DECIMAL(10, 3),
    critical_value_low DECIMAL(10, 3),
    critical_value_high DECIMAL(10, 3),
    unit VARCHAR(20),
    description TEXT,
    turn_around_time_hours INT,
    requires_fasting BOOLEAN DEFAULT false,
    special_instructions TEXT,
    cost_xaf DECIMAL(10, 2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_test_code ON lab_test(test_code);
CREATE INDEX idx_lab_test_category ON lab_test(category);

-- ============================================================================
-- 2. LAB ORDERS (Órdenes de Laboratorio)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider(id) ON DELETE RESTRICT,
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE RESTRICT,
    
    -- Order Details
    order_date DATE NOT NULL,
    order_time TIME,
    clinical_indication TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'routine', -- routine, urgent, stat
    requested_for_date DATE,
    
    -- Specimen Collection
    collection_date DATE,
    collection_time TIME,
    specimen_id VARCHAR(50),
    
    -- Sample Info
    collected_by_name VARCHAR(100),
    notes TEXT,
    
    -- Status Tracking
    order_status VARCHAR(50) DEFAULT 'pending', -- pending, collected, in_process, completed, cancelled
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_lab_order_patient ON lab_order(patient_id);
CREATE INDEX idx_lab_order_provider ON lab_order(provider_id);
CREATE INDEX idx_lab_order_date ON lab_order(order_date);
CREATE INDEX idx_lab_order_status ON lab_order(order_status);

-- ============================================================================
-- 3. LAB RESULTS (Resultados de Laboratorio)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES lab_order(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES lab_test(id) ON DELETE RESTRICT,
    
    -- Result Data
    value DECIMAL(15, 5),
    value_unit VARCHAR(20),
    
    -- Interpretation
    interpretation VARCHAR(50), -- normal, low, high, critical_low, critical_high, positive, negative
    reference_range_min DECIMAL(10, 3),
    reference_range_max DECIMAL(10, 3),
    
    -- Result Status
    result_status VARCHAR(50) DEFAULT 'pending', -- pending, preliminary, final, corrected, corrected_and_final
    result_date DATE,
    result_time TIME,
    released_date DATE,
    released_time TIME,
    
    -- Validation
    validated_by_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    validation_date DATE,
    
    -- Comments
    technical_comments TEXT,
    pathologist_comments TEXT,
    
    -- Trend (for serial tests)
    trend_status VARCHAR(50), -- improving, stable, worsening
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_result_order ON lab_result(lab_order_id);
CREATE INDEX idx_lab_result_test ON lab_result(test_id);
CREATE INDEX idx_lab_result_date ON lab_result(result_date);
CREATE INDEX idx_lab_result_status ON lab_result(result_status);

-- ============================================================================
-- 4. QUALITY CONTROL (Control de Calidad)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES lab_test(id) ON DELETE CASCADE,
    
    control_date DATE NOT NULL,
    control_level VARCHAR(50), -- low, normal, high
    
    -- Control Results
    control_value DECIMAL(15, 5),
    expected_value DECIMAL(15, 5),
    variance_percentage DECIMAL(5, 2),
    acceptable_range_min DECIMAL(15, 5),
    acceptable_range_max DECIMAL(15, 5),
    
    -- Status
    qc_status VARCHAR(50), -- passed, failed, investigate
    corrective_action TEXT,
    
    verified_by_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qc_test ON quality_control(test_id);
CREATE INDEX idx_qc_date ON quality_control(control_date);

-- ============================================================================
-- 5. LAB SAMPLE TRACKING (Rastreo de Muestras)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_sample (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specimen_id VARCHAR(50) UNIQUE NOT NULL,
    lab_order_id UUID NOT NULL REFERENCES lab_order(id) ON DELETE CASCADE,
    
    sample_type VARCHAR(100) NOT NULL,
    volume_ml DECIMAL(5, 2),
    
    -- Tracking
    collection_datetime TIMESTAMPTZ,
    received_datetime TIMESTAMPTZ,
    processing_datetime TIMESTAMPTZ,
    storage_location VARCHAR(100),
    
    -- Quality
    sample_quality VARCHAR(50), -- excellent, acceptable, questionable, unsuitable
    quality_issues TEXT,
    
    -- Status
    sample_status VARCHAR(50) DEFAULT 'pending', -- pending, received, processing, archived, discarded
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_sample_specimen ON lab_sample(specimen_id);
CREATE INDEX idx_lab_sample_order ON lab_sample(lab_order_id);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_lab_order_updated_at BEFORE UPDATE ON lab_order
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_lab_result_updated_at BEFORE UPDATE ON lab_result
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 7. INITIAL COMMON TESTS
-- ============================================================================

INSERT INTO lab_test (test_name, test_code, category, sample_type, normal_range_min, normal_range_max, unit, requires_fasting) VALUES
    ('Hemoglobina', 'HEM', 'Hematology', 'Whole Blood', 12.0, 18.0, 'g/dL', false),
    ('Hematocrito', 'HCT', 'Hematology', 'Whole Blood', 36.0, 54.0, '%', false),
    ('Glucosa', 'GLU', 'Chemistry', 'Plasma', 70.0, 100.0, 'mg/dL', true),
    ('Urea', 'UREA', 'Chemistry', 'Serum', 7.0, 20.0, 'mg/dL', true),
    ('Creatinina', 'CRE', 'Chemistry', 'Serum', 0.7, 1.3, 'mg/dL', false),
    ('Colesterol Total', 'CHOL', 'Chemistry', 'Serum', 0.0, 200.0, 'mg/dL', true),
    ('Triglicéridos', 'TRIG', 'Chemistry', 'Serum', 0.0, 150.0, 'mg/dL', true),
    ('Proteína C Reactiva', 'CRP', 'Immunology', 'Serum', 0.0, 3.0, 'mg/L', false),
    ('Plaquetas', 'PLT', 'Hematology', 'Whole Blood', 150.0, 400.0, '10^3/uL', false)
ON CONFLICT (test_code) DO NOTHING;

-- ============================================================================
-- TOTAL: 5 tables created
-- ============================================================================
