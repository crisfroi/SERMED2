-- ============================================================================
-- WEEK 4 - HITO 1: SQL SCHEMAS
-- ASIS 7: Nutrición - Evaluación y Seguimiento Nutricional
-- FECHA: Abril 14, 2026 - 01:00 UTC
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. TABLA: nutrition_assessment_types
-- Tipo de evaluaciones nutricionales (referencial)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nutrition_assessment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  assessment_category VARCHAR(100), -- anthropometric, biochemical, clinical, dietary
  required_fields TEXT[], -- JSON fields required for this type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLA: patient_nutrition_assessments
-- Evaluaciones nutricionales del paciente (HITO 1: Core table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_nutrition_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  center_id UUID REFERENCES public.centros_salud(id),
  
  -- Assessment data
  assessment_type_id UUID REFERENCES public.nutrition_assessment_types(id),
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Anthropometric measurements
  weight_kg DECIMAL(6, 2), -- Patient weight in kg
  height_cm DECIMAL(6, 2), -- Patient height in cm
  bmi DECIMAL(5, 2), -- BMI auto-calculated (weight / (height/100)^2)
  bmi_classification VARCHAR(50), -- underweight, normal, overweight, obese
  
  -- Biochemical markers
  hemoglobin_g_dl DECIMAL(5, 2),
  albumin_g_dl DECIMAL(5, 2),
  prealbumin_g_dl DECIMAL(5, 2),
  total_protein_g_dl DECIMAL(5, 2),
  
  -- Clinical assessment
  muscle_mass_percentage DECIMAL(5, 2),
  fat_percentage DECIMAL(5, 2),
  nutritional_status VARCHAR(50), -- well-nourished, mild, moderate, severe malnutrition
  risk_level VARCHAR(50), -- low, medium, high
  
  -- Dietary assessment
  main_dietary_habits TEXT,
  food_allergies TEXT[],
  food_intolerances TEXT[],
  restrict dietary VARCHAR(255), -- vegetarian, vegan, gluten-free, etc.
  
  -- Risk factors
  feeding_difficulty BOOLEAN DEFAULT FALSE,
  swallowing_difficulty BOOLEAN DEFAULT FALSE,
  nutrient_malabsorption BOOLEAN DEFAULT FALSE,
  increased_nutrient_needs BOOLEAN DEFAULT FALSE,
  appetite_loss BOOLEAN DEFAULT FALSE,
  
  -- Assessment notes
  clinical_assessment TEXT,
  recommendations TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  assessed_by_id UUID REFERENCES public.users(id),
  status VARCHAR(50) DEFAULT 'active', -- active, completed, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLA: dietary_intake_records
-- Registros de ingesta dietética (24-hour recall, food frequency)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dietary_intake_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nutrition_assessment_id UUID REFERENCES public.patient_nutrition_assessments(id) ON DELETE SET NULL,
  center_id UUID REFERENCES public.centros_salud(id),
  
  -- Intake details
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_type VARCHAR(50), -- 24hour_recall, food_frequency, typical_day
  
  -- Meal data
  breakfast JSONB, -- {foods: [{name, portion, calories}]}
  lunch JSONB,
  dinner JSONB,
  snacks JSONB,
  
  -- Nutritional totals for day
  total_calories DECIMAL(8, 2),
  total_protein_g DECIMAL(8, 2),
  total_carbs_g DECIMAL(8, 2),
  total_fat_g DECIMAL(8, 2),
  total_fiber_g DECIMAL(8, 2),
  
  -- Micronutrients
  calcium_mg DECIMAL(8, 2),
  iron_mg DECIMAL(8, 2),
  zinc_mg DECIMAL(8, 2),
  vitamin_a_iu DECIMAL(10, 2),
  vitamin_c_mg DECIMAL(8, 2),
  
  -- Additional data
  water_intake_liters DECIMAL(4, 2),
  supplements_taken TEXT[],
  notes TEXT,
  
  -- Metadata
  recorded_by_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLA: nutrition_plans
-- Planes nutricionales personalizados (HITO 1: Core table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nutrition_assessment_id UUID NOT NULL REFERENCES public.patient_nutrition_assessments(id) ON DELETE CASCADE,
  center_id UUID REFERENCES public.centros_salud(id),
  
  -- Plan details
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, completed, cancelled
  
  -- Plan specifications
  daily_calorie_target DECIMAL(8, 2),
  protein_g_per_day DECIMAL(8, 2),
  carbs_percentage DECIMAL(5, 2),
  fat_percentage DECIMAL(5, 2),
  
  -- Special requirements
  therapeutic_diet VARCHAR(255), -- diabetic, renal, cardiac, etc.
  texture_modification VARCHAR(100), -- normal, soft, chopped, puree, liquid
  feeding_method VARCHAR(100), -- oral, tube_feeding, parenteral
  
  -- Plan composition
  macronutrient_recommendations JSONB, -- {proteins: {min, max, type}, carbs: {...}, fats: {...}}
  micronutrient_focus TEXT[], -- Array of specific micronutrients to target
  
  -- Meal plan structure
  meal_frequency INTEGER DEFAULT 3, -- number of main meals
  custom_meal_schedule JSONB, -- {breakfast: "7:00", lunch: "12:00", etc.}
  
  -- Supplementation
  supplements_prescribed JSONB, -- {supplement_name: {dosage, frequency, duration}}
  mineral_supplementation TEXT,
  vitamin_supplementation TEXT,
  
  -- Objectives
  nutrition_objectives TEXT[], -- Array of specific goals
  expected_outcomes TEXT,
  
  -- Monitoring
  monitoring_frequency VARCHAR(50), -- weekly, biweekly, monthly
  follow_up_date DATE,
  
  -- Metadata
  created_by_id UUID NOT NULL REFERENCES public.users(id),
  last_modified_by_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLA: nutrition_outcomes
-- Resultados y seguimiento de planes nutricionales
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nutrition_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nutrition_plan_id UUID NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
  center_id UUID REFERENCES public.centros_salud(id),
  
  -- Follow-up visit
  follow_up_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_number INTEGER, -- 1st follow-up, 2nd follow-up, etc.
  
  -- Weight/Measurement changes
  weight_kg DECIMAL(6, 2),
  weight_change_kg DECIMAL(6, 2), -- compared to baseline
  weight_change_percentage DECIMAL(5, 2),
  bmi DECIMAL(5, 2),
  bmi_classification VARCHAR(50),
  
  -- Plan adherence
  adherence_percentage DECIMAL(5, 2), -- 0-100%
  adherence_level VARCHAR(50), -- excellent, good, fair, poor
  adherence_notes TEXT,
  
  -- Tolerance and side effects
  gastrointestinal_tolerance VARCHAR(100), -- well-tolerated, mild issues, moderate issues, poor
  supplement_tolerance TEXT,
  side_effects TEXT[],
  
-- Nutritional status improvement
  nutritional_status VARCHAR(50), -- well-nourished, mild, moderate, severe malnutrition
  status_change VARCHAR(50), -- improved, stable, worsened
  
  -- Biomarkers (if measured)
  hemoglobin_g_dl DECIMAL(5, 2),
  albumin_g_dl DECIMAL(5, 2),
  
  -- Outcomes assessment
  achieved_objectives TEXT[], -- Array of met objectives
  unmet_objectives TEXT[], -- Array of unmet objectives
  barriers_to_adherence TEXT,
  
  -- Next steps
  plan_modifications JSONB, -- Changes to nutrition plan
  new_recommendations TEXT,
  next_follow_up_date DATE,
  
  -- Metadata
  assessed_by_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES - Performance optimization
-- ============================================================================
CREATE INDEX idx_nutrition_assessments_patient ON public.patient_nutrition_assessments(patient_id);
CREATE INDEX idx_nutrition_assessments_center ON public.patient_nutrition_assessments(center_id);
CREATE INDEX idx_nutrition_assessments_date ON public.patient_nutrition_assessments(assessment_date);
CREATE INDEX idx_nutrition_assessments_status ON public.patient_nutrition_assessments(status);

CREATE INDEX idx_dietary_records_patient ON public.dietary_intake_records(patient_id);
CREATE INDEX idx_dietary_records_date ON public.dietary_intake_records(record_date);

CREATE INDEX idx_nutrition_plans_patient ON public.nutrition_plans(patient_id);
CREATE INDEX idx_nutrition_plans_status ON public.nutrition_plans(status);
CREATE INDEX idx_nutrition_plans_dates ON public.nutrition_plans(start_date, end_date);

CREATE INDEX idx_nutrition_outcomes_patient ON public.nutrition_outcomes(patient_id);
CREATE INDEX idx_nutrition_outcomes_plan ON public.nutrition_outcomes(nutrition_plan_id);
CREATE INDEX idx_nutrition_outcomes_date ON public.nutrition_outcomes(follow_up_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.nutrition_assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_nutrition_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietary_intake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_outcomes ENABLE ROW LEVEL SECURITY;

-- nutrition_assessment_types - Public read, Admin modify
CREATE POLICY rls_nutrition_assessment_types_read ON public.nutrition_assessment_types
  FOR SELECT USING (true);

CREATE POLICY rls_nutrition_assessment_types_modify ON public.nutrition_assessment_types
  FOR INSERT, UPDATE, DELETE 
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- patient_nutrition_assessments - User sees own, Doctors see their patients
CREATE POLICY rls_nutrition_assessments_select ON public.patient_nutrition_assessments
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.jwt() ->> 'role' IN ('admin', 'doctor', 'nutritionist') OR
    EXISTS (
      SELECT 1 FROM public.pacientes_profesionales
      WHERE pacientes_profesionales.paciente_id = patient_id
      AND pacientes_profesionales.profesional_id = auth.uid()
    )
  );

CREATE POLICY rls_nutrition_assessments_insert ON public.patient_nutrition_assessments
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'doctor', 'nutritionist')
  );

CREATE POLICY rls_nutrition_assessments_update ON public.patient_nutrition_assessments
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'doctor', 'nutritionist')
  );

-- dietary_intake_records - User sees own, Professionals see their patients
CREATE POLICY rls_dietary_records_select ON public.dietary_intake_records
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.jwt() ->> 'role' IN ('admin', 'nutritionist') OR
    EXISTS (
      SELECT 1 FROM public.pacientes_profesionales
      WHERE pacientes_profesionales.paciente_id = patient_id
      AND pacientes_profesionales.profesional_id = auth.uid()
    )
  );

-- nutrition_plans - User sees own, Professionals modify own
CREATE POLICY rls_nutrition_plans_select ON public.nutrition_plans
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.jwt() ->> 'role' IN ('admin', 'nutritionist') OR
    auth.uid() = created_by_id
  );

CREATE POLICY rls_nutrition_plans_modify ON public.nutrition_plans
  FOR INSERT, UPDATE, DELETE USING (
    auth.jwt() ->> 'role' IN ('admin', 'nutritionist') OR
    auth.uid() = created_by_id
  );

-- nutrition_outcomes - User sees own, Professionals see their patients
CREATE POLICY rls_nutrition_outcomes_select ON public.nutrition_outcomes
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.jwt() ->> 'role' IN ('admin', 'nutritionist')
  );

-- ============================================================================
-- TRIGGERS - Automated calculations and updates
-- ============================================================================

-- Calculate BMI automatically
CREATE OR REPLACE FUNCTION calculate_nutrition_bmi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.weight_kg IS NOT NULL AND NEW.height_cm IS NOT NULL THEN
    NEW.bmi := ROUND((NEW.weight_kg / POWER(NEW.height_cm / 100.0, 2))::NUMERIC, 2);
    
    -- Classification
    IF NEW.bmi < 18.5 THEN
      NEW.bmi_classification := 'underweight';
    ELSIF NEW.bmi >= 18.5 AND NEW.bmi < 25 THEN
      NEW.bmi_classification := 'normal';
    ELSIF NEW.bmi >= 25 AND NEW.bmi < 30 THEN
      NEW.bmi_classification := 'overweight';
    ELSE
      NEW.bmi_classification := 'obese';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_nutrition_bmi
  BEFORE INSERT OR UPDATE ON public.patient_nutrition_assessments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_nutrition_bmi();

-- Track weight changes
CREATE OR REPLACE FUNCTION calculate_weight_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.weight_kg IS NOT NULL THEN
    -- Find previous weight from patient's last assessment
    SELECT weight_kg INTO STRICT NEW.weight_change_kg
    FROM public.patient_nutrition_assessments
    WHERE patient_id = NEW.patient_id
    AND id != NEW.id
    ORDER BY follow_up_date DESC
    LIMIT 1;
    
    IF NEW.weight_change_kg IS NOT NULL THEN
      NEW.weight_change_kg := ROUND((NEW.weight_kg - COALESCE(NEW.weight_change_kg, NEW.weight_kg))::NUMERIC, 2);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_weight_changes
  BEFORE INSERT OR UPDATE ON public.nutrition_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_weight_changes();

-- Update modified timestamp
CREATE OR REPLACE FUNCTION update_nutrition_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nutrition_assessment_timestamp
  BEFORE UPDATE ON public.patient_nutrition_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_timestamp();

CREATE TRIGGER trigger_update_nutrition_plans_timestamp
  BEFORE UPDATE ON public.nutrition_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_timestamp();

-- ============================================================================
-- SEED DATA - Nutrition Assessment Types
-- ============================================================================
INSERT INTO public.nutrition_assessment_types (code, name, description, assessment_category, required_fields) VALUES
  ('NAT_001', 'Evaluación Nutricional Básica', 'Evaluación inicial con medidas antropométricas básicas', 'anthropometric', '["weight_kg","height_cm","bmi"]'),
  ('NAT_002', 'Evaluación Nutricional Completa', 'Evaluación comprensiva con medidas antropométricas y bioquímicas', 'biochemical', '["weight_kg","height_cm","hemoglobin_g_dl","albumin_g_dl"]'),
  ('NAT_003', 'Evaluación Nutricional Pediátrica', 'Evaluación especializada para niños', 'anthropometric', '["weight_kg","height_cm","age_months"]'),
  ('NAT_004', 'Evaluación Nutricional Geriátrica', 'Evaluación para adultos mayores', 'clinical', '["weight_kg","height_cm","muscle_mass_percentage"]'),
  ('NAT_005', 'Evaluación Nutricional Quirúrgica', 'Pre y post-evaluación quirúrgica', 'biochemical', '["weight_kg","albumin_g_dl","prealbumin_g_dl"]')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- GRANTS - Permissions
-- ============================================================================
GRANT SELECT ON public.nutrition_assessment_types TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.patient_nutrition_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.dietary_intake_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.nutrition_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.nutrition_outcomes TO authenticated;
