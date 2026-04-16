-- FASE 2 Module 1: Inpatient Management
-- Tables: admissions, bed_assignments, daily_rounds, occupancy

CREATE TABLE IF NOT EXISTS inpatient_admissions (
  admission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discharge_date TIMESTAMP WITH TIME ZONE,
  facility_id UUID NOT NULL,
  department TEXT NOT NULL,
  admission_type TEXT CHECK (admission_type IN ('emergency', 'planned', 'transfer', 'observation')),
  clinical_summary TEXT,
  status TEXT CHECK (status IN ('active', 'discharged', 'transferred')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bed_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES inpatient_admissions(admission_id),
  bed_id TEXT NOT NULL,
  ward TEXT NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discharge_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_rounds (
  round_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES inpatient_admissions(admission_id),
  round_date DATE NOT NULL,
  provider_id UUID NOT NULL,
  clinical_notes TEXT,
  orders TEXT,
  assessment TEXT,
  status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bed_occupancy (
  occupancy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id TEXT NOT NULL,
  occupancy_date DATE NOT NULL,
  is_occupied BOOLEAN DEFAULT FALSE,
  occupant_admission_id UUID REFERENCES inpatient_admissions(admission_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_inpatient_admissions_patient_id ON inpatient_admissions(patient_id);
CREATE INDEX idx_inpatient_admissions_facility_id ON inpatient_admissions(facility_id);
CREATE INDEX idx_inpatient_admissions_status ON inpatient_admissions(status);
CREATE INDEX idx_bed_assignments_admission_id ON bed_assignments(admission_id);
CREATE INDEX idx_daily_rounds_admission_id ON daily_rounds(admission_id);
CREATE INDEX idx_bed_occupancy_date ON bed_occupancy(occupancy_date);

-- Add to audit trail
INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'inpatient_admissions,bed_assignments,daily_rounds,bed_occupancy', 'FASE 2 Module 1: Inpatient Management tables created', 'high');
