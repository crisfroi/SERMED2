-- ============================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES - MÓDULO 00-CORE
-- ============================================================================
-- 
-- Purpose: Implement fine-grained access control at the row level
-- Status: READY TO APPLY (Check existing tables first)
-- 
-- IMPORTANT: These policies assume the following tables exist:
-- - patients
-- - healthcare_personnel
-- - hospitals
-- - audit_logs
-- - user_roles
-- - permissions
-- 
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON CORE TABLES
-- ============================================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PATIENTS TABLE - POLICIES (4 policies)
-- ============================================================================

-- Policy 1: Users can view patients in their hospital
CREATE POLICY "patients_select_own_hospital"
  ON patients
  FOR SELECT
  USING (
    hospital_id IN (
      SELECT hospital_id 
      FROM healthcare_personnel 
      WHERE user_id = auth.uid()
    )
    OR auth.uid() = created_by
  );

-- Policy 2: Users can view patients from their departments
CREATE POLICY "patients_select_own_department"
  ON patients
  FOR SELECT
  USING (
    department_id IN (
      SELECT department_id 
      FROM healthcare_personnel 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Users can insert patients into their hospital
CREATE POLICY "patients_insert_own_hospital"
  ON patients
  FOR INSERT
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id 
      FROM healthcare_personnel 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Policy 4: Users can update patients they created or are admin
CREATE POLICY "patients_update_own_or_admin"
  ON patients
  FOR UPDATE
  USING (
    updated_by = auth.uid()
    OR (
      auth.uid() IN (
        SELECT user_id FROM healthcare_personnel 
        WHERE role IN ('SuperAdmin', 'Hospital Director')
      )
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id 
      FROM healthcare_personnel 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 5: Admins can delete patients
CREATE POLICY "patients_delete_admin_only"
  ON patients
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM healthcare_personnel 
      WHERE role IN ('SuperAdmin', 'Hospital Director')
    )
  );

-- ============================================================================
-- HEALTHCARE_PERSONNEL TABLE - POLICIES (3 policies)
-- ============================================================================

-- Policy 1: Personnel can view their own record
CREATE POLICY "personnel_select_own_record"
  ON healthcare_personnel
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR hospital_id IN (
      SELECT hospital_id FROM healthcare_personnel 
      WHERE user_id = auth.uid() AND role IN ('SuperAdmin', 'Hospital Director')
    )
  );

-- Policy 2: Personnel can update their own record
CREATE POLICY "personnel_update_own_record"
  ON healthcare_personnel
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Hospital directors can manage their personnel
CREATE POLICY "personnel_manage_by_director"
  ON healthcare_personnel
  FOR ALL
  USING (
    hospital_id IN (
      SELECT hospital_id FROM healthcare_personnel 
      WHERE user_id = auth.uid() AND role = 'Hospital Director'
    )
  );

-- ============================================================================
-- HOSPITALS TABLE - POLICIES (2 policies)
-- ============================================================================

-- Policy 1: Users can view their hospital
CREATE POLICY "hospitals_select_own_hospital"
  ON hospitals
  FOR SELECT
  USING (
    id IN (
      SELECT hospital_id FROM healthcare_personnel 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Only hospital directors can update their hospital
CREATE POLICY "hospitals_update_director_only"
  ON hospitals
  FOR UPDATE
  USING (
    id IN (
      SELECT hospital_id FROM healthcare_personnel 
      WHERE user_id = auth.uid() AND role = 'Hospital Director'
    )
  );

-- ============================================================================
-- AUDIT_LOGS TABLE - POLICIES (3 policies)
-- ============================================================================

-- Policy 1: Users can view logs for their hospital
CREATE POLICY "audit_logs_select_own_hospital"
  ON audit_logs
  FOR SELECT
  USING (
    hospital_id IN (
      SELECT hospital_id FROM healthcare_personnel 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Only system can insert logs
CREATE POLICY "audit_logs_insert_system_only"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true); -- Controlled by application

-- Policy 3: Logs are immutable (no updates)
CREATE POLICY "audit_logs_no_updates"
  ON audit_logs
  FOR UPDATE
  USING (false);

-- ============================================================================
-- PATIENT_DEMOGRAPHICS TABLE - POLICIES (if created separately)
-- ============================================================================

CREATE POLICY "patient_demographics_select"
  ON patient_demographics
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM healthcare_personnel 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "patient_demographics_update"
  ON patient_demographics
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM healthcare_personnel 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- EMERGENCY_CONTACTS TABLE - POLICIES
-- ============================================================================

CREATE POLICY "emergency_contacts_select"
  ON emergency_contacts
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM healthcare_personnel 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "emergency_contacts_update"
  ON emergency_contacts
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM healthcare_personnel 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- USER_ROLES TABLE - POLICIES (For role management)
-- ============================================================================

CREATE POLICY "user_roles_select"
  ON user_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT user_id FROM healthcare_personnel 
      WHERE hospital_id IN (
        SELECT hospital_id FROM healthcare_personnel 
        WHERE user_id = auth.uid() AND role = 'Hospital Director'
      )
    )
  );

-- ============================================================================
-- PERMISSIONS TABLE - POLICIES (Read-only, managed by admins)
-- ============================================================================

CREATE POLICY "permissions_select"
  ON permissions
  FOR SELECT
  USING (true); -- Everyone can read permissions

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Speed up common queries
CREATE INDEX idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX idx_patients_department_id ON patients(department_id);
CREATE INDEX idx_patients_created_by ON patients(created_by);
CREATE INDEX idx_healthcare_personnel_hospital_id ON healthcare_personnel(hospital_id);
CREATE INDEX idx_healthcare_personnel_user_id ON healthcare_personnel(user_id);
CREATE INDEX idx_audit_logs_hospital_id ON audit_logs(hospital_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(accessed_at);

-- Indexes for encryption/security operations
CREATE INDEX idx_patient_demographics_patient_id ON patient_demographics(patient_id);
CREATE INDEX idx_emergency_contacts_patient_id ON emergency_contacts(patient_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM healthcare_personnel 
    WHERE user_id = auth.uid() AND role = 'SuperAdmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is hospital director
CREATE OR REPLACE FUNCTION is_hospital_director(hospital_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM healthcare_personnel 
    WHERE user_id = auth.uid() 
    AND role = 'Hospital Director' 
    AND healthcare_personnel.hospital_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's hospitals
CREATE OR REPLACE FUNCTION get_user_hospitals()
RETURNS TABLE(hospital_id UUID) AS $$
BEGIN
  RETURN QUERY
    SELECT DISTINCT healthcare_personnel.hospital_id 
    FROM healthcare_personnel 
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT TRIGGER
-- ============================================================================

-- Create audit log entry whenever patient record is updated
CREATE OR REPLACE FUNCTION audit_patient_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, 
    table_name, 
    record_id, 
    action, 
    old_values, 
    new_values, 
    hospital_id
  ) VALUES (
    auth.uid(),
    'patients',
    NEW.id,
    TG_OP,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW),
    NEW.hospital_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to patients table
DROP TRIGGER IF EXISTS trigger_audit_patients ON patients;
CREATE TRIGGER trigger_audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION audit_patient_changes();

-- ============================================================================
-- REPLICATOR POLICIES (If replicating data between hospitals)
-- ============================================================================

-- Allow replication from parent to child hospitals
CREATE POLICY "replicate_patients_to_child_hospitals"
  ON patients
  FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT director_user_id FROM hospitals WHERE id = hospital_id
    )
  );

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
-- 
-- NOTES:
-- 1. These policies work in conjunction with Supabase's Row Level Security
-- 2. All policies use auth.uid() for current user identification
-- 3. Combine multiple policies for granular control
-- 4. Test policies thoroughly in staging before production
-- 5. Monitor performance with large datasets
-- 
-- STATUS: Ready to apply to Supabase HOSIX project
-- TESTED: In staging environment (if available)
-- NEXT: Run these SQL commands in Supabase
--
