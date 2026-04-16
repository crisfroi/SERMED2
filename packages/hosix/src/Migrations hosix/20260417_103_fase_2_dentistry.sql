-- FASE 2 Module 4: Dentistry Management
-- Tables: dental_exams, dental_procedures, dental_treatments, tooth_map

CREATE TABLE IF NOT EXISTS dental_exams (
  exam_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dentist_id UUID NOT NULL,
  clinical_notes TEXT,
  periodontal_status TEXT,
  plaque_index NUMERIC(3,2),
  bleeding_index NUMERIC(3,2),
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tooth_recordings (
  recording_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES dental_exams(exam_id),
  tooth_fdi INT,
  surface TEXT,
  condition TEXT CHECK (condition IN ('healthy', 'cavity', 'filled', 'root_canal', 'missing', 'crown')),
  treatment_planned TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dental_procedures (
  procedure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  procedure_type TEXT NOT NULL,
  procedure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  dentist_id UUID NOT NULL,
  teeth_involved TEXT,
  description TEXT,
  status TEXT CHECK (status IN ('planned', 'completed', 'cancelled')) DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dental_treatments (
  treatment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  treatment_plan TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'completed', 'suspended')) DEFAULT 'active',
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_dental_exams_patient_id ON dental_exams(patient_id);
CREATE INDEX idx_dental_exams_dentist_id ON dental_exams(dentist_id);
CREATE INDEX idx_tooth_recordings_exam_id ON tooth_recordings(exam_id);
CREATE INDEX idx_dental_procedures_patient_id ON dental_procedures(patient_id);
CREATE INDEX idx_dental_treatments_patient_id ON dental_treatments(patient_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'dental_exams,tooth_recordings,dental_procedures,dental_treatments', 'FASE 2 Module 4: Dentistry Management tables created', 'high');
