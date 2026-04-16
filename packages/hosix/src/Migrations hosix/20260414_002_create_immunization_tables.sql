-- ============================================================================
-- WEEK 4 - HITO 1: SQL SCHEMAS
-- ASIS 8: Inmunización - Seguimiento de Vacunaciones
-- FECHA: Abril 14, 2026 - 02:00 UTC
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. TABLA: vaccine_schedules
-- Esquemas de vacunación estándar por país/ministerio (referencial)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vaccine_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL, -- EQU_SCHEMA, COL_SCHEMA, etc.
  country_code VARCHAR(5),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_type VARCHAR(50), -- childhood, adolescent, adult, special
  
  -- Schedule definition
  vaccines_included JSONB, -- [{vaccine_id, age_months, dose_number, route}]
  age_range_months_min INTEGER,
  age_range_months_max INTEGER,
  
  -- Metadata
  active BOOLEAN DEFAULT TRUE,
  last_updated DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLA: vaccine_types
-- Tipos de vacunas disponibles (referencial)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vaccine_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL, -- VAX_BCG, VAX_POLIO, VAX_MMR, etc.
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(500),
  disease_prevented TEXT[], -- Array: BCG, tuberculosis, etc.
  
  -- Vaccine properties
  vaccine_class VARCHAR(100), -- live_attenuated, inactivated, subunit, viral_vector
  manufacturer VARCHAR(255),
  vial_size_doses INTEGER,
  storage_temperature_c INTEGER, -- -20, 2-8, 15-25
  cold_chain_required BOOLEAN DEFAULT TRUE,
  
  -- Administration
  route_of_administration VARCHAR(100), -- intradermal, subcutaneous, intramuscular, oral
  injection_site VARCHAR(100), -- deltoid, anterolateral_thigh, etc.
  site_guidance TEXT,
  
  -- Contraindications & precautions
  absolute_contraindications TEXT[],
  precautions TEXT[],
  pregnancy_contraindicated BOOLEAN DEFAULT FALSE,
  immunocompromised_safe BOOLEAN DEFAULT FALSE,
  
  -- Adverse events potential
  common_side_effects TEXT[],
  serious_side_effects TEXT[],
  
  -- Scheduling
  minimum_age_days INTEGER,
  doses_required INTEGER,
  interval_between_doses_days INTEGER,
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLA: patient_vaccinations (HITO 1: Core table)
-- Registro de vacunaciones del paciente
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccine_types(id),
  center_id UUID REFERENCES public.centros_salud(id),
  
  -- Vaccination event
  vaccination_date DATE NOT NULL DEFAULT CURRENT_DATE,
  dose_number INTEGER DEFAULT 1,
  age_at_vaccination_months DECIMAL(6, 2),
  
  -- Vaccine lot information
  vaccine_lot_id UUID REFERENCES public.vaccine_lots(id),
  lot_number VARCHAR(100),
  expiration_date DATE,
  
  -- Administration details
  route_of_administration VARCHAR(100),
  injection_site VARCHAR(100), -- left_arm, right_arm, left_leg, right_leg
  vaccine_batch VARCHAR(100),
  
  -- Provider information
  administered_by_id UUID REFERENCES public.users(id),
  center_location VARCHAR(255),
  
  -- Reaction & follow-up
  immediate_reaction BOOLEAN DEFAULT FALSE,
  reaction_description TEXT,
  reaction_severity VARCHAR(50), -- mild, moderate, severe
  
  -- Schedule tracking
  vaccine_schedule_id UUID REFERENCES public.vaccine_schedules(id),
  scheduled_date DATE,
  appointment_kept BOOLEAN DEFAULT TRUE,
  
  -- Observations
  clinical_notes TEXT,
  next_vaccine_date DATE,
  next_vaccine_id UUID REFERENCES public.vaccine_types(id),
  
  -- Documentation
  certificate_generated BOOLEAN DEFAULT FALSE,
  certificate_number VARCHAR(100),
  
  -- System metadata
  status VARCHAR(50) DEFAULT 'completed', -- scheduled, completed, missed, refused, contraindicated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLA: vaccine_lots
-- Lotes de vacunas y control de inventario
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vaccine_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vaccine_id UUID NOT NULL REFERENCES public.vaccine_types(id),
  center_id UUID NOT NULL REFERENCES public.centros_salud(id),
  
  -- Lot identification
  lot_number VARCHAR(100) NOT NULL UNIQUE,
  manufacturer VARCHAR(255),
  country_of_origin VARCHAR(100),
  
  -- Temporal tracking
  manufacture_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  days_until_expiration INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (expiration_date - CURRENT_DATE))::INTEGER
  ) STORED,
  storage_temperature_c INTEGER DEFAULT 2,
  
  -- Inventory
  initial_doses INTEGER NOT NULL,
  doses_used INTEGER DEFAULT 0,
  doses_remaining INTEGER GENERATED ALWAYS AS (initial_doses - doses_used) STORED,
  doses_wasted INTEGER DEFAULT 0,
  
  -- Cold chain
  cold_chain_maintained BOOLEAN DEFAULT TRUE,
  temperature_excursion BOOLEAN DEFAULT FALSE,
  temperature_excursion_notes TEXT,
  
  -- Documentation
  certificate_of_analysis_url TEXT,
  import_documentation VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'available', -- available, depleted, expired, recalled, quarantined
  expiration_alert_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  received_date DATE DEFAULT CURRENT_DATE,
  received_by_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLA: vaccine_adverse_events
-- Eventos adversos reportados después de vacunación
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vaccine_adverse_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vaccination_id UUID NOT NULL REFERENCES public.patient_vaccinations(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccine_types(id),
  
  -- Event details
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  days_after_vaccination INTEGER,
  onset_time_hours INTEGER, -- How many hours after vaccine
  
  -- Event description
  event_type VARCHAR(100), -- local_reaction, systemic_reaction, serious_event
  event_description TEXT,
  severity VARCHAR(50), -- mild, moderate, severe, life_threatening
  
  -- Symptoms
  symptoms TEXT[],
  
  -- Local reactions (if applicable)
  local_redness_mm INTEGER,
  local_swelling_mm INTEGER,
  local_tenderness BOOLEAN DEFAULT FALSE,
  
  -- Systemic reactions (if applicable)
  fever_celsius DECIMAL(4, 2),
  malaise BOOLEAN DEFAULT FALSE,
  myalgia BOOLEAN DEFAULT FALSE,
  arthralgia BOOLEAN DEFAULT FALSE,
  headache BOOLEAN DEFAULT FALSE,
  nausea BOOLEAN DEFAULT FALSE,
  convulsions BOOLEAN DEFAULT FALSE,
  
  -- Management
  treatment_given TEXT,
  hospitalization_required BOOLEAN DEFAULT FALSE,
  hospitalization_duration_days INTEGER,
  
  -- Medical assessment
  causality_assessment VARCHAR(50), -- unlikely, possible, probable, certain
  reporter_id UUID REFERENCES public.users(id),
  
  -- Follow-up
  outcome VARCHAR(50), -- recovered, recovered_with_sequelae, not_recovered, fatal, unknown
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Reporting
  reported_to_health_authority BOOLEAN DEFAULT FALSE,
  report_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'reported', -- reported, under_review, closed
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. TABLA: patient_immunization_gaps
-- Brechas de vacunación identificadas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_immunization_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccine_types(id),
  center_id UUID REFERENCES public.centros_salud(id),
  
  -- Gap identification
  expected_age_months INTEGER,
  actual_age_months INTEGER,
  age_gap_months INTEGER, -- How late the patient is
  
  -- Schedule reference
  vaccine_schedule_id UUID REFERENCES public.vaccine_schedules(id),
  should_have_been_vaccinated_date DATE,
  
  -- Gap details
  dose_number INTEGER,
  reason_for_gap VARCHAR(100), -- missed_appointment, contraindication, refused, not_available
  
  -- Catch-up planning
  recommended_catch_up_date DATE,
  catch_up_appointment_scheduled BOOLEAN DEFAULT FALSE,
  catch_up_appointment_id VARCHAR(100),
  
  -- Risk assessment
  epidemiological_risk VARCHAR(50), -- low, medium, high
  catch_up_priority VARCHAR(50), -- routine, high_priority, urgent
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolution_date DATE,
  resolution_method VARCHAR(100), -- vaccinated, exemption, medical_contraindication
  
  -- Notifications
  parent_notified BOOLEAN DEFAULT FALSE,
  notification_date DATE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES - Performance optimization
-- ============================================================================
CREATE INDEX idx_vaccinations_patient ON public.patient_vaccinations(patient_id);
CREATE INDEX idx_vaccinations_vaccine ON public.patient_vaccinations(vaccine_id);
CREATE INDEX idx_vaccinations_date ON public.patient_vaccinations(vaccination_date);
CREATE INDEX idx_vaccinations_status ON public.patient_vaccinations(status);

CREATE INDEX idx_vaccine_lots_vaccine ON public.vaccine_lots(vaccine_id);
CREATE INDEX idx_vaccine_lots_center ON public.vaccine_lots(center_id);
CREATE INDEX idx_vaccine_lots_expiration ON public.vaccine_lots(expiration_date);
CREATE INDEX idx_vaccine_lots_status ON public.vaccine_lots(status);

CREATE INDEX idx_adverse_events_patient ON public.vaccine_adverse_events(patient_id);
CREATE INDEX idx_adverse_events_vaccination ON public.vaccine_adverse_events(vaccination_id);
CREATE INDEX idx_adverse_events_severity ON public.vaccine_adverse_events(severity);

CREATE INDEX idx_immunization_gaps_patient ON public.patient_immunization_gaps(patient_id);
CREATE INDEX idx_immunization_gaps_vaccine ON public.patient_immunization_gaps(vaccine_id);
CREATE INDEX idx_immunization_gaps_resolved ON public.patient_immunization_gaps(resolved);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.vaccine_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_adverse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_immunization_gaps ENABLE ROW LEVEL SECURITY;

-- vaccine_schedules & vaccine_types - Public read
CREATE POLICY rls_vaccine_schedules_read ON public.vaccine_schedules
  FOR SELECT USING (true);

CREATE POLICY rls_vaccine_types_read ON public.vaccine_types
  FOR SELECT USING (true);

-- patient_vaccinations - User sees own, Health professionals see their patients
CREATE POLICY rls_vaccinations_select ON public.patient_vaccinations
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.jwt() ->> 'role' IN ('admin', 'nurse', 'immunizer') OR
    EXISTS (
      SELECT 1 FROM public.pacientes_profesionales
      WHERE pacientes_profesionales.paciente_id = patient_id
      AND pacientes_profesionales.profesional_id = auth.uid()
    )
  );

CREATE POLICY rls_vaccinations_insert ON public.patient_vaccinations
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'nurse', 'immunizer', 'doctor')
  );

CREATE POLICY rls_vaccinations_update ON public.patient_vaccinations
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'nurse', 'immunizer', 'doctor')
  );

-- vaccine_lots - Health professionals only
CREATE POLICY rls_vaccine_lots_select ON public.vaccine_lots
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'nurse', 'pharmacist', 'immunizer')
  );

CREATE POLICY rls_vaccine_lots_modify ON public.vaccine_lots
  FOR INSERT, UPDATE, DELETE USING (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist')
  );

-- vaccine_adverse_events - Medical personnel
CREATE POLICY rls_adverse_events_select ON public.vaccine_adverse_events
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'doctor', 'nurse', 'pharmacovigilance')
  );

CREATE POLICY rls_adverse_events_insert ON public.vaccine_adverse_events
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'doctor', 'nurse', 'pharmacovigilance')
  );

-- immunization_gaps - Health professionals
CREATE POLICY rls_immunization_gaps_select ON public.patient_immunization_gaps
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'nurse', 'immunizer', 'doctor')
  );

-- ============================================================================
-- TRIGGERS - Automated updates
-- ============================================================================

-- Calculate days after vaccination
CREATE OR REPLACE FUNCTION calculate_vaccination_timing()
RETURNS TRIGGER AS $$
BEGIN
  NEW.days_after_vaccination := EXTRACT(DAY FROM (NEW.event_date - 
    (SELECT vaccination_date FROM public.patient_vaccinations WHERE id = NEW.vaccination_id)))::INTEGER;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vaccination_timing
  BEFORE INSERT OR UPDATE ON public.vaccine_adverse_events
  FOR EACH ROW
  EXECUTE FUNCTION calculate_vaccination_timing();

-- Update vaccine lot doses_used
CREATE OR REPLACE FUNCTION update_vaccine_lot_doses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vaccine_lots
  SET doses_used = doses_used + 1
  WHERE id = NEW.vaccine_lot_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vaccine_lot_doses
  AFTER INSERT ON public.patient_vaccinations
  FOR EACH ROW
  WHEN (NEW.vaccine_lot_id IS NOT NULL)
  EXECUTE FUNCTION update_vaccine_lot_doses();

-- ============================================================================
-- SEED DATA - Vaccine Types (Key vaccines)
-- ============================================================================
INSERT INTO public.vaccine_types (code, name, full_name, disease_prevented, vaccine_class, route_of_administration, minimum_age_days, doses_required) VALUES
  ('VAX_BCG', 'BCG', 'Bacillus Calmette-Guérin', ARRAY['tuberculosis'], 'live_attenuated', 'intradermal', 0, 1),
  ('VAX_POLIO', 'OPV', 'Vacuna Polio Oral', ARRAY['poliomyelitis'], 'live_attenuated', 'oral', 0, 3),
  ('VAX_POLIO_IPV', 'IPV', 'Vacuna Polio Inactivada', ARRAY['poliomyelitis'], 'inactivated', 'intramuscular', 0, 4),
  ('VAX_PENTAVAL', 'Pentavalente', 'DPT + HvB + Hib', ARRAY['diphtheria','pertussis','tetanus','hepatitis_b','haemophilus_influenzae'], 'inactivated', 'intramuscular', 0, 3),
  ('VAX_MMR', 'MMR', 'Sarampión, Paperas, Rubeola', ARRAY['measles','mumps','rubella'], 'live_attenuated', 'subcutaneous', 365, 2),
  ('VAX_VARICELA', 'Varicela', 'Varicela', ARRAY['varicella'], 'live_attenuated', 'subcutaneous', 365, 2),
  ('VAX_ROTAVIRUS', 'Rotavirus', 'Rotavirus', ARRAY['rotavirus'], 'live_attenuated', 'oral', 0, 3),
  ('VAX_PCV', 'PCV13', 'Neumococo Conjugada', ARRAY['pneumococcus'], 'inactivated', 'intramuscular', 0, 4),
  ('VAX_INFLUENZA', 'Influenza Estacional', 'Influenza', ARRAY['influenza'], 'inactivated', 'intramuscular', 180, 2),
  ('VAX_FIEBRE_AMARILLA', 'Fiebre Amarilla', 'Fiebre Amarilla', ARRAY['yellow_fever'], 'live_attenuated', 'subcutaneous', 365, 1)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- GRANTS - Permissions
-- ============================================================================
GRANT SELECT ON public.vaccine_schedules TO authenticated;
GRANT SELECT ON public.vaccine_types TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.patient_vaccinations TO authenticated;
GRANT SELECT ON public.vaccine_lots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vaccine_adverse_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.patient_immunization_gaps TO authenticated;
