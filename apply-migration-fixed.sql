-- =====================================================
-- ADD MISSING COLUMNS TO document_contexts
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add extracted_text column for storing raw extracted content
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add normalized_text column for storing cleaned content
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS normalized_text TEXT;

-- Add retry_count for tracking processing retries
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- Add error_message for storing failure details
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add processed_at timestamp for tracking completion time
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Add started_at timestamp for tracking processing start
ALTER TABLE public.document_contexts
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add constraint to ensure retry_count is non-negative (with error handling)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'retry_count_non_negative' 
    AND conrelid = 'public.document_contexts'::regclass
  ) THEN
    ALTER TABLE public.document_contexts
    ADD CONSTRAINT retry_count_non_negative CHECK (retry_count >= 0);
  END IF;
END $$;

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
-- VERIFY CHANGES APPLIED
-- =====================================================

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'document_contexts' 
  AND column_name IN ('extracted_text', 'normalized_text', 'retry_count', 'error_message', 'processed_at', 'started_at')
ORDER BY column_name;

-- Expected: 6 rows showing all new columns
