-- ============================================================================
-- DATABASE MIGRATIONS - MÓDULO 00-CORE EXPANSION
-- ============================================================================
--
-- Purpose: Create and expand core tables for patient management, security,
--          and auditoria
-- 
-- Status: READY TO APPLY (Check existing tables first)
-- 
-- Changelog:
-- 2026-04-21: Initial creation with encryption and audit support
--
-- ============================================================================

-- ============================================================================
-- CREATE MAIN TABLES (IF NOT EXIST)
-- ============================================================================

-- TABLE: hospitals
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL, -- Unique hospital identifier
  address TEXT, -- Encrypted
  phone VARCHAR(20), -- Encrypted
  email VARCHAR(255), -- Encrypted
  director_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  established_date DATE,
  bed_count INT DEFAULT 0,
  department_count INT DEFAULT 0,
  is_teaching_hospital BOOLEAN DEFAULT false,
  coordinates POINT, -- For mapping (lat, lng)
  timezone VARCHAR(50) DEFAULT 'UTC',
  website VARCHAR(255),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- TABLE: healthcare_personnel (formerly known as users in healthcare context)
CREATE TABLE IF NOT EXISTS healthcare_personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES hospital_departments(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL, -- SuperAdmin, Director, Physician, Nurse, etc.
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  specialties TEXT[], -- Array of medical specialties
  license_number VARCHAR(100) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_role CHECK (role IN (
    'SuperAdmin', 'Hospital Director', 'Department Head',
    'Physician', 'Nurse', 'Receptionist', 'Pharmacist',
    'Lab Technician', 'Radiologist', 'Administrator'
  ))
);

-- TABLE: patients (EXPAND WITH NEW FIELDS)
CREATE TABLE IF NOT EXISTS patients (
  -- ID and basic
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES hospital_departments(id),
  
  -- Demographics (ENCRYPTED FIELDS)
  first_name VARCHAR(255) NOT NULL, -- ENCRYPT
  last_name VARCHAR(255) NOT NULL, -- ENCRYPT
  email VARCHAR(255), -- ENCRYPT (also store hash for duplicate detection)
  phone VARCHAR(20), -- ENCRYPT
  date_of_birth DATE, -- ENCRYPT
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('M', 'F', 'O', 'N')),
  blood_type VARCHAR(5) CHECK (blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
  
  -- Identification
  identification_number VARCHAR(50), -- ENCRYPT (DNI, Pasaporte, etc.)
  identification_type VARCHAR(50) DEFAULT 'DNI', -- DNI, Pasaporte, CE, etc.
  identification_hash VARCHAR(64), -- SHA-256 hash for searching without decryption
  
  -- Location (ENCRYPTED)
  address TEXT, -- ENCRYPT
  city VARCHAR(100),
  province VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Equatorial Guinea',
  
  -- Medical Data
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(6,2),
  bmi DECIMAL(5,2),
  allergies JSONB, -- Array of { allergen, severity, reaction }
  chronic_conditions JSONB, -- Array of ICD-10 codes
  
  -- Administrative
  marital_status VARCHAR(20), -- Single, Married, Divorced, Widowed
  occupation VARCHAR(100),
  insurance_provider VARCHAR(100),
  insurance_number VARCHAR(100),
  insurance_expiry DATE,
  
  -- Emergency Contacts (ENCRYPTED in separate table)
  has_emergency_contacts BOOLEAN DEFAULT false,
  
  -- Consent Management
  consent_treatment BOOLEAN DEFAULT false,
  consent_privacy BOOLEAN DEFAULT false,
  consent_research BOOLEAN DEFAULT false,
  consent_photography BOOLEAN DEFAULT false,
  
  -- Control Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  archived_at TIMESTAMP WITH TIME ZONE,
  archived_by UUID REFERENCES auth.users(id)
);

-- TABLE: patient_demographics (NEW - Extended demographic info)
CREATE TABLE IF NOT EXISTS patient_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE UNIQUE,
  ethnicity VARCHAR(100),
  religion VARCHAR(100),
  education_level VARCHAR(50), -- Primary, Secondary, University, etc.
  household_size INT,
  socioeconomic_status VARCHAR(20), -- Low, Medium, High
  indigenous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: emergency_contacts (NEW - Separate for better organization)
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- ENCRYPT
  relationship VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL, -- ENCRYPT
  email VARCHAR(255), -- ENCRYPT
  address TEXT, -- ENCRYPT
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: patient_consents (NEW - Track all consentimientos)
CREATE TABLE IF NOT EXISTS patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL, -- treatment, privacy, research, photography
  description TEXT,
  consent_date DATE NOT NULL,
  expiry_date DATE,
  signature_base64 TEXT, -- Digital signature
  signed_by_user_id UUID REFERENCES auth.users(id),
  witnessed_by_user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_consent_type CHECK (consent_type IN (
    'treatment', 'privacy', 'research', 'photography', 'imaging', 'procedure'
  ))
);

-- TABLE: audit_logs (NEW - Complete audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  hospital_id UUID REFERENCES hospitals(id),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB, -- NULL for SELECT and INSERT
  new_values JSONB, -- NULL for DELETE
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- For security analysis
  is_sensitive_access BOOLEAN DEFAULT false,
  access_justification TEXT,
  
  -- Constraints
  CONSTRAINT audit_valid_action CHECK (
    (action = 'SELECT' AND old_values IS NULL AND new_values IS NULL) OR
    (action = 'INSERT' AND old_values IS NULL AND new_values IS NOT NULL) OR
    (action = 'UPDATE' AND old_values IS NOT NULL AND new_values IS NOT NULL) OR
    (action = 'DELETE' AND old_values IS NOT NULL AND new_values IS NULL)
  )
);

-- TABLE: hospital_departments (Supporting table)
CREATE TABLE IF NOT EXISTS hospital_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  head_user_id UUID REFERENCES healthcare_personnel(user_id),
  phone VARCHAR(20),
  budget DECIMAL(12,2),
  bed_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: hospital_services (Supporting table)
CREATE TABLE IF NOT EXISTS hospital_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Emergency, Lab, DICOM, etc.
  is_available BOOLEAN DEFAULT true,
  available_hours_start TIME,
  available_hours_end TIME,
  contact_info VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: user_roles (NEW - Role management)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role_name, hospital_id)
);

-- TABLE: permissions (NEW - Permission management)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(100) NOT NULL UNIQUE,
  table_name VARCHAR(100) NOT NULL,
  select_permission BOOLEAN DEFAULT false,
  insert_permission BOOLEAN DEFAULT false,
  update_permission BOOLEAN DEFAULT false,
  delete_permission BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES (IF THEY EXIST)
-- ============================================================================

-- Add encryption-related columns if table already exists
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS identification_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS has_emergency_contacts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_treatment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_privacy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_research BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_photography BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Patients table indexes
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_department_id ON patients(department_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_identification_hash ON patients(identification_hash);
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients(is_active);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- Healthcare personnel indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_hospital_id ON healthcare_personnel(hospital_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_user_id ON healthcare_personnel(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_role ON healthcare_personnel(role);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_hospital_id ON audit_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_accessed_at ON audit_logs(accessed_at DESC);

-- Support tables
CREATE INDEX IF NOT EXISTS idx_patient_demographics_patient_id ON patient_demographics(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient_id ON emergency_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient_id ON patient_consents(patient_id);

-- ============================================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active patients by hospital
CREATE OR REPLACE VIEW v_active_patients_by_hospital AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.hospital_id,
  h.name as hospital_name,
  p.department_id,
  hd.name as department_name,
  p.date_of_birth,
  p.gender,
  p.is_active,
  p.created_at
FROM patients p
JOIN hospitals h ON p.hospital_id = h.id
LEFT JOIN hospital_departments hd ON p.department_id = hd.id
WHERE p.is_active = true;

-- View: Personnel by hospital and role
CREATE OR REPLACE VIEW v_personnel_by_hospital_role AS
SELECT 
  hp.id,
  hp.user_id,
  hp.hospital_id,
  h.name as hospital_name,
  hp.role,
  hp.first_name,
  hp.last_name,
  hp.is_active,
  hp.created_at
FROM healthcare_personnel hp
JOIN hospitals h ON hp.hospital_id = h.id
WHERE hp.is_active = true;

-- ============================================================================
-- GRANT PERMISSIONS (adjust roles as needed)
-- ============================================================================

-- Allow authenticated users to see data based on RLS policies
GRANT SELECT, INSERT, UPDATE ON patients TO authenticated;
GRANT SELECT ON hospitals TO authenticated;
GRANT SELECT ON healthcare_personnel TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;

-- ============================================================================
-- MIGRATION STATUS: READY FOR SUPABASE
-- ============================================================================
--
-- Next Steps:
-- 1. Review this SQL for your existing table structure
-- 2. Create any missing tables
-- 3. Add any missing columns to existing tables
-- 4. Create indexes for performance
-- 5. Create RLS policies (see core_rls_policies.sql)
-- 6. Test thoroughly in staging
-- 7. Apply to production with caution
--
-- Safety Tips:
-- - Always backup before running migrations
-- - Test in staging environment first
-- - Use transactions to rollback if needed
-- - Monitor performance after changes
--
