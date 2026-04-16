-- FASE 2 Module 7: Genetics Management
-- Tables: genetic_tests, family_history, genetic_risk_assessments, carrier_status

CREATE TABLE IF NOT EXISTS genetic_tests (
  test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  test_type TEXT NOT NULL,
  test_code TEXT,
  ordering_provider_id UUID,
  specimen_collected TIMESTAMP WITH TIME ZONE,
  result_date TIMESTAMP WITH TIME ZONE,
  result_status TEXT CHECK (result_status IN ('ordered', 'in_progress', 'completed', 'cancelled')),
  result_value TEXT,
  interpretation TEXT,
  pathogenic_findings TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  relation TEXT,
  condition TEXT,
  age_of_onset INT,
  affected BOOLEAN DEFAULT TRUE,
  notes TEXT,
  recorded_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS genetic_risk_assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  risk_condition TEXT,
  cancer_risk_score NUMERIC(5,2),
  cardiovascular_risk_score NUMERIC(5,2),
  neurological_risk_score NUMERIC(5,2),
  recurrence_risk_percentage NUMERIC(5,2),
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  counseling_recommended BOOLEAN,
  genetic_counselor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carrier_status (
  carrier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  gene_name TEXT NOT NULL,
  variant TEXT,
  carrier_status TEXT CHECK (carrier_status IN ('positive', 'negative', 'uncertain')),
  inheritance_pattern TEXT,
  penetrance NUMERIC(5,2),
  phenotype TEXT,
  recorded_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_genetic_tests_patient_id ON genetic_tests(patient_id);
CREATE INDEX idx_genetic_tests_date ON genetic_tests(test_date);
CREATE INDEX idx_family_history_patient_id ON family_history(patient_id);
CREATE INDEX idx_genetic_risk_patient_id ON genetic_risk_assessments(patient_id);
CREATE INDEX idx_carrier_status_patient_id ON carrier_status(patient_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'genetic_tests,family_history,genetic_risk_assessments,carrier_status', 'FASE 2 Module 7: Genetics Management tables created', 'high');
