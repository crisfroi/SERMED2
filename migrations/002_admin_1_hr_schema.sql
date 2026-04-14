-- WEEK 11 ADMIN 1: SQL MIGRATIONS
-- Gestión de Recursos Humanos (HR Management)
-- Moneda: XAF (Francos CFA)
-- Arquitectura: HOSIX autónomo (THALAMUS = sync opcional)

-- ============================================================================
-- 1. CREAR TABLAS PRINCIPALES
-- ============================================================================

/** 1.1 STAFF_RECORDS: Datos de empleados */
CREATE TABLE staff_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  identification_number VARCHAR(20) UNIQUE,
  
  -- Employment Information
  position_id UUID,
  department_id UUID,
  hire_date DATE NOT NULL,
  contract_type VARCHAR(50) NOT NULL, -- 'indefinido', 'temporal', '6meses', 'contrato'
  employment_status VARCHAR(30) DEFAULT 'activo', -- 'activo','licencia','suspendido','jubilado'
  
  -- Salary (en XAF - Francos CFA)
  base_salary_xaf DECIMAL(15,2) NOT NULL,
  currency_code VARCHAR(3) DEFAULT 'XAF',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  audit_trail JSONB DEFAULT '[]'::jsonb
);

COMMENT ON TABLE staff_records IS 'Registro principal de empleados. Base para nómina, turnos, asistencia (futura).';
COMMENT ON COLUMN staff_records.base_salary_xaf IS 'Salario base mensual en Francos CFA (XAF)';

-- ============================================================================

/** 1.2 STAFF_POSITIONS: Catálogo de posiciones */
CREATE TABLE staff_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL,
  position_name VARCHAR(100) NOT NULL,
  position_level VARCHAR(50) NOT NULL, -- 'senior','mid','junior','support'
  department_id UUID,
  basic_salary_xaf DECIMAL(15,2), -- Referencia de salario base
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(hospital_id, position_name)
);

COMMENT ON TABLE staff_positions IS 'Catálogo de posiciones disponibles en el hospital';

-- ============================================================================

/** 1.3 STAFF_DEPARTMENTS: Departamentos */
CREATE TABLE staff_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  department_code VARCHAR(20) UNIQUE,
  department_head_id UUID REFERENCES staff_records(id) ON DELETE SET NULL,
  budget_monthly_xaf DECIMAL(15,2) DEFAULT 0, -- Presupuesto mensual en XAF
  staff_count INT DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(hospital_id, department_name)
);

COMMENT ON TABLE staff_departments IS 'Departamentos del hospital con presupuesto en XAF';
COMMENT ON COLUMN staff_departments.budget_monthly_xaf IS 'Presupuesto mensual para el departamento en XAF';

-- ============================================================================

/** 1.4 PAYROLL_PROCESSING: Procesamiento de nómina */
CREATE TABLE payroll_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL,
  payroll_period VARCHAR(7) NOT NULL, -- Formato: 'YYYY-MM' (ej: '2026-05')
  
  -- Staff Information
  staff_id UUID NOT NULL REFERENCES staff_records(id) ON DELETE RESTRICT,
  
  -- Salary Components (en XAF)
  base_salary_xaf DECIMAL(15,2) NOT NULL,
  hours_worked INT DEFAULT 0, -- Horas trabajadas (futura: desde asistencia)
  
  -- Añadidos (en XAF)
  bonuses_xaf DECIMAL(15,2) DEFAULT 0,
  bonus_description TEXT,
  overtime_xaf DECIMAL(15,2) DEFAULT 0,
  other_income_xaf DECIMAL(15,2) DEFAULT 0,
  
  -- Deducciones (en XAF)
  deductions_xaf DECIMAL(15,2) DEFAULT 0,
  deduction_description TEXT,
  social_security_xaf DECIMAL(15,2) DEFAULT 0,
  health_insurance_xaf DECIMAL(15,2) DEFAULT 0,
  pension_contribution_xaf DECIMAL(15,2) DEFAULT 0,
  
  -- Impuestos (en XAF)
  income_tax_xaf DECIMAL(15,2) DEFAULT 0,
  
  -- Total Calculado
  gross_salary_xaf DECIMAL(15,2) GENERATED ALWAYS AS 
    (base_salary_xaf + COALESCE(bonuses_xaf,0) + COALESCE(overtime_xaf,0) + COALESCE(other_income_xaf,0)) STORED,
  
  total_deductions_xaf DECIMAL(15,2) GENERATED ALWAYS AS 
    (COALESCE(deductions_xaf,0) + COALESCE(social_security_xaf,0) + 
     COALESCE(health_insurance_xaf,0) + COALESCE(pension_contribution_xaf,0) + 
     COALESCE(income_tax_xaf,0)) STORED,
  
  net_salary_xaf DECIMAL(15,2) GENERATED ALWAYS AS 
    (base_salary_xaf + COALESCE(bonuses_xaf,0) + COALESCE(overtime_xaf,0) + COALESCE(other_income_xaf,0) - 
     COALESCE(deductions_xaf,0) - COALESCE(social_security_xaf,0) - 
     COALESCE(health_insurance_xaf,0) - COALESCE(pension_contribution_xaf,0) - 
     COALESCE(income_tax_xaf,0)) STORED,
  
  -- Status y Workflow
  status VARCHAR(30) DEFAULT 'draft', -- 'draft','submitted','approved','processed','paid','rejected'
  payment_date DATE,
  payment_method VARCHAR(50), -- 'bank_transfer', 'cash', 'check'
  
  -- Auditoría
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_by UUID,
  submitted_at TIMESTAMP,
  approved_by UUID,
  approved_at TIMESTAMP,
  processed_by UUID,
  processed_at TIMESTAMP,
  reject_reason TEXT,
  audit_trail JSONB DEFAULT '[]'::jsonb
);

COMMENT ON TABLE payroll_processing IS 'Procesamiento de nómina con cálculos automáticos en XAF';
COMMENT ON COLUMN payroll_processing.payroll_period IS 'Período en formato YYYY-MM (ej: 2026-05)';
COMMENT ON COLUMN payroll_processing.net_salary_xaf IS 'Salario neto a pagar calculado automáticamente en XAF';

-- ============================================================================

/** 1.5 SALARY_ADJUSTMENTS: Ajustes salariales */
CREATE TABLE salary_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL,
  staff_id UUID NOT NULL REFERENCES staff_records(id) ON DELETE RESTRICT,
  
  adjustment_type VARCHAR(50) NOT NULL, -- 'bonus','deduction','increase','decrease','special'
  amount_xaf DECIMAL(15,2) NOT NULL,
  
  description VARCHAR(500) NOT NULL,
  reason_code VARCHAR(100), -- 'merit','performance','temporary','other'
  
  effective_date DATE NOT NULL,
  end_date DATE, -- NULL si es permanente
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending', -- 'pending','approved','active','expired','cancelled'
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP,
  approved_reason TEXT,
  
  UNIQUE(staff_id, adjustment_type, effective_date)
);

COMMENT ON TABLE salary_adjustments IS 'Ajustes salariales, bonificaciones, deducciones en XAF';

-- ============================================================================

/** 1.6 STAFF_SCHEDULING: Turnos de trabajo */
CREATE TABLE staff_scheduling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL,
  staff_id UUID NOT NULL REFERENCES staff_records(id) ON DELETE RESTRICT,
  
  -- Schedule Details
  schedule_date DATE NOT NULL,
  shift_type VARCHAR(50) NOT NULL, -- 'morning','afternoon','night','on-call','rest'
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  shift_hours NUMERIC(4,2) GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (shift_end - shift_start))/3600) STORED,
  
  -- Location
  location_department VARCHAR(100),
  assigned_unit VARCHAR(100),
  
  -- Status
  is_confirmed BOOLEAN DEFAULT false,
  attendance_status VARCHAR(30), -- 'present','absent','late','early-leave' (futura: desde asistencia)
  
  -- Notes
  notes TEXT,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  confirmed_at TIMESTAMP,
  confirmed_by UUID,
  
  UNIQUE(staff_id, schedule_date, shift_type)
);

COMMENT ON TABLE staff_scheduling IS 'Programación de turnos de personal';
COMMENT ON COLUMN staff_scheduling.shift_hours IS 'Horas de turno calculadas automáticamente';

-- ============================================================================

/** 1.7 PAYROLL_AUDIT_LOG: Auditoría de procesos */
CREATE TABLE payroll_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL,
  payroll_id UUID NOT NULL REFERENCES payroll_processing(id) ON DELETE CASCADE,
  
  action VARCHAR(100) NOT NULL, -- 'created','submitted','approved','rejected','processed','paid','modified'
  action_description TEXT,
  
  -- User Information
  performed_by UUID NOT NULL,
  user_role VARCHAR(50),
  ip_address INET,
  
  -- Change Tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Auditoría
  timestamp TIMESTAMP DEFAULT NOW(),
  
  reason_for_change TEXT
);

COMMENT ON TABLE payroll_audit_log IS 'Log de auditoría para procesos de nómina (cumplimiento)';

-- ============================================================================
-- 2. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

CREATE INDEX idx_staff_hospital_status ON staff_records(hospital_id, employment_status);
CREATE INDEX idx_staff_department ON staff_records(department_id);
CREATE INDEX idx_staff_active ON staff_records(is_active);
CREATE INDEX idx_staff_email ON staff_records(email);

CREATE INDEX idx_payroll_hospital_period ON payroll_processing(hospital_id, payroll_period);
CREATE INDEX idx_payroll_staff ON payroll_processing(staff_id);
CREATE INDEX idx_payroll_status ON payroll_processing(status);
CREATE INDEX idx_payroll_period ON payroll_processing(payroll_period);

CREATE INDEX idx_adjustments_staff ON salary_adjustments(staff_id, effective_date);
CREATE INDEX idx_adjustments_status ON salary_adjustments(status);

CREATE INDEX idx_scheduling_staff_date ON staff_scheduling(staff_id, schedule_date);
CREATE INDEX idx_scheduling_hospital_date ON staff_scheduling(hospital_id, schedule_date);

CREATE INDEX idx_payroll_audit_payroll ON payroll_audit_log(payroll_id);
CREATE INDEX idx_payroll_audit_timestamp ON payroll_audit_log(timestamp DESC);

-- ============================================================================
-- 3. CREAR FUNCIONES PL/pgSQL
-- ============================================================================

/** 3.1 Calcular nómina net (triggeada automáticamente) */
CREATE OR REPLACE FUNCTION calculate_net_salary()
RETURNS TRIGGER AS $$
BEGIN
  -- El cálculo se hace automáticamente via GENERATED ALWAYS (antes era función)
  -- Pero dejamos para auditoría
  NEW.audit_trail := NEW.audit_trail || 
    jsonb_build_array(
      jsonb_build_object(
        'action', 'salary_calculated',
        'timestamp', NOW(),
        'gross', NEW.gross_salary_xaf,
        'deductions', NEW.total_deductions_xaf,
        'net', NEW.net_salary_xaf
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_net_salary IS 'Registra cálculo automático de nómina neta';

-- ============================================================================

/** 3.2 Validar cambios de estado de nómina */
CREATE OR REPLACE FUNCTION validate_payroll_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo permitir transiciones de estado válidas
  IF OLD.status = 'draft' AND NEW.status NOT IN ('submitted','draft') THEN
    RAISE EXCEPTION 'Invalid status transition from draft to %', NEW.status;
  ELSIF OLD.status = 'submitted' AND NEW.status NOT IN ('approved','rejected','submitted') THEN
    RAISE EXCEPTION 'Invalid status transition from submitted to %', NEW.status;
  ELSIF OLD.status = 'approved' AND NEW.status NOT IN ('processed','rejected','approved') THEN
    RAISE EXCEPTION 'Invalid status transition from approved to %', NEW.status;
  ELSIF OLD.status = 'processed' AND NEW.status NOT IN ('paid','processed') THEN
    RAISE EXCEPTION 'Invalid status transition from processed to %', NEW.status;
  ELSIF OLD.status = 'rejected' AND NEW.status NOT IN ('draft','rejected') THEN
    RAISE EXCEPTION 'Invalid status transition from rejected to %', NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_payroll_status_change IS 'Valida transiciones de estado permitidas en nómina';

-- ============================================================================

/** 3.3 Auto-update de updated_at */
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_timestamp IS 'Actualiza automáticamente el timestamp de actualización';

-- ============================================================================

/** 3.4 Registrar cambios en auditoría */
CREATE OR REPLACE FUNCTION log_payroll_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO payroll_audit_log (
    hospital_id,
    payroll_id,
    action,
    performed_by,
    old_values,
    new_values
  ) VALUES (
    NEW.hospital_id,
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'modified'
      ELSE 'unknown'
    END,
    CURRENT_USER::uuid,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_payroll_change IS 'Registra cambios en nómina para auditoría';

-- ============================================================================
-- 4. CREAR TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_update_staff_timestamp
BEFORE UPDATE ON staff_records
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_payroll_timestamp
BEFORE UPDATE ON payroll_processing
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_calculate_payroll_net
BEFORE INSERT OR UPDATE ON payroll_processing
FOR EACH ROW
EXECUTE FUNCTION calculate_net_salary();

CREATE TRIGGER trg_validate_payroll_status
BEFORE UPDATE ON payroll_processing
FOR EACH ROW
EXECUTE FUNCTION validate_payroll_status_change();

CREATE TRIGGER trg_audit_payroll_changes
AFTER INSERT OR UPDATE ON payroll_processing
FOR EACH ROW
EXECUTE FUNCTION log_payroll_change();

-- ============================================================================
-- 5. ROW-LEVEL SECURITY (RLS) - HIPAA & Seguridad
-- ============================================================================

ALTER TABLE staff_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_processing ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_scheduling ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy 1: Staff solo ven su propio registro
CREATE POLICY rls_staff_own_record ON staff_records
  FOR SELECT
  USING (
    id = current_setting('app.current_user_id', true)::uuid
    OR current_setting('app.user_role', true) IN ('director','admin','hr_manager')
  );

-- Policy 2: HR Manager ve staff de su hospital
CREATE POLICY rls_hr_manager_staff ON staff_records
  FOR ALL
  USING (
    hospital_id = current_setting('app.current_hospital_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('director','admin','hr_manager')
  );

-- Policy 3: Staff solo ve su propia nómina
CREATE POLICY rls_staff_own_payroll ON payroll_processing
  FOR SELECT
  USING (
    staff_id = current_setting('app.current_user_id', true)::uuid
    OR current_setting('app.user_role', true) IN ('director','admin','finance_manager')
  );

-- Policy 4: Finance Manager ve nóminas aprobadas
CREATE POLICY rls_finance_payroll ON payroll_processing
  FOR ALL
  USING (
    hospital_id = current_setting('app.current_hospital_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('director','admin','finance_manager')
    AND status IN ('approved','processed','paid')
  );

-- Policy 5: Auditoría: solo ver logs con permisos apropiados
CREATE POLICY rls_audit_log ON payroll_audit_log
  FOR SELECT
  USING (
    current_setting('app.user_role', true) IN ('director','admin','compliance_officer')
  );

-- ============================================================================
-- 6. GRANTS & PERMISOS
-- ============================================================================

-- Por defecto, solo el role que ejecuta tiene acceso
-- Los permisos se configuran en la app via app.user_role setting

-- ============================================================================
-- 7. COMENTARIOS & DOCUMENTACIÓN
-- ============================================================================

COMMENT ON SCHEMA public IS 'WEEK 11 ADMIN 1 - HR Management System (HOSIX autónomo)';

-- ============================================================================
-- FINAL: Mostrar resumen
-- ============================================================================

-- Verificar creación
DO $$
DECLARE
  table_count INT;
  index_count INT;
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name LIKE 'staff_%' OR table_name LIKE 'payroll_%';
  
  SELECT COUNT(*) INTO index_count 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename LIKE 'staff_%' OR tablename LIKE 'payroll_%';
  
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename LIKE 'staff_%' OR tablename LIKE 'payroll_%';
  
  RAISE NOTICE '✅ WEEK 11 ADMIN 1 Migration Complete';
  RAISE NOTICE '📊 Tables created: %', table_count;
  RAISE NOTICE '⚡ Indexes created: %', index_count;
  RAISE NOTICE '🔒 RLS Policies: %', policy_count;
  RAISE NOTICE '💰 Currency: XAF (Francos CFA)';
  RAISE NOTICE '⚠️ Note: Control de Asistencia PENDIENTE para Phase 2';
  
END $$;

-- ============================================================================
-- END OF MIGRATION
-- Estado: ✅ COMPLETO
-- Líneas: 450+ líneas de SQL
-- Tablas: 7 principales
-- Índices: 12+
-- Triggers: 5
-- Funciones: 4
-- RLS Policies: 5
-- ============================================================================
