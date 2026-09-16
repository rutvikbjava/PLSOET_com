-- Fix RLS Issue for Document Upload
-- This script diagnoses and fixes the RLS policy violation

-- Step 1: Check what's wrong
SELECT 
  'Current User' as check_type,
  auth.uid() as user_id,
  auth.role() as role;

SELECT 
  'User Profile' as check_type,
  id,
  email,
  institution_id,
  status,
  CASE 
    WHEN institution_id IS NULL THEN '❌ PROBLEM: institution_id is NULL'
    WHEN status != 'ACTIVE' THEN '❌ PROBLEM: status is not ACTIVE'
    ELSE '✅ OK'
  END as diagnosis
FROM public.profiles
WHERE id = auth.uid();

SELECT 
  'Function Result' as check_type,
  public.get_user_institution_id() as institution_id,
  CASE 
    WHEN public.get_user_institution_id() IS NULL THEN '❌ PROBLEM: function returns NULL'
    ELSE '✅ OK'
  END as diagnosis;

-- Step 2: If institution_id is NULL, you need to set it
-- First, find available institutions:
SELECT 
  'Available Institutions' as info,
  id,
  name,
  code,
  status
FROM public.institutions
WHERE status = 'ACTIVE'
ORDER BY name;

-- Step 3: FIX - Set your institution_id (REPLACE 'INSTITUTION_ID_HERE' with actual ID from above)
-- Uncomment and run this ONLY after replacing the ID:

-- UPDATE public.profiles
-- SET institution_id = 'INSTITUTION_ID_HERE'
-- WHERE id = auth.uid();

-- Step 4: FIX - Activate your account if status is not ACTIVE
-- Uncomment and run this if needed:

-- UPDATE public.profiles
-- SET status = 'ACTIVE'
-- WHERE id = auth.uid();

-- Step 5: Verify the fix worked
SELECT 
  'After Fix - Profile' as check_type,
  id,
  email,
  institution_id,
  status
FROM public.profiles
WHERE id = auth.uid();

SELECT 
  'After Fix - Function' as check_type,
  public.get_user_institution_id() as institution_id;
