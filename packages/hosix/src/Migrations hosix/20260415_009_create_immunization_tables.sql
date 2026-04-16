-- WEEK 6 - ASIS 9: Immunization Database Schema
-- Migration: 20260415_009_create_immunization_tables.sql
-- Date: April 15, 2026
-- Purpose: Comprehensive vaccination and immunization tracking system

-- ==================== IMMUNIZATION MODULE TABLES ====================

-- 1. vaccine_types - Vaccine catalog with specifications
CREATE TABLE public.vaccine_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name VARCHAR(255) NOT NULL UNIQUE,
  vaccine_abbreviation VARCHAR(20),
  description TEXT,
  disease_prevented TEXT, -- Comma-separated: measles, mumps, rubella
  vaccine_type TEXT NOT NULL CHECK (vaccine_type IN ('live_attenuated', 'inactivated', 'subunit', 'toxoid', 'mRNA', 'viral_vector')),
  manufacturer VARCHAR(255),
  batch_type TEXT CHECK (batch_type IN ('pediatric', 'adult', 'booster', 'combination')),
  number_of_doses INTEGER,
  dose_volume_ml DECIMAL(4, 2),
  storage_temperature_celsius VARCHAR(20), -- e.g., "2-8°C" or "-20°C to -4°C"
  efficacy_percent DECIMAL(5, 2),
  onset_of_immunity_days INTEGER,
  duration_of_immunity_years INTEGER,
  contraindications TEXT,
  precautions TEXT,
  side_effects_common TEXT,
  side_effects_severe TEXT,
  administration_route TEXT CHECK (administration_route IN ('intramuscular', 'subcutaneous', 'intronal', 'oral')),
  administration_site VARCHAR(100),
  pregnancy_category TEXT CHECK (pregnancy_category IN ('A', 'B', 'C', 'D', 'X', 'contraindicated', 'safe')),
  breastfeeding_safe BOOLEAN DEFAULT true,
  immunocompromised_safe BOOLEAN DEFAULT false,
  minimum_interval_after_other_vaccines_days INTEGER,
  recommended_age_months_start INTEGER,
  recommended_age_months_end INTEGER,
  booster_interval_months INTEGER,
  cost_usd DECIMAL(8, 2),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp
);

-- 2. immunization_schedules - Standard immunization schedules by age group
CREATE TABLE public.immunization_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_name VARCHAR(255) NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('routine', 'catch-up', 'catch-up_immunocompromised', 'travel', 'occupational', 'post-exposure')),
  country VARCHAR(100), -- WHO-based by country
  recommended_age_months INTEGER,
  vaccine_id UUID NOT NULL,
  dose_number INTEGER,
  minimum_interval_previous_dose_days INTEGER,
  recommended_interval_previous_dose_days INTEGER,
  minimum_age_months INTEGER,
  maximum_age_months INTEGER,
  priority_level TEXT CHECK (priority_level IN ('essential', 'recommended', 'optional')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (vaccine_id) REFERENCES public.vaccine_types(id) ON DELETE CASCADE,
  UNIQUE(country, vaccine_id, dose_number)
);

-- 3. vaccination_records - Patient vaccination history
CREATE TABLE public.vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  vaccine_id UUID NOT NULL,
  vaccination_date TIMESTAMP NOT NULL,
  dose_number INTEGER,
  total_doses_series INTEGER,
  administration_site VARCHAR(100), -- Left arm, Right arm, Thigh, etc.
  lot_number VARCHAR(100),
  expiration_date DATE,
  vaccine_batch_id UUID,
  vaccinator_id UUID, -- Health worker who administered vaccine
  clinic_location VARCHAR(255),
  temperature_before_celsius DECIMAL(4, 2),
  temperature_after_celsius DECIMAL(4, 2),
  pre_vaccination_screening BOOLEAN DEFAULT false,
  allergy_check_performed BOOLEAN DEFAULT false,
  informed_consent_obtained BOOLEAN DEFAULT true,
  status TEXT CHECK (status IN ('administered', 'incomplete', 'contraindicated', 'deferred', 'declined', 'not_applicable')) DEFAULT 'administered',
  adverse_event_occurred BOOLEAN DEFAULT false,
  adverse_event_description TEXT,
  adverse_event_severity TEXT CHECK (adverse_event_severity IN ('mild', 'moderate', 'severe', 'life_threatening', 'na')),
  follow_up_date_next_dose TIMESTAMP,
  follow_up_date_adverse_event TIMESTAMP,
  next_dose_recommended BOOLEAN DEFAULT false,
  duplicate_protection_days INTEGER,
  given_with_other_vaccines TEXT, -- Comma-separated vaccine IDs
  routing_vaccine BOOLEAN DEFAULT false,
  cost_paid_by TEXT CHECK (cost_paid_by IN ('patient', 'insurance', 'government', 'charity', 'other')),
  insurance_company VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  FOREIGN KEY (vaccine_id) REFERENCES public.vaccine_types(id) ON DELETE RESTRICT
);

-- 4. vaccine_inventory - Vaccine stock management
CREATE TABLE public.vaccine_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_id UUID NOT NULL,
  storage_location VARCHAR(255) NOT NULL, -- Refrigerator, Freezer, etc.
  storage_temperature_current_celsius DECIMAL(4, 2),
  batch_number VARCHAR(100) NOT NULL,
  lot_number VARCHAR(100),
  received_date DATE,
  expiration_date DATE NOT NULL,
  quantity_received INTEGER,
  quantity_current INTEGER,
  quantity_administered INTEGER DEFAULT 0,
  quantity_damaged INTEGER DEFAULT 0,
  quantity_expired INTEGER DEFAULT 0,
  vaccine_efficacy_percent DECIMAL(5, 2),
  temperature_monitoring_required BOOLEAN DEFAULT true,
  last_temp_check TIMESTAMP,
  last_temp_check_celsius DECIMAL(4, 2),
  cold_chain_maintained BOOLEAN DEFAULT true,
  cold_chain_break_details TEXT,
  vaccination_campaign_used_in TEXT,
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(255),
  invoice_number VARCHAR(100),
  cost_total DECIMAL(10, 2),
  storage_location_responsible_id UUID,
  status TEXT CHECK (status IN ('in_stock', 'low_stock', 'expired', 'damaged', 'disposed')) DEFAULT 'in_stock',
  notes TEXT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (vaccine_id) REFERENCES public.vaccine_types(id) ON DELETE RESTRICT
);

-- 5. adverse_vaccine_reactions - Adverse event tracking
CREATE TABLE public.adverse_vaccine_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccination_record_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('local', 'systemic', 'allergic', 'serious_adverse_event')),
  symptom TEXT NOT NULL,
  symptom_severity TEXT CHECK (symptom_severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  onset_hours_after_vaccination INTEGER,
  duration_hours INTEGER,
  treatment_required BOOLEAN DEFAULT false,
  treatment_provided TEXT,
  hospitalization_required BOOLEAN DEFAULT false,
  hospitalization_days INTEGER,
  permanent_injury BOOLEAN DEFAULT false,
  death_occurred BOOLEAN DEFAULT false,
  causality_assessment TEXT CHECK (causality_assessment IN ('unrelated', 'unlikely', 'possible', 'probable', 'definite')),
  reported_to_authority BOOLEAN DEFAULT false,
  report_reference_number VARCHAR(100),
  serious_adverse_event_report BOOLEAN DEFAULT false,
  investigation_completed BOOLEAN DEFAULT false,
  investigation_findings TEXT,
  follow_up_status TEXT CHECK (follow_up_status IN ('recovered', 'recovering', 'not_recovered', 'unknown', 'fatal')),
  follow_up_date TIMESTAMP,
  healthcare_provider_contacted BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (vaccination_record_id) REFERENCES public.vaccination_records(id) ON DELETE CASCADE
);

-- ==================== INDEXES ====================

-- Vaccine types indexes
CREATE INDEX idx_vaccine_types_name ON public.vaccine_types(vaccine_name);
CREATE INDEX idx_vaccine_types_abbreviation ON public.vaccine_types(vaccine_abbreviation);
CREATE INDEX idx_vaccine_types_active ON public.vaccine_types(active);

-- Immunization schedules indexes
CREATE INDEX idx_schedules_vaccine ON public.immunization_schedules(vaccine_id);
CREATE INDEX idx_schedules_age ON public.immunization_schedules(recommended_age_months);
CREATE INDEX idx_schedules_country ON public.immunization_schedules(country);
CREATE INDEX idx_schedules_type ON public.immunization_schedules(schedule_type);

-- Vaccination records indexes
CREATE INDEX idx_vaccination_records_patient ON public.vaccination_records(patient_id);
CREATE INDEX idx_vaccination_records_vaccine ON public.vaccination_records(vaccine_id);
CREATE INDEX idx_vaccination_records_date ON public.vaccination_records(vaccination_date);
CREATE INDEX idx_vaccination_records_status ON public.vaccination_records(status);
CREATE INDEX idx_vaccination_records_adverse ON public.vaccination_records(adverse_event_occurred);

-- Vaccine inventory indexes
CREATE INDEX idx_vaccine_inventory_vaccine ON public.vaccine_inventory(vaccine_id);
CREATE INDEX idx_vaccine_inventory_status ON public.vaccine_inventory(status);
CREATE INDEX idx_vaccine_inventory_expiration ON public.vaccine_inventory(expiration_date);
CREATE INDEX idx_vaccine_inventory_location ON public.vaccine_inventory(storage_location);

-- Adverse reactions indexes
CREATE INDEX idx_adverse_reactions_vaccination ON public.adverse_vaccine_reactions(vaccination_record_id);
CREATE INDEX idx_adverse_reactions_type ON public.adverse_vaccine_reactions(reaction_type);
CREATE INDEX idx_adverse_reactions_severity ON public.adverse_vaccine_reactions(symptom_severity);
CREATE INDEX idx_adverse_reactions_causality ON public.adverse_vaccine_reactions(causality_assessment);

-- ==================== ROW LEVEL SECURITY POLICIES ====================

-- Enable RLS
ALTER TABLE public.vaccine_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immunization_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adverse_vaccine_reactions ENABLE ROW LEVEL SECURITY;

-- vaccine_types - All authenticated can read
CREATE POLICY "vaccine_types_read_all" ON public.vaccine_types
  FOR SELECT USING (true);

-- immunization_schedules - All authenticated can read
CREATE POLICY "schedules_read_all" ON public.immunization_schedules
  FOR SELECT USING (true);

-- vaccination_records - Patients see their own, staff sees all
CREATE POLICY "vaccination_records_read" ON public.vaccination_records
  FOR SELECT USING (
    patient_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'medical_staff', 'nurse', 'immunization_officer'))
  );

CREATE POLICY "vaccination_records_insert" ON public.vaccination_records
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'medical_staff', 'nurse', 'immunization_officer'))
  );

-- vaccine_inventory - Medical staff and admin only
CREATE POLICY "vaccine_inventory_read" ON public.vaccine_inventory
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'medical_staff', 'pharmacy_staff'))
  );

-- adverse_vaccine_reactions - Relevant staff
CREATE POLICY "adverse_reactions_read" ON public.adverse_vaccine_reactions
  FOR SELECT USING (
    vaccination_record_id IN (
      SELECT id FROM public.vaccination_records WHERE patient_id = auth.uid()
    ) OR
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'medical_staff', 'pharmacovigilance'))
  );

-- ==================== TRIGGERS ====================

-- Update vaccine inventory when vaccine administered
CREATE OR REPLACE FUNCTION update_vaccine_inventory_on_administration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vaccine_inventory
  SET quantity_current = quantity_current - 1,
      quantity_administered = quantity_administered + 1,
      updated_at = current_timestamp
  WHERE vaccine_id = NEW.vaccine_id
    AND batch_number IN (SELECT batch_number FROM public.vaccine_inventory 
                          WHERE vaccine_id = NEW.vaccine_id 
                          ORDER BY expiration_date ASC 
                          LIMIT 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vaccine_inventory_update_trigger
  AFTER INSERT ON public.vaccination_records
  FOR EACH ROW
  WHEN (NEW.status = 'administered')
  EXECUTE FUNCTION update_vaccine_inventory_on_administration();

-- Auto-flag adverse event in vaccination record
CREATE OR REPLACE FUNCTION flag_adverse_event()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vaccination_records
  SET adverse_event_occurred = true,
      updated_at = current_timestamp
  WHERE id = NEW.vaccination_record_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER adverse_event_flag_trigger
  AFTER INSERT ON public.adverse_vaccine_reactions
  FOR EACH ROW
  EXECUTE FUNCTION flag_adverse_event();

-- Update vaccine inventory status based on quantity
CREATE OR REPLACE FUNCTION update_vaccine_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity_current <= 0 THEN
    NEW.status = 'disposed';
  ELSIF NEW.expiration_date < current_date THEN
    NEW.status = 'expired';
  ELSIF NEW.quantity_current < 10 THEN
    NEW.status = 'low_stock';
  ELSE
    NEW.status = 'in_stock';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vaccine_inventory_status_trigger
  BEFORE UPDATE ON public.vaccine_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_vaccine_inventory_status();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_immunization_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = current_timestamp;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vaccine_types_timestamp_trigger
  BEFORE UPDATE ON public.vaccine_types
  FOR EACH ROW
  EXECUTE FUNCTION update_immunization_modified_timestamp();

CREATE TRIGGER immunization_schedules_timestamp_trigger
  BEFORE UPDATE ON public.immunization_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_immunization_modified_timestamp();

CREATE TRIGGER vaccination_records_timestamp_trigger
  BEFORE UPDATE ON public.vaccination_records
  FOR EACH ROW
  EXECUTE FUNCTION update_immunization_modified_timestamp();

CREATE TRIGGER vaccine_inventory_timestamp_trigger
  BEFORE UPDATE ON public.vaccine_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_immunization_modified_timestamp();

CREATE TRIGGER adverse_reactions_timestamp_trigger
  BEFORE UPDATE ON public.adverse_vaccine_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_immunization_modified_timestamp();

-- ==================== SEED DATA ====================

-- Insert vaccine types
INSERT INTO public.vaccine_types (vaccine_name, vaccine_abbreviation, description, disease_prevented, vaccine_type, manufacturer, batch_type, number_of_doses, dose_volume_ml, storage_temperature_celsius, efficacy_percent, onset_of_immunity_days, duration_of_immunity_years, administration_route, pregnancy_category)
VALUES
  ('Measles, Mumps, Rubella', 'MMR', 'Combined viral vaccine', 'measles,mumps,rubella', 'live_attenuated', 'Merck', 'pediatric', 2, 0.5, '2-8°C', 97, 14, 'lifetime', 'subcutaneous', 'contraindicated'),
  ('Polio', 'IPV', 'Inactivated polio vaccine', 'polio', 'inactivated', 'Sanofi', 'pediatric', 4, 0.5, '2-8°C', 99, 7, 'lifetime', 'intramuscular', 'B'),
  ('Diphtheria, Tetanus, Pertussis', 'DPT', 'Combined bacterial vaccine', 'diphtheria,tetanus,pertussis', 'inactivated', 'Sanofi', 'pediatric', 5, 0.5, '2-8°C', 95, 7, 10, 'intramuscular', 'safe'),
  ('Hepatitis B', 'HBV', 'Recombinant hepatitis B vaccine', 'hepatitis_b', 'subunit', 'Merck', 'pediatric', 3, 0.5, '2-8°C', 95, 30, 'lifetime', 'intramuscular', 'safe'),
  ('Varicella', 'VAR', 'Chickenpox vaccine', 'chickenpox', 'live_attenuated', 'Merck', 'pediatric', 2, 0.5, '2-8°C', 90, 21, '10-20', 'subcutaneous', 'contraindicated'),
  ('Influenza', 'FLU', 'Annual flu vaccine', 'influenza', 'inactivated', 'Various', 'adult', 1, 0.5, '2-8°C', 60, 14, 1, 'intramuscular', 'safe'),
  ('COVID-19 mRNA', 'COVID', 'mRNA vaccine against SARS-CoV-2', 'covid_19', 'mRNA', 'Pfizer/Moderna', 'adult', 2, 0.3, '-20°C to -4°C', 95, 14, 'current', 'intramuscular', 'B'),
  ('Yellow Fever', 'YF', 'Live attenuated yellow fever vaccine', 'yellow_fever', 'live_attenuated', 'Sanofi', 'adult', 1, 0.5, '2-8°C', 99, 30, 'lifetime', 'subcutaneous', 'contraindicated'),
  ('Rabies', 'RABV', 'Post-exposure rabies prophylaxis', 'rabies', 'inactivated', 'Sanofi', 'adult', 4, 0.5, '2-8°C', 98, 7, 'varies', 'intramuscular', 'safe'),
  ('Tuberculosis', 'BCG', 'Live bacille Calmette-Guérin vaccine', 'tuberculosis', 'live_attenuated', 'Danish SSI', 'pediatric', 1, 0.1, '2-8°C', 70, 0, '10-20', 'intradermal', 'contraindicated');

-- Insert immunization schedules (Ecuador standard)
INSERT INTO public.immunization_schedules (schedule_name, schedule_type, country, recommended_age_months, vaccine_id, dose_number, minimum_interval_previous_dose_days, recommended_interval_previous_dose_days, minimum_age_months, maximum_age_months, priority_level)
SELECT 
  name,
  'routine',
  'Ecuador',
  age,
  id,
  dose,
  interval_min,
  interval_rec,
  age,
  60,
  'essential'
FROM (
  VALUES
    ('HBV Birth Dose', 0, (SELECT id FROM public.vaccine_types WHERE vaccine_abbreviation = 'HBV'), 1, 0, 0, 0),
    ('DPT 1st', 2, (SELECT id FROM public.vaccine_types WHERE vaccine_abbreviation = 'DPT'), 1, 0, 30, 30),
    ('Polio 1st', 2, (SELECT id FROM public.vaccine_types WHERE vaccine_abbreviation = 'IPV'), 1, 0, 30, 30),
    ('MMR 1st', 12, (SELECT id FROM public.vaccine_types WHERE vaccine_abbreviation = 'MMR'), 1, 0, 0, 0)
) AS schedule_data(name, age, id, dose, interval_min, interval_rec);
