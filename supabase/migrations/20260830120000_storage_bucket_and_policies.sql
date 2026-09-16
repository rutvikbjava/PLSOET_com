-- Migration: Create Supabase Storage bucket and configure storage policies
-- Task: EDU-007
-- Created: 2026-08-30
-- Description: 
--   - Create private storage bucket for institutional documents
--   - Configure storage policies for tenant isolation
--   - Prevent cross-institution access
--   - Admin-only deletion

-- =====================================================
-- STORAGE BUCKET CREATION
-- =====================================================

-- Create private bucket for institutional documents
-- Public = false means files are NOT publicly accessible
-- Access requires authorization via signed URLs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'institutional-documents',
  'institutional-documents',
  false, -- PRIVATE bucket
  52428800, -- 50MB in bytes (50 * 1024 * 1024)
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING; -- Idempotent: skip if already exists

-- =====================================================
-- STORAGE POLICIES FOR TENANT ISOLATION
-- =====================================================

-- NOTE: RLS is already enabled on storage.objects in Supabase
-- No need to run ALTER TABLE (would require superuser privileges)

-- Drop existing policies if they exist (for clean re-application)
DROP POLICY IF EXISTS "Users can upload to own institution path" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own institution documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own institution documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete own institution documents" ON storage.objects;

-- =====================================================
-- INSERT POLICY: Users can upload to their institution path only
-- =====================================================
-- Security:
-- - Authenticated users only
-- - Path must start with their institution_id
-- - Prevents cross-institution uploads
-- - Uses WITH CHECK (applies to INSERT operations)
CREATE POLICY "Users can upload to own institution path"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'institutional-documents' 
  AND
  -- Extract first folder from path (institution_id)
  -- Path format: {institution_id}/documents/{document_id}/...
  (storage.foldername(name))[1] = (
    SELECT institution_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- SELECT POLICY: Users can read their institution's documents
-- =====================================================
-- Security:
-- - Authenticated users only
-- - Can only read files in their institution path
-- - Prevents cross-institution reads
CREATE POLICY "Users can read own institution documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'institutional-documents' 
  AND
  (storage.foldername(name))[1] = (
    SELECT institution_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- UPDATE POLICY: Users can update their institution's documents
-- =====================================================
-- Security:
-- - Authenticated users only
-- - Can only update files in their institution path
-- - Note: Updates are rare (versions are immutable)
CREATE POLICY "Users can update own institution documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'institutional-documents' 
  AND
  (storage.foldername(name))[1] = (
    SELECT institution_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- DELETE POLICY: Only admins can delete documents
-- =====================================================
-- Security:
-- - Authenticated users only
-- - Must be in own institution path
-- - Must have ADMIN or SYSTEM_ADMIN role
-- - Prevents accidental deletion by regular users
CREATE POLICY "Admins can delete own institution documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'institutional-documents' 
  AND
  (storage.foldername(name))[1] = (
    SELECT institution_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
  AND
  -- Only admins can delete
  EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'SYSTEM_ADMIN')
    AND status = 'ACTIVE'
  )
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment to verify policies are created:

-- SELECT * FROM storage.buckets WHERE id = 'institutional-documents';
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- To rollback this migration:
-- 1. DROP POLICY "Users can upload to own institution path" ON storage.objects;
-- 2. DROP POLICY "Users can read own institution documents" ON storage.objects;
-- 3. DROP POLICY "Users can update own institution documents" ON storage.objects;
-- 4. DROP POLICY "Admins can delete own institution documents" ON storage.objects;
-- 5. DELETE FROM storage.buckets WHERE id = 'institutional-documents';

-- =====================================================
-- SECURITY NOTES
-- =====================================================
-- 1. Bucket is PRIVATE (public = false)
-- 2. Files are NOT accessible via public URLs
-- 3. Access requires signed URLs generated server-side
-- 4. Policies enforce institution_id matching via path inspection
-- 5. Admin deletion requires ACTIVE status (suspended admins cannot delete)
-- 6. Anonymous users cannot access any files
-- 7. Users cannot access other institutions' files
-- 8. File size limited to 50MB
-- 9. MIME types restricted to document/image types only
