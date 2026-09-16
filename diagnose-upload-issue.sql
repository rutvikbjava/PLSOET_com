-- Diagnostic SQL to debug document upload failure
-- Run this in Supabase SQL Editor while logged in as the user having issues

-- 1. Check current authentication
SELECT 
  auth.uid() as user_id,
  auth.role() as auth_role,
  auth.jwt() ->> 'email' as user_email;

-- 2. Check if profile exists for current user
SELECT 
  id,
  email,
  display_name,
  institution_id,
  department_id,
  role,
  status
FROM public.profiles
WHERE id = auth.uid();

-- 3. Test the get_user_institution_id() function
SELECT public.get_user_institution_id() as institution_id_from_function;

-- 4. Check if institution exists and is active
SELECT 
  i.id,
  i.name,
  i.code,
  i.status
FROM public.institutions i
WHERE i.id = (SELECT institution_id FROM public.profiles WHERE id = auth.uid());

-- 5. Check storage bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'institutional-documents';

-- 6. Check if helper functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_user_institution_id',
  'user_is_admin',
  'get_user_role'
);

