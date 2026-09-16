# Migration Application Guide

## Current Situation

You have 6 migrations in `supabase/migrations/`:
1. `20260826000000_initial_edusphere_schema.sql` - Core schema
2. `20260826000001_rls_policies.sql` - RLS policies (uses `public.get_user_institution_id()`)
3. `20260830000000_auth_rls_updates.sql` - Anonymous access policy
4. `20260830120000_storage_bucket_and_policies.sql` - Storage bucket
5. `20260902000000_document_processing_enhancements.sql` - **NEW (EDU-008)**
6. `20260902000001_fix_document_contexts_versioning.sql` - **NEW (EDU-008) [CRITICAL]**

## Errors You're Seeing

### Error 1: Function does not exist
```
ERROR: function auth.get_user_institution_id() does not exist
```

**Cause:** Some migration is trying to use `auth.get_user_institution_id()` but it should be `public.get_user_institution_id()`.

**Which migration?** This error should NOT occur with current migrations. If you see this, it means an old version of a migration was applied.

### Error 2: Policy already exists
```
ERROR: policy "Anonymous users can view active institutions for signup" for table "institutions" already exists
```

**Cause:** Migration `20260830000000_auth_rls_updates.sql` has already been applied to your database.

## Solution: Apply Only Missing Migrations

### Check Which Migrations Are Applied

In Supabase SQL Editor, run:
```sql
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

This shows which migrations have been applied (by version number).

### Apply Only Missing Migrations

Based on what's missing, manually run the SQL from these files **in order**:

#### If You See No Migrations Applied

Run all 6 migrations in order (copy/paste each file's content into SQL Editor).

#### If You See Migrations Up To 20260830120000 Applied

You only need to run:
1. `20260902000000_document_processing_enhancements.sql` ✓
2. `20260902000001_fix_document_contexts_versioning.sql` ✓ **[CRITICAL]**

#### If Migration 20260902000000 Is Applied

You only need to run:
1. `20260902000001_fix_document_contexts_versioning.sql` ✓ **[CRITICAL]**

## How to Apply a Single Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy the **entire contents** of the migration file
3. Paste into SQL Editor
4. Click "Run"
5. Verify no errors
6. Check the migration was recorded:
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations 
   WHERE version = '20260902000001';
   ```

## Critical Migration: 20260902000001

**Why it's critical:**
- Fixes ERR-004: Version provenance broken
- Without this, processing Document Version 2 **overwrites** Version 1's context
- Adds `document_version_id` column
- Changes unique constraint from `document_id` to `document_version_id`
- Adds RLS write-denial policies

**After applying this migration:**
- The schema will support per-version context storage
- But the application code (`context-engine.ts`) needs updating to use `document_version_id`
- See section below

## After Applying Migrations

### 1. Verify Schema Changes

```sql
-- Check document_contexts has new columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'document_contexts' 
AND column_name IN ('extracted_text', 'normalized_text', 'retry_count', 
                     'error_message', 'processed_at', 'started_at', 'document_version_id');

-- Should return 7 rows

-- Check unique constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.document_contexts'::regclass
AND contype = 'u';

-- Should show document_contexts_version_unique

-- Check RLS policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'document_contexts';

-- Should show SELECT, INSERT, UPDATE, DELETE policies
```

### 2. Update Application Code

**CRITICAL:** `context-engine.ts` must be updated to use `document_version_id`.

Current code in `processDocument()`:
```typescript
const { data: document, error: docError } = await adminSupabase
  .from('documents')
  .select(`
    id,
    institution_id,
    title,
    document_type,
    document_versions!inner(
      id,
      version_number,
      storage_path,
      file_size_bytes,
      created_at
    )
  `)
  .eq('id', documentId)
  .order('document_versions(version_number)', { ascending: false })
  .limit(1)
  .single();

const latestVersion = versions[0];
```

**Change needed:**
Store context using `document_version_id`, not just `document_id`:

```typescript
// In storeContext() function:
const contextData = {
  document_id: documentId,           // Keep for backwards compatibility
  document_version_id: versionId,    // ADD THIS - critical for version provenance
  extracted_text: extractedText,
  normalized_text: normalizedText,
  // ... rest of fields
};
```

**Also update:**
- `getExistingContext()` to check `document_version_id`
- `markProcessingStarted()` to use `document_version_id`
- `markProcessingFailed()` to use `document_version_id`
- `markProcessingCompleted()` to use `document_version_id`

### 3. Test Multi-Version Processing

After code update:
1. Upload Document Version 1
2. Process it → Check context created
3. Upload Document Version 2 of same document
4. Process it → Check NEW context created (Version 1 preserved)
5. Verify both contexts exist:
   ```sql
   SELECT dc.id, dc.document_version_id, dv.version_number, dc.processing_status
   FROM document_contexts dc
   JOIN document_versions dv ON dc.document_version_id = dv.id
   WHERE dv.document_id = 'YOUR_DOCUMENT_ID'
   ORDER BY dv.version_number;
   
   -- Should show 2 rows: Version 1 and Version 2
   ```

## If You Get Errors

### "Constraint already exists"
Skip that constraint creation, it's already there.

### "Column already exists"
Use `ADD COLUMN IF NOT EXISTS` (already in migrations).

### "Policy already exists"
**Option 1:** Skip that CREATE POLICY line
**Option 2:** Drop and recreate:
```sql
DROP POLICY IF EXISTS "policy name" ON table_name;
-- then run CREATE POLICY
```

### "Function does not exist"
Check you have these functions in `public` schema (not `auth`):
- `public.get_user_institution_id()`
- `public.user_is_admin()`
- `public.get_user_role()`
- `public.user_has_institution()`

If they're missing, re-run migration `20260826000001_rls_policies.sql`.

## Environment Variables After Migration

Ensure these are set:
```bash
# Required for processing
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional for AI extraction (mock works without)
OPENAI_API_KEY=your_openai_key
```

## Verification Checklist

After applying all migrations:
- [ ] All 6 migrations recorded in `supabase_migrations.schema_migrations`
- [ ] `document_contexts` has 7 new columns
- [ ] `policy_sources` table exists
- [ ] `document_version_id` unique constraint exists
- [ ] 4 RLS policies exist on `document_contexts` (SELECT, INSERT, UPDATE, DELETE)
- [ ] Application code updated to use `document_version_id`
- [ ] Multi-version processing tested and working
- [ ] Run integration tests: `npm test`

## Questions?

Check ERROR_LOG.md for:
- ERR-004: Version provenance issue details
- ERR-005: RLS policy issue details

Check PROJECT_CONTEXT.md for:
- EDU-008 Final Audit section
- Architecture decisions
- Implementation details
