-- ==============================================================================
-- MIGRATION: 20260414_006_create_pharmacotherapy_tables.sql
-- MODULE: ASIS 12 - Farmacoterapia (Pharmacotherapy)
-- DATE: 2026-04-14
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- REFERENTIAL TABLES
-- ==============================================================================

-- Medication master database
CREATE TABLE IF NOT EXISTS medication_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_code VARCHAR(50) UNIQUE NOT NULL,
  generic_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  therapeutic_class VARCHAR(100),
  pharmacological_group VARCHAR(100),
  atc_code VARCHAR(10),
  active_ingredient VARCHAR(255),
  strength VARCHAR(50),
  dosage_form VARCHAR(50), -- tablet, capsule, injection, suspension, cream, etc.
  presentation VARCHAR(100), -- e.g., "30 tablets", "5ml vial"
  route_of_administration VARCHAR(50), -- oral, IV, IM, sublingual, topical, etc.
  onset_time_minutes INT,
  duration_hours INT,
  half_life_hours NUMERIC(5, 2),
  metabolism_pathway TEXT,
  renal_excretion_percentage NUMERIC(5, 2),
  hepatic_clearance_percentage NUMERIC(5, 2),
  is_controlled BOOLEAN DEFAULT false,
  controlled_substance_class VARCHAR(20), -- I, II, III, IV, V
  pregnancy_category VARCHAR(10), -- A, B, C, D, X
  breastfeeding_compatibility VARCHAR(50), -- safe, caution, contraindicated
  contraindications TEXT,
  special_precautions TEXT,
  typical_dose_adult VARCHAR(100),
  typical_dose_pediatric VARCHAR(100),
  cost_per_unit NUMERIC(10, 2),
  is_generic_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drug interactions matrix
CREATE TABLE IF NOT EXISTS medication_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_1_id UUID NOT NULL REFERENCES medication_master(id),
  medication_2_id UUID NOT NULL REFERENCES medication_master(id),
  interaction_severity VARCHAR(50), -- minor, moderate, major, contraindicated
  interaction_mechanism TEXT,
  clinical_effect TEXT,
  management_recommendation TEXT,
  onset_timing VARCHAR(100), -- immediate, hours, days, weeks
  requires_monitoring BOOLEAN DEFAULT false,
  monitoring_parameters TEXT,
  dose_adjustment_required BOOLEAN DEFAULT false,
  dose_adjustment_recommendation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Allergen/reaction database
CREATE TABLE IF NOT EXISTS medication_allergens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES medication_master(id),
  allergen_type VARCHAR(50), -- sulfonamide, penicillin, nsaid, macrolide, etc.
  cross_reactivity_medications TEXT,
  potential_reactions TEXT,
  severity VARCHAR(50), -- mild, moderate, severe, anaphylactic
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- CORE OPERATIONAL TABLES
-- ==============================================================================

-- Patient prescriptions
CREATE TABLE IF NOT EXISTS patient_prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  prescribing_provider_id UUID,
  medication_id UUID NOT NULL REFERENCES medication_master(id),
  prescription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_date DATE NOT NULL,
  end_date DATE,
  duration_days INT,
  frequency VARCHAR(100), -- once daily, twice daily, every 6 hours, as needed, etc.
  dose_value NUMERIC(10, 2),
  dose_unit VARCHAR(50), -- mg, ml, units, etc.
  route VARCHAR(50),
  number_of_refills INT DEFAULT 0,
  refills_remaining INT,
  quantity_prescribed INT,
  special_instructions TEXT,
  indication TEXT NOT NULL,
  clinical_justification TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued, suspended, cancelled
  discontinuation_reason TEXT,
  discontinuation_date DATE,
  authorization_code VARCHAR(50),
  is_essential_medication BOOLEAN DEFAULT false,
  is_preventive BOOLEAN DEFAULT false,
  drug_interaction_review_required BOOLEAN DEFAULT false,
  interaction_review_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drug interaction risk checks
CREATE TABLE IF NOT EXISTS drug_interaction_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES patient_prescriptions(id),
  interacting_medication_id UUID REFERENCES medication_master(id),
  interacting_prescription_id UUID REFERENCES patient_prescriptions(id),
  interaction_severity VARCHAR(50),
  interaction_details TEXT,
  alert_status VARCHAR(50) DEFAULT 'pending', -- pending, acknowledged, managed, resolved
  management_action TEXT,
  action_date TIMESTAMP,
  acknowledged_by_provider_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medication adherence tracking
CREATE TABLE IF NOT EXISTS medication_adherence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES patient_prescriptions(id),
  observed_by_id UUID, -- provider ID who observed
  adherence_level VARCHAR(50), -- excellent, good, fair, poor, not_assessed
  adherence_percentage NUMERIC(5, 2), -- 0-100%
  assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  missed_doses INT DEFAULT 0,
  adherence_barriers TEXT,
  side_effects_reported TEXT,
  motivation_level VARCHAR(50), -- high, moderate, low
  education_provided BOOLEAN DEFAULT false,
  education_topics TEXT,
  medication_reminder_strategy TEXT,
  specialist_referral_recommended BOOLEAN DEFAULT false,
  specialist_referral_reason TEXT,
  follow_up_date DATE,
  follow_up_method VARCHAR(50), -- in_person, phone, sms, email, app
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adverse medication events
CREATE TABLE IF NOT EXISTS adverse_medication_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  prescription_id UUID REFERENCES patient_prescriptions(id),
  medication_id UUID NOT NULL REFERENCES medication_master(id),
  event_type VARCHAR(50), -- allergy, side_effect, toxicity, drug_interaction, contraindication_violation
  event_description TEXT NOT NULL,
  event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  onset_time_hours INT,
  severity VARCHAR(50), -- mild, moderate, severe, life_threatening
  body_system_affected VARCHAR(100), -- respiratory, cardiac, gastrointestinal, dermatologic, etc.
  action_taken TEXT,
  medication_discontinued BOOLEAN DEFAULT false,
  discontinuation_date TIMESTAMP,
  alternative_prescribed UUID REFERENCES medication_master(id),
  hospitalization_required BOOLEAN DEFAULT false,
  managed_by_provider_id UUID,
  reported_to_pharmacovigilance BOOLEAN DEFAULT false,
  pharmacovigilance_number VARCHAR(50),
  outcome VARCHAR(50), -- recovered, recovering, recovered_with_sequelae, fatal, unknown
  outcome_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX idx_patient_prescriptions_patient_id ON patient_prescriptions(patient_id);
CREATE INDEX idx_patient_prescriptions_status ON patient_prescriptions(status);
CREATE INDEX idx_patient_prescriptions_start_date ON patient_prescriptions(start_date);
CREATE INDEX idx_patient_prescriptions_medication_id ON patient_prescriptions(medication_id);
CREATE INDEX idx_drug_interaction_alerts_prescription_id ON drug_interaction_alerts(prescription_id);
CREATE INDEX idx_drug_interaction_alerts_status ON drug_interaction_alerts(alert_status);
CREATE INDEX idx_medication_adherence_prescription_id ON medication_adherence(prescription_id);
CREATE INDEX idx_medication_adherence_level ON medication_adherence(adherence_level);
CREATE INDEX idx_adverse_events_patient_id ON adverse_medication_events(patient_id);
CREATE INDEX idx_adverse_events_medication_id ON adverse_medication_events(medication_id);
CREATE INDEX idx_adverse_events_severity ON adverse_medication_events(severity);
CREATE INDEX idx_medication_interactions_severity ON medication_interactions(interaction_severity);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Patient prescriptions RLS
ALTER TABLE patient_prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY patient_prescriptions_patient_view ON patient_prescriptions
  FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY patient_prescriptions_provider_view ON patient_prescriptions
  FOR SELECT USING (auth.jwt() ->> 'role' = 'healthcare_provider');
CREATE POLICY patient_prescriptions_admin_all ON patient_prescriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY patient_prescriptions_insert_provider ON patient_prescriptions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'healthcare_provider');

-- Drug interaction alerts RLS
ALTER TABLE drug_interaction_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY drug_interaction_alerts_provider_view ON drug_interaction_alerts
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('healthcare_provider', 'pharmacist'));
CREATE POLICY drug_interaction_alerts_admin_all ON drug_interaction_alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Medication adherence RLS
ALTER TABLE medication_adherence ENABLE ROW LEVEL SECURITY;
CREATE POLICY medication_adherence_patient_view ON medication_adherence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patient_prescriptions pp
      WHERE pp.id = medication_adherence.prescription_id
      AND pp.patient_id = auth.uid()
    )
  );
CREATE POLICY medication_adherence_provider_view ON medication_adherence
  FOR SELECT USING (auth.jwt() ->> 'role' = 'healthcare_provider');
CREATE POLICY medication_adherence_admin_all ON medication_adherence
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Adverse events RLS
ALTER TABLE adverse_medication_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY adverse_events_patient_view ON adverse_medication_events
  FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY adverse_events_provider_view ON adverse_medication_events
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('healthcare_provider', 'pharmacist'));
CREATE POLICY adverse_events_admin_all ON adverse_medication_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Check drug interactions when prescription is created
CREATE OR REPLACE FUNCTION check_drug_interactions_on_prescription()
RETURNS TRIGGER AS $$
DECLARE
  existing_rx RECORD;
  interaction_record RECORD;
BEGIN
  -- Find all active prescriptions for this patient
  FOR existing_rx IN
    SELECT pp.id, pp.medication_id
    FROM patient_prescriptions pp
    WHERE pp.patient_id = NEW.patient_id
    AND pp.status = 'active'
    AND pp.id != NEW.id
  LOOP
    -- Check if there's an interaction between the new medication and existing ones
    FOR interaction_record IN
      SELECT mi.id, mi.interaction_severity, mi.interaction_mechanism, mi.clinical_effect
      FROM medication_interactions mi
      WHERE (mi.medication_1_id = NEW.medication_id AND mi.medication_2_id = existing_rx.medication_id)
      OR (mi.medication_1_id = existing_rx.medication_id AND mi.medication_2_id = NEW.medication_id)
    LOOP
      INSERT INTO drug_interaction_alerts (
        prescription_id, interacting_medication_id, interacting_prescription_id,
        interaction_severity, interaction_details, alert_status
      ) VALUES (
        NEW.id, existing_rx.medication_id, existing_rx.id,
        interaction_record.interaction_severity, interaction_record.clinical_effect, 'pending'
      );
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_drug_interactions
AFTER INSERT ON patient_prescriptions
FOR EACH ROW
EXECUTE FUNCTION check_drug_interactions_on_prescription();

-- Create adverse event record and modify prescription if needed
CREATE OR REPLACE FUNCTION handle_adverse_event()
RETURNS TRIGGER AS $$
BEGIN
  -- If severe, auto-flag prescription for discontinuation
  IF NEW.severity IN ('severe', 'life_threatening') THEN
    UPDATE patient_prescriptions
    SET status = 'suspended'
    WHERE id = NEW.prescription_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_adverse_event
AFTER INSERT ON adverse_medication_events
FOR EACH ROW
EXECUTE FUNCTION handle_adverse_event();

-- Update prescription when refills are used
CREATE OR REPLACE FUNCTION update_refills_on_dispensing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE patient_prescriptions
    SET refills_remaining = CASE
      WHEN refills_remaining > 0 THEN refills_remaining - 1
      ELSE 0
    END
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_refills
AFTER UPDATE ON patient_prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_refills_on_dispensing();

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- Common medications
INSERT INTO medication_master (medication_code, generic_name, brand_name, therapeutic_class, pharmacological_group, atc_code, active_ingredient, strength, dosage_form, route_of_administration, onset_time_minutes, duration_hours, half_life_hours, pregnancy_category, typical_dose_adult, cost_per_unit)
VALUES
  ('AMOX', 'Amoxicilina', 'Amoxil', 'Antibiotic', 'Beta-lactam', 'J01CA04', 'Amoxicillin trihydrate', '500mg', 'capsule', 'oral', 30, 8, 1.3, 'B', '500mg every 8 hours', 0.50),
  ('IBUP', 'Ibuprofeno', 'Ibupirac', 'NSAID', 'Analgesic/Antipyretic', 'M01AE01', 'Ibuprofen', '400mg', 'tablet', 'oral', 30, 6, 2.0, 'C', '400-600mg 3-4 times daily', 0.15),
  ('METF', 'Metformina', 'Glucophage', 'Antidiabetic', 'Biguanide', 'A10BA02', 'Metformin HCl', '500mg', 'tablet', 'oral', 60, 12, 3.0, 'B', '500-1000mg twice daily', 0.25),
  ('LISIN', 'Lisinopril', 'Carace', 'ACE Inhibitor', 'Antihypertensive', 'C09AA03', 'Lisinopril dihydrate', '10mg', 'tablet', 'oral', 60, 24, 12.0, 'D', '10-40mg once daily', 1.50),
  ('ASPI', 'Ácido Acetilsalicílico', 'Aspirin', 'NSAID', 'Antiplatelet', 'B01AC06', 'Acetylsalicylic acid', '81mg', 'tablet', 'oral', 30, 4, 0.25, 'C', '81-325mg once daily', 0.10),
  ('OMEP', 'Omeprazol', 'Prilosec', 'PPI', 'Gastric Protectant', 'A02BC01', 'Omeprazole', '20mg', 'capsule', 'oral', 60, 24, 1.0, 'C', '20mg once daily', 0.80),
  ('SIMVA', 'Simvastatina', 'Zocor', 'Statin', 'Lipid Lowering', 'C10AA01', 'Simvastatin', '20mg', 'tablet', 'oral', 120, 24, 2.0, 'X', '20-40mg once daily', 1.20),
  ('CLORA', 'Cloramfenicol', 'Cloramicol', 'Antibiotic', 'Phenicol', 'J01BA01', 'Chloramphenicol', '250mg', 'capsule', 'oral', 30, 12, 4.0, 'C', '250mg every 6 hours', 3.00),
  ('AMINO', 'Aminofilina', 'Asmalix', 'Bronchodilator', 'Xanthine', 'R03DA04', 'Aminophylline', '100mg', 'tablet', 'oral', 30, 6, 8.0, 'A', '100-200mg 3 times daily', 0.35),
  ('TRIMO', 'Trimetoprima', 'TMP', 'Antibiotic', 'Trimethoprim', 'J01EA01', 'Trimethoprim', '100mg', 'tablet', 'oral', 60, 12, 9.0, 'C', '100mg twice daily', 0.40);

-- Drug interaction examples
INSERT INTO medication_interactions (medication_1_id, medication_2_id, interaction_severity, interaction_mechanism, clinical_effect, management_recommendation)
SELECT 
  m1.id, m2.id, 'moderate', 
  'NSAID reduces ACE inhibitor effectiveness',
  'Increased blood pressure, reduced renal protection',
  'Monitor BP closely, consider alternative analgesic'
FROM medication_master m1, medication_master m2
WHERE m1.medication_code = 'IBUP' AND m2.medication_code = 'LISIN'
LIMIT 1;

INSERT INTO medication_interactions (medication_1_id, medication_2_id, interaction_severity, interaction_mechanism, clinical_effect, management_recommendation)
SELECT 
  m1.id, m2.id, 'moderate',
  'Simvastatin inhibits CYP3A4, may increase levels',
  'Risk of muscle breakdown and kidney damage',
  'Monitor liver and kidney function, use lower statin dose'
FROM medication_master m1, medication_master m2
WHERE m1.medication_code = 'SIMVA' AND m2.medication_code = 'CLORA'
LIMIT 1;
