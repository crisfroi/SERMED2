-- ==============================================================================
-- MIGRATION: 20260414_004_create_laboratory_tables.sql
-- MODULE: ASIS 10 - Laboratorio Clínico (Clinical Laboratory)
-- DATE: 2026-04-14
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- REFERENTIAL TABLES
-- ==============================================================================

-- Lab test types and their specifications
CREATE TABLE IF NOT EXISTS lab_test_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  description TEXT,
  specimen_type VARCHAR(50) NOT NULL, -- blood, urine, stool, cerebrospinal fluid, etc.
  reference_unit VARCHAR(50),
  reference_range_min NUMERIC,
  reference_range_max NUMERIC,
  critical_low NUMERIC,
  critical_high NUMERIC,
  turnaround_time_hours INT DEFAULT 24,
  requires_fasting BOOLEAN DEFAULT false,
  procedure_time_minutes INT,
  cost_amount NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab quality control standards
CREATE TABLE IF NOT EXISTS lab_quality_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  standard_code VARCHAR(20) UNIQUE NOT NULL,
  standard_name VARCHAR(255),
  intra_assay_cv NUMERIC(5, 2), -- Coefficient of variation %
  inter_assay_cv NUMERIC(5, 2),
  accuracy_percentage NUMERIC(5, 2),
  minimum_sample_volume_ml NUMERIC(5, 2),
  storage_temperature_min INT,
  storage_temperature_max INT,
  shelf_life_hours INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- CORE OPERATIONAL TABLES
-- ==============================================================================

-- Lab test orders
CREATE TABLE IF NOT EXISTS lab_test_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  ordering_provider_id UUID,
  test_type_id UUID NOT NULL REFERENCES lab_test_types(id),
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  specimen_collection_date TIMESTAMP,
  specimen_received_date TIMESTAMP,
  specimen_type VARCHAR(50),
  specimen_volume_ml NUMERIC(5, 2),
  specimen_quality_flag VARCHAR(50), -- acceptable, hemolyzed, insufficient, contaminated
  clinical_indication TEXT,
  status VARCHAR(50) DEFAULT 'ordered', -- ordered, collected, received, processing, completed, cancelled
  priority VARCHAR(20) DEFAULT 'routine', -- routine, urgent, STAT
  collection_notes TEXT,
  requested_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab test results
CREATE TABLE IF NOT EXISTS lab_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_order_id UUID NOT NULL REFERENCES lab_test_orders(id),
  result_value NUMERIC,
  result_unit VARCHAR(50),
  reference_range_text VARCHAR(255),
  flag VARCHAR(50), -- normal, low, high, critical_low, critical_high, pending
  performed_by_id UUID,
  result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_id UUID,
  review_date TIMESTAMP,
  quality_control_result VARCHAR(50), -- passed, failed, needs_repeat
  quality_score NUMERIC(3, 1), -- 0-100
  delta_check_status VARCHAR(50), -- no_previous, normal_change, significant_change, critical_change
  interpretation_comment TEXT,
  is_final BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab quality control runs
CREATE TABLE IF NOT EXISTS lab_quality_control_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_type_id UUID NOT NULL REFERENCES lab_test_types(id),
  quality_standard_id UUID REFERENCES lab_quality_standards(id),
  control_level VARCHAR(50), -- low, normal, high
  expected_value NUMERIC,
  observed_value NUMERIC,
  cv_percentage NUMERIC(5, 2),
  result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  run_number INT,
  technician_id UUID,
  qc_status VARCHAR(50) DEFAULT 'pending', -- pending, passed, failed, requires_investigation
  investigation_notes TEXT,
  corrective_action TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab reagent inventory and expiration
CREATE TABLE IF NOT EXISTS lab_reagents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reagent_name VARCHAR(255) NOT NULL,
  reagent_code VARCHAR(50) UNIQUE,
  supplier_id UUID,
  lot_number VARCHAR(50),
  manufacture_date DATE,
  expiration_date DATE NOT NULL,
  quantity_received INT,
  quantity_used INT DEFAULT 0,
  quantity_available INT,
  storage_location VARCHAR(100),
  storage_temperature_min INT,
  storage_temperature_max INT,
  stability_days INT,
  cost_per_unit NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX idx_lab_test_orders_patient_id ON lab_test_orders(patient_id);
CREATE INDEX idx_lab_test_orders_status ON lab_test_orders(status);
CREATE INDEX idx_lab_test_orders_priority ON lab_test_orders(priority);
CREATE INDEX idx_lab_test_orders_order_date ON lab_test_orders(order_date DESC);
CREATE INDEX idx_lab_test_results_test_order_id ON lab_test_results(test_order_id);
CREATE INDEX idx_lab_test_results_flag ON lab_test_results(flag);
CREATE INDEX idx_lab_test_results_result_date ON lab_test_results(result_date DESC);
CREATE INDEX idx_lab_qc_runs_test_type_id ON lab_quality_control_runs(test_type_id);
CREATE INDEX idx_lab_qc_runs_status ON lab_quality_control_runs(qc_status);
CREATE INDEX idx_lab_reagents_expiration ON lab_reagents(expiration_date);
CREATE INDEX idx_lab_reagents_active ON lab_reagents(is_active) WHERE is_active = true;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Lab test orders RLS
ALTER TABLE lab_test_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY lab_test_orders_patient_view ON lab_test_orders
  FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY lab_test_orders_professional_view ON lab_test_orders
  FOR SELECT USING (auth.jwt() ->> 'role' = 'healthcare_provider');
CREATE POLICY lab_test_orders_admin_all ON lab_test_orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Lab test results RLS
ALTER TABLE lab_test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY lab_test_results_patient_view ON lab_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lab_test_orders lto
      WHERE lto.id = lab_test_results.test_order_id
      AND lto.patient_id = auth.uid()
    )
  );
CREATE POLICY lab_test_results_professional_view ON lab_test_results
  FOR SELECT USING (auth.jwt() ->> 'role' = 'healthcare_provider');
CREATE POLICY lab_test_results_admin_all ON lab_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Update lab_test_orders status when result is finalized
CREATE OR REPLACE FUNCTION update_lab_order_status_on_result()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_final = true THEN
    UPDATE lab_test_orders
    SET status = 'completed', updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.test_order_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lab_order_status
AFTER UPDATE ON lab_test_results
FOR EACH ROW
WHEN (OLD.is_final IS DISTINCT FROM NEW.is_final)
EXECUTE FUNCTION update_lab_order_status_on_result();

-- Auto-update reagent available quantity
CREATE OR REPLACE FUNCTION update_reagent_availability()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quantity_available := NEW.quantity_received - NEW.quantity_used;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reagent_availability
BEFORE UPDATE ON lab_reagents
FOR EACH ROW
EXECUTE FUNCTION update_reagent_availability();

-- Create QC alert if test fails
CREATE OR REPLACE FUNCTION alert_on_qc_failure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qc_status = 'failed' THEN
    INSERT INTO lab_quality_control_runs (
      test_type_id, quality_standard_id, control_level, expected_value,
      observed_value, cv_percentage, result_date, qc_status
    ) VALUES (
      NEW.test_type_id, NEW.quality_standard_id, NEW.control_level,
      NEW.expected_value, NEW.observed_value, NEW.cv_percentage,
      CURRENT_TIMESTAMP, 'requires_investigation'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alert_on_qc_failure
AFTER INSERT ON lab_quality_control_runs
FOR EACH ROW
EXECUTE FUNCTION alert_on_qc_failure();

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- Common lab tests
INSERT INTO lab_test_types (code, test_name, specimen_type, reference_unit, reference_range_min, reference_range_max, requires_fasting, cost_amount)
VALUES
  ('HEM', 'Hemoglobin', 'blood', 'g/dL', 12.0, 17.5, false, 15.00),
  ('WBC', 'White Blood Cell Count', 'blood', '10^3/μL', 4.5, 11.0, false, 20.00),
  ('PLT', 'Platelet Count', 'blood', '10^3/μL', 150.0, 400.0, false, 20.00),
  ('GLU', 'Glucose', 'blood', 'mg/dL', 70.0, 100.0, true, 10.00),
  ('CRE', 'Creatinine', 'blood', 'mg/dL', 0.6, 1.2, false, 12.00),
  ('BUN', 'Blood Urea Nitrogen', 'blood', 'mg/dL', 7.0, 20.0, false, 12.00),
  ('TSH', 'Thyroid Stimulating Hormone', 'blood', 'mIU/L', 0.4, 4.0, false, 35.00),
  ('TRIG', 'Triglycerides', 'blood', 'mg/dL', 0.0, 150.0, true, 15.00),
  ('HDL', 'HDL Cholesterol', 'blood', 'mg/dL', 40.0, 999.0, true, 15.00),
  ('LDL', 'LDL Cholesterol', 'blood', 'mg/dL', 0.0, 100.0, true, 15.00);

-- Quality control standards
INSERT INTO lab_quality_standards (standard_code, standard_name, intra_assay_cv, inter_assay_cv, minimum_sample_volume_ml)
VALUES
  ('QC-001', 'High Precision', 2.0, 3.0, 0.5),
  ('QC-002', 'Standard Precision', 3.0, 4.5, 0.5),
  ('QC-003', 'Basic Precision', 5.0, 6.0, 1.0);
