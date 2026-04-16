-- WEEK 6 - ASIS 8: Nutrition/Dietetics Database Schema
-- Migration: 20260415_008_create_nutrition_tables.sql
-- Date: April 15, 2026
-- Purpose: Comprehensive nutritional assessment and diet planning system

-- ==================== NUTRITION MODULE TABLES ====================

-- 1. nutrition_assessments - Patient nutritional status evaluation
CREATE TABLE public.nutrition_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  assessment_date TIMESTAMP NOT NULL,
  nutritionist_id UUID,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'reviewed')) DEFAULT 'pending',
  bmi DECIMAL(5, 2),
  weight_kg DECIMAL(6, 2),
  height_cm DECIMAL(5, 1),
  ideal_weight_kg DECIMAL(6, 2),
  weight_change_percent DECIMAL(5, 2), -- % change from baseline
  waist_circumference_cm DECIMAL(5, 1),
  hip_circumference_cm DECIMAL(5, 1),
  muscle_mass_percent DECIMAL(5, 2),
  body_fat_percent DECIMAL(5, 2),
  nutritional_status TEXT CHECK (nutritional_status IN ('well_nourished', 'at_risk', 'malnourished', 'overweight', 'obese')),
  dietary_restrictions TEXT, -- Comma-separated: vegetarian, vegan, gluten-free, dairy-free, etc.
  food_allergies TEXT,
  food_intolerances TEXT,
  cultural_dietary_preferences TEXT,
  religious_dietary_requirements TEXT,
  appetite_level TEXT CHECK (appetite_level IN ('excellent', 'good', 'fair', 'poor')),
  chewing_difficulties BOOLEAN DEFAULT false,
  swallowing_difficulties BOOLEAN DEFAULT false,
  gastrointestinal_issues TEXT,
  medications_affecting_nutrition TEXT,
  supplement_use TEXT,
  alcohol_consumption TEXT CHECK (alcohol_consumption IN ('none', 'minimal', 'moderate', 'heavy')),
  exercise_frequency TEXT CHECK (exercise_frequency IN ('sedentary', 'light', 'moderate', 'vigorous')),
  typical_daily_calories INTEGER,
  recommended_daily_calories INTEGER,
  protein_needs_grams DECIMAL(6, 1),
  fiber_needs_grams DECIMAL(5, 1),
  water_intake_liters DECIMAL(4, 1),
  nutritional_concerns TEXT,
  goals_short_term TEXT,
  goals_long_term TEXT,
  referral_needed BOOLEAN DEFAULT false,
  referral_type TEXT, -- Registered Dietitian, Bariatric Specialist, etc.
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE
);

-- 2. diet_plans - Personalized diet plans for patients
CREATE TABLE public.diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  nutrition_assessment_id UUID,
  diet_type TEXT NOT NULL CHECK (diet_type IN ('balanced', 'low_carb', 'low_fat', 'high_protein', 'ketogenic', 'mediterranean', 'dash', 'diabetic', 'renal', 'cardiac', 'gluten_free', 'other')),
  diet_name VARCHAR(255),
  description TEXT,
  created_date TIMESTAMP DEFAULT current_timestamp,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT CHECK (status IN ('active', 'completed', 'modified', 'discontinued')) DEFAULT 'active',
  created_by_id UUID,
  last_modified_by_id UUID,
  daily_calorie_target INTEGER,
  daily_protein_grams DECIMAL(6, 1),
  daily_carbs_grams DECIMAL(6, 1),
  daily_fat_grams DECIMAL(6, 1),
  daily_fiber_grams DECIMAL(5, 1),
  daily_sodium_mg INTEGER,
  daily_potassium_mg INTEGER,
  daily_calcium_mg INTEGER,
  daily_iron_mg DECIMAL(5, 1),
  meal_frequency INTEGER, -- e.g., 3 meals + 2 snacks = 5
  meal_timing TEXT, -- e.g., "Breakfast 7am, Lunch 12pm, Dinner 6pm"
  special_instructions TEXT,
  foods_to_include TEXT,
  foods_to_avoid TEXT,
  portion_size_guidance TEXT,
  hydration_guidelines TEXT,
  supplemental_nutrition_needed BOOLEAN DEFAULT false,
  supplement_type TEXT, -- Protein shake, vitamin, mineral, etc.
  supplement_frequency TEXT,
  follow_up_frequency_days INTEGER,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  compliance_notes TEXT,
  modifications_history TEXT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  FOREIGN KEY (nutrition_assessment_id) REFERENCES public.nutrition_assessments(id) ON DELETE SET NULL
);

-- 3. food_items - Food database with nutritional content
CREATE TABLE public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_name VARCHAR(255) NOT NULL UNIQUE,
  food_category TEXT NOT NULL CHECK (food_category IN ('grains', 'protein', 'vegetables', 'fruits', 'dairy', 'fats_oils', 'beverages', 'snacks', 'condiments', 'other')),
  serving_size_grams DECIMAL(6, 1),
  calories_per_serving DECIMAL(7, 2),
  protein_grams DECIMAL(5, 1),
  carbs_grams DECIMAL(5, 1),
  fat_grams DECIMAL(5, 1),
  saturated_fat_grams DECIMAL(4, 1),
  trans_fat_grams DECIMAL(4, 1),
  cholesterol_mg DECIMAL(5, 1),
  sodium_mg DECIMAL(5, 1),
  potassium_mg DECIMAL(5, 1),
  fiber_grams DECIMAL(4, 1),
  sugars_grams DECIMAL(5, 1),
  calcium_mg DECIMAL(5, 1),
  iron_mg DECIMAL(5, 2),
  vitamin_a_iu DECIMAL(7, 1),
  vitamin_c_mg DECIMAL(5, 1),
  vitamin_d_iu DECIMAL(5, 1),
  glycemic_index INTEGER,
  allergen_information TEXT, -- Peanuts, Tree nuts, Shellfish, etc.
  is_organic BOOLEAN DEFAULT false,
  is_gmo_free BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_vegetarian BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp
);

-- 4. patient_nutrition_tracking - Daily nutrition tracking for patients
CREATE TABLE public.patient_nutrition_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_timestamp(),
  patient_id UUID NOT NULL,
  tracking_date DATE NOT NULL,
  diet_plan_id UUID,
  total_calories DECIMAL(7, 2),
  total_protein_grams DECIMAL(6, 1),
  total_carbs_grams DECIMAL(6, 1),
  total_fat_grams DECIMAL(6, 1),
  total_fiber_grams DECIMAL(5, 1),
  total_sodium_mg DECIMAL(7, 1),
  meals_logged_count INTEGER,
  compliance_percentage DECIMAL(5, 2), -- % of daily target met
  water_intake_liters DECIMAL(4, 1),
  exercise_minutes INTEGER,
  weight_kg DECIMAL(6, 2),
  mood TEXT CHECK (mood IN ('excellent', 'good', 'fair', 'poor')),
  energy_level TEXT CHECK (energy_level IN ('high', 'normal', 'low')),
  digestion_issues TEXT, -- Yes/No with description if yes
  cravings TEXT,
  notes TEXT,
  adherence_notes TEXT,
  entries_reviewed_by_id UUID,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  FOREIGN KEY (diet_plan_id) REFERENCES public.diet_plans(id) ON DELETE SET NULL,
  UNIQUE(patient_id, tracking_date)
);

-- 5. nutritionist_recommendations - Nutrient-specific recommendations
CREATE TABLE public.nutritionist_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_assessment_id UUID,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('nutrient', 'food_group', 'meal_timing', 'supplementation', 'lifestyle', 'monitoring')),
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  recommendation TEXT NOT NULL,
  rationale TEXT,
  timeframe TEXT, -- Immediate, 1-2 weeks, 1-3 months, long-term
  expected_outcome TEXT,
  baseline_measurement TEXT,
  target_measurement TEXT,
  follow_up_date TIMESTAMP,
  status TEXT CHECK (status IN ('active', 'completed', 'not_applicable', 'modified')),
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  patient_feedback TEXT,
  modification_reason TEXT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (nutrition_assessment_id) REFERENCES public.nutrition_assessments(id) ON DELETE CASCADE
);

-- ==================== INDEXES ====================

-- Nutrition assessments indexes
CREATE INDEX idx_nutrition_assessments_patient ON public.nutrition_assessments(patient_id);
CREATE INDEX idx_nutrition_assessments_date ON public.nutrition_assessments(assessment_date);
CREATE INDEX idx_nutrition_assessments_status ON public.nutrition_assessments(status);

-- Diet plans indexes
CREATE INDEX idx_diet_plans_patient ON public.diet_plans(patient_id);
CREATE INDEX idx_diet_plans_assessment ON public.diet_plans(nutrition_assessment_id);
CREATE INDEX idx_diet_plans_status ON public.diet_plans(status);
CREATE INDEX idx_diet_plans_type ON public.diet_plans(diet_type);

-- Food items indexes
CREATE INDEX idx_food_items_name ON public.food_items(food_name);
CREATE INDEX idx_food_items_category ON public.food_items(food_category);
CREATE INDEX idx_food_items_active ON public.food_items(active);

-- Nutrition tracking indexes
CREATE INDEX idx_nutrition_tracking_patient ON public.patient_nutrition_tracking(patient_id);
CREATE INDEX idx_nutrition_tracking_date ON public.patient_nutrition_tracking(tracking_date);
CREATE INDEX idx_nutrition_tracking_plan ON public.patient_nutrition_tracking(diet_plan_id);

-- Recommendations indexes
CREATE INDEX idx_recommendations_assessment ON public.nutritionist_recommendations(nutrition_assessment_id);
CREATE INDEX idx_recommendations_status ON public.nutritionist_recommendations(status);
CREATE INDEX idx_recommendations_type ON public.nutritionist_recommendations(recommendation_type);

-- ==================== ROW LEVEL SECURITY POLICIES ====================

-- Enable RLS
ALTER TABLE public.nutrition_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_nutrition_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritionist_recommendations ENABLE ROW LEVEL SECURITY;

-- nutrition_assessments - Patients see their own, staff sees all
CREATE POLICY "nutrition_assessments_read" ON public.nutrition_assessments
  FOR SELECT USING (
    patient_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'nutritionist', 'medical_staff'))
  );

CREATE POLICY "nutrition_assessments_insert" ON public.nutrition_assessments
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- diet_plans - Patients and nutritionists
CREATE POLICY "diet_plans_read" ON public.diet_plans
  FOR SELECT USING (
    patient_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'nutritionist', 'medical_staff'))
  );

-- food_items - All authenticated can read
CREATE POLICY "food_items_read_all" ON public.food_items
  FOR SELECT USING (true);

-- patient_nutrition_tracking - Patients and nutritionists
CREATE POLICY "nutrition_tracking_read" ON public.patient_nutrition_tracking
  FOR SELECT USING (
    patient_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'nutritionist', 'medical_staff'))
  );

-- recommendations - Patients and nutritionists
CREATE POLICY "recommendations_read" ON public.nutritionist_recommendations
  FOR SELECT USING (
    nutrition_assessment_id IN (
      SELECT id FROM public.nutrition_assessments WHERE patient_id = auth.uid()
    ) OR
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'nutritionist'))
  );

-- ==================== TRIGGERS ====================

-- Update nutritional status based on BMI
CREATE OR REPLACE FUNCTION update_nutritional_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bmi < 18.5 THEN
    NEW.nutritional_status = 'malnourished';
  ELSIF NEW.bmi >= 18.5 AND NEW.bmi < 25 THEN
    NEW.nutritional_status = 'well_nourished';
  ELSIF NEW.bmi >= 25 AND NEW.bmi < 30 THEN
    NEW.nutritional_status = 'overweight';
  ELSE
    NEW.nutritional_status = 'obese';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nutrition_assessments_status_trigger
  BEFORE INSERT OR UPDATE ON public.nutrition_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_nutritional_status();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_nutrition_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = current_timestamp;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nutrition_assessments_timestamp_trigger
  BEFORE UPDATE ON public.nutrition_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_modified_timestamp();

CREATE TRIGGER diet_plans_timestamp_trigger
  BEFORE UPDATE ON public.diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_modified_timestamp();

CREATE TRIGGER food_items_timestamp_trigger
  BEFORE UPDATE ON public.food_items
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_modified_timestamp();

CREATE TRIGGER nutrition_tracking_timestamp_trigger
  BEFORE UPDATE ON public.patient_nutrition_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_modified_timestamp();

CREATE TRIGGER recommendations_timestamp_trigger
  BEFORE UPDATE ON public.nutritionist_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_modified_timestamp();

-- ==================== SEED DATA ====================

-- Insert common food items for diet plans
INSERT INTO public.food_items (food_name, food_category, serving_size_grams, calories_per_serving, protein_grams, carbs_grams, fat_grams, fiber_grams, sodium_mg)
VALUES
  ('Chicken Breast', 'protein', 100, 165, 31, 0, 3.6, 0, 74),
  ('Salmon', 'protein', 100, 208, 20, 0, 13, 0, 75),
  ('Eggs', 'protein', 50, 78, 6.3, 0.6, 5.3, 0, 71),
  ('Greek Yogurt', 'dairy', 170, 130, 23, 9, 0.4, 0, 75),
  ('Brown Rice', 'grains', 150, 195, 4.3, 43, 1.8, 3.5, 6),
  ('Whole Wheat Bread', 'grains', 30, 80, 4.5, 14, 1.5, 2.5, 190),
  ('Broccoli', 'vegetables', 100, 34, 2.8, 7, 0.4, 2.4, 64),
  ('Spinach', 'vegetables', 100, 23, 2.7, 3.6, 0.4, 2.7, 79),
  ('Banana', 'fruits', 120, 107, 1.3, 27, 0.3, 3.1, 2),
  ('Apple', 'fruits', 100, 52, 0.3, 14, 0.2, 2.4, 2),
  ('Olive Oil', 'fats_oils', 15, 135, 0, 0, 15, 0, 0),
  ('Almond', 'snacks', 23, 128, 4.6, 4.2, 11, 2.4, 0),
  ('Water', 'beverages', 250, 0, 0, 0, 0, 0, 0),
  ('Green Tea', 'beverages', 240, 2, 0, 0.4, 0, 0, 2),
  ('Oats', 'grains', 40, 150, 5, 27, 3, 4, 1),
  ('Salmon Fillet', 'protein', 150, 312, 30, 0, 20, 0, 112),
  ('Tofu', 'protein', 100, 76, 8.1, 1.9, 4.8, 1.3, 7),
  ('Lentils', 'protein', 100, 116, 9, 20, 0.4, 8, 2),
  ('Chickpeas', 'protein', 100, 164, 9, 27, 2.6, 6, 7),
  ('Sweet Potato', 'vegetables', 100, 86, 1.6, 20, 0.1, 3, 55);
