-- ============================================================================
-- MIGRATION 002: ADMIN_1 - HUMAN RESOURCES (HR)
-- FECHA: 2026-04-15
-- PROPOSITO: Gestión de Personal, Nóminas, Departamentos, Salarios
-- ============================================================================

-- ============================================================================
-- 1. STAFF (Personal/Empleados)
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    cedula VARCHAR(20) UNIQUE,
    position VARCHAR(100) NOT NULL,
    department_id UUID NOT NULL REFERENCES department(id) ON DELETE RESTRICT,
    hire_date DATE NOT NULL,
    employment_status VARCHAR(50) DEFAULT 'active', -- active, on_leave, terminated, contract_pending
    base_salary_xaf DECIMAL(15, 2) NOT NULL,
    salary_currency VARCHAR(3) DEFAULT 'XAF',
    bank_account VARCHAR(50),
    tin_number VARCHAR(50), -- Tax ID
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_cedula ON staff(cedula);
CREATE INDEX IF NOT EXISTS idx_staff_employment_status ON staff(employment_status);

-- ============================================================================
-- 2. PAYROLL PROCESSING (Procesamiento de Nóminas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_processing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    payroll_period VARCHAR(7) NOT NULL, -- YYYY-MM
    
    -- Salary Components (en XAF)
    base_salary_xaf DECIMAL(15, 2) NOT NULL,
    bonuses_xaf DECIMAL(15, 2) DEFAULT 0.00,
    overtime_xaf DECIMAL(15, 2) DEFAULT 0.00,
    performance_bonus_xaf DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Deductions (en XAF)
    social_security_xaf DECIMAL(15, 2) DEFAULT 0.00,
    health_insurance_xaf DECIMAL(15, 2) DEFAULT 0.00,
    income_tax_xaf DECIMAL(15, 2) DEFAULT 0.00,
    other_deductions_xaf DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Totals (en XAF)
    gross_salary_xaf DECIMAL(15, 2) NOT NULL,
    total_deductions_xaf DECIMAL(15, 2) NOT NULL,
    net_salary_xaf DECIMAL(15, 2) NOT NULL,
    
    -- Status Workflow
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, processed, paid, reversed
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    payment_method VARCHAR(50), -- bank_transfer, cash, check
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    approved_by_id UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'submitted', 'approved', 'processed', 'paid', 'reversed')),
    CONSTRAINT unique_payroll_period UNIQUE(staff_id, payroll_period)
);

CREATE INDEX IF NOT EXISTS idx_payroll_staff ON payroll_processing(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_processing(payroll_period);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll_processing(status);

-- ============================================================================
-- 3. SALARY STRUCTURE (Estructura de Salarios)
-- ============================================================================

CREATE TABLE IF NOT EXISTS salary_structure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_name VARCHAR(100) NOT NULL,
    department_id UUID NOT NULL REFERENCES department(id) ON DELETE CASCADE,
    base_salary_xaf DECIMAL(15, 2) NOT NULL,
    allowances_xaf DECIMAL(15, 2) DEFAULT 0.00,
    deductions_percentage DECIMAL(5, 2) DEFAULT 20.00, -- Percentage of gross salary
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. ATTENDANCE TRACKING (Asistencia)
-- ============================================================================

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(50), -- present, absent, late, half_day, on_leave
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- ============================================================================
-- 5. LEAVE MANAGEMENT (Gestión de Licencias)
-- ============================================================================

CREATE TABLE IF NOT EXISTS leave_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    leave_type VARCHAR(50), -- vacation, sick, personal, unpaid, maternity
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    number_of_days INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    reason TEXT,
    approved_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_staff ON leave_request(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_request(status);

-- ============================================================================
-- 6. TRIGGERS FOR TIMESTAMPS
-- ============================================================================

CREATE TRIGGER trigger_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_payroll_updated_at BEFORE UPDATE ON payroll_processing
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_salary_structure_updated_at BEFORE UPDATE ON salary_structure
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_leave_updated_at BEFORE UPDATE ON leave_request
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 7. INITIAL DATA
-- ============================================================================

INSERT INTO staff (employee_id, full_name, email, position, department_id, hire_date, base_salary_xaf, active) 
VALUES 
    ('EMP001', 'Dr. Juan García', 'juan.garcia@hospital.ec', 'Médico Especialista', 
     (SELECT id FROM department WHERE code = 'OB'), '2024-01-15', 250000.00, true)
ON CONFLICT (employee_id) DO NOTHING;

-- ============================================================================
-- TOTAL: 6 tables created
-- ============================================================================
