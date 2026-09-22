-- Debug Processing Page "Document not found" issue
-- Run this in Supabase SQL Editor

-- 1. Check if documents exist
SELECT 
  id,
  title,
  document_type,
  status,
  created_by,
  institution_id,
  created_at
FROM documents
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if document_contexts exist
SELECT 
  id,
  document_id,
  processing_status,
  error_message,
  retry_count,
  created_at
FROM document_contexts
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check current authenticated user
SELECT auth.uid() as current_user_id;

-- 4. Check user profile
SELECT 
  id,
  email,
  institution_id,
  status,
  role
FROM profiles
WHERE id = auth.uid();

-- 5. Test the exact query from getDocumentContext
-- Replace 'YOUR_DOCUMENT_ID' with actual document ID from step 1
SELECT 
  d.id,
  d.title,
  d.document_type,
  d.status,
  d.created_at,
  dc.id as context_id,
  dc.document_type_detected,
  dc.creator_role_detected,
  dc.department_scope,
  dc.purpose,
  dc.impact_level,
  dc.confidence_score,
  dc.model_version,
  dc.processing_status,
  dc.error_message,
  dc.retry_count,
  dc.processed_at
FROM documents d
LEFT JOIN document_contexts dc ON dc.document_id = d.id
WHERE d.id = 'YOUR_DOCUMENT_ID';

-- 6. Check RLS policies on documents table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'documents';
