-- Migration: 001 - Create Authentication Tables
-- Date: 2026-04-16
-- Module: 00-core/auth
-- Status: Placeholder - actual migrations managed in supabase/migrations/

-- User profiles table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  scope VARCHAR(50) DEFAULT 'hospital',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  UNIQUE(user_id, permission, scope)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_view_own_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admins_see_all_profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = auth.uid() 
      AND permission = 'ADMIN'
    )
  );
