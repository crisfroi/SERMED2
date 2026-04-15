-- ============================================================================
-- MIGRATION 003: ADMIN_2 - WAITING ROOMS & QUEUE MANAGEMENT
-- FECHA: 2026-04-15
-- PROPOSITO: Gestión de Salas de Espera, Colas, Turnos
-- ============================================================================

-- ============================================================================
-- 1. CONSULTATION TYPES
-- ============================================================================

CREATE TABLE IF NOT EXISTS consultation_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(100) NOT NULL UNIQUE,
    average_duration_minutes INT DEFAULT 30,
    priority_default VARCHAR(20) DEFAULT 'normal', -- low, normal, high, emergency
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO consultation_type (type_name, average_duration_minutes, priority_default) VALUES
    ('Consulta General', 30, 'normal'),
    ('Revisión Especializada', 45, 'normal'),
    ('Emergencia', 15, 'emergency'),
    ('Seguimiento', 20, 'normal'),
    ('Procedimiento', 60, 'high')
ON CONFLICT (type_name) DO NOTHING;

-- ============================================================================
-- 2. WAITING ROOMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS waiting_room (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name VARCHAR(100) NOT NULL,
    room_code VARCHAR(20) UNIQUE NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    capacity INT DEFAULT 20,
    status VARCHAR(50) DEFAULT 'active', -- active, closed, maintenance
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waiting_room_clinic ON waiting_room(clinic_id);
CREATE INDEX IF NOT EXISTS idx_waiting_room_status ON waiting_room(status);

-- ============================================================================
-- 3. WAITING QUEUE (Colas de Espera)
-- ============================================================================

CREATE TABLE IF NOT EXISTS waiting_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES waiting_room(id) ON DELETE RESTRICT,
    queue_number INT NOT NULL,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    
    -- Priority & Type
    priority_level VARCHAR(20) DEFAULT 'normal', -- low, normal, high, emergency
    consultation_type_id UUID NOT NULL REFERENCES consultation_type(id) ON DELETE RESTRICT,
    
    -- Times
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metrics
    actual_wait_minutes INT GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - queued_at)) / 60
    ) STORED,
    
    -- Status
    status VARCHAR(50) DEFAULT 'waiting', -- waiting, called, completed, no_show, cancelled
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waiting_queue_room ON waiting_queue(room_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_patient ON waiting_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_status ON waiting_queue(status);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_queued_time ON waiting_queue(queued_at);

-- ============================================================================
-- 4. APPOINTMENT (Citas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider(id) ON DELETE RESTRICT,
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE RESTRICT,
    consultation_type_id UUID NOT NULL REFERENCES consultation_type(id) ON DELETE RESTRICT,
    
    -- Appointment Details
    appointment_datetime TIMESTAMPTZ NOT NULL,
    appointment_duration_minutes INT DEFAULT 30,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, cancelled, no_show, completed
    
    -- Notes
    reason_for_visit TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_patient ON appointment(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_provider ON appointment(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointment_datetime ON appointment(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointment_status ON appointment(status);

-- ============================================================================
-- 5. QUEUE ANALYTICS (Análisis de Colas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS queue_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES waiting_room(id) ON DELETE CASCADE,
    analytics_date DATE NOT NULL,
    
    -- Metrics
    total_patients_served INT DEFAULT 0,
    average_wait_time_minutes INT DEFAULT 0,
    min_wait_time_minutes INT DEFAULT 0,
    max_wait_time_minutes INT DEFAULT 0,
    patients_no_show INT DEFAULT 0,
    
    -- Peak Times
    peak_hour_start TIME,
    peak_hour_end TIME,
    peak_patients_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, analytics_date)
);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_waiting_room_updated_at BEFORE UPDATE ON waiting_room
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_waiting_queue_updated_at BEFORE UPDATE ON waiting_queue
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_appointment_updated_at BEFORE UPDATE ON appointment
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 7. INITIAL DATA
-- ============================================================================

INSERT INTO waiting_room (room_name, room_code, clinic_id) VALUES
    ('Sala Principal', 'SA001', (SELECT id FROM clinic LIMIT 1))
ON CONFLICT (room_code) DO NOTHING;

-- ============================================================================
-- TOTAL: 6 tables created
-- ============================================================================
