-- WEEK 6 - ASIS 7: Surgery Database Schema
-- Migration: 20260415_007_create_surgery_tables.sql
-- Date: April 15, 2026
-- Purpose: Complete surgical management system with pre-op, intra-op, post-op tracking

-- ==================== SURGERY MODULE TABLES ====================

-- 1. surgical_procedures - Surgical procedure catalog
CREATE TABLE public.surgical_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  surgical_specialty TEXT NOT NULL, -- General, Cardiothoracic, Neurosurgery, Orthopedic, etc.
  avg_duration_minutes INTEGER,
  complexity_level TEXT CHECK (complexity_level IN ('minor', 'moderate', 'major', 'complex')),
  anesthesia_type TEXT, -- General, Regional, Local, Spinal
  typical_blood_loss_ml INTEGER,
  post_op_stay_days INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  typical_cost DECIMAL(10, 2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp
);

-- 2. surgery_bookings - Surgical procedure bookings/scheduling
CREATE TABLE public.surgery_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  surgical_procedure_id UUID NOT NULL,
  booking_date TIMESTAMP NOT NULL,
  scheduled_surgery_date TIMESTAMP NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'preparing', 'in_progress', 'completed', 'cancelled', 'postponed')) DEFAULT 'scheduled',
  priority TEXT CHECK (priority IN ('routine', 'urgent', 'emergency')) DEFAULT 'routine',
  pre_op_clearance_status TEXT CHECK (pre_op_clearance_status IN ('pending', 'approved', 'rejected', 'conditional')) DEFAULT 'pending',
  pre_op_notes TEXT,
  expected_duration_minutes INTEGER,
  surgical_site_location VARCHAR(255),
  laterality TEXT CHECK (laterality IN ('left', 'right', 'bilateral', 'midline')),
  allergies TEXT,
  medications_to_avoid TEXT,
  special_equipment_needed TEXT,
  surgeon_id UUID,
  anesthesiologist_id UUID,
  operative_notes TEXT,
  actual_duration_minutes INTEGER,
  complications TEXT,
  blood_transfusion_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  FOREIGN KEY (surgical_procedure_id) REFERENCES public.surgical_procedures(id) ON DELETE RESTRICT
);

-- 3. surgery_teams - Surgical team composition and assignment
CREATE TABLE public.surgery_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_booking_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('lead_surgeon', 'assistant_surgeon', 'anesthesiologist', 'scrub_nurse', 'circulating_nurse', 'surgical_tech')),
  person_id UUID NOT NULL,
  license_number VARCHAR(100),
  specialization TEXT,
  years_experience INTEGER,
  certification_status TEXT CHECK (certification_status IN ('valid', 'expired', 'pending', 'suspended')),
  arrival_time TIMESTAMP,
  departure_time TIMESTAMP,
  performance_notes TEXT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (surgery_booking_id) REFERENCES public.surgery_bookings(id) ON DELETE CASCADE
);

-- 4. post_surgery_followup - Post-operative follow-up tracking
CREATE TABLE public.post_surgery_followup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_booking_id UUID NOT NULL,
  followup_number INTEGER, -- 1st, 2nd, 3rd followup
  followup_date TIMESTAMP,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')) DEFAULT 'scheduled',
  wound_condition TEXT CHECK (wound_condition IN ('healing_well', 'minor_issues', 'infection_signs', 'dehiscence', 'seroma')),
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  mobility_level TEXT CHECK (mobility_level IN ('bed_rest', 'limited', 'partial', 'full')),
  medications_compliance TEXT CHECK (medications_compliance IN ('excellent', 'good', 'fair', 'poor')),
  complications_observed TEXT,
  drain_status TEXT CHECK (drain_status IN ('in_place', 'removed', 'na')),
  drain_output_ml INTEGER,
  suture_removal_date TIMESTAMP,
  return_to_normal_date TIMESTAMP GENERATED ALWAYS AS (
    CASE 
      WHEN mobility_level = 'full' AND pain_level <= 3 THEN followup_date
      ELSE NULL
    END
  ) STORED,
  physiotherapy_referral BOOLEAN DEFAULT false,
  follow_up_provider_id UUID,
  additional_notes TEXT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (surgery_booking_id) REFERENCES public.surgery_bookings(id) ON DELETE CASCADE
);

-- 5. surgical_outcomes - Long-term surgical outcomes tracking
CREATE TABLE public.surgical_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_booking_id UUID NOT NULL,
  outcome_date TIMESTAMP,
  immediate_outcome TEXT CHECK (immediate_outcome IN ('success', 'partial_success', 'failure', 'complications')),
  success_criteria_met BOOLEAN,
  complication_type TEXT CHECK (complication_type IN ('bleeding', 'infection', 'nerve_damage', 'vascular_injury', 'other', 'none')),
  complication_severity TEXT CHECK (complication_severity IN ('minor', 'moderate', 'major', 'life_threatening', 'none')),
  complication_management TEXT,
  readmission_required BOOLEAN DEFAULT false,
  readmission_date TIMESTAMP,
  readmission_reason TEXT,
  hospital_stay_days INTEGER,
  icu_stay_required BOOLEAN DEFAULT false,
  icu_stay_days INTEGER,
  additional_surgeries_needed BOOLEAN DEFAULT false,
  additional_procedures TEXT,
  functional_recovery_timeline VARCHAR(100),
  estimated_recovery_complete TIMESTAMP,
  patient_satisfaction_score INTEGER CHECK (patient_satisfaction_score >= 1 AND patient_satisfaction_score <= 5),
  quality_of_life_impact TEXT CHECK (quality_of_life_impact IN ('improved', 'stable', 'worsened')),
  return_to_work_date TIMESTAMP,
  final_notes TEXT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (surgery_booking_id) REFERENCES public.surgery_bookings(id) ON DELETE CASCADE,
  UNIQUE(surgery_booking_id) -- One outcome per surgery
);

-- ==================== INDEXES ====================

-- Surgery bookings indexes
CREATE INDEX idx_surgery_bookings_patient ON public.surgery_bookings(patient_id);
CREATE INDEX idx_surgery_bookings_procedure ON public.surgery_bookings(surgical_procedure_id);
CREATE INDEX idx_surgery_bookings_status ON public.surgery_bookings(status);
CREATE INDEX idx_surgery_bookings_date ON public.surgery_bookings(scheduled_surgery_date);
CREATE INDEX idx_surgery_bookings_priority ON public.surgery_bookings(priority);

-- Surgery teams indexes
CREATE INDEX idx_surgery_teams_booking ON public.surgery_teams(surgery_booking_id);
CREATE INDEX idx_surgery_teams_person ON public.surgery_teams(person_id);
CREATE INDEX idx_surgery_teams_role ON public.surgery_teams(role);

-- Post-op followup indexes
CREATE INDEX idx_post_op_followup_booking ON public.post_surgery_followup(surgery_booking_id);
CREATE INDEX idx_post_op_followup_date ON public.post_surgery_followup(followup_date);
CREATE INDEX idx_post_op_followup_status ON public.post_surgery_followup(status);

-- Outcomes indexes
CREATE INDEX idx_surgical_outcomes_booking ON public.surgical_outcomes(surgery_booking_id);
CREATE INDEX idx_surgical_outcomes_outcome ON public.surgical_outcomes(immediate_outcome);
CREATE INDEX idx_surgical_outcomes_date ON public.surgical_outcomes(outcome_date);

-- ==================== ROW LEVEL SECURITY POLICIES ====================

-- Enable RLS
ALTER TABLE public.surgical_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_surgery_followup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgical_outcomes ENABLE ROW LEVEL SECURITY;

-- surgical_procedures - Readable by all authenticated users
CREATE POLICY "surgical_procedures_read_all" ON public.surgical_procedures
  FOR SELECT USING (true);

CREATE POLICY "surgical_procedures_insert_admin" ON public.surgical_procedures
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- surgery_bookings - Patients can only see their own bookings
CREATE POLICY "surgery_bookings_patient_read" ON public.surgery_bookings
  FOR SELECT USING (
    patient_id = auth.uid() OR 
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'surgeon', 'medical_staff'))
  );

CREATE POLICY "surgery_bookings_patient_insert" ON public.surgery_bookings
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- surgery_teams - Medical staff and admins only
CREATE POLICY "surgery_teams_medical_read" ON public.surgery_teams
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'surgeon', 'medical_staff'))
  );

CREATE POLICY "surgery_teams_insert_medical" ON public.surgery_teams
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'surgeon'))
  );

-- post_surgery_followup - Patients and medical staff
CREATE POLICY "post_op_followup_read" ON public.post_surgery_followup
  FOR SELECT USING (
    surgery_booking_id IN (
      SELECT id FROM public.surgery_bookings WHERE patient_id = auth.uid()
    ) OR
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'medical_staff'))
  );

-- surgical_outcomes - Patients and medical staff
CREATE POLICY "surgical_outcomes_read" ON public.surgical_outcomes
  FOR SELECT USING (
    surgery_booking_id IN (
      SELECT id FROM public.surgery_bookings WHERE patient_id = auth.uid()
    ) OR
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'medical_staff'))
  );

-- ==================== TRIGGERS ====================

-- Update surgery booking status when surgery started
CREATE OR REPLACE FUNCTION update_surgery_status_in_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.operative_notes IS NOT NULL AND OLD.operative_notes IS NULL THEN
    NEW.status = 'in_progress';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER surgery_status_in_progress_trigger
  BEFORE UPDATE ON public.surgery_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_surgery_status_in_progress();

-- Auto-create outcome record when surgery completed
CREATE OR REPLACE FUNCTION create_surgery_outcome_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status != 'completed') THEN
    INSERT INTO public.surgical_outcomes(surgery_booking_id, outcome_date)
    VALUES (NEW.id, current_timestamp);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_surgery_outcome_trigger
  AFTER UPDATE ON public.surgery_bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_surgery_outcome_on_completion();

-- Update modified timestamp
CREATE OR REPLACE FUNCTION update_surgery_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = current_timestamp;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER surgery_bookings_timestamp_trigger
  BEFORE UPDATE ON public.surgery_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_surgery_modified_timestamp();

CREATE TRIGGER post_op_followup_timestamp_trigger
  BEFORE UPDATE ON public.post_surgery_followup
  FOR EACH ROW
  EXECUTE FUNCTION update_surgery_modified_timestamp();

CREATE TRIGGER surgical_outcomes_timestamp_trigger
  BEFORE UPDATE ON public.surgical_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_surgery_modified_timestamp();

-- ==================== SEED DATA ====================

-- Insert surgical procedures
INSERT INTO public.surgical_procedures (name, description, surgical_specialty, avg_duration_minutes, complexity_level, anesthesia_type, typical_blood_loss_ml, post_op_stay_days, risk_level, typical_cost)
VALUES
  ('Appendectomy', 'Surgical removal of the appendix', 'General Surgery', 45, 'minor', 'General', 100, 1, 'low', 2500.00),
  ('Cholecystectomy', 'Removal of gallbladder, typically laparoscopic', 'General Surgery', 60, 'moderate', 'General', 150, 1, 'low', 3500.00),
  ('Coronary Artery Bypass', 'CABG surgery for heart disease', 'Cardiothoracic', 240, 'complex', 'General', 2000, 5, 'high', 75000.00),
  ('Total Knee Replacement', 'Replacement of knee joint', 'Orthopedic', 90, 'moderate', 'Regional', 500, 2, 'moderate', 35000.00),
  ('Cataract Surgery', 'Removal and replacement of cloudy lens', 'Ophthalmology', 20, 'minor', 'Local', 10, 0, 'low', 2000.00),
  ('Hysterectomy', 'Removal of uterus', 'Gynecology', 120, 'moderate', 'General', 400, 2, 'moderate', 8000.00),
  ('Hip Replacement', 'Replacement of hip joint', 'Orthopedic', 120, 'moderate', 'Regional', 500, 3, 'moderate', 40000.00),
  ('Thyroidectomy', 'Partial or total removal of thyroid', 'General Surgery', 90, 'moderate', 'General', 300, 1, 'moderate', 6000.00),
  ('Prostatectomy', 'Removal of prostate gland', 'Urology', 180, 'major', 'General', 600, 3, 'moderate', 12000.00),
  ('Cesarean Section', 'Surgical delivery of baby', 'ObGyn', 60, 'moderate', 'Regional', 800, 2, 'moderate', 5000.00);
