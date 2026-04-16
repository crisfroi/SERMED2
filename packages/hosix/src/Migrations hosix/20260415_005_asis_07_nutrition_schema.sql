-- ============================================================================
-- MIGRATION 006: ASIS_07 - NUTRITION & DIETETICS (NUTRICIÓN Y DIETÉTICA)
-- FECHA: 2026-04-15
-- PROPOSITO: Evaluación nutricional, planes de dieta, seguimiento
-- ============================================================================

-- ============================================================================
-- 1. NUTRITION ASSESSMENT (Evaluación Nutricional)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Assessment Date
    assessment_date DATE NOT NULL,
    
    -- Anthropometric Measurements
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    bmi DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN height_cm > 0 THEN (weight_kg / ((height_cm / 100) * (height_cm / 100))) ELSE NULL END
    ) STORED,
    mid_arm_circumference_cm DECIMAL(5, 2),
    waist_circumference_cm DECIMAL(5, 2),
    hip_circumference_cm DECIMAL(5, 2),
    
    -- Body Composition
    muscle_mass_percentage DECIMAL(5, 2),
    fat_percentage DECIMAL(5, 2),
    water_percentage DECIMAL(5, 2),
    
    -- Biochemical Data
    hemoglobin_g_dl DECIMAL(5, 2),
    albumin_g_dl DECIMAL(5, 2),
    prealbumin_mg_dl DECIMAL(5, 2),
    total_protein_g_dl DECIMAL(5, 2),
    albumin_globulin_ratio DECIMAL(5, 2),
    
    -- Nutritional Status Assessment
    nutritional_status VARCHAR(50), -- well_nourished, at_risk, malnourished, obese
    classification VARCHAR(50), -- normal, overweight, obese, underweight, wasted, stunted
    
    -- Clinical History
    feeding_difficulty BOOLEAN DEFAULT false,
    swallowing_difficulty BOOLEAN DEFAULT false,
    tooth_loss INT DEFAULT 0,
    dentures BOOLEAN DEFAULT false,
    nutrient_malabsorption TEXT,
    appetite_status VARCHAR(50), -- normal, increased, decreased
    appetite_loss BOOLEAN DEFAULT false,
    
    -- Medications Affecting Nutrition
    medications_that_affect_nutrition TEXT,
    
    -- Dietary Habits
    meals_per_day INT,
    snacks_per_day INT,
    water_intake_liters DECIMAL(5, 2),
    alcohol_consumption TEXT,
    caffeine_consumption TEXT,
    
    -- Clinical Assessment
    clinical_assessment TEXT,
    recommendations TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_assessment_patient ON nutrition_assessment(patient_id);
CREATE INDEX idx_nutrition_assessment_date ON nutrition_assessment(assessment_date);
CREATE INDEX idx_nutrition_assessment_status ON nutrition_assessment(nutritional_status);

-- ============================================================================
-- 2. NUTRITION PLANS (Planes Dietéticos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES nutrition_assessment(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Plan Details
    plan_type VARCHAR(50), -- therapeutic, weight_management, supplementation, standard
    start_date DATE NOT NULL,
    end_date DATE,
    duration_days INT,
    
    -- Nutritional Goals
    caloric_goal INT, -- kcal/day
    protein_target_g DECIMAL(5, 2),
    carbs_target_g DECIMAL(5, 2),
    fats_target_g DECIMAL(5, 2),
    fiber_target_g DECIMAL(5, 2),
    
    -- Macronutrient Distribution
    protein_percentage DECIMAL(5, 2),
    carbs_percentage DECIMAL(5, 2),
    fats_percentage DECIMAL(5, 2),
    
    -- Micronutrient Targets
    calcium_target_mg INT,
    iron_target_mg DECIMAL(5, 2),
    vitamin_d_target_iu INT,
    vitamin_b12_target_mcg DECIMAL(5, 2),
    sodium_target_mg INT,
    
    -- Dietary Restrictions
    restrictions TEXT, -- gluten_free, lactose_free, vegetarian, vegan, nut_allergy, etc
    foods_to_avoid TEXT,
    
    -- Feeding Method
    feeding_method VARCHAR(50), -- oral, tube, parenteral
    
    -- Adherence Target
    adherence_goal INT DEFAULT 80, -- percentage
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_plan_patient ON nutrition_plan(patient_id);
CREATE INDEX idx_nutrition_plan_dates ON nutrition_plan(start_date, end_date);

-- ============================================================================
-- 3. MEAL PLANS (Planes de Comidas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutrition_plan_id UUID NOT NULL REFERENCES nutrition_plan(id) ON DELETE CASCADE,
    
    meal_type VARCHAR(50), -- breakfast, lunch, dinner, snack
    sequence_number INT, -- día 1, día 2, etc
    
    -- Meal Details
    meal_description TEXT,
    preparation_instructions TEXT,
    estimated_calories INT,
    estimated_protein_g DECIMAL(5, 2),
    estimated_carbs_g DECIMAL(5, 2),
    estimated_fats_g DECIMAL(5, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. NUTRITION MONITORING (Monitoreo de Adherencia)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    nutrition_plan_id UUID NOT NULL REFERENCES nutrition_plan(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES provider(id) ON DELETE SET NULL,
    
    -- Monitoring Date
    monitoring_date DATE NOT NULL,
    
    -- Current Status
    weight_kg DECIMAL(5, 2),
    weight_change_kg DECIMAL(5, 2),
    bmi DECIMAL(5, 2),
    
    -- Adherence Assessment
    adherence_percentage INT,
    adherence_rating VARCHAR(50), -- excellent, good, fair, poor
    barriers_to_adherence TEXT,
    
    -- Dietary Intake
    current_caloric_intake INT,
    dietary_survey_notes TEXT,
    
    -- Lab Values (Recent)
    hemoglobin_g_dl DECIMAL(5, 2),
    albumin_g_dl DECIMAL(5, 2),
    
    -- Changes Made
    plan_modifications TEXT,
    goals_achieved TEXT,
    goals_not_achieved TEXT,
    
    -- Next Steps
    recommendations TEXT,
    next_visit_date DATE,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_monitoring_patient ON nutrition_monitoring(patient_id);
CREATE INDEX idx_nutrition_monitoring_date ON nutrition_monitoring(monitoring_date);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_nutrition_assessment_updated_at BEFORE UPDATE ON nutrition_assessment
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_nutrition_plan_updated_at BEFORE UPDATE ON nutrition_plan
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TOTAL: 4 tables created
-- ============================================================================
