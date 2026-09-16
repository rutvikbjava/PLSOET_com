/**
 * Test User Seed Data
 * 
 * Creates test users for all roles in the system.
 * Run this in Supabase SQL Editor after users have signed up.
 * 
 * IMPORTANT: Users must first sign up through the UI, then run this script
 * to activate and assign roles.
 */

-- =============================================================================
-- Step 1: First, sign up these users through the UI at /auth/sign-up
-- =============================================================================
-- 
-- 1. faculty@test.com (password: Test1234!)
-- 2. hod@test.com (password: Test1234!)
-- 3. coe@test.com (password: Test1234!)
-- 4. principal@test.com (password: Test1234!)
-- 5. admin@test.com (password: Test1234!)
-- 6. superadmin@test.com (password: Test1234!)
--
-- After signing up all 6 accounts, run the commands below:

-- =============================================================================
-- Step 2: Activate and assign roles
-- =============================================================================

-- FACULTY - Regular faculty member (most common user)
UPDATE profiles 
SET role = 'FACULTY', status = 'ACTIVE'
WHERE email = 'faculty@test.com';

-- HOD - Head of Department (department-level authority)
UPDATE profiles 
SET role = 'HOD', status = 'ACTIVE'
WHERE email = 'hod@test.com';

-- COE - Controller of Examinations (exam workflows)
UPDATE profiles 
SET role = 'COE', status = 'ACTIVE'
WHERE email = 'coe@test.com';

-- PRINCIPAL - Highest institutional authority
UPDATE profiles 
SET role = 'PRINCIPAL', status = 'ACTIVE'
WHERE email = 'principal@test.com';

-- ADMIN - System administrator (can manage users)
UPDATE profiles 
SET role = 'ADMIN', status = 'ACTIVE'
WHERE email = 'admin@test.com';

-- SUPER_ADMIN - Super administrator (full system access)
UPDATE profiles 
SET role = 'SUPER_ADMIN', status = 'ACTIVE'
WHERE email = 'superadmin@test.com';

-- =============================================================================
-- Step 3: Verify all test users are set up correctly
-- =============================================================================

SELECT 
  id,
  email,
  display_name,
  role,
  status,
  created_at
FROM profiles
WHERE email IN (
  'faculty@test.com',
  'hod@test.com',
  'coe@test.com',
  'principal@test.com',
  'admin@test.com',
  'superadmin@test.com'
)
ORDER BY 
  CASE role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'ADMIN' THEN 2
    WHEN 'PRINCIPAL' THEN 3
    WHEN 'COE' THEN 4
    WHEN 'HOD' THEN 5
    WHEN 'FACULTY' THEN 6
    ELSE 7
  END;

-- =============================================================================
-- Expected Output:
-- =============================================================================
-- You should see 6 users, all with status = 'ACTIVE' and their respective roles
--
-- superadmin@test.com   | SUPER_ADMIN  | ACTIVE
-- admin@test.com        | ADMIN        | ACTIVE
-- principal@test.com    | PRINCIPAL    | ACTIVE
-- coe@test.com          | COE          | ACTIVE
-- hod@test.com          | HOD          | ACTIVE
-- faculty@test.com      | FACULTY      | ACTIVE
