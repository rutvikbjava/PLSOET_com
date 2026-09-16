-- Migration: Enhance document_contexts for processing pipeline
-- Task: EDU-008
-- Created: 2026-09-02
-- Description:
--   - Add extracted_text storage for raw text content
--   - Add retry tracking for processing failures
--   - Add error tracking for debugging
--   - Add processed timestamp for audit trail
--   - Add normalized_text for cleaned content
--   - Maintain backward compatibility

-- =====================================================
-- ENHANCE document_contexts TABLE
-- =====================================================

-- Add extracted_text column for storing raw extracted content
-- This preserves the original extraction before normalization
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add normalized_text column for storing cleaned content
-- This is the normalized version used for AI processing
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS normalized_text TEXT;

-- Add retry_count for tracking processing retries
-- Enables bounded retry strategy (max 3 retries)
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- Add error_message for storing failure details
-- Helps with debugging and user feedback
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add processed_at timestamp for tracking completion time
-- Useful for audit trail and performance monitoring
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Add started_at timestamp for tracking processing start
-- Enables timeout detection and performance monitoring
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add constraint to ensure retry_count is non-negative
ALTER TABLE public.document_contexts
ADD CONSTRAINT retry_count_non_negative CHECK (retry_count >= 0);

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for finding documents that need reprocessing
CREATE INDEX IF NOT EXISTS idx_document_contexts_retry_count 
ON public.document_contexts(retry_count) 
WHERE processing_status = 'FAILED';

-- Index for finding stale processing jobs (timeouts)
CREATE INDEX IF NOT EXISTS idx_document_contexts_started_at 
ON public.document_contexts(started_at) 
WHERE processing_status = 'PROCESSING';

-- =====================================================
-- ADD POLICY-DOCUMENT RELATIONSHIP (if not exists)
-- =====================================================

-- Create table for tracking which policies are derived from which documents
-- This enables traceability: Policy → Source Document
CREATE TABLE IF NOT EXISTS public.policy_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE RESTRICT,
  source_type TEXT NOT NULL, -- 'DERIVED_FROM', 'REFERENCED_IN', 'SUPERSEDES'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(policy_id, document_id, source_type)
);

-- RLS for policy_sources
ALTER TABLE public.policy_sources ENABLE ROW LEVEL SECURITY;

-- Users can read policy sources from their institution
CREATE POLICY "Users can read own institution policy sources"
ON public.policy_sources
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.policies p
    WHERE p.id = policy_sources.policy_id
    AND p.institution_id = auth.get_user_institution_id()
  )
);

-- Only admins/authorized users can create policy sources
CREATE POLICY "Authorized users can create policy sources"
ON public.policy_sources
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.policies p
    WHERE p.id = policy_sources.policy_id
    AND p.institution_id = auth.get_user_institution_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SYSTEM_ADMIN', 'PRINCIPAL', 'COE')
      AND status = 'ACTIVE'
    )
  )
);

-- Index for policy sources
CREATE INDEX IF NOT EXISTS idx_policy_sources_policy_id 
ON public.policy_sources(policy_id);

CREATE INDEX IF NOT EXISTS idx_policy_sources_document_id 
ON public.policy_sources(document_id);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.document_contexts.extracted_text IS 
'Raw text extracted from document file (PDF, DOCX, TXT)';

COMMENT ON COLUMN public.document_contexts.normalized_text IS 
'Cleaned and normalized text ready for AI processing';

COMMENT ON COLUMN public.document_contexts.retry_count IS 
'Number of processing retry attempts (max 3)';

COMMENT ON COLUMN public.document_contexts.error_message IS 
'Error details if processing failed';

COMMENT ON COLUMN public.document_contexts.processed_at IS 
'Timestamp when processing completed (success or failure)';

COMMENT ON COLUMN public.document_contexts.started_at IS 
'Timestamp when processing started';

COMMENT ON TABLE public.policy_sources IS 
'Tracks source documents for institutional policies (provenance)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment to verify changes:

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'document_contexts' 
-- AND column_name IN ('extracted_text', 'normalized_text', 'retry_count', 'error_message', 'processed_at', 'started_at');

-- SELECT * FROM information_schema.tables WHERE table_name = 'policy_sources';

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- To rollback this migration:
-- 
-- DROP TABLE IF EXISTS public.policy_sources;
-- ALTER TABLE public.document_contexts DROP COLUMN IF EXISTS extracted_text;
-- ALTER TABLE public.document_contexts DROP COLUMN IF EXISTS normalized_text;
-- ALTER TABLE public.document_contexts DROP COLUMN IF EXISTS retry_count;
-- ALTER TABLE public.document_contexts DROP COLUMN IF EXISTS error_message;
-- ALTER TABLE public.document_contexts DROP COLUMN IF EXISTS processed_at;
-- ALTER TABLE public.document_contexts DROP COLUMN IF EXISTS started_at;
-- DROP INDEX IF EXISTS idx_document_contexts_retry_count;
-- DROP INDEX IF EXISTS idx_document_contexts_started_at;

