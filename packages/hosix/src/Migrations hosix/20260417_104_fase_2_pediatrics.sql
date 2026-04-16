-- FASE 2 Module 5: Pediatrics Growth Management
-- Tables: growth_measurements, developmental_milestones, pediatric_assessments

CREATE TABLE IF NOT EXISTS growth_measurements (
  measurement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  measurement_date TIMESTAMP WITH TIME ZONE NOT NULL,
  age_months INT,
  weight_kg NUMERIC(6,2),
  height_cm NUMERIC(6,1),
  head_circumference_cm NUMERIC(6,1),
  bmi NUMERIC(5,2),
  who_z_score NUMERIC(5,2),
  growth_status TEXT CHECK (growth_status IN ('wasting', 'stunting', 'normal', 'overweight', 'obese')),
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developmental_milestones (
  milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  milestone_date TIMESTAMP WITH TIME ZONE NOT NULL,
  age_months INT,
  milestone_category TEXT CHECK (milestone_category IN ('motor', 'cognitive', 'language', 'social', 'self_care')),
  milestone_description TEXT,
  achieved BOOLEAN DEFAULT FALSE,
  age_of_achievement_months INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pediatric_assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  nutritional_status TEXT,
  immunization_status TEXT,
  psychomotor_development_score INT,
  assessment_notes TEXT,
  concerns_identified TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_growth_measurements_patient_id ON growth_measurements(patient_id);
CREATE INDEX idx_growth_measurements_date ON growth_measurements(measurement_date);
CREATE INDEX idx_developmental_milestones_patient_id ON developmental_milestones(patient_id);
CREATE INDEX idx_pediatric_assessments_patient_id ON pediatric_assessments(patient_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'growth_measurements,developmental_milestones,pediatric_assessments', 'FASE 2 Module 5: Pediatrics Growth Management tables created', 'high');
