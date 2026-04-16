-- FASE 2 Module 2: ICU Management
-- Tables: icu_admissions, vital_signs, ventilation_settings, icu_severity

CREATE TABLE IF NOT EXISTS icu_admissions (
  icu_admission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discharge_date TIMESTAMP WITH TIME ZONE,
  icu_type TEXT CHECK (icu_type IN ('medical', 'surgical', 'cardiac', 'neuro', 'trauma')),
  severity_on_admission INT,
  status TEXT CHECK (status IN ('active', 'discharged', 'expired')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vital_signs_monitoring (
  vital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icu_admission_id UUID NOT NULL REFERENCES icu_admissions(icu_admission_id),
  recorded_time TIMESTAMP WITH TIME ZONE NOT NULL,
  heart_rate INT,
  systolic_bp INT,
  diastolic_bp INT,
  oxygen_saturation NUMERIC(5,2),
  gcs_score INT,
  temperature NUMERIC(5,2),
  provider_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ventilation_settings (
  ventilation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icu_admission_id UUID NOT NULL REFERENCES icu_admissions(icu_admission_id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  ventilation_type TEXT CHECK (ventilation_type IN ('invasive', 'non_invasive', 'high_flow')),
  mode TEXT,
  fio2 NUMERIC(3,1),
  peep INT,
  status TEXT CHECK (status IN ('active', 'discontinued')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS icu_severity_scores (
  score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icu_admission_id UUID NOT NULL REFERENCES icu_admissions(icu_admission_id),
  score_date DATE NOT NULL,
  sofa_score INT,
  apache_score INT,
  saps_score INT,
  calculated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_icu_admissions_patient_id ON icu_admissions(patient_id);
CREATE INDEX idx_icu_admissions_status ON icu_admissions(status);
CREATE INDEX idx_vital_signs_icu_admission ON vital_signs_monitoring(icu_admission_id);
CREATE INDEX idx_vital_signs_recorded_time ON vital_signs_monitoring(recorded_time);
CREATE INDEX idx_ventilation_icu_admission ON ventilation_settings(icu_admission_id);
CREATE INDEX idx_icu_severity_admission_id ON icu_severity_scores(icu_admission_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'icu_admissions,vital_signs_monitoring,ventilation_settings,icu_severity_scores', 'FASE 2 Module 2: ICU Management tables created', 'high');
