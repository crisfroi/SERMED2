-- ============================================================================
-- SEMANA 3 - HITO 1: SQL MIGRATIONS
-- ASIS 14.0: Diagnóstico Unificado
-- CREADO: Abril 12, 2026
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. TABLA: icd10_codes (10,000+ códigos ICD-10 precolados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.icd10_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL, -- A00-Z99.99
  description VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  diagnosis_type VARCHAR(50), -- primary, secondary, complication
  
  -- Medical classification
  severity_default VARCHAR(20), -- mild, moderate, severe
  chronic BOOLEAN DEFAULT FALSE,
  infectious BOOLEAN DEFAULT FALSE,
  preventable BOOLEAN DEFAULT FALSE,
  occupational_related BOOLEAN DEFAULT FALSE,
  
  -- Related codes
  parent_code VARCHAR(10),
  related_codes TEXT[], -- Array of related ICD-10 codes
  
  -- Query optimization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_severity CHECK (severity_default IN ('mild', 'moderate', 'severe'))
);

-- Full text search index
CREATE INDEX idx_icd10_search ON public.icd10_codes 
  USING GIN (to_tsvector('spanish', description));

CREATE INDEX idx_icd10_category ON public.icd10_codes(category);
CREATE INDEX idx_icd10_chronic ON public.icd10_codes(chronic);
CREATE INDEX idx_icd10_code ON public.icd10_codes(code);

-- ============================================================================
-- 2. TABLA: patient_diagnoses (Diagnósticos del paciente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  icd10_id UUID NOT NULL REFERENCES public.icd10_codes(id) ON DELETE RESTRICT,
  
  -- Clinical context
  encounter_id UUID, -- Reference to encounter/visit
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Diagnosis info
  diagnosis_status VARCHAR(20) DEFAULT 'active',
  severity VARCHAR(20), -- mild, moderate, severe
  onset_type VARCHAR(20), -- acute, chronic, subacute, remote
  primary_diagnosis BOOLEAN DEFAULT FALSE,
  
  -- Clinical observation
  clinical_presentation TEXT,
  relevant_history TEXT,
  physical_exam_findings TEXT,
  
  -- Resolution info
  resolution_date DATE,
  outcome TEXT,
  
  -- Audit
  diagnosed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (diagnosis_status IN 
    ('active', 'suspected', 'resolved', 'excluded', 'ruled_out', 'remission')),
  CONSTRAINT valid_severity CHECK (severity IN ('mild', 'moderate', 'severe')),
  CONSTRAINT valid_onset CHECK (onset_type IN ('acute', 'chronic', 'subacute', 'remote'))
);

CREATE INDEX idx_diagnosis_patient ON public.patient_diagnoses(patient_id);
CREATE INDEX idx_diagnosis_icd10 ON public.patient_diagnoses(icd10_id);
CREATE INDEX idx_diagnosis_status ON public.patient_diagnoses(diagnosis_status);
CREATE INDEX idx_diagnosis_dates ON public.patient_diagnoses(admission_date, resolution_date);
CREATE INDEX idx_diagnosis_primary ON public.patient_diagnoses(primary_diagnosis);

-- ============================================================================
-- 3. TABLA: comorbidities (Matriz de comorbilidades)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comorbidities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  
  diagnosis_a_id UUID NOT NULL REFERENCES public.patient_diagnoses(id) ON DELETE CASCADE,
  diagnosis_b_id UUID NOT NULL REFERENCES public.patient_diagnoses(id) ON DELETE CASCADE,
  
  -- Comorbidity relationship
  relationship_type VARCHAR(50), -- temporal, causal, independent, complication
  severity_multiplier DECIMAL(3, 2) DEFAULT 1.0, -- Clinical impact multiplier
  interaction_risk TEXT,
  management_impact TEXT, -- How comorbidity affects treatment
  
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detected_by UUID,
  
  UNIQUE(patient_id, diagnosis_a_id, diagnosis_b_id),
  CONSTRAINT valid_relationship CHECK (relationship_type IN 
    ('temporal', 'causal', 'independent', 'complication', 'sequential'))
);

CREATE INDEX idx_comorbidity_patient ON public.comorbidities(patient_id);
CREATE INDEX idx_comorbidity_diagnosis_a ON public.comorbidities(diagnosis_a_id);
CREATE INDEX idx_comorbidity_diagnosis_b ON public.comorbidities(diagnosis_b_id);

-- ============================================================================
-- 4. TABLA: diagnosis_history (Histórico de cambios de diagnósticos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diagnosis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnosis_id UUID NOT NULL REFERENCES public.patient_diagnoses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  
  -- Change tracking
  change_type VARCHAR(50), -- created, updated, status_change, resolved, new_finding
  
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  
  previous_severity VARCHAR(20),
  new_severity VARCHAR(20),
  
  change_reason TEXT,
  clinical_note TEXT,
  
  -- Audit
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_change CHECK (change_type IN 
    ('created', 'updated', 'status_change', 'resolved', 'new_finding', 'excluded'))
);

CREATE INDEX idx_history_diagnosis ON public.diagnosis_history(diagnosis_id);
CREATE INDEX idx_history_patient ON public.diagnosis_history(patient_id);
CREATE INDEX idx_history_dates ON public.diagnosis_history(changed_at);

-- ============================================================================
-- 5. TABLA: diagnosis_alerts (Alertas clínicas basadas en diagnósticos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diagnosis_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  diagnosis_id UUID REFERENCES public.patient_diagnoses(id) ON DELETE CASCADE,
  
  alert_type VARCHAR(50), -- drug_contraindication, precaution, monitoring, complication_risk
  severity VARCHAR(20), -- info, warning, critical
  
  alert_description TEXT NOT NULL,
  recommended_action TEXT,
  evidence_level VARCHAR(10),
  
  status VARCHAR(20) DEFAULT 'new',
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_alert_type CHECK (alert_type IN 
    ('drug_contraindication', 'precaution', 'monitoring', 'complication_risk', 'patient_education')),
  CONSTRAINT valid_alert_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_alert_status CHECK (status IN ('new', 'acknowledged', 'resolved', 'dismissed'))
);

CREATE INDEX idx_alert_patient ON public.diagnosis_alerts(patient_id);
CREATE INDEX idx_alert_status ON public.diagnosis_alerts(status);
CREATE INDEX idx_alert_severity ON public.diagnosis_alerts(severity);

-- ============================================================================
-- RLS POLICIES - ASIS 14.0 DIAGNÓSTICO
-- ============================================================================

-- Enable RLS
ALTER TABLE public.icd10_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comorbidities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: icd10_codes - visible to all authenticated users (read-only)
CREATE POLICY "icd10_read" ON public.icd10_codes
  FOR SELECT USING (TRUE);

-- Policy: patient_diagnoses - patients see only their own, clinicians see what they diagnosed
CREATE POLICY "diagnoses_patient" ON public.patient_diagnoses
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.uid() = diagnosed_by OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('clinician', 'admin')
  );

-- Policy: patient_diagnoses - clinicians can insert
CREATE POLICY "diagnoses_insert" ON public.patient_diagnoses
  FOR INSERT WITH CHECK (
    auth.uid() = diagnosed_by AND
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'clinician'
  );

-- Policy: patient_diagnoses - clinicians can update their own diagnoses
CREATE POLICY "diagnoses_update" ON public.patient_diagnoses
  FOR UPDATE USING (
    auth.uid() = diagnosed_by OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Policy: comorbidities - same visibility as diagnoses
CREATE POLICY "comorbidities_select" ON public.comorbidities
  FOR SELECT USING (
    auth.uid() = patient_id OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('clinician', 'admin')
  );

-- Policy: diagnosis_history - patients view own, clinicians view all
CREATE POLICY "history_select" ON public.diagnosis_history
  FOR SELECT USING (
    auth.uid() = patient_id OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('clinician', 'admin')
  );

-- Policy: diagnosis_alerts - patients view own, clinicians view all
CREATE POLICY "alerts_select" ON public.diagnosis_alerts
  FOR SELECT USING (
    auth.uid() = patient_id OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('clinician', 'admin')
  );

-- ============================================================================
-- DATA INSERTION: 200+ DIAGNÓSTICOS ICD-10 MÁS FRECUENTES
-- ============================================================================

INSERT INTO public.icd10_codes 
(code, description, category, severity_default, chronic, infectious) 
VALUES
-- ENFERMEDADES DEL SISTEMA CIRCULATORIO (I00-I99)
('I10', 'Hipertensión esencial (primaria)', 'Cardiovascular', 'moderate', true, false),
('I11', 'Enfermedad cardíaca hipertensiva', 'Cardiovascular', 'severe', true, false),
('I20', 'Angina de pecho', 'Cardiovascular', 'moderate', true, false),
('I21', 'Infarto agudo de miocardio', 'Cardiovascular', 'severe', false, false),
('I25', 'Enfermedad cardíaca isquémica crónica', 'Cardiovascular', 'moderate', true, false),
('I30', 'Pericarditis aguda', 'Cardiovascular', 'moderate', false, true),
('I40', 'Miocarditis', 'Cardiovascular', 'moderate', false, true),
('I50', 'Insuficiencia cardíaca', 'Cardiovascular', 'moderate', true, false),
('I63', 'Infarto cerebral', 'Cardiovascular', 'severe', false, false),
('I64', 'Accidente cerebrovascular, no especificado', 'Cardiovascular', 'severe', false, false),
('I69', 'Secuelas de enfermedad cerebrovascular', 'Cardiovascular', 'moderate', true, false),
('I70', 'Aterosclerosis', 'Cardiovascular', 'moderate', true, false),
('I73', 'Otras enfermedades vasculares', 'Cardiovascular', 'mild', true, false),
('I80', 'Flebititis y tromboflebitis', 'Cardiovascular', 'moderate', false, true),
('I83', 'Venas varicosas', 'Cardiovascular', 'mild', true, false),

-- ENFERMEDADES DEL SISTEMA RESPIRATORIO (J00-J99)
('J00', 'Rinitis aguda', 'Respiratorio', 'mild', false, true),
('J01', 'Sinusitis aguda', 'Respiratorio', 'mild', false, true),
('J02', 'Faringitis aguda', 'Respiratorio', 'mild', false, true),
('J03', 'Amigdalitis aguda', 'Respiratorio', 'mild', false, true),
('J04', 'Laringitis y traqueítis agudas', 'Respiratorio', 'mild', false, true),
('J05', 'Laringotraqueobronquitis aguda', 'Respiratorio', 'moderate', false, true),
('J06', 'Infecciones agudas de las vías respiratorias superiores', 'Respiratorio', 'mild', false, true),
('J12', 'Neumonía viral', 'Respiratorio', 'moderate', false, true),
('J13', 'Neumonía por Streptococcus pneumoniae', 'Respiratorio', 'moderate', false, true),
('J14', 'Neumonía por Haemophilus influenzae', 'Respiratorio', 'moderate', false, true),
('J18', 'Neumonía, no especificada', 'Respiratorio', 'moderate', false, true),
('J20', 'Bronquitis aguda', 'Respiratorio', 'mild', false, true),
('J40', 'Bronquitis, no especificada como aguda o crónica', 'Respiratorio', 'mild', true, false),
('J41', 'Bronquitis crónica simple', 'Respiratorio', 'mild', true, false),
('J42', 'Enfermedad pulmonar obstructiva crónica', 'Respiratorio', 'moderate', true, false),
('J43', 'Enfisema', 'Respiratorio', 'moderate', true, false),
('J44', 'Enfermedad pulmonar obstructiva crónica', 'Respiratorio', 'moderate', true, false),
('J45', 'Asma', 'Respiratorio', 'moderate', true, false),
('J60', 'Neumoconiosis del minero', 'Respiratorio', 'moderate', true, true),
('J81', 'Edema pulmonar', 'Respiratorio', 'severe', false, false),
('J82', 'Colapso pulmonar', 'Respiratorio', 'severe', false, false),
('J84', 'Otras enfermedades pulmonares', 'Respiratorio', 'moderate', true, false),
('J91', 'Derrame pleural', 'Respiratorio', 'moderate', false, false),
('J93', 'Neumotórax', 'Respiratorio', 'moderate', false, false),

-- ENFERMEDADES ENDOCRINAS, DE LA NUTRICIÓN Y DEL METABOLISMO (E00-E90)
('E00', 'Síndrome de deficiencia de yodo', 'Endocrinológico', 'mild', true, false),
('E03', 'Hipotiroidismo', 'Endocrinológico', 'mild', true, false),
('E04', 'Otros hipotiroidismos', 'Endocrinológico', 'mild', true, false),
('E05', 'Tirotoxicosis [hipertiroidismo]', 'Endocrinológico', 'moderate', true, false),
('E10', 'Diabetes mellitus tipo 1', 'Endocrinológico', 'moderate', true, false),
('E11', 'Diabetes mellitus tipo 2', 'Endocrinológico', 'moderate', true, false),
('E12', 'Diabetes mellitus relacionada con malnutrición', 'Endocrinológico', 'moderate', true, false),
('E13', 'Otra diabetes mellitus', 'Endocrinológico', 'moderate', true, false),
('E14', 'Diabetes mellitus, no especificada', 'Endocrinológico', 'moderate', true, false),
('E20', 'Hipoparatiroidismo', 'Endocrinológico', 'moderate', true, false),
('E21', 'Hiperparatiroidismo', 'Endocrinológico', 'moderate', true, false),
('E24', 'Síndrome de Cushing', 'Endocrinológico', 'moderate', true, false),
('E65', 'Adiposidad localizada', 'Endocrinológico', 'mild', true, false),
('E66', 'Obesidad', 'Endocrinológico', 'moderate', true, false),
('E78', 'Abetalipoproteinemia y otras dislipidemias', 'Endocrinológico', 'moderate', true, false),

-- ENFERMEDADES INFECCIOSAS Y PARASITARIAS (A00-B99)
('A00', 'Cólera', 'Infeccioso', 'severe', false, true),
('A01', 'Fiebre tifoidea y paratifoidea', 'Infeccioso', 'moderate', false, true),
('A09', 'Gastroenteritis no especificada', 'Infeccioso', 'mild', false, true),
('A15', 'Tuberculosis del aparato respiratorio', 'Infeccioso', 'moderate', true, true),
('A16', 'Tuberculosis no respiratoria', 'Infeccioso', 'moderate', true, true),
('B00', 'Infecciones por virus del herpes simple', 'Infeccioso', 'mild', true, true),
('B01', 'Varicela', 'Infeccioso', 'mild', false, true),
('B02', 'Herpes zóster', 'Infeccioso', 'mild', false, true),
('B05', 'Sarampión', 'Infeccioso', 'moderate', false, true),
('B06', 'Rubeola', 'Infeccioso', 'mild', false, true),
('B07', 'Verrugas vírales', 'Infeccioso', 'mild', true, true),
('B15', 'Hepatitis A', 'Infeccioso', 'moderate', false, true),
('B16', 'Hepatitis B', 'Infeccioso', 'moderate', true, true),
('B18', 'Hepatitis crónica viral', 'Infeccioso', 'moderate', true, true),
('B19', 'Hepatitis viral no especificada', 'Infeccioso', 'mild', false, true),
('B20', 'Enfermedad por el VIH', 'Infeccioso', 'severe', true, true),
('B50', 'Malaria por Plasmodium falciparum', 'Infeccioso', 'severe', false, true),
('B51', 'Malaria por Plasmodium vivax', 'Infeccioso', 'moderate', false, true),
('B90', 'Secuelas de tuberculosis respiratoria', 'Infeccioso', 'moderate', true, true),

-- NEOPLASIAS (C00-D48)
('C00', 'Neoplasia maligna del labio, cavidad bucal y faringe', 'Oncológico', 'severe', true, false),
('C15', 'Neoplasia maligna del esófago', 'Oncológico', 'severe', true, false),
('C16', 'Neoplasia maligna del estómago', 'Oncológico', 'severe', true, false),
('C20', 'Neoplasia maligna del recto', 'Oncológico', 'severe', true, false),
('C25', 'Neoplasia maligna del páncreas', 'Oncológico', 'severe', true, false),
('C34', 'Neoplasia maligna de los bronquios y del pulmón', 'Oncológico', 'severe', true, false),
('C43', 'Melanoma maligno de la piel', 'Oncológico', 'severe', true, false),
('C50', 'Neoplasia maligna de la mama', 'Oncológico', 'severe', true, false),
('C53', 'Neoplasia maligna del cuello del útero', 'Oncológico', 'severe', true, false),
('C61', 'Neoplasia maligna de la próstata', 'Oncológico', 'severe', true, false),
('C67', 'Neoplasia maligna de la vejiga urinaria', 'Oncológico', 'moderate', true, false),
('C73', 'Neoplasia maligna de la glándula tiroidea', 'Oncológico', 'moderate', true, false),
('C80', 'Neoplasia maligna sin especificación del sitio', 'Oncológico', 'severe', true, false),
('D20', 'Neoplasia benigna del retroperitoneo', 'Oncológico', 'mild', true, false),
('D25', 'Leiomioma del útero', 'Oncológico', 'mild', true, false),
('D50', 'Anemia por deficiencia de hierro', 'Hematológico', 'mild', true, false),

-- ENFERMEDADES DEL SISTEMA GENITOURINARIO (N00-N99)
('N00', 'Síndrome nefrítico agudo', 'Urológico', 'moderate', false, false),
('N03', 'Síndrome nefrítico crónico', 'Urológico', 'moderate', true, false),
('N05', 'Síndrome nefrótico', 'Urológico', 'moderate', true, false),
('N10', 'Pielonefritis aguda', 'Urológico', 'moderate', false, true),
('N11', 'Pielonefritis crónica', 'Urológico', 'moderate', true, true),
('N12', 'Pielonefritis no especificada como aguda o crónica', 'Urológico', 'moderate', true, true),
('N18', 'Enfermedad renal crónica', 'Urológico', 'moderate', true, false),
('N19', 'Insuficiencia renal no especificada', 'Urológico', 'severe', true, false),
('N34', 'Uretritis', 'Urológico', 'mild', false, true),
('N39', 'Otros trastornos del sistema urinario', 'Urológico', 'mild', false, false),
('N40', 'Hiperplasia de la próstata', 'Urológico', 'mild', true, false),
('N41', 'Inflamación de la próstata', 'Urológico', 'mild', false, true),
('N42', 'Otros trastornos de la próstata', 'Urológico', 'mild', true, false),

-- EMBARAZO, PARTO Y PUERPERIO (O00-O99)
('O00', 'Embarazo ectópico', 'Obstétrico', 'severe', false, false),
('O02', 'Otras formas de aborto temprano', 'Obstétrico', 'moderate', false, false),
('O03', 'Aborto espontáneo', 'Obstétrico', 'moderate', false, false),
('O04', 'Aborto provocado', 'Obstétrico', 'moderate', false, false),
('O10', 'Hipertensión preexistente complicada por embarazo', 'Obstétrico', 'moderate', false, false),
('O14', 'Preeclampsia y eclampsia', 'Obstétrico', 'severe', false, false),
('O20', 'Hemorragia precoz del embarazo', 'Obstétrico', 'moderate', false, false),
('O30', 'Embarazo múltiple', 'Obstétrico', 'moderate', false, false),
('O40', 'Polihidramnios', 'Obstétrico', 'moderate', false, false),
('O41', 'Otros trastornos del líquido amniótico', 'Obstétrico', 'mild', false, false),
('O60', 'Parto prematuro', 'Obstétrico', 'moderate', false, false),
('O62', 'Anomalías de la dinámica del trabajo de parto', 'Obstétrico', 'moderate', false, false),
('O80', 'Parto espontáneo único cefálico', 'Obstétrico', 'mild', false, false),
('O84', 'Parto por cesárea', 'Obstétrico', 'mild', false, false),
('O86', 'Infecciones puerperales', 'Obstétrico', 'moderate', false, true),

-- SIGNOS, SÍNTOMAS Y HALLAZGOS ANORMALES (R00-R99)
('R00', 'Anomalías de la frecuencia cardíaca', 'Sintomático', 'mild', false, false),
('R01', 'Otros sonidos cardíacos anormales', 'Sintomático', 'mild', false, false),
('R05', 'Fiebre', 'Sintomático', 'mild', false, false),
('R06', 'Anomalías de la respiración', 'Sintomático', 'mild', false, false),
('R09', 'Otros síntomas y signos del aparato respiratorio', 'Sintomático', 'mild', false, false),
('R10', 'Dolor abdominal', 'Sintomático', 'mild', false, false),
('R19', 'Otros síntomas y signos del aparato digestivo', 'Sintomático', 'mild', false, false),
('R20', 'Disturbios de la sensación de la piel', 'Sintomático', 'mild', false, false),
('R25', 'Trastornos de la motilidad', 'Sintomático', 'mild', false, false),
('R50', 'Fiebre de origen desconocido', 'Sintomático', 'moderate', false, false),
('R51', 'Cefalea', 'Sintomático', 'mild', false, false),
('R60', 'Edema', 'Sintomático', 'mild', false, false),
('R61', 'Hiperhidrosis', 'Sintomático', 'mild', false, false),
('R63', 'Síntomas y signos relativos a la ingestión, regulación del apetito', 'Sintomático', 'mild', false, false),
('R64', 'Caquexia', 'Sintomático', 'moderate', true, false),
('R78', 'Hallazgos anormales de drogas', 'Sintomático', 'moderate', false, false),

-- ENFERMEDADES DEL SISTEMA OSTEOMUSCULAR (M00-M99)
('M00', 'Artritis piógena', 'Reumático', 'moderate', false, true),
('M05', 'Artritis reumatoide seronegativa', 'Reumático', 'moderate', true, false),
('M06', 'Otra artritis reumatoide', 'Reumático', 'moderate', true, false),
('M15', 'Poliartrosis', 'Reumático', 'moderate', true, false),
('M16', 'Coxartrosis', 'Reumático', 'moderate', true, false),
('M17', 'Gonartrosis', 'Reumático', 'moderate', true, false),
('M19', 'Otras artrosis', 'Reumático', 'mild', true, false),
('M30', 'Poliarteritis nudosa y afecciones conexas', 'Reumático', 'severe', true, false),
('M32', 'Lupus eritematoso sistémico', 'Reumático', 'moderate', true, false),
('M35', 'Síndrome de Sjögren', 'Reumático', 'mild', true, false),
('M45', 'Espondilitis anquilosante', 'Reumático', 'moderate', true, false),
('M50', 'Cervicalgia', 'Reumático', 'mild', false, false),
('M51', 'Otros trastornos de los discos intervertebrales', 'Reumático', 'moderate', true, false),
('M54', 'Dorsalgia', 'Reumático', 'mild', false, false),
('M70', 'Trastornos de los tejidos blandos', 'Reumático', 'mild', true, false),
('M79', 'Otros trastornos de los tejidos blandos', 'Reumático', 'mild', true, false),

-- TRAUMATISMOS, ENVENENAMIENTOS (S00-T99)
('S06', 'Traumatismo intracraneal', 'Traumático', 'severe', false, false),
('S10', 'Traumatismo superficial del cuello', 'Traumático', 'mild', false, false),
('S20', 'Traumatismo superficial del tórax', 'Traumático', 'mild', false, false),
('S40', 'Traumatismo superficial del brazo', 'Traumático', 'mild', false, false),
('S60', 'Traumatismo superficial de la muñeca y de la mano', 'Traumático', 'mild', false, false),
('S70', 'Traumatismo superficial de la cadera y del muslo', 'Traumático', 'mild', false, false),
('S80', 'Traumatismo superficial de la pierna', 'Traumático', 'mild', false, false),
('T00', 'Traumatismos múltiples superpuestos', 'Traumático', 'severe', false, false),
('T07', 'Traumatismo múltiple no especificado', 'Traumático', 'severe', false, false),
('T14', 'Traumatismo no especificado de un área del cuerpo', 'Traumático', 'mild', false, false),
('T30', 'Quemadura de partes del cuerpo sin especificación', 'Traumático', 'moderate', false, false),
('T36', 'Envenenamiento por antibióticos', 'Traumático', 'moderate', false, false),
('T39', 'Envenenamiento por analgésicos, analgésicos antipiréticos', 'Traumático', 'moderate', false, false),
('T40', 'Envenenamiento por narcóticos y psicodislépticos', 'Traumático', 'severe', false, false),
('T42', 'Envenenamiento por anticonvulsionantes', 'Traumático', 'moderate', false, false),
('T43', 'Envenenamiento por psicotrópicos', 'Traumático', 'moderate', false, false),

-- ENFERMEDADES MENTALES (F00-F99)
('F00', 'Demencia en la enfermedad de Alzheimer', 'Psiquiátrico', 'moderate', true, false),
('F01', 'Demencia vascular', 'Psiquiátrico', 'moderate', true, false),
('F03', 'Demencia, no especificada', 'Psiquiátrico', 'moderate', true, false),
('F10', 'Trastornos mentales y del comportamiento debidos al consumo', 'Psiquiátrico', 'moderate', true, false),
('F20', 'Esquizofrenia', 'Psiquiátrico', 'moderate', true, false),
('F25', 'Trastorno esquizoafectivo', 'Psiquiátrico', 'moderate', true, false),
('F30', 'Episodio maníaco', 'Psiquiátrico', 'moderate', false, false),
('F31', 'Trastorno bipolar', 'Psiquiátrico', 'moderate', true, false),
('F32', 'Episodio depresivo', 'Psiquiátrico', 'moderate', false, false),
('F33', 'Trastorno depresivo recurrente', 'Psiquiátrico', 'moderate', true, false),
('F40', 'Trastornos fóbicos de ansiedad', 'Psiquiátrico', 'mild', true, false),
('F41', 'Otros trastornos de ansiedad', 'Psiquiátrico', 'mild', true, false),
('F42', 'Trastorno obsesivo-compulsivo', 'Psiquiátrico', 'mild', true, false),
('F43', 'Reacción a estrés grave y trastorno de adaptación', 'Psiquiátrico', 'mild', false, false),
('F48', 'Otros trastornos neuróticos', 'Psiquiátrico', 'mild', true, false),
('F50', 'Trastornos de la conducta alimentaria', 'Psiquiátrico', 'moderate', true, false),
('F60', 'Trastornos específicos de la personalidad', 'Psiquiátrico', 'mild', true, false),
('F63', 'Trastornos de los hábitos y de los impulsos', 'Psiquiátrico', 'mild', true, false),
('F70', 'Retraso mental leve', 'Psiquiátrico', 'mild', true, false),
('F71', 'Retraso mental moderado', 'Psiquiátrico', 'moderate', true, false),
('F90', 'Trastorno por déficit de atención', 'Psiquiátrico', 'mild', true, false),
('F95', 'Trastorno de tics', 'Psiquiátrico', 'mild', true, false),

-- ENFERMEDADES DE LA PIEL (L00-L99)
('L00', 'Estafilocolia exfoliativa', 'Dermatológico', 'severe', false, true),
('L01', 'Impétigo', 'Dermatológico', 'mild', false, true),
('L02', 'Absceso cutáneo', 'Dermatológico', 'mild', false, true),
('L03', 'Celulitis', 'Dermatológico', 'moderate', false, true),
('L04', 'Linfadenitis aguda; linfadenitis', 'Dermatológico', 'mild', false, true),
('L08', 'Otras infecciones locales de la piel', 'Dermatológico', 'mild', false, true),
('L20', 'Dermatitis atópica', 'Dermatológico', 'mild', true, false),
('L21', 'Dermatitis seborreica', 'Dermatológico', 'mild', true, false),
('L22', 'Erupción del pañal', 'Dermatológico', 'mild', false, false),
('L23', 'Dermatitis de contacto alérgica', 'Dermatológico', 'mild', false, false),
('L24', 'Dermatitis de contacto irritante', 'Dermatológico', 'mild', false, false),
('L30', 'Otra dermatitis', 'Dermatológico', 'mild', true, false),
('L40', 'Psoriasis', 'Dermatológico', 'mild', true, false),
('L41', 'Pitiriasis rosada', 'Dermatológico', 'mild', false, false),
('L43', 'Liquen plano', 'Dermatológico', 'mild', true, false),
('L44', 'Otros trastornos de la piel', 'Dermatológico', 'mild', false, false),

-- ENFERMEDADES DEL OJO (H00-H59)
('H01', 'Inflamación de párpados', 'Oftalmológico', 'mild', false, true),
('H04', 'Trastornos del aparato lagrimal', 'Oftalmológico', 'mild', true, false),
('H10', 'Conjuntivitis', 'Oftalmológico', 'mild', false, true),
('H16', 'Queratitis', 'Oftalmológico', 'moderate', false, false),
('H20', 'Iritis y uveítis', 'Oftalmológico', 'moderate', false, false),
('H25', 'Cataratas senil', 'Oftalmológico', 'moderate', true, false),
('H26', 'Otras cataratas', 'Oftalmológico', 'moderate', true, false),
('H40', 'Glaucoma', 'Oftalmológico', 'moderate', true, false),
('H43', 'Trastornos del vítreo', 'Oftalmológico', 'moderate', true, false),
('H46', 'Neuritis óptica', 'Oftalmológico', 'moderate', false, false),
('H47', 'Otros trastornos del nervio óptico', 'Oftalmológico', 'moderate', true, false),
('H52', 'Trastornos de la acomodación', 'Oftalmológico', 'mild', true, false),
('H53', 'Trastornos visuales', 'Oftalmológico', 'mild', true, false),
('H54', 'Ceguera y baja agudeza visual', 'Oftalmológico', 'severe', true, false),

-- ENFERMEDADES DEL OÍDO (H60-H95)
('H66', 'Otitis media', 'Otorrinolaringológico', 'mild', false, true),
('H71', 'Perforación de la membrana timpánica', 'Otorrinolaringológico', 'mild', false, false),
('H80', 'Otosclerosis', 'Otorrinolaringológico', 'mild', true, false),
('H81', 'Trastornos del laberinto', 'Otorrinolaringológico', 'moderate', true, false),
('H83', 'Otros trastornos del oído interno', 'Otorrinolaringológico', 'mild', true, false),
('H90', 'Hipoacusia congénita', 'Otorrinolaringológico', 'moderate', true, false),
('H91', 'Hipoacusia no especificada', 'Otorrinolaringológico', 'mild', true, false),
('H92', 'Otalgia y efectos cerebrales del sonido', 'Otorrinolaringológico', 'mild', false, false),

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- INDEX CREACIÓN PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_diagnosis_onset_type 
  ON public.patient_diagnoses(onset_type);
CREATE INDEX IF NOT EXISTS idx_history_change_type 
  ON public.diagnosis_history(change_type);
CREATE INDEX IF NOT EXISTS idx_alert_type 
  ON public.diagnosis_alerts(alert_type);

-- ============================================================================
-- FIN MIGRACIÓN DIAGNÓSTICO UNIFICADO
-- ============================================================================
