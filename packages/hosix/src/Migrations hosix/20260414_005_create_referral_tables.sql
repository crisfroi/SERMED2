-- ==============================================================================
-- MIGRATION: 20260414_005_create_referral_tables.sql
-- MODULE: ASIS 11 - Referencia y Contrarreferencia (Referral & Counterreferral)
-- DATE: 2026-04-14
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- REFERENTIAL TABLES
-- ==============================================================================

-- Referral types and specialties
CREATE TABLE IF NOT EXISTS referral_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_code VARCHAR(30) UNIQUE NOT NULL,
  type_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100),
  description TEXT,
  average_response_days INT DEFAULT 7,
  requires_authorization BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specialist providers/facilities
CREATE TABLE IF NOT EXISTS specialist_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_name VARCHAR(255) NOT NULL,
  facility_code VARCHAR(50),
  specialty VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  availability_hours VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- CORE OPERATIONAL TABLES
-- ==============================================================================

-- Outgoing referral requests
CREATE TABLE IF NOT EXISTS referral_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  referral_type_id UUID NOT NULL REFERENCES referral_types(id),
  referring_provider_id UUID,
  specialist_facility_id UUID REFERENCES specialist_facilities(id),
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'routine', -- routine, urgent, STAT
  clinical_indication TEXT NOT NULL,
  clinical_history TEXT,
  relevant_exams TEXT,
  medications_current TEXT,
  allergies TEXT,
  insurance_authorization_code VARCHAR(50),
  insurance_authorization_expiry DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, received_by_specialist, in_progress, completed, closed, cancelled
  expected_response_date DATE,
  referral_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Responses from specialists
CREATE TABLE IF NOT EXISTS specialist_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_request_id UUID NOT NULL REFERENCES referral_requests(id),
  specialist_provider_id UUID,
  specialist_facility_id UUID REFERENCES specialist_facilities(id),
  response_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  receipt_date TIMESTAMP,
  clinical_findings TEXT,
  diagnostic_impression TEXT,
  recommended_treatment TEXT,
  medication_recommendations TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_interval_days INT,
  procedures_recommended TEXT,
  return_to_origin_recommended BOOLEAN DEFAULT true,
  urgency_of_return VARCHAR(50), -- routine, urgent, STAT
  specialist_notes TEXT,
  response_status VARCHAR(50) DEFAULT 'pending', -- pending, received, reviewed, acted_upon
  responding_provider_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referral follow-up tracking
CREATE TABLE IF NOT EXISTS referral_followup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_request_id UUID NOT NULL REFERENCES referral_requests(id),
  specialist_response_id UUID REFERENCES specialist_responses(id),
  followup_type VARCHAR(50), -- appointment_scheduled, test_ordered, medication_started, clinical_improvement, no_improvement, complications
  followup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responsible_provider_id UUID,
  clinical_notes TEXT,
  patient_compliance VARCHAR(50), -- good, partial, poor, unknown
  adherence_barriers TEXT,
  completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMP,
  outcomes TEXT,
  next_action VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referral outcomes and impact
CREATE TABLE IF NOT EXISTS referral_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_request_id UUID NOT NULL REFERENCES referral_requests(id),
  closure_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closure_reason VARCHAR(100), -- resolved, improved, referred_elsewhere, lost_to_followup, transferred_care, deceased, unknown
  clinical_outcome VARCHAR(50), -- improved, stable, worsened, no_change, unknown
  symptom_resolution BOOLEAN,
  diagnostic_confirmation BOOLEAN,
  treatment_effectiveness VARCHAR(50), -- excellent, good, fair, poor, unknown
  complications_developed BOOLEAN DEFAULT false,
  complications_description TEXT,
  readmittance_required BOOLEAN DEFAULT false,
  readmittance_reason TEXT,
  cost_saving_estimate NUMERIC(10, 2),
  quality_of_care_rating INT, -- 1-5 scale
  patient_satisfaction_rating INT, -- 1-5 scale
  recommendations_for_improvement TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX idx_referral_requests_patient_id ON referral_requests(patient_id);
CREATE INDEX idx_referral_requests_status ON referral_requests(status);
CREATE INDEX idx_referral_requests_priority ON referral_requests(priority);
CREATE INDEX idx_referral_requests_request_date ON referral_requests(request_date DESC);
CREATE INDEX idx_referral_requests_referral_type ON referral_requests(referral_type_id);
CREATE INDEX idx_specialist_responses_referral_id ON specialist_responses(referral_request_id);
CREATE INDEX idx_specialist_responses_status ON specialist_responses(response_status);
CREATE INDEX idx_specialist_responses_date ON specialist_responses(response_date DESC);
CREATE INDEX idx_referral_followup_referral_id ON referral_followup(referral_request_id);
CREATE INDEX idx_referral_followup_type ON referral_followup(followup_type);
CREATE INDEX idx_referral_outcomes_referral_id ON referral_outcomes(referral_request_id);
CREATE INDEX idx_referral_outcomes_date ON referral_outcomes(closure_date DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Referral requests RLS
ALTER TABLE referral_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_requests_patient_view ON referral_requests
  FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY referral_requests_provider_view ON referral_requests
  FOR SELECT USING (auth.jwt() ->> 'role' = 'healthcare_provider');
CREATE POLICY referral_requests_admin_all ON referral_requests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY referral_requests_insert_provider ON referral_requests
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'healthcare_provider');

-- Specialist responses RLS
ALTER TABLE specialist_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY specialist_responses_patient_view ON specialist_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM referral_requests r
      WHERE r.id = specialist_responses.referral_request_id
      AND r.patient_id = auth.uid()
    )
  );
CREATE POLICY specialist_responses_provider_view ON specialist_responses
  FOR SELECT USING (auth.jwt() ->> 'role' = 'healthcare_provider');
CREATE POLICY specialist_responses_admin_all ON specialist_responses
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Referral followup RLS
ALTER TABLE referral_followup ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_followup_patient_view ON referral_followup
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM referral_requests r
      WHERE r.id = referral_followup.referral_request_id
      AND r.patient_id = auth.uid()
    )
  );
CREATE POLICY referral_followup_provider_view ON referral_followup
  FOR SELECT USING (auth.jwt() ->> 'role' = 'healthcare_provider');
CREATE POLICY referral_followup_admin_all ON referral_followup
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Generate referral number on creation
CREATE OR REPLACE FUNCTION generate_referral_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_number := 'REF-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY') || '-' || 
                        LPAD(CAST(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) AS INT) % 100000 AS TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_referral_number
BEFORE INSERT ON referral_requests
FOR EACH ROW
EXECUTE FUNCTION generate_referral_number();

-- Update referral status when response received
CREATE OR REPLACE FUNCTION update_referral_status_on_response()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_requests
  SET status = 'received_by_specialist', updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.referral_request_id
  AND status != 'completed';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_status_on_response
AFTER INSERT ON specialist_responses
FOR EACH ROW
EXECUTE FUNCTION update_referral_status_on_response();

-- Close referral when outcome recorded
CREATE OR REPLACE FUNCTION close_referral_on_outcome()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_requests
  SET status = 'closed', updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.referral_request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_close_referral_on_outcome
AFTER INSERT ON referral_outcomes
FOR EACH ROW
EXECUTE FUNCTION close_referral_on_outcome();

-- Mark followup as completed when outcome recorded
CREATE OR REPLACE FUNCTION complete_referral_followup_on_outcome()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_followup
  SET completed = true, completion_date = CURRENT_TIMESTAMP
  WHERE referral_request_id = NEW.referral_request_id
  AND completed = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_complete_referral_followup
AFTER INSERT ON referral_outcomes
FOR EACH ROW
EXECUTE FUNCTION complete_referral_followup_on_outcome();

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- Referral types
INSERT INTO referral_types (type_code, type_name, specialty, average_response_days, requires_authorization)
VALUES
  ('CARD', 'Cardiología', 'Cardiology', 5, true),
  ('NEURO', 'Neurología', 'Neurology', 7, true),
  ('ORTHO', 'Traumatología', 'Orthopedic Surgery', 7, false),
  ('PSYCH', 'Psiquiatría', 'Psychiatry', 10, true),
  ('ONCO', 'Oncología', 'Oncology', 3, true),
  ('DIAG', 'Diagnóstico por Imagen', 'Diagnostic Imaging', 2, false),
  ('DERM', 'Dermatología', 'Dermatology', 5, false),
  ('OTO', 'Otorrinolaringología', 'ENT', 7, false),
  ('GASTRO', 'Gastroenterología', 'Gastroenterology', 7, true),
  ('NEPHRO', 'Nefrología', 'Nephrology', 5, true);

-- Specialist facilities
INSERT INTO specialist_facilities (facility_name, facility_code, specialty, contact_phone, contact_email, city)
VALUES
  ('Hospital Metropolitano - Cardiología', 'HM-CARD', 'Cardiology', '+593-2-2441234', 'cardio@hmetro.ec', 'Quito'),
  ('Clínica del Pacífico - Neurología', 'CP-NEURO', 'Neurology', '+593-2-3334567', 'neuro@pacifico.ec', 'Quito'),
  ('SOLCA Oncología', 'SOLCA-ONCO', 'Oncology', '+593-2-2555888', 'oncologia@solca.ec', 'Quito'),
  ('HospitalUno Traumatología', 'H1-ORTHO', 'Orthopedic Surgery', '+593-2-2666999', 'ortho@hospitaluno.ec', 'Quito'),
  ('Clínica Mental Positiva', 'CMP-PSYCH', 'Psychiatry', '+593-2-2777111', 'psych@mentalpos.ec', 'Quito'),
  ('Diagnóstica Ecuatoriana', 'DIAG-IMAG', 'Diagnostic Imaging', '+593-2-2888222', 'imaging@diagnostica.ec', 'Quito'),
  ('Dermatología Total', 'DERM-TOTAL', 'Dermatology', '+593-2-2999333', 'derm@dermatotal.ec', 'Quito'),
  ('OTO Clínica', 'OTO-CLINIC', 'ENT', '+593-2-3000444', 'oto@otoclinic.ec', 'Quito'),
  ('Gastro Center', 'GASTRO-C', 'Gastroenterology', '+593-2-3111555', 'gastro@gastroc.ec', 'Quito'),
  ('Nefrología Especializada', 'NEPHRO-ESP', 'Nephrology', '+593-2-3222666', 'nephro@especial.ec', 'Quito');
