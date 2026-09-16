-- Temporary Fix: Add more permissive document insert policy
-- This allows authenticated users with profiles to create documents

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can create documents in their institution" ON documents;

-- Create a new, more permissive policy for testing
CREATE POLICY "Users can create documents in their institution"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User must have a profile
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND status = 'ACTIVE'
    AND institution_id IS NOT NULL
  )
  AND
  -- The document being created must match user's institution
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
  AND
  -- The created_by must be the current user
  created_by = auth.uid()
);

-- Verify policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'documents' 
AND policyname = 'Users can create documents in their institution';
