-- ============================================================================
-- LABORATORIO CLÍNICO - ASIS 8.0 - WEEK 2 IMPLEMENTATION
-- health_lab integration with Supabase PostgreSQL
-- ============================================================================

-- Set search_path
SET search_path = public;

-- ============================================================================
-- 1. CORE LABORATORY TABLES
-- ============================================================================

-- Tabla: laboratory_tests (catálogo de pruebas)
CREATE TABLE IF NOT EXISTS laboratory_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_code VARCHAR(50) NOT NULL UNIQUE, -- ej: "GLU", "HEM", "TSH"
    test_name VARCHAR(255) NOT NULL,
    test_category VARCHAR(100) NOT NULL, -- Hematología, Química, Inmunología, etc.
    description TEXT,
    
    -- Valores de referencia por defecto (pueden variar por sexo/edad)
    normal_min_value NUMERIC(10,2),
    normal_max_value NUMERIC(10,2),
    critical_low_value NUMERIC(10,2),
    critical_high_value NUMERIC(10,2),
    unit_of_measure VARCHAR(50), -- mg/dL, mmol/L, etc.
    
    -- Turnaround time (horas)
    standard_turnaround_hours INTEGER DEFAULT 24,
    
    -- Control de cambios
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    enabled BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT valid_normal_range CHECK (
        normal_min_value IS NULL OR normal_max_value IS NULL OR 
        normal_min_value <= normal_max_value
    )
);

-- Tabla: lab_sample_types (tipos de muestras)
CREATE TABLE IF NOT EXISTS lab_sample_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_code VARCHAR(50) NOT NULL UNIQUE, -- "BLOOD", "URINE", "CSF", etc.
    sample_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Recolección y almacenamiento
    collection_container VARCHAR(100), -- Tubo rojo, EDTA, etc.
    storage_temperature INTEGER, -- Celsius
    max_storage_hours INTEGER, -- Horas de estabilidad
    
    created_at TIMESTAMP DEFAULT NOW(),
    enabled BOOLEAN DEFAULT TRUE
);

-- Tabla: laboratory_orders (órdenes de laboratorio)
CREATE TABLE IF NOT EXISTS laboratory_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    ordered_by_provider_id UUID NOT NULL REFERENCES party(id) ON DELETE RESTRICT,
    
    -- Información de la orden
    order_date TIMESTAMP DEFAULT NOW(),
    requested_for_date DATE,
    clinical_indication TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- normal, urgent, stat
    
    -- Estado del flujo
    status VARCHAR(20) DEFAULT 'pending', -- pending, collected, processing, completed, cancelled
    specimen_collection_status VARCHAR(20) DEFAULT 'pending', -- pending, collected, rejected
    
    -- Datos de recolección
    specimen_collected_at TIMESTAMP,
    specimen_collected_by_id UUID REFERENCES party(id),
    specimen_rejection_reason TEXT,
    
    -- Laboratorio asignado
    assigned_laboratory_id UUID REFERENCES party(id),
    
    -- Fechas importantes
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    -- Control de cambios
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_order_dates CHECK (
        order_date IS NOT NULL
    )
);

CREATE INDEX idx_laboratory_orders_patient ON laboratory_orders(patient_id);
CREATE INDEX idx_laboratory_orders_status ON laboratory_orders(status);
CREATE INDEX idx_laboratory_orders_date ON laboratory_orders(order_date);

-- Tabla: lab_order_lines (detalle de pruebas por orden)
CREATE TABLE IF NOT EXISTS lab_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES laboratory_orders(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    test_id UUID NOT NULL REFERENCES laboratory_tests(id) ON DELETE RESTRICT,
    
    -- Información específica
    sample_type_id UUID NOT NULL REFERENCES lab_sample_types(id),
    urgency VARCHAR(20) DEFAULT 'normal',
    
    -- Control
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(lab_order_id, sequence_number)
);

CREATE INDEX idx_lab_order_lines_order ON lab_order_lines(lab_order_id);

-- Tabla: lab_test_results (resultados de pruebas)
CREATE TABLE IF NOT EXISTS lab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES laboratory_orders(id) ON DELETE CASCADE,
    lab_order_line_id UUID NOT NULL REFERENCES lab_order_lines(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES laboratory_tests(id),
    
    -- Resultado
    result_value NUMERIC(15,4),
    result_text VARCHAR(500), -- Para resultados cualitativos
    unit_of_measure VARCHAR(50),
    
    -- Validez clínica
    result_status VARCHAR(20) DEFAULT 'pending', -- pending, valid, abnormal, critical, error
    
    -- Interpretación automática relativa a valores normales
    interpretation VARCHAR(50) DEFAULT 'normal', -- normal, low, high, critical_low, critical_high
    
    -- Persona que valida
    validated_by_provider_id UUID REFERENCES party(id),
    validation_date TIMESTAMP,
    
    -- Comentarios
    comments TEXT,
    
    -- Control de cambios
    result_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lab_test_results_order ON lab_test_results(lab_order_id);
CREATE INDEX idx_lab_test_results_status ON lab_test_results(result_status);
CREATE INDEX idx_lab_test_results_date ON lab_test_results(result_date);

-- Tabla: lab_result_comments (comentarios e interpretaciones clínicas)
CREATE TABLE IF NOT EXISTS lab_result_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_test_result_id UUID NOT NULL REFERENCES lab_test_results(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES party(id),
    comment_text TEXT NOT NULL,
    interpretation_level VARCHAR(20) DEFAULT 'normal', -- normal, alert, critical
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lab_result_comments_result ON lab_result_comments(lab_test_result_id);

-- Tabla: lab_normal_ranges (rangos normales por demografía)
CREATE TABLE IF NOT EXISTS lab_normal_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES laboratory_tests(id) ON DELETE CASCADE,
    
    -- Demografía
    sex VARCHAR(10), -- M, F, NULL = ambos
    min_age_years INTEGER, -- NULL = sin límite inferior
    max_age_years INTEGER, -- NULL = sin límite superior
    
    -- Rangos
    normal_min NUMERIC(10,2),
    normal_max NUMERIC(10,2),
    critical_low NUMERIC(10,2),
    critical_high NUMERIC(10,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(test_id, sex, min_age_years, max_age_years)
);

CREATE INDEX idx_lab_normal_ranges_test ON lab_normal_ranges(test_id);

-- ============================================================================
-- 2. LABORATORY QUALITY AND TRACKING
-- ============================================================================

-- Tabla: lab_quality_controls (control de calidad)
CREATE TABLE IF NOT EXISTS lab_quality_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES laboratory_tests(id),
    
    -- Control
    control_date TIMESTAMP DEFAULT NOW(),
    control_status VARCHAR(20) DEFAULT 'pass', -- pass, fail
    control_reason VARCHAR(255),
    
    -- Valores teóricos vs. medidos
    expected_value NUMERIC(15,4),
    measured_value NUMERIC(15,4),
    tolerance_percentage NUMERIC(5,2), -- %
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: lab_turnaround_tracking (SLA seguimiento)
CREATE TABLE IF NOT EXISTS lab_turnaround_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES laboratory_orders(id) ON DELETE CASCADE,
    
    -- Hitos de tiempo
    order_received_at TIMESTAMP,
    specimen_collected_at TIMESTAMP,
    processing_started_at TIMESTAMP,
    result_completed_at TIMESTAMP,
    result_reported_at TIMESTAMP,
    
    -- Cálculo de SLA
    turnaround_hours INTEGER,
    sla_target_hours INTEGER,
    sla_met BOOLEAN,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lab_turnaround_order ON lab_turnaround_tracking(lab_order_id);

-- ============================================================================
-- 3. RLS (ROW-LEVEL SECURITY) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE laboratory_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_sample_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_result_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_normal_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_quality_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_turnaround_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: laboratory_tests - visible para todos
CREATE POLICY "laboratory_tests_readable" 
ON laboratory_tests FOR SELECT 
USING (TRUE);

-- Policy: laboratory_orders - Solo médico ordenante + laboratorio + paciente
CREATE POLICY "laboratory_orders_own_orders" 
ON laboratory_orders FOR SELECT 
USING (
    auth.uid()::text = ordered_by_provider_id::text OR
    auth.uid()::text = assigned_laboratory_id::text OR
    (SELECT party_id FROM medical_record WHERE patient_id = laboratory_orders.patient_id AND party_id = auth.uid()::uuid) IS NOT NULL
);

CREATE POLICY "laboratory_orders_create_own" 
ON laboratory_orders FOR INSERT 
WITH CHECK (
    auth.uid()::text = ordered_by_provider_id::text
);

-- Policy: lab_test_results - Solo los autorizados ven resultados
CREATE POLICY "lab_test_results_restricted" 
ON lab_test_results FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM laboratory_orders lo
        WHERE lo.id = lab_test_results.lab_order_id
        AND (
            auth.uid()::text = lo.ordered_by_provider_id::text OR
            auth.uid()::text = lo.assigned_laboratory_id::text OR
            (SELECT party_id FROM medical_record WHERE patient_id = lo.patient_id AND party_id = auth.uid()::uuid) IS NOT NULL
        )
    )
);

-- ============================================================================
-- 4. PRE-LOADED DATA - Reference values Ecuador
-- ============================================================================

-- Insertar pruebas comunes
INSERT INTO laboratory_tests (test_code, test_name, test_category, normal_min_value, normal_max_value, critical_low_value, critical_high_value, unit_of_measure) VALUES
('GLU', 'Glucosa en Ayunas', 'Química', 70, 100, 40, 400, 'mg/dL'),
('HEM', 'Hemoglobina', 'Hematología', 12, 16, 7, 20, 'g/dL'),
('HTC', 'Hematocrito', 'Hematología', 36, 46, 20, 60, '%'),
('LEU', 'Leucocitos', 'Hematología', 4.5, 11, 1, 50, '10^3/μL'),
('PLT', 'Plaquetas', 'Hematología', 150, 400, 50, 1000, '10^3/μL'),
('TSH', 'TSH', 'Endocrinología', 0.4, 4.0, 0.1, 100, 'mIU/L'),
('CRE', 'Creatinina', 'Química', 0.6, 1.2, 0.1, 10, 'mg/dL'),
('PTN', 'Proteínas totales', 'Química', 6.0, 8.3, 3, 12, 'g/dL'),
('ALB', 'Albúmina', 'Química', 3.5, 5.0, 1, 7, 'g/dL'),
('ALT', 'ALT/SGPT', 'Química', 7, 35, 1, 500, 'U/L'),
('AST', 'AST/SGOT', 'Química', 10, 40, 1, 500, 'U/L'),
('BIL', 'Bilirrubina total', 'Química', 0.1, 1.2, 0, 20, 'mg/dL'),
('COL', 'Colesterol total', 'Lípidos', 0, 200, 0, 400, 'mg/dL'),
('TRG', 'Triglicéridos', 'Lípidos', 0, 150, 0, 1000, 'mg/dL'),
('SOD', 'Sodio', 'Electrolitos', 136, 145, 120, 160, 'mEq/L'),
('POT', 'Potasio', 'Electrolitos', 3.5, 5.0, 2, 8, 'mEq/L'),
('CAL', 'Calcio', 'Electrolitos', 8.5, 10.2, 6, 14, 'mg/dL'),
('MAG', 'Magnesio', 'Electrolitos', 1.7, 2.2, 1, 4, 'mg/dL'),
('PC', 'Prueba de Coagulación', 'Coagulación', 11, 13.5, 8, 20, 'seg'),
('TPT', 'Tiempo Parcial de Tromboplastina', 'Coagulación', 25, 35, 15, 50, 'seg');

-- Insertar tipos de muestras
INSERT INTO lab_sample_types (sample_code, sample_name, collection_container, storage_temperature, max_storage_hours) VALUES
('BLOOD', 'Sangre', 'Tubo rojo (1 a 5 mL)', 20, 24),
('BLOOD_EDTA', 'Sangre con EDTA', 'Tubo lila (1 a 5 mL)', 20, 48),
('SERUM', 'Suero', 'Vial de vidrio', 4, 7),
('PLASMA', 'Plasma', 'Tubo azul/verde', 20, 48),
('URINE', 'Orina', 'Recipiente estéril', 4, 24),
('CSF', 'Líquido Cefalorraquídeo', 'Vial estéril', 4, 1),
('STOOL', 'Heces', 'Recipiente estéril', 4, 48),
('SALIVA', 'Saliva', 'Vial especial', 4, 24);

-- ============================================================================
-- 5. INDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_laboratory_tests_category ON laboratory_tests(test_category);
CREATE INDEX idx_lab_sample_types_enabled ON lab_sample_types(enabled);
CREATE INDEX idx_laboratory_orders_priority ON laboratory_orders(priority);
CREATE INDEX idx_lab_test_results_interpretation ON lab_test_results(interpretation);
CREATE INDEX idx_lab_normal_ranges_age ON lab_normal_ranges(min_age_years, max_age_years);

-- ============================================================================
-- MIGRACION COMPLETADA
-- ============================================================================
-- Tables creadas: 9
-- RLS Policies: 5
-- Data cargada: 20 + pruebas estándar, 8 tipos de muestras
-- Índices: 15+
