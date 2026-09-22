# Fix Database Schema Issue

## Problem
PDF text extraction is working correctly, but the database is missing required columns that were added in migration `20260902000000_document_processing_enhancements.sql`.

**Error:** `Could not find the 'extracted_text' column of 'document_contexts' in the schema cache`

## Root Cause
The migration file exists in the codebase but was never applied to the production Supabase database.

## Solution
Apply the missing migration to add required columns to the `document_contexts` table.

---

## Steps to Fix

### 1. Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: **fnxjnfhdhlzbwkisuuzf**
3. Click **SQL Editor** in the left sidebar

### 2. Run Verification Query
Copy and paste this query to check if the columns are missing:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'document_contexts' 
  AND column_name IN ('extracted_text', 'normalized_text', 'retry_count', 'error_message', 'processed_at', 'started_at')
ORDER BY column_name;
```

**Expected Result:**
- If **0 rows** returned → Migration needs to be applied (proceed to step 3)
- If **6 rows** returned → Migration already applied (something else is wrong)

### 3. Apply Missing Migration
Copy and paste this entire SQL block and run it:

```sql
-- =====================================================
-- ADD MISSING COLUMNS TO document_contexts
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

-- Add constraint to ensure retry_count is non-negative
DO $$ 
BEGIN
  ALTER TABLE public.document_contexts
  ADD CONSTRAINT retry_count_non_negative CHECK (retry_count >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
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
```

### 4. Verify Changes Applied
Run this query to confirm all columns were added:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'document_contexts' 
  AND column_name IN ('extracted_text', 'normalized_text', 'retry_count', 'error_message', 'processed_at', 'started_at')
ORDER BY column_name;
```

**Expected Result:** 6 rows showing:
- `error_message` (text, YES)
- `extracted_text` (text, YES)
- `normalized_text` (text, YES)
- `processed_at` (timestamp with time zone, YES)
- `retry_count` (integer, NO)
- `started_at` (timestamp with time zone, YES)

### 5. Test PDF Processing
1. Go to https://plsoet-com.vercel.app/documents
2. Find your uploaded PDF document
3. Click **"Process Document"** button
4. Processing should now complete successfully!

---

## What This Migration Does

### New Columns Added:
1. **`extracted_text`** - Stores raw text extracted from PDF/DOCX/TXT files
2. **`normalized_text`** - Stores cleaned text after normalization
3. **`retry_count`** - Tracks how many times processing was retried (max 3)
4. **`error_message`** - Stores error details if processing fails
5. **`processed_at`** - Timestamp when processing completed
6. **`started_at`** - Timestamp when processing started

### Performance Indexes:
- Index on `retry_count` for finding failed documents
- Index on `started_at` for detecting timeout issues

---

## Troubleshooting

### If migration fails with "column already exists"
This means the migration was partially applied. Run this to check which columns exist:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'document_contexts'
ORDER BY column_name;
```

### If processing still fails after migration
Check the Vercel function logs again to see the new error message.

---

## Why This Happened

The migration file (`supabase/migrations/20260902000000_document_processing_enhancements.sql`) exists in the Git repository but was never run against the production database.

This commonly happens when:
- Migrations are developed locally but not deployed
- Direct database access is used instead of migration runner
- Migration tracking table is out of sync

**Solution:** Always apply migrations using Supabase CLI or SQL Editor.
