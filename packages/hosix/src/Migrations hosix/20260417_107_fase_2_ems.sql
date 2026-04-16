-- FASE 2 Module 8: EMS (Emergency Medical Services) Management
-- Tables: emergency_calls, ambulance_dispatch, ems_encounters, emergency_triage

CREATE TABLE IF NOT EXISTS emergency_calls (
  call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_number TEXT UNIQUE,
  call_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  caller_name TEXT,
  caller_phone TEXT,
  incident_location TEXT,
  incident_description TEXT,
  incident_type TEXT CHECK (incident_type IN ('trauma', 'medical', 'cardiac', 'respiratory', 'psychiatric', 'other')),
  priority_level TEXT CHECK (priority_level IN ('routine', 'urgent', 'emergent', 'critical')),
  dispatch_status TEXT CHECK (dispatch_status IN ('received', 'dispatched', 'responding', 'on_scene', 'transported', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ambulance_dispatch (
  dispatch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES emergency_calls(call_id),
  ambulance_id TEXT NOT NULL,
  ambulance_type TEXT CHECK (ambulance_type IN ('basic_support', 'advanced_support', 'critical_care')),
  crew_chief_id UUID,
  paramedic_id UUID,
  dispatch_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  on_scene_time TIMESTAMP WITH TIME ZONE,
  transport_start_time TIMESTAMP WITH TIME ZONE,
  transport_end_time TIMESTAMP WITH TIME ZONE,
  destination_facility TEXT,
  eta_minutes INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ems_patient_encounters (
  encounter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES emergency_calls(call_id),
  dispatch_id UUID REFERENCES ambulance_dispatch(dispatch_id),
  patient_id UUID,
  chief_complaint TEXT,
  vital_signs_on_scene JSONB,
  interventions_provided TEXT,
  medications_given JSONB,
  transport_mode TEXT,
  receiving_facility_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_triage (
  triage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES ems_patient_encounters(encounter_id),
  triage_time TIMESTAMP WITH TIME ZONE NOT NULL,
  esi_level INT CHECK (esi_level > 0 AND esi_level < 6),
  salt_category TEXT,
  vital_signs JSONB,
  abnormalities_detected TEXT,
  transport_recommendation TEXT,
  triage_performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_emergency_calls_call_time ON emergency_calls(call_time);
CREATE INDEX idx_emergency_calls_status ON emergency_calls(dispatch_status);
CREATE INDEX idx_ambulance_dispatch_call_id ON ambulance_dispatch(call_id);
CREATE INDEX idx_ambulance_dispatch_ambulance_id ON ambulance_dispatch(ambulance_id);
CREATE INDEX idx_ems_encounters_call_id ON ems_patient_encounters(call_id);
CREATE INDEX idx_ems_encounters_patient_id ON ems_patient_encounters(patient_id);
CREATE INDEX idx_emergency_triage_encounter_id ON emergency_triage(encounter_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'emergency_calls,ambulance_dispatch,ems_patient_encounters,emergency_triage', 'FASE 2 Module 8: EMS Management tables created', 'high');
