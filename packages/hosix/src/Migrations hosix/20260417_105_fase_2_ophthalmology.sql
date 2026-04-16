-- FASE 2 Module 6: Ophthalmology Management
-- Tables: eye_exams, refraction_data, ocular_diagnoses, eye_prescriptions

CREATE TABLE IF NOT EXISTS eye_exams (
  exam_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ophthalmologist_id UUID NOT NULL,
  visual_acuity_od TEXT,
  visual_acuity_os TEXT,
  intraocular_pressure_od NUMERIC(5,2),
  intraocular_pressure_os NUMERIC(5,2),
  slit_lamp_findings TEXT,
  fundus_examination TEXT,
  exam_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refraction_data (
  refraction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES eye_exams(exam_id),
  eye_side TEXT CHECK (eye_side IN ('OD', 'OS')),
  sphere NUMERIC(5,2),
  cylinder NUMERIC(5,2),
  axis INT,
  spherical_equivalent NUMERIC(5,2),
  add_power NUMERIC(5,2),
  refractive_error TEXT CHECK (refractive_error IN ('myopia', 'hyperopia', 'astigmatism', 'emmetropia')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocular_diagnoses (
  diagnosis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  diagnosis_date TIMESTAMP WITH TIME ZONE NOT NULL,
  icd_code TEXT,
  diagnosis_name TEXT,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  status TEXT CHECK (status IN ('active', 'resolved', 'chronic')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eye_prescriptions (
  prescription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES eye_exams(exam_id),
  prescription_date TIMESTAMP WITH TIME ZONE NOT NULL,
  eyeglass_prescription TEXT,
  contact_lens_prescription TEXT,
  dispensed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_eye_exams_patient_id ON eye_exams(patient_id);
CREATE INDEX idx_eye_exams_date ON eye_exams(exam_date);
CREATE INDEX idx_refraction_exam_id ON refraction_data(exam_id);
CREATE INDEX idx_ocular_diagnoses_patient_id ON ocular_diagnoses(patient_id);
CREATE INDEX idx_eye_prescriptions_exam_id ON eye_prescriptions(exam_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'eye_exams,refraction_data,ocular_diagnoses,eye_prescriptions', 'FASE 2 Module 6: Ophthalmology Management tables created', 'high');
