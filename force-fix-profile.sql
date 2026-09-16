-- Force Fix Profile - Run this with your actual email
-- This bypasses RLS using direct table access

-- STEP 1: Find your user ID by email
-- Replace 'your-email@example.com' with your actual email
SELECT 
  id,
  email,
  institution_id,
  status,
  role
FROM public.profiles
WHERE email = 'your-email@example.com';  -- REPLACE THIS!

-- STEP 2: Update using the ID from above
-- Replace BOTH the UUID and the institution_id
UPDATE public.profiles
SET 
  institution_id = '1459034d-9d7d-49c4-99f4-52e5c2fa896a',  -- MGM institution
  status = 'ACTIVE'
WHERE id = 'PASTE-YOUR-USER-ID-FROM-STEP-1-HERE';  -- REPLACE THIS!

-- STEP 3: Verify it worked
SELECT 
  id,
  email,
  institution_id,
  status,
  role
FROM public.profiles
WHERE email = 'your-email@example.com';  -- REPLACE THIS!
