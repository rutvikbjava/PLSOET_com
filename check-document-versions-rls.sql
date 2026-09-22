-- Check RLS policies on document_versions table
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'document_versions';

-- Check RLS policies on document_versions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'document_versions'
ORDER BY cmd, policyname;

-- Test if admin can access document_versions
-- (This will work because you're using service role in SQL editor)
SELECT 
  dv.id,
  dv.document_id,
  dv.version_number,
  dv.storage_path
FROM document_versions dv
WHERE dv.document_id = 'f5c655fa-b374-48ea-a519-d79c8846ed52';
