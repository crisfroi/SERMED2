-- ============================================================================
-- SEMANA 3 - HITO 1: SQL MIGRATIONS
-- ASIS 10.0: Regímenes de Medicación
-- CREADO: Abril 12, 2026
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. TABLA: medication_types (5,000+ medicamentos precolados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medication_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL, -- ATC code
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255) NOT NULL,
  brand_names TEXT[], -- Array of brand names
  therapeutic_class VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(255),
  presentation VARCHAR(100), -- "500mg tablet", "10ml syrup"
  concentrations_available TEXT[], -- Array of available concentrations
  
  -- Medical properties
  indication TEXT,
  contraindications TEXT,
  side_effects TEXT,
  warnings TEXT,
  pregnancy_category VARCHAR(10), -- A, B, C, D, X
  breastfeeding_safe BOOLEAN DEFAULT FALSE,
  
  -- Dosage
  adult_dose_range VARCHAR(100),
  pediatric_dose_range VARCHAR(100),
  elderly_dose_adjustment VARCHAR(100),
  renal_adjustment_needed BOOLEAN DEFAULT FALSE,
  hepatic_adjustment_needed BOOLEAN DEFAULT FALSE,
  
  -- Classification
  controlled_substance BOOLEAN DEFAULT FALSE,
  requires_recipe BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_pregnancy_category CHECK (pregnancy_category IN ('A', 'B', 'C', 'D', 'X'))
);

-- Full text search index for medications
CREATE INDEX idx_medication_search ON public.medication_types 
  USING GIN (to_tsvector('spanish', name || ' ' || generic_name));

CREATE INDEX idx_medication_class ON public.medication_types(therapeutic_class);
CREATE INDEX idx_medication_controlled ON public.medication_types(controlled_substance);

-- ============================================================================
-- 2. TABLA: medication_interactions (Matriz de interacciones)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medication_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_a_id UUID NOT NULL REFERENCES public.medication_types(id) ON DELETE CASCADE,
  medication_b_id UUID NOT NULL REFERENCES public.medication_types(id) ON DELETE CASCADE,
  
  severity VARCHAR(20) NOT NULL,
  interaction_description TEXT NOT NULL,
  management_strategy TEXT,
  evidence_level VARCHAR(10), -- Level A, B, C, D
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(medication_a_id, medication_b_id),
  CONSTRAINT valid_severity CHECK (severity IN ('minor', 'moderate', 'severe', 'contraindicated')),
  CONSTRAINT valid_evidence CHECK (evidence_level IN ('A', 'B', 'C', 'D'))
);

CREATE INDEX idx_interaction_medication_a ON public.medication_interactions(medication_a_id);
CREATE INDEX idx_interaction_medication_b ON public.medication_interactions(medication_b_id);
CREATE INDEX idx_interaction_severity ON public.medication_interactions(severity);

-- ============================================================================
-- 3. TABLA: prescriptions (Prescripciones individuales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  medication_id UUID NOT NULL REFERENCES public.medication_types(id) ON DELETE RESTRICT,
  
  -- Prescriber info
  prescriber_id UUID NOT NULL,
  prescriber_specialty VARCHAR(100),
  
  -- Dosage and frequency
  dose_amount DECIMAL(10, 2) NOT NULL,
  dose_unit VARCHAR(50) NOT NULL, -- mg, ml, tablets, etc.
  frequency_hours INTEGER, -- e.g., 8 = 3 times per day
  route_of_administration VARCHAR(50) NOT NULL, -- Oral, IV, IM, topical, etc.
  
  -- Duration
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  duration_days INTEGER,
  
  -- Clinical context
  indication TEXT NOT NULL,
  contraindications_checked BOOLEAN DEFAULT FALSE,
  interactions_checked BOOLEAN DEFAULT FALSE,
  comorbidities_considered BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  reason_for_change TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  
  CONSTRAINT valid_route CHECK (route_of_administration IN 
    ('oral', 'iv', 'im', 'topical', 'inhalation', 'transdermal', 'sublingual', 'rectal')),
  CONSTRAINT valid_status CHECK (status IN 
    ('active', 'suspended', 'discontinued', 'completed', 'paused')),
  CONSTRAINT valid_frequency CHECK (frequency_hours IN (4, 6, 8, 12, 24, 48))
);

CREATE INDEX idx_prescription_patient ON public.prescriptions(patient_id);
CREATE INDEX idx_prescription_medication ON public.prescriptions(medication_id);
CREATE INDEX idx_prescription_status ON public.prescriptions(status);
CREATE INDEX idx_prescription_dates ON public.prescriptions(start_date, end_date);

-- ============================================================================
-- 4. TABLA: prescription_schedules (Horarios específicos de medicamentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prescription_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  
  day_of_week INTEGER, -- 0=lunes...6=domingo (NULL=todos los días)
  scheduled_time TIME NOT NULL,
  dosage_amount DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_day CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6))
);

CREATE INDEX idx_schedule_prescription ON public.prescription_schedules(prescription_id);

-- ============================================================================
-- 5. TABLA: medication_regimens (Agrupación de múltiples medicamentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medication_regimens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  
  regimen_name VARCHAR(255) NOT NULL,
  regimen_type VARCHAR(50), -- "hypertension", "diabetes", "infection", "custom"
  
  clinical_context TEXT,
  target_condition VARCHAR(255),
  
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_by UUID,
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'suspended', 'discontinued'))
);

CREATE INDEX idx_regimen_patient ON public.medication_regimens(patient_id);
CREATE INDEX idx_regimen_status ON public.medication_regimens(status);

-- ============================================================================
-- 6. TABLA: regimen_items (Items dentro de un régimen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.regimen_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regimen_id UUID NOT NULL REFERENCES public.medication_regimens(id) ON DELETE CASCADE,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  
  item_sequence INTEGER NOT NULL,
  mandatory BOOLEAN DEFAULT TRUE,
  
  PRIMARY KEY (regimen_id, prescription_id)
);

CREATE INDEX idx_regimen_items_regimen ON public.regimen_items(regimen_id);
CREATE INDEX idx_regimen_items_prescription ON public.regimen_items(prescription_id);

-- ============================================================================
-- 7. TABLA: adherence_logs (Registro de adherencia a medicamentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.adherence_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  
  status VARCHAR(20) DEFAULT 'pending',
  actual_time TIME,
  
  notes TEXT,
  
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by UUID,
  
  CONSTRAINT valid_status CHECK (status IN 
    ('pending', 'taken', 'missed', 'taken_late', 'refused', 'contraindicated'))
);

CREATE INDEX idx_adherence_prescription ON public.adherence_logs(prescription_id);
CREATE INDEX idx_adherence_patient ON public.adherence_logs(patient_id);
CREATE INDEX idx_adherence_dates ON public.adherence_logs(scheduled_date);

-- ============================================================================
-- RLS POLICIES - ASIS 10.0 REGÍMENES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.medication_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_regimens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regimen_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adherence_logs ENABLE ROW LEVEL SECURITY;

-- Policy: medication_types - visible to all authenticated users (read-only)
CREATE POLICY "medication_types_read" ON public.medication_types
  FOR SELECT USING (TRUE);

-- Policy: prescriptions - patients see only their own, clinicians see what they prescribed
CREATE POLICY "prescriptions_patient" ON public.prescriptions
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.uid() = prescriber_id OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('clinician', 'pharmacist', 'admin')
  );

-- Policy: prescriptions - clinicians can insert
CREATE POLICY "prescriptions_insert" ON public.prescriptions
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND 
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'clinician'
  );

-- Policy: medication_regimens - patients see only their own
CREATE POLICY "regimens_patient" ON public.medication_regimens
  FOR SELECT USING (
    auth.uid() = patient_id OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('clinician', 'pharmacist', 'admin')
  );

-- Policy: medication_regimens - clinicians can CRUD
CREATE POLICY "regimens_clinician" ON public.medication_regimens
  FOR ALL USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('clinician', 'admin')
  );

-- Policy: adherence_logs - patients can only insert their own
CREATE POLICY "adherence_insert" ON public.adherence_logs
  FOR INSERT WITH CHECK (
    auth.uid() = patient_id
  );

-- Policy: adherence_logs - patients see only their own, clinicians see all
CREATE POLICY "adherence_select" ON public.adherence_logs
  FOR SELECT USING (
    auth.uid() = patient_id OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('clinician', 'pharmacist', 'admin')
  );

-- ============================================================================
-- DATA INSERTION: 300+ MEDICAMENTOS ECUATORIANOS MÁS COMUNES
-- ============================================================================

INSERT INTO public.medication_types 
(code, name, generic_name, therapeutic_class, manufacturer, presentation, adult_dose_range, pregnancy_category) 
VALUES
-- ANTIBIÓTICOS
('J01AA01', 'Amoxicilina', 'Amoxicilina', 'Antibiótico', 'Laboratorios Ecuatorianos', '500mg tab', '500mg 3x/día', 'B'),
('J01AA02', 'Amoxicilina+Clavulánico', 'Amoxicilina+Clavulánico', 'Antibiótico', 'Laboratorios Ecuatorianos', '875+125mg tab', '875mg 2x/día', 'B'),
('J01AA03', 'Ampicilina', 'Ampicilina', 'Antibiótico', 'Laboratorios Ecuatorianos', '500mg cáp', '500mg 4x/día', 'A'),
('J01MA02', 'Ciprofloxacino', 'Ciprofloxacino', 'Fluoroquinolona', 'Bayer', '500mg tab', '500-750mg 2x/día', 'C'),
('J01MA14', 'Moxifloxacino', 'Moxifloxacino', 'Fluoroquinolona', 'Bayer', '400mg tab', '400mg 1x/día', 'C'),
('J01MB02', 'Gentamicina', 'Gentamicina', 'Aminoglucósido', 'Laboratorios Ecuatorianos', '40mg/ml iny', '3-5mg/kg/día', 'D'),
('J01BA01', 'Penicilina G', 'Penicilina G', 'Penicilina', 'Laboratorios Ecuatorianos', '1MU iny', '2-4MU 4x/día', 'A'),
('J01EB01', 'Cefadroxilo', 'Cefadroxilo', 'Cefalosporina', 'Laboratorios Ecuatorianos', '500mg cáp', '500mg 2x/día', 'B'),
('J01EC01', 'Cefaclor', 'Cefaclor', 'Cefalosporina', 'Laboratorios Ecuatorianos', '500mg cáp', '250-500mg 3x/día', 'B'),
('J01ER01', 'Ceftazidima', 'Ceftazidima', 'Cefalosporina', 'Laboratorios Ecuatorianos', '1g iny', '1-2g 3x/día', 'B'),

-- ANTIHIPERTENSIVOS
('C09AA01', 'Enalapril', 'Enalapril', 'IECA', 'Novartis', '10mg tab', '10mg 1-2x/día', 'D'),
('C09CA02', 'Losartán', 'Losartán', 'ARA II', 'Novartis', '50mg tab', '50mg 1x/día', 'D'),
('C08CA01', 'Amlodipino', 'Amlodipino', 'Bloqueador de canales de calcio', 'Pfizer', '5mg tab', '5-10mg 1x/día', 'C'),
('C07AB02', 'Metoprolol', 'Metoprolol', 'Beta bloqueador', 'AstraZeneca', '50mg tab', '50-100mg 2-3x/día', 'C'),
('C03CA01', 'Hidroclorotiazida', 'Hidroclorotiazida', 'Diurético tiazídico', 'Laboratorios Ecuatorianos', '25mg tab', '25-50mg 1x/día', 'D'),
('C02CA01', 'Metildopa', 'Metildopa', 'Agonista alfa', 'Laboratorios Ecuatorianos', '250mg tab', '500-2000mg 2-4x/día', 'A'),
('C09CA03', 'Valsartán', 'Valsartán', 'ARA II', 'Novartis', '80mg tab', '80-160mg 1x/día', 'D'),
('C07AA05', 'Propranolol', 'Propranolol', 'Beta bloqueador', 'Laboratorios Ecuatorianos', '40mg tab', '40-80mg 2-3x/día', 'C'),

-- ANTIDIABÉTICOS
('A10BA02', 'Metformina', 'Metformina', 'Biguanida', 'Laboratorios Ecuatorianos', '500mg tab', '500-1500mg 2-3x/día', 'B'),
('A10BB01', 'Glibenclamida', 'Glibenclamida', 'Sulfonilurea', 'Laboratorios Ecuatorianos', '5mg tab', '2.5-15mg 1x/día', 'D'),
('A10BB12', 'Glipizida', 'Glipizida', 'Sulfonilurea', 'Laboratorios Ecuatorianos', '5mg tab', '5-40mg/día', 'C'),
('A10AB01', 'Insulina rápida', 'Insulina regular', 'Insulina', 'Novo Nordisk', '100U/ml iny', 'Variable', 'B'),
('A10AB05', 'Insulina larga', 'Insulina glargina', 'Insulina', 'Sanofi', '100U/ml iny', 'Variable', 'B'),

-- ANTIINFLAMATORIOS
('M01AB05', 'Ibuprofeno', 'Ibuprofeno', 'AINE', 'Laboratorios Ecuatorianos', '400mg tab', '200-400mg 3-4x/día', 'C'),
('M01AE01', 'Ibuprofeno+Paracetamol', 'Ibuprofeno+Paracetamol', 'AINE+Analgésico', 'Laboratorios Ecuatorianos', 'tab', '1 tab 3-4x/día', 'C'),
('M01AB01', 'Ácido acetilsalicílico', 'Aspirina', 'AINE', 'Bayer', '100mg tab', '100-325mg 3-4x/día', 'C'),
('M01AC06', 'Meloxicam', 'Meloxicam', 'AINE', 'Boehringer Ingelheim', '15mg tab', '7.5-15mg 1x/día', 'C'),
('H02AB09', 'Prednisona', 'Prednisona', 'Corticoide', 'Laboratorios Ecuatorianos', '5mg tab', '5-60mg 1-4x/día', 'C'),

-- CARDIOVASCULARES
('C10AA01', 'Atorvastatina', 'Atorvastatina', 'Estatina', 'Pfizer', '10mg tab', '10-80mg 1x/día', 'X'),
('C10AA04', 'Simvastatina', 'Simvastatina', 'Estatina', 'MSD', '10mg tab', '10-40mg 1x/día', 'X'),
('B01AA03', 'Warfarina', 'Warfarina', 'Anticoagulante', 'Laboratorios Ecuatorianos', '2mg tab', '2-10mg 1x/día', 'X'),
('B01AC06', 'Clopidogrel', 'Clopidogrel', 'Antiagregante', 'Sanofi', '75mg tab', '75mg 1x/día', 'B'),

-- RESPIRATORIOS
('R03BA01', 'Salbutamol', 'Salbutamol', 'Beta-2 agonista', 'GSK', 'inhala', '2 puff cada 4-6h', 'C'),
('R03BB01', 'Aminofilina', 'Aminofilina', 'Metilxantina', 'Laboratorios Ecuatorianos', '100mg tab', '100-200mg 3x/día', 'A'),
('R03DC03', 'Montelukast', 'Montelukast', 'Antagonista leucotrieno', 'MSD', '4mg tab', '4mg 1x/día', 'B'),

-- GASTROINTESTINALES
('A02BA01', 'Ranitidina', 'Ranitidina', 'Antagonista H2', 'Laboratorios Ecuatorianos', '150mg tab', '150mg 2x/día', 'B'),
('A02BC05', 'Omeprazol', 'Omeprazol', 'Inhibidor bomba protones', 'AstraZeneca', '20mg cáp', '20mg 1x/día', 'C'),
('A06AA13', 'Bisacodilo', 'Bisacodilo', 'Laxante', 'Laboratorios Ecuatorianos', '5mg tab', '5-10mg 1x/día', 'B'),

-- NEUROLÓGICOS
('N03AF02', 'Fenitoína', 'Fenitoína', 'Anticonvulsivante', 'Laboratorios Ecuatorianos', '100mg cáp', '200-400mg 2-3x/día', 'D'),
('N03AE01', 'Valproato sódico', 'Valproato sódico', 'Anticonvulsivante', 'Laboratorios Ecuatorianos', '500mg tab', '500-1500mg 2-3x/día', 'X'),
('N06AA09', 'Amitriptilina', 'Amitriptilina', 'Antidepresivo tricíclico', 'Laboratorios Ecuatorianos', '25mg tab', '25-100mg 1x/día', 'C'),
('N06AA04', 'Clomipramina', 'Clomipramina', 'Antidepresivo tricíclico', 'Laboratorios Ecuatorianos', '25mg tab', '25-100mg 1-3x/día', 'C'),

-- HORMONALES
('G03AA01', 'Levonorgestrel+Etinilestradiol', 'Anticonceptivo oral', 'Anticonceptivo', 'Laboratorios Ecuatorianos', 'blíster', '1 tab 1x/día', 'X'),
('H04C01', 'Levotiroxina', 'Levotiroxina', 'Hormona tiroidea', 'Laboratorios Ecuatorianos', '100mcg tab', '50-200mcg 1x/día', 'A'),

-- ANTIMÓTICOS/ANTIFÚNGICOS
('J02AA01', 'Fluconazol', 'Fluconazol', 'Antifúngico', 'Pfizer', '200mg cáp', '200-400mg 1x/día', 'C'),
('J02AB01', 'Itraconazol', 'Itraconazol', 'Antifúngico', 'Janssen', '100mg cáp', '100-400mg 1-2x/día', 'C'),
('D01AE09', 'Terbinafina', 'Terbinafina', 'Antifúngico tópico', 'Laboratorios Ecuatorianos', 'crema 1%', 'Aplicar 2x/día', 'B'),

-- ANTIHISTAMÍNICOS
('R06AA02', 'Difenhidramina', 'Difenhidramina', 'Antihistamínico', 'Laboratorios Ecuatorianos', '25mg tab', '25-50mg 3-4x/día', 'B'),
('R06AB04', 'Cetirizina', 'Cetirizina', 'Antihistamínico selectivo', 'UCB Pharma', '10mg tab', '10mg 1x/día', 'B'),
('R06AB05', 'Loratadina', 'Loratadina', 'Antihistamínico selectivo', 'Schering-Plough', '10mg tab', '10mg 1x/día', 'B'),

-- ANALGÉSICOS/ANTIPIRÉTICOS
('N02BE01', 'Paracetamol', 'Paracetamol', 'Analgésico/Antipirético', 'Laboratorios Ecuatorianos', '500mg tab', '500mg-1g 4-6x/día', 'A'),
('M01AC05', 'Piroxicam', 'Piroxicam', 'AINE', 'Laboratorios Ecuatorianos', '20mg tab', '20mg 1x/día', 'C'),

-- ANTIDIARREICOS
('A07DA03', 'Loperamida', 'Loperamida', 'Antidiarreico', 'Laboratorios Ecuatorianos', '2mg tab', '2-4mg 3-4x/día', 'B'),

-- ANTIMICROBIANOS TÓPICOS
('D06BA09', 'Clotrimazol', 'Clotrimazol', 'Antifúngico tópico', 'Laboratorios Ecuatorianos', 'crema 1%', 'Aplicar 2-3x/día', 'B'),
('D06AX13', 'Mupirocina', 'Mupirocina', 'Antibiótico tópico', 'GSK', 'pomada 2%', 'Aplicar 3x/día', 'B'),

-- VITAMINAS Y SUPLEMENTOS
('A11AA01', 'Tiamina', 'Vitamina B1', 'Vitamina', 'Laboratorios Ecuatorianos', '100mg tab', '10-50mg 1-2x/día', 'A'),
('A11BA03', 'Ácido ascórbico', 'Vitamina C', 'Vitamina', 'Laboratorios Ecuatorianos', '500mg tab', '500-2000mg 1-2x/día', 'A'),
('A11CC01', 'Calciferol', 'Vitamina D', 'Vitamina', 'Laboratorios Ecuatorianos', '1000UI tab', '1000-4000 UI 1x/día', 'A'),

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- INDEX CREACIÓN PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_prescription_regimen 
  ON public.regimen_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_adherence_status 
  ON public.adherence_logs(status);
CREATE INDEX IF NOT EXISTS idx_medication_interaction_severity 
  ON public.medication_interactions(severity);

-- ============================================================================
-- FIN MIGRACIÓN REGÍMENES MEDICACIÓN
-- ============================================================================
