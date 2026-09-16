-- Quick Fix: Create Storage Bucket for Documents
-- Run this in Supabase SQL Editor if document upload is failing

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'institutional-documents',
  'institutional-documents',
  false,
  52428800, -- 50MB
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
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload to own institution path" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own institution documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own institution documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete own institution documents" ON storage.objects;

-- 4. Create INSERT policy
CREATE POLICY "Users can upload to own institution path"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'institutional-documents' 
  AND
  (storage.foldername(name))[1] = (
    SELECT institution_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- 5. Create SELECT policy
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

-- 6. Create UPDATE policy
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

-- 7. Create DELETE policy
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
  EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'SYSTEM_ADMIN')
    AND status = 'ACTIVE'
  )
);

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'institutional-documents';

-- Verify policies are in place
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%institution%';
