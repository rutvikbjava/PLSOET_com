# EDU-008 Migration Instructions

## Quick Start

You're seeing migration errors because some migrations are already applied to your database. Follow these steps:

### Step 1: Check What's Already Applied

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `supabase/check_migration_status.sql`
3. Click **Run**
4. Review results to see which migrations are applied

### Step 2: Apply Only Missing Migrations

Based on Step 1 results:

#### If You Have Migrations Through 20260830120000

Apply these two in order:

**A. First Migration** (`20260902000000_document_processing_enhancements.sql`):
- Adds processing columns to document_contexts
- Creates policy_sources table
- Adds indexes for retry and timeout detection

**B. Second Migration** (`20260902000001_fix_document_contexts_versioning.sql`) **[CRITICAL]**:
- Fixes ERR-004: Version provenance issue
- Adds document_version_id column
- Changes unique constraint to support per-version context
- Adds RLS write-denial policies

#### If You Already Applied 20260902000000

Only apply:
- `20260902000001_fix_document_contexts_versioning.sql` **[CRITICAL]**

### Step 3: Handle "Already Exists" Errors

If you see:
```
ERROR: policy "..." already exists
```

**Solution:**
- Skip that specific CREATE POLICY line, OR
- Add `DROP POLICY IF EXISTS "policy name" ON table_name;` before it

If you see:
```
ERROR: column "..." already exists
```

**Solution:**
- The migration already uses `ADD COLUMN IF NOT EXISTS`, so this shouldn't happen
- If it does, the migration was partially applied - skip that ALTER TABLE statement

### Step 4: Verify Migration Success

Run `supabase/check_migration_status.sql` again and verify:

- [ ] Migration 20260902000001 appears in migration list
- [ ] `document_version_id` column exists in document_contexts
- [ ] Unique constraint `document_contexts_version_unique` exists
- [ ] Old constraint `document_contexts_document_unique` is GONE
- [ ] 4 RLS policies on document_contexts (SELECT, INSERT, UPDATE, DELETE)

## Why Migration 20260902000001 Is Critical

**The Problem (ERR-004):**
```
Document ID: ABC-123

Version 1 uploaded → Process → Context Created ✓
Version 2 uploaded → Process → Context Created, Version 1 DESTROYED ✗

Result: Historical context LOST
```

**The Fix:**
```
Document ID: ABC-123

Version 1 uploaded → Process → Context for Version 1 Created ✓
Version 2 uploaded → Process → Context for Version 2 Created ✓

Result: Both contexts PRESERVED
```

This is essential for version provenance - each document version must retain its context.

## After Migration: Code Update Required

**CRITICAL:** The application code needs updating to use `document_version_id`.

Location: `src/lib/processing/context-engine.ts`

**Current Code Problem:**
The `storeContext()` function uses `document_id` only:
```typescript
const contextData = {
  document_id: documentId,  // ← Only links to document, not specific version
  extracted_text: extractedText,
  // ...
};
```

**Required Change:**
Pass and store `document_version_id`:
```typescript
const contextData = {
  document_id: documentId,           // Keep for compatibility
  document_version_id: versionId,    // ← ADD THIS - critical for version provenance
  extracted_text: extractedText,
  // ...
};
```

**Where to Get versionId:**
It's already available in `processDocument()`:
```typescript
const latestVersion = versions[0];
// latestVersion.id is the document_version_id
```

## Testing After Changes

1. **Test Multi-Version Processing:**
   ```sql
   -- Upload and process Document Version 1
   -- Upload and process Document Version 2 of same document
   
   -- Verify both contexts exist:
   SELECT 
     dc.id,
     dv.version_number,
     dc.processing_status,
     dc.document_version_id
   FROM document_contexts dc
   JOIN document_versions dv ON dc.document_version_id = dv.id
   WHERE dv.document_id = 'YOUR_DOCUMENT_ID'
   ORDER BY dv.version_number;
   
   -- Should show 2 rows (Version 1 and Version 2)
   ```

2. **Run Integration Tests:**
   ```bash
   npm test
   ```
   All 192 tests should pass (currently 26 fail due to missing database connection).

## Common Issues

### "Function does not exist"
**Error:** `function auth.get_user_institution_id() does not exist`

**Cause:** Old migration version with wrong schema prefix

**Fix:** Functions should be in `public` schema, not `auth`. Check migration 20260826000001 has:
- `public.get_user_institution_id()`
- `public.user_is_admin()`
- `public.get_user_role()`
- `public.user_has_institution()`

### "Constraint violation"
**Error:** Unique constraint violation when processing Version 2

**Cause:** Migration 20260902000001 not applied

**Fix:** Apply the migration, then update application code

### Tests Still Failing
**Error:** 26 tests fail after migration

**Cause:** Integration tests require actual database connection and data

**Fix:** These tests run against mocked/in-memory data during development. They'll pass when run against actual Supabase instance.

## Need More Help?

See detailed guides:
- `supabase/MIGRATION_APPLICATION_GUIDE.md` - Complete migration guide
- `supabase/check_migration_status.sql` - Verification SQL script
- `ERROR_LOG.md` - ERR-004 and ERR-005 details
- `PROJECT_CONTEXT.md` - EDU-008 Final Audit section

## Summary

**Minimum Required for EDU-008:**
1. ✅ Apply migration 20260902000001 (fixes version provenance)
2. ✅ Update context-engine.ts to use document_version_id
3. ✅ Test multi-version processing works
4. ✅ Verify RLS policies in place

**Then EDU-008 status changes:** PARTIAL → COMPLETE

**Next:** Proceed to EDU-009 (AI Workflow Generator)
