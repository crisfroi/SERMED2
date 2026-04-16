-- FASE 2 Module 10: Imaging Worklist Management
-- Tables: imaging_orders, imaging_studies, imaging_reports, dicom_references

CREATE TABLE IF NOT EXISTS imaging_orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  ordering_provider_id UUID NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modality TEXT NOT NULL CHECK (modality IN ('XR', 'CT', 'MRI', 'US', 'NM', 'PET', 'ECHO', 'OTHER')),
  body_part TEXT NOT NULL,
  clinical_indication TEXT,
  urgency TEXT CHECK (urgency IN ('routine', 'urgent', 'stat')),
  status TEXT CHECK (status IN ('ordered', 'scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'ordered',
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS imaging_studies (
  study_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES imaging_orders(order_id),
  patient_id UUID NOT NULL,
  acquisition_date TIMESTAMP WITH TIME ZONE NOT NULL,
  acquisition_time TIME,
  series_count INT,
  image_count INT,
  dicom_server_location TEXT,
  file_size_mb NUMERIC(10,2),
  status TEXT CHECK (status IN ('acquired', 'processing', 'quality_control', 'archived', 'final')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS imaging_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES imaging_studies(study_id),
  order_id UUID NOT NULL REFERENCES imaging_orders(order_id),
  patient_id UUID NOT NULL,
  radiologist_id UUID NOT NULL,
  report_date TIMESTAMP WITH TIME ZONE NOT NULL,
  findings TEXT NOT NULL,
  impression TEXT NOT NULL,
  recommendation TEXT,
  report_status TEXT CHECK (report_status IN ('preliminary', 'final', 'amended')),
  critical_findings BOOLEAN DEFAULT FALSE,
  critical_notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS imaging_segmentations (
  segmentation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES imaging_studies(study_id),
  segmentation_type TEXT NOT NULL,
  volume_ml NUMERIC(10,2),
  surface_area_cm2 NUMERIC(10,2),
  segmentation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ai_algorithm_used TEXT,
  quality_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_imaging_orders_patient_id ON imaging_orders(patient_id);
CREATE INDEX idx_imaging_orders_status ON imaging_orders(status);
CREATE INDEX idx_imaging_studies_order_id ON imaging_studies(order_id);
CREATE INDEX idx_imaging_studies_patient_id ON imaging_studies(patient_id);
CREATE INDEX idx_imaging_reports_study_id ON imaging_reports(study_id);
CREATE INDEX idx_imaging_reports_radiologist_id ON imaging_reports(radiologist_id);
CREATE INDEX idx_imaging_segmentations_study_id ON imaging_segmentations(study_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'imaging_orders,imaging_studies,imaging_reports,imaging_segmentations', 'FASE 2 Module 10: Imaging Worklist Management tables created', 'high');
