-- ============================================================================
-- Migration Status Check
-- ============================================================================
-- Run this in Supabase SQL Editor to check which migrations are applied
-- and verify schema changes

-- ============================================================================
-- 1. CHECK APPLIED MIGRATIONS
-- ============================================================================

SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations 
ORDER BY version;

-- Expected migrations (if all applied):
-- 20260826000000 - initial_edusphere_schema
-- 20260826000001 - rls_policies
-- 20260830000000 - auth_rls_updates
-- 20260830120000 - storage_bucket_and_policies
-- 20260902000000 - document_processing_enhancements (EDU-008)
-- 20260902000001 - fix_document_contexts_versioning (EDU-008 CRITICAL)

-- ============================================================================
-- 2. VERIFY DOCUMENT_CONTEXTS COLUMNS (EDU-008)
-- ============================================================================

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'document_contexts'
ORDER BY ordinal_position;

-- Expected NEW columns from EDU-008:
-- extracted_text (TEXT)
-- normalized_text (TEXT)
-- retry_count (INTEGER, default 0)
-- error_message (TEXT)
-- processed_at (TIMESTAMPTZ)
-- started_at (TIMESTAMPTZ)
-- document_version_id (UUID) - from migration 20260902000001

-- ============================================================================
-- 3. VERIFY UNIQUE CONSTRAINTS
-- ============================================================================

SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.document_contexts'::regclass
AND contype IN ('u', 'p')
ORDER BY conname;

-- Expected from migration 20260902000001:
-- document_contexts_version_unique: UNIQUE (document_version_id) WHERE document_version_id IS NOT NULL
-- document_contexts_document_unique_legacy: UNIQUE (document_id) WHERE document_version_id IS NULL

-- Should NOT see:
-- document_contexts_document_unique (old constraint, should be dropped)

-- ============================================================================
-- 4. VERIFY RLS POLICIES ON DOCUMENT_CONTEXTS
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING clause present'
    ELSE 'No USING clause'
  END AS using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK clause present'
    ELSE 'No WITH CHECK clause'
  END AS with_check_status
FROM pg_policies 
WHERE tablename = 'document_contexts'
ORDER BY cmd, policyname;

-- Expected policies:
-- SELECT: "Users can view document contexts in their institution" (existing)
-- INSERT: "Service role only can insert document contexts" (from 20260902000001)
-- UPDATE: "Service role only can update document contexts" (from 20260902000001)
-- DELETE: "Service role only can delete document contexts" (from 20260902000001)

-- ============================================================================
-- 5. VERIFY POLICY_SOURCES TABLE
-- ============================================================================

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'policy_sources'
ORDER BY ordinal_position;

-- Expected columns:
-- id (UUID)
-- policy_id (UUID)
-- document_id (UUID)
-- source_type (TEXT)
-- created_at (TIMESTAMPTZ)

-- Check RLS policies
SELECT 
  policyname,
  cmd AS command
FROM pg_policies 
WHERE tablename = 'policy_sources'
ORDER BY cmd, policyname;

-- Expected policies:
-- SELECT: "Users can read own institution policy sources"
-- INSERT: "Authorized users can create policy sources"

-- ============================================================================
-- 6. VERIFY INDEXES
-- ============================================================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'document_contexts'
ORDER BY indexname;

-- Expected indexes from EDU-008:
-- idx_document_contexts_retry_count (for failed job queries)
-- idx_document_contexts_started_at (for timeout detection)
-- idx_document_contexts_version_id (for version lookups)
-- document_contexts_version_unique (unique constraint index)

-- ============================================================================
-- 7. CHECK FOR VERSION PROVENANCE ISSUE
-- ============================================================================

-- If you see this index, ERR-004 is NOT fixed yet:
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'document_contexts'
AND indexname = 'document_contexts_document_unique';

-- If returns a row: PROBLEM - old constraint still exists
-- If returns empty: GOOD - migration 20260902000001 applied successfully

-- ============================================================================
-- 8. TEST MULTI-VERSION CONTEXT (After Migration 20260902000001)
-- ============================================================================

-- Check if you have any documents with multiple versions
SELECT 
  d.id AS document_id,
  d.title,
  COUNT(dv.id) AS version_count,
  COUNT(dc.id) AS context_count
FROM documents d
LEFT JOIN document_versions dv ON dv.document_id = d.id
LEFT JOIN document_contexts dc ON dc.document_version_id = dv.id
GROUP BY d.id, d.title
HAVING COUNT(dv.id) > 1;

-- After migration 20260902000001:
-- context_count should equal version_count (each version has its own context)

-- Before migration:
-- context_count would be 0 or 1 (only latest version has context)

-- ============================================================================
-- SUMMARY INTERPRETATION
-- ============================================================================

-- ALL GOOD if:
-- ✓ All 6 migrations listed in section 1
-- ✓ document_version_id column exists (section 2)
-- ✓ document_contexts_version_unique constraint exists (section 3)
-- ✓ 4 RLS policies on document_contexts (section 4)
-- ✓ policy_sources table exists with RLS (section 5)
-- ✓ No document_contexts_document_unique index (section 7)

-- NEEDS ATTENTION if:
-- ✗ Missing migration 20260902000001 → Apply it (CRITICAL)
-- ✗ document_contexts_document_unique index exists → Migration 20260902000001 not applied
-- ✗ Missing INSERT/UPDATE/DELETE policies → Migration 20260902000001 not applied
-- ✗ No document_version_id column → Migration 20260902000001 not applied
