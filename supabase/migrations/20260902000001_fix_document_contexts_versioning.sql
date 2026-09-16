-- Migration: Fix document_contexts to support per-version context
-- Task: EDU-008 (Critical Fix)
-- Created: 2026-09-02
-- Description:
--   CRITICAL: The existing unique constraint on document_id prevents
--   storing context for multiple document versions. This breaks version
--   provenance - uploading Version 2 overwrites Version 1's context.
--
--   This migration:
--   1. Drops the problematic document_id unique constraint
--   2. Adds document_version_id column
--   3. Creates unique constraint on document_version_id
--   4. Adds explicit RLS policies to prevent user writes
--   5. Preserves existing data if any exists

-- =====================================================
-- STEP 1: Add document_version_id column
-- =====================================================

-- Add column for document version reference
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS document_version_id UUID REFERENCES public.document_versions(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 2: Drop old unique constraint
-- =====================================================

-- Drop the constraint that prevents multiple contexts per document
DROP INDEX IF EXISTS public.document_contexts_document_unique;

-- =====================================================
-- STEP 3: Create new unique constraint
-- =====================================================

-- One context per document VERSION (not per document)
-- This allows each version to have its own context
CREATE UNIQUE INDEX document_contexts_version_unique 
  ON public.document_contexts(document_version_id)
  WHERE document_version_id IS NOT NULL;

-- Temporary transition: Keep document_id unique for rows without version_id
-- This allows gradual migration of existing data
CREATE UNIQUE INDEX document_contexts_document_unique_legacy
  ON public.document_contexts(document_id)
  WHERE document_version_id IS NULL;

-- =====================================================
-- STEP 4: Add index for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_document_contexts_version_id
  ON public.document_contexts(document_version_id);

-- =====================================================
-- STEP 5: Add explicit RLS policies
-- =====================================================

-- Prevent users from inserting contexts directly
-- Only service role (admin client) can insert
CREATE POLICY "Service role only can insert document contexts"
  ON public.document_contexts
  FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Always deny for regular users

-- Prevent users from updating contexts directly
-- Only service role can update
CREATE POLICY "Service role only can update document contexts"
  ON public.document_contexts
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false); -- Always deny for regular users

-- Prevent users from deleting contexts
CREATE POLICY "Service role only can delete document contexts"
  ON public.document_contexts
  FOR DELETE
  TO authenticated
  USING (false); -- Always deny for regular users

-- Note: SELECT policy already exists from previous migration
-- Users can read contexts for documents in their institution

-- =====================================================
-- STEP 6: Update comments
-- =====================================================

COMMENT ON COLUMN public.document_contexts.document_version_id IS 
'Reference to specific document version - enables per-version context storage';

COMMENT ON INDEX document_contexts_version_unique IS 
'Ensures one context per document version (primary constraint)';

COMMENT ON INDEX document_contexts_document_unique_legacy IS 
'Legacy constraint for transition - only applies to rows without version_id';

-- =====================================================
-- MIGRATION NOTES
-- =====================================================

-- BREAKING CHANGE: Applications must update to use document_version_id
-- 
-- Before this migration:
--   - One context per document (document_id unique)
--   - Version 2 overwrote Version 1 context
-- 
-- After this migration:
--   - One context per document VERSION (document_version_id unique)
--   - Version 2 gets its own context, Version 1 preserved
--   - document_id column kept for backwards compatibility
-- 
-- Application Update Required:
--   - context-engine.ts must be updated to use document_version_id
--   - Processing should target specific version, not just document
--
-- RLS Enhancement:
--   - Added explicit INSERT/UPDATE/DELETE denial policies
--   - Only admin client (service role) can write contexts
--   - Users can still read via existing SELECT policy
--
-- Data Migration:
--   - Existing contexts remain linked via document_id
--   - New contexts should use document_version_id
--   - Legacy constraint allows transition period

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify column exists
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'document_contexts' 
-- AND column_name = 'document_version_id';

-- Verify constraints
-- SELECT conname, contype, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'public.document_contexts'::regclass;

-- Verify indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'document_contexts';

-- Verify RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'document_contexts';

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- To rollback this migration:
-- 
-- DROP POLICY IF EXISTS "Service role only can insert document contexts" ON public.document_contexts;
-- DROP POLICY IF EXISTS "Service role only can update document contexts" ON public.document_contexts;
-- DROP POLICY IF EXISTS "Service role only can delete document contexts" ON public.document_contexts;
-- DROP INDEX IF EXISTS document_contexts_version_unique;
-- DROP INDEX IF EXISTS document_contexts_document_unique_legacy;
-- DROP INDEX IF EXISTS idx_document_contexts_version_id;
-- ALTER TABLE public.document_contexts DROP COLUMN IF EXISTS document_version_id;
-- CREATE UNIQUE INDEX document_contexts_document_unique ON public.document_contexts(document_id);
