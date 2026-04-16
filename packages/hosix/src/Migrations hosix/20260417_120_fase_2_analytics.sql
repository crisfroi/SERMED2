-- FASE 2 Module 12: Reports & Analytics
-- Tables: report_definitions, generated_reports, report_schedules, analytics_metrics

CREATE TABLE IF NOT EXISTS report_definitions (
  definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name TEXT NOT NULL UNIQUE,
  report_type TEXT CHECK (report_type IN ('clinical', 'operational', 'financial', 'patient_demographics', 'appointment', 'treatment', 'custom')),
  description TEXT,
  query_template TEXT NOT NULL,
  parameters JSONB,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on_demand')),
  organization_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generated_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES report_definitions(definition_id),
  report_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  report_period_start DATE,
  report_period_end DATE,
  generated_by UUID,
  status TEXT CHECK (status IN ('generated', 'sent', 'archived', 'failed')),
  file_url TEXT
);

CREATE TABLE IF NOT EXISTS report_schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES report_definitions(definition_id),
  email_recipients TEXT[],
  next_generation_time TIMESTAMP WITH TIME ZONE,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_metrics (
  metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('kpi', 'performance', 'quality', 'financial', 'operational')),
  calculation_method TEXT,
  current_value NUMERIC(12,4),
  target_value NUMERIC(12,4),
  unit_of_measure TEXT,
  measurement_date DATE,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_satisfaction_surveys (
  survey_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  appointment_id UUID,
  provider_id UUID,
  survey_date DATE DEFAULT CURRENT_DATE,
  rating_overall INT CHECK (rating_overall BETWEEN 1 AND 5),
  rating_provider INT CHECK (rating_provider BETWEEN 1 AND 5),
  rating_facility INT CHECK (rating_facility BETWEEN 1 AND 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_report_definitions_type ON report_definitions(report_type);
CREATE INDEX idx_generated_reports_definition_id ON generated_reports(definition_id);
CREATE INDEX idx_generated_reports_generated_at ON generated_reports(generated_at);
CREATE INDEX idx_report_schedules_enabled ON report_schedules(enabled);
CREATE INDEX idx_analytics_metrics_name ON analytics_metrics(metric_name);
CREATE INDEX idx_analytics_metrics_date ON analytics_metrics(measurement_date);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'report_definitions,generated_reports,report_schedules,analytics_metrics,patient_satisfaction_surveys', 'FASE 2 Module 12: Reports & Analytics tables created', 'high');
