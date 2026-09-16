# EDU-009 Migration Guide

## Overview
This migration adds workflow generation, validation, and execution capabilities for EDU-009.

## Migration File
`supabase/migrations/20260902000002_edu009_workflow_enhancements.sql`

## What This Migration Does

### 1. New Enums
- `workflow_generation_source` - Track if workflow is human-created, AI-generated, or reviewed
- `transition_type` - Define workflow graph transition types
- `action_execution_mode` - Control how actions execute (sync/async/deferred)

### 2. Enhanced Existing Enums
- `workflow_status` - Added: VALIDATING, READY
- `workflow_instance_status` - Added: RUNNING, WAITING, FAILED
- `workflow_step_status` - Added: RUNNING, WAITING, FAILED

### 3. New Tables

#### workflow_action_types
**Purpose**: Registry of allowed workflow actions (security boundary)

**Columns**:
- `action_name` - Unique action identifier
- `action_category` - Grouping (VALIDATION, APPROVAL, NOTIFICATION, etc.)
- `config_schema` - JSON Schema for action configuration validation
- `requires_approval` - Whether action needs approval
- `execution_mode` - SYNCHRONOUS, ASYNCHRONOUS, or DEFERRED
- `is_system_defined` - System vs custom actions
- `is_active` - Enable/disable actions

**Initial Data**: 10 system-defined actions pre-populated

#### workflow_step_transitions
**Purpose**: Define workflow graph (transitions between steps)

**Columns**:
- `workflow_definition_id` - Parent workflow
- `from_step_id`, `to_step_id` - Transition endpoints
- `transition_type` - SEQUENTIAL, CONDITIONAL, PARALLEL_SPLIT, PARALLEL_JOIN
- `condition_expression` - JSON condition for conditional transitions
- `priority` - Order of evaluation for multiple transitions

#### workflow_execution_log
**Purpose**: Detailed audit trail of workflow execution

**Columns**:
- `workflow_instance_id` - Instance being executed
- `workflow_instance_step_id` - Specific step (optional)
- `event_type` - Type of event (STARTED, COMPLETED, FAILED, etc.)
- `event_data` - Additional event details (JSON)
- `actor_id` - User who triggered event
- `created_at` - Event timestamp

### 4. Enhanced Existing Tables

#### workflow_definitions (NEW COLUMNS)
- `is_ai_generated` - Boolean flag for AI-generated workflows
- `generation_source` - HUMAN_CREATED | AI_GENERATED | AI_GENERATED_REVIEWED
- `reviewed_by` - User who reviewed AI-generated workflow
- `reviewed_at` - Review timestamp
- `review_notes` - Optional review comments
- `trigger_config` - JSON trigger configuration

#### workflow_steps (NEW COLUMNS)
- `action_type_id` - Reference to workflow_action_types
- `condition_expression` - JSON condition for step execution
- `execution_mode` - SYNCHRONOUS | ASYNCHRONOUS | DEFERRED

#### ai_generation_records (NEW COLUMNS)
- `context_references` - Array of document_context IDs used
- `policy_references` - Array of policy IDs/versions used
- `generation_prompt_version` - Prompt template version
- `model_provider` - AI provider (openai, anthropic, mock)
- `generation_metadata` - Additional generation details

#### workflow_instance_steps (NEW COLUMNS)
- `execution_metadata` - Step execution details (JSON)
- `retry_count` - Number of retry attempts
- `error_category` - Error classification (TRANSIENT, PERMANENT)
- `error_message` - Error details
- `locked_at` - Concurrency control timestamp
- `locked_by` - Worker/process that locked the step

### 5. Row Level Security (RLS)

#### workflow_action_types
- **SELECT**: All authenticated users (system-wide actions)
- **ALL**: Only SYSTEM_ADMIN role

#### workflow_step_transitions
- **SELECT**: Users in same institution as workflow
- **ALL**: Admins/leadership roles in same institution

#### workflow_execution_log
- **SELECT**: Users in same institution as workflow instance
- **INSERT**: Users in same institution (append-only)

## Application Instructions

### Step 1: Backup Database (RECOMMENDED)
```bash
# Using Supabase CLI
supabase db dump -f backup_before_edu009.sql

# Or via SQL Editor in Supabase Dashboard
-- Export your critical data
```

### Step 2: Apply Migration

#### Option A: Supabase SQL Editor (RECOMMENDED)
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Create new query
4. Copy entire contents of `20260902000002_edu009_workflow_enhancements.sql`
5. Execute query
6. Verify success (check for errors)

#### Option B: Supabase CLI (if configured)
```bash
# Apply migration
supabase db push

# Or apply specific migration
psql $DATABASE_URL -f supabase/migrations/20260902000002_edu009_workflow_enhancements.sql
```

### Step 3: Verify Migration

Run this verification query in SQL Editor:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'workflow_action_types',
  'workflow_step_transitions',
  'workflow_execution_log'
);
-- Should return 3 rows

-- Check new enums exist
SELECT typname 
FROM pg_type 
WHERE typname IN (
  'workflow_generation_source',
  'transition_type',
  'action_execution_mode'
);
-- Should return 3 rows

-- Check new columns added to workflow_definitions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workflow_definitions' 
AND column_name IN (
  'is_ai_generated',
  'generation_source',
  'reviewed_by',
  'trigger_config'
);
-- Should return 4 rows

-- Check system actions inserted
SELECT COUNT(*) FROM workflow_action_types WHERE is_system_defined = TRUE;
-- Should return 10

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'workflow_action_types',
  'workflow_step_transitions',
  'workflow_execution_log'
);
-- Should return multiple rows
```

### Step 4: Verify RLS Isolation

```sql
-- Test as authenticated user (replace with actual user ID)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<user_uuid>';

-- Should see action types (system-wide)
SELECT COUNT(*) FROM workflow_action_types;

-- Should only see your institution's workflows
SELECT COUNT(*) FROM workflow_step_transitions;

-- Should only see your institution's execution logs
SELECT COUNT(*) FROM workflow_execution_log;

-- Reset
RESET ROLE;
```

## Post-Migration Tasks

### 1. Update TypeScript Types
```bash
# Regenerate Supabase types
npm run db:generate-types

# Or manually
supabase gen types typescript --local > src/types/supabase.ts
```

### 2. Verify Application Still Builds
```bash
npm run typecheck
npm run build
```

### 3. Update Application Code
The migration is backward-compatible, but you should:
- Update workflow queries to handle new columns
- Implement action type validation in workflow creation
- Add generation source tracking to AI workflow generator

## Rollback Instructions (if needed)

If you encounter critical issues, you can rollback:

```sql
-- WARNING: This will delete all data in new tables

-- Drop new tables (cascades to foreign keys)
DROP TABLE IF EXISTS workflow_execution_log CASCADE;
DROP TABLE IF EXISTS workflow_step_transitions CASCADE;
DROP TABLE IF EXISTS workflow_action_types CASCADE;

-- Remove new columns (data loss!)
ALTER TABLE workflow_definitions 
  DROP COLUMN IF EXISTS is_ai_generated,
  DROP COLUMN IF EXISTS generation_source,
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS review_notes,
  DROP COLUMN IF EXISTS trigger_config;

ALTER TABLE workflow_steps 
  DROP COLUMN IF EXISTS action_type_id,
  DROP COLUMN IF EXISTS condition_expression,
  DROP COLUMN IF EXISTS execution_mode;

ALTER TABLE ai_generation_records 
  DROP COLUMN IF EXISTS context_references,
  DROP COLUMN IF EXISTS policy_references,
  DROP COLUMN IF EXISTS generation_prompt_version,
  DROP COLUMN IF EXISTS model_provider,
  DROP COLUMN IF EXISTS generation_metadata;

ALTER TABLE workflow_instance_steps 
  DROP COLUMN IF EXISTS execution_metadata,
  DROP COLUMN IF EXISTS retry_count,
  DROP COLUMN IF EXISTS error_category,
  DROP COLUMN IF EXISTS error_message,
  DROP COLUMN IF EXISTS locked_at,
  DROP COLUMN IF EXISTS locked_by;

-- Drop new enums
DROP TYPE IF EXISTS action_execution_mode;
DROP TYPE IF EXISTS transition_type;
DROP TYPE IF EXISTS workflow_generation_source;

-- Note: Cannot remove enum values from existing enums
-- You would need to recreate those enums entirely
```

## Common Issues

### Issue: "type already exists"
**Cause**: Migration was partially applied before
**Solution**: Check which objects exist and skip those CREATE statements

### Issue: "column already exists"
**Cause**: Columns were added in previous attempt
**Solution**: Use `ADD COLUMN IF NOT EXISTS` (already in migration)

### Issue: RLS policy errors
**Cause**: Policies with same name exist
**Solution**: Drop existing policies or rename new ones

### Issue: "function update_updated_at_column() does not exist"
**Cause**: Base schema not applied
**Solution**: Apply `20260826000000_initial_edusphere_schema.sql` first

## Data Migration (if applicable)

If you have existing workflows, you may want to:

```sql
-- Mark existing workflows as human-created
UPDATE workflow_definitions 
SET is_ai_generated = FALSE,
    generation_source = 'HUMAN_CREATED'
WHERE generation_source IS NULL;

-- Set default execution mode for existing steps
UPDATE workflow_steps 
SET execution_mode = 'SYNCHRONOUS'
WHERE execution_mode IS NULL;
```

## Support

If you encounter issues:

1. Check Supabase Dashboard > Database > Logs
2. Check migration verification queries above
3. Review ERROR_LOG.md for similar issues
4. Check that prerequisite migrations were applied

## Next Steps

After successful migration:

1. ✅ Regenerate TypeScript types
2. ✅ Verify application builds
3. ✅ Implement workflow generator service
4. ✅ Implement workflow validator
5. ✅ Implement execution engine
6. ✅ Create workflow UI components
7. ✅ Write tests

## References

- Domain Model: `EDU-009_DOMAIN_MODEL.md`
- Task Specification: `task.md` (EDU-009 section)
- Project Memory: `PROJECT_MEMORY.md`
- Base Schema: `supabase/migrations/20260826000000_initial_edusphere_schema.sql`
