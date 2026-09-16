-- =============================================================================
-- Verify Test User Setup
-- =============================================================================
-- Run this query to check if all test users are properly configured

SELECT 
  email,
  display_name,
  role,
  status,
  CASE 
    WHEN status = 'ACTIVE' AND role IN ('FACULTY', 'HOD', 'COE', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN') 
    THEN '✅ OK'
    WHEN status != 'ACTIVE' 
    THEN '❌ Not Active'
    ELSE '❌ Invalid Role'
  END as setup_status,
  created_at,
  institution_id
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
-- Check if any test users are missing
-- =============================================================================

WITH expected_users AS (
  SELECT unnest(ARRAY[
    'faculty@test.com',
    'hod@test.com',
    'coe@test.com',
    'principal@test.com',
    'admin@test.com',
    'superadmin@test.com'
  ]) as email
),
existing_users AS (
  SELECT email FROM profiles WHERE email LIKE '%@test.com'
)
SELECT 
  eu.email as missing_user,
  'Sign up this user at /auth/sign-up' as action_required
FROM expected_users eu
LEFT JOIN existing_users ex ON eu.email = ex.email
WHERE ex.email IS NULL;

-- =============================================================================
-- Summary
-- =============================================================================

SELECT 
  COUNT(*) FILTER (WHERE email LIKE '%@test.com') as total_test_users,
  COUNT(*) FILTER (WHERE email LIKE '%@test.com' AND status = 'ACTIVE') as active_users,
  COUNT(*) FILTER (WHERE email LIKE '%@test.com' AND status = 'PENDING_VERIFICATION') as pending_users
FROM profiles;
