-- Check if document_contexts exist for your documents
-- Run this in Supabase SQL Editor

-- Check documents
SELECT id, title, created_at, status
FROM documents
ORDER BY created_at DESC
LIMIT 10;

-- Check if ANY document_contexts exist
SELECT COUNT(*) as total_contexts
FROM document_contexts;

-- Check document_contexts for specific documents
SELECT 
  dc.id,
  dc.document_id,
  dc.processing_status,
  dc.created_at,
  d.title as document_title
FROM document_contexts dc
JOIN documents d ON d.id = dc.document_id
ORDER BY dc.created_at DESC
LIMIT 10;
