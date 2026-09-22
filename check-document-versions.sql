-- Check if documents have versions
-- Run this in Supabase SQL Editor

-- Check documents
SELECT id, title, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 5;

-- Check document_versions
SELECT 
  dv.id,
  dv.document_id,
  dv.version_number,
  dv.storage_path,
  dv.file_size_bytes,
  d.title as document_title
FROM document_versions dv
JOIN documents d ON d.id = dv.document_id
ORDER BY dv.created_at DESC
LIMIT 10;

-- Check if ANY versions exist
SELECT COUNT(*) as total_versions
FROM document_versions;

-- Check specific document (replace with your document ID)
SELECT 
  d.id as document_id,
  d.title,
  dv.id as version_id,
  dv.version_number,
  dv.storage_path
FROM documents d
LEFT JOIN document_versions dv ON dv.document_id = d.id
WHERE d.id = 'f5c655fa-b374-48ea-a519-d79c8846ed52'
ORDER BY dv.version_number DESC;
