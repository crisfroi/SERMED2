-- FASE 2 Module 11: Appointment Calendar Management
-- Tables: appointments, provider_schedules, appointment_reminders, blocked_times

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  facility_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INT DEFAULT 30,
  appointment_type TEXT CHECK (appointment_type IN ('consultation', 'procedure', 'follow_up', 'checkup', 'emergency', 'telemedicine')),
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  chief_complaint TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  schedule_date DATE NOT NULL,
  working_hours_start TIME DEFAULT '08:00',
  working_hours_end TIME DEFAULT '18:00',
  lunch_start TIME DEFAULT '12:00',
  lunch_end TIME DEFAULT '13:00',
  slot_duration_minutes INT DEFAULT 30,
  max_daily_slots INT DEFAULT 16,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_block_times (
  block_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT CHECK (reason IN ('lunch', 'meeting', 'vacation', 'maintenance', 'other')),
  recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointment_reminders (
  reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(appointment_id),
  patient_id UUID NOT NULL,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_channel TEXT CHECK (reminder_channel IN ('sms', 'email', 'phone', 'app_notification')),
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'acknowledged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_provider_schedules_date ON provider_schedules(schedule_date);
CREATE INDEX idx_provider_block_times_date ON provider_block_times(date);
CREATE INDEX idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'appointments,provider_schedules,provider_block_times,appointment_reminders', 'FASE 2 Module 11: Appointment Calendar Management tables created', 'high');
