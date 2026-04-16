-- FASE 2 Module 9: Contact Tracing Management
-- Tables: contact_traces, contact_notifications, epidemiology_events, public_health_alerts

CREATE TABLE IF NOT EXISTS contact_traces (
  trace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_patient_id UUID NOT NULL,
  contact_patient_id UUID NOT NULL,
  disease_type TEXT NOT NULL,
  exposure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  relationship TEXT,
  contact_duration_minutes INT,
  location_of_exposure TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high')),
  status TEXT CHECK (status IN ('identified', 'notified', 'monitoring', 'completed')) DEFAULT 'identified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id UUID NOT NULL REFERENCES contact_traces(trace_id),
  contact_patient_id UUID NOT NULL,
  notification_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_method TEXT CHECK (notification_method IN ('sms', 'email', 'phone', 'in_person')),
  message_sent TEXT,
  acknowledgement_received BOOLEAN,
  acknowledgement_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS epidemiology_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  disease_name TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  confirmed_cases INT DEFAULT 0,
  suspected_cases INT DEFAULT 0,
  deaths INT DEFAULT 0,
  geographic_region TEXT,
  outbreak_level TEXT CHECK (outbreak_level IN ('suspected', 'confirmed', 'contained', 'resolved')),
  public_health_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public_health_alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES epidemiology_events(event_id),
  alert_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  alert_level TEXT CHECK (alert_level IN ('information', 'warning', 'emergency')),
  alert_message TEXT,
  target_population TEXT,
  distribution_channels TEXT,
  distributed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_contact_traces_source_patient ON contact_traces(source_patient_id);
CREATE INDEX idx_contact_traces_contact_patient ON contact_traces(contact_patient_id);
CREATE INDEX idx_contact_traces_status ON contact_traces(status);
CREATE INDEX idx_contact_notifications_trace_id ON contact_notifications(trace_id);
CREATE INDEX idx_epidemiology_events_start_date ON epidemiology_events(start_date);
CREATE INDEX idx_public_health_alerts_event_id ON public_health_alerts(event_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'contact_traces,contact_notifications,epidemiology_events,public_health_alerts', 'FASE 2 Module 9: Contact Tracing Management tables created', 'high');
