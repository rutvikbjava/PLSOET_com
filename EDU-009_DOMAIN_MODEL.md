# EDU-009 Domain Model Design

## Overview
Enhanced workflow architecture for AI-driven workflow generation, validation, and execution.

## Design Decisions

### DEC-046: Workflow Versioning Strategy
**Decision**: Use existing `workflow_definitions.version` column for versioning
**Approach**:
- Each version is a separate row with incremented `version` number
- Same `name` + `institution_id`, different `version`
- Active version has `status='ACTIVE'`
- Historical versions kept as `status='ARCHIVED'`
- Workflow instances reference exact workflow_definition_id (immutable)

**Why**: Existing schema supports this; avoids unnecessary complexity of separate version table

### DEC-047: Action Registry
**Decision**: Create `workflow_action_types` table with controlled action handlers
**Rationale**: Critical security boundary - prevents arbitrary code execution
**Action Types**:
- `VALIDATE_DOCUMENT` - Run document validation
- `REQUEST_APPROVAL` - Create approval request
- `GENERATE_NOTIFICATION` - Send notification
- `UPDATE_STATUS` - Update workflow/document status
- `WAIT_FOR_CONDITION` - Conditional wait
- `AI_REVIEW` - AI-assisted review
- `COLLECT_INFORMATION` - Gather additional data
- `DELEGATE_TASK` - Delegate to another user

### DEC-048: Step Transitions
**Decision**: Add `workflow_step_transitions` table for graph-based workflows
**Rationale**: Supports non-linear workflows with conditional branching
**Structure**:
- `from_step_id` → `to_step_id`
- `condition_expression` - JSON-based condition DSL
- `transition_type` - SEQUENTIAL, CONDITIONAL, PARALLEL_SPLIT, PARALLEL_JOIN

### DEC-049: AI Generation Metadata
**Decision**: Enhance `ai_generation_records` with context/policy provenance
**Fields**:
- `context_references` - Array of document_context_ids used
- `policy_references` - Array of policy_ids/versions used
- `generation_prompt_version` - Prompt template version
- `model_provider` - openai, anthropic, mock, etc.

### DEC-050: Execution State Management
**Decision**: Use existing tables with enhanced metadata tracking
**Approach**:
- `workflow_instances.execution_metadata` - Store execution-specific data
- `workflow_instance_steps.execution_metadata` - Store step execution details
- `workflow_instance_steps.retry_count` - Track retries
- `workflow_execution_log` - Detailed audit trail
**Concurrency**: PostgreSQL row-level locking with `SELECT ... FOR UPDATE`

### DEC-051: Workflow DSL
**Decision**: JSON-based structured workflow definition schema
**Schema**:
```typescript
{
  name: string;
  description: string;
  workflow_type: string;
  trigger: { type: 'MANUAL' | 'DOCUMENT_UPLOAD' | 'STATUS_CHANGE' };
  steps: Array<{
    id: string;
    name: string;
    action_type: string;  // References workflow_action_types
    sequence_order: number;
    config: Record<string, any>;
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'gt' | 'lt' | 'contains';
      value: any;
    }>;
    transitions?: Array<{
      to_step_id: string;
      type: 'SEQUENTIAL' | 'CONDITIONAL';
      condition?: string;
    }>;
  }>;
  required_roles: string[];
  policy_references: string[];
}
```

### DEC-052: Human Review Workflow
**Decision**: Add review tracking to workflow_definitions
**Fields**:
- `is_ai_generated` - Boolean flag
- `generation_source` - HUMAN_CREATED | AI_GENERATED | AI_GENERATED_REVIEWED
- `reviewed_by` - User who reviewed (if applicable)
- `reviewed_at` - Review timestamp
- `review_notes` - Optional review comments

## Enhanced Schema

### New Tables

#### workflow_action_types
```sql
CREATE TABLE workflow_action_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_name TEXT NOT NULL UNIQUE,
  action_category TEXT NOT NULL,
  description TEXT,
  config_schema JSONB,
  requires_approval BOOLEAN DEFAULT FALSE,
  execution_mode action_execution_mode NOT NULL DEFAULT 'SYNCHRONOUS',
  is_system_defined BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### workflow_step_transitions
```sql
CREATE TABLE workflow_step_transitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  from_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  to_step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
  transition_type transition_type NOT NULL DEFAULT 'SEQUENTIAL',
  condition_expression JSONB,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### workflow_execution_log
```sql
CREATE TABLE workflow_execution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  workflow_instance_step_id UUID REFERENCES workflow_instance_steps(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Enhanced Existing Tables

#### workflow_definitions (ADD columns)
```sql
ALTER TABLE workflow_definitions ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE workflow_definitions ADD COLUMN IF NOT EXISTS generation_source TEXT;
ALTER TABLE workflow_definitions ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE workflow_definitions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE workflow_definitions ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE workflow_definitions ADD COLUMN IF NOT EXISTS trigger_config JSONB DEFAULT '{}'::jsonb;
```

#### workflow_steps (ADD columns)
```sql
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS action_type_id UUID REFERENCES workflow_action_types(id);
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS condition_expression JSONB;
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS execution_mode action_execution_mode DEFAULT 'SYNCHRONOUS';
```

#### ai_generation_records (ADD columns)
```sql
ALTER TABLE ai_generation_records ADD COLUMN IF NOT EXISTS context_references JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ai_generation_records ADD COLUMN IF NOT EXISTS policy_references JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ai_generation_records ADD COLUMN IF NOT EXISTS generation_prompt_version TEXT;
ALTER TABLE ai_generation_records ADD COLUMN IF NOT EXISTS model_provider TEXT;
ALTER TABLE ai_generation_records ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}'::jsonb;
```

#### workflow_instance_steps (ADD columns)
```sql
ALTER TABLE workflow_instance_steps ADD COLUMN IF NOT EXISTS execution_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE workflow_instance_steps ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE workflow_instance_steps ADD COLUMN IF NOT EXISTS error_category TEXT;
ALTER TABLE workflow_instance_steps ADD COLUMN IF NOT EXISTS error_message TEXT;
```

### New Enums
```sql
CREATE TYPE workflow_generation_source AS ENUM (
  'HUMAN_CREATED',
  'AI_GENERATED',
  'AI_GENERATED_REVIEWED'
);

CREATE TYPE transition_type AS ENUM (
  'SEQUENTIAL',
  'CONDITIONAL',
  'PARALLEL_SPLIT',
  'PARALLEL_JOIN'
);

CREATE TYPE action_execution_mode AS ENUM (
  'SYNCHRONOUS',
  'ASYNCHRONOUS',
  'DEFERRED'
);
```

## Workflow Lifecycle States

### Workflow Definition States
- **DRAFT** - Under construction, not validated
- **VALIDATING** - Undergoing validation (NEW)
- **READY** - Validated, ready for activation (NEW)
- **ACTIVE** - Currently active version
- **INACTIVE** - Deactivated but not archived
- **ARCHIVED** - Historical version

**Migration**: Add VALIDATING and READY to existing workflow_status enum

### Workflow Instance States
- **PENDING** - Created, not started
- **RUNNING** - Currently executing (rename from IN_PROGRESS)
- **WAITING** - Waiting for condition/approval (NEW)
- **COMPLETED** - Successfully finished
- **FAILED** - Failed with error (NEW)
- **REJECTED** - Rejected by approver
- **CANCELLED** - Cancelled by user

**Migration**: Add RUNNING, WAITING, FAILED to workflow_instance_status

### Workflow Step Instance States
- **PENDING** - Not started
- **RUNNING** - Currently executing (rename from IN_PROGRESS)
- **COMPLETED** - Successfully finished
- **FAILED** - Failed with error (NEW)
- **SKIPPED** - Skipped due to condition
- **REJECTED** - Rejected by approver
- **WAITING** - Waiting for external event (NEW)

**Migration**: Add RUNNING, WAITING, FAILED to workflow_step_status

## Security Model

### Authorization Rules
1. **Generate Workflow**: Requires capability `GENERATE_WORKFLOW`
2. **Edit Workflow**: Creator OR admin role
3. **Activate Workflow**: Admin role + validation passed
4. **Execute Workflow**: Based on workflow's required_roles
5. **View Workflow**: Any authenticated user in same institution

### RLS Policies
- All workflow tables filtered by `institution_id`
- Cross-tenant access strictly prohibited
- Service role used only for system operations

### Execution Security
- No arbitrary code execution - only registered action types
- Action handlers implement authorization checks
- Workflow cannot escalate privileges
- All actions audited in workflow_execution_log

## Validation Architecture

### Schema Validation
- Validate against workflow DSL schema
- Check required fields present
- Validate action_type references exist
- Check step references valid

### Graph Validation
- Detect unreachable steps
- Detect infinite cycles (where not allowed)
- Validate terminal states exist
- Check transition consistency

### Policy Validation
- Check workflow complies with institutional policies
- Validate required approval steps present
- Check role requirements satisfy policies

### Context Validation
- Verify referenced documents/contexts exist
- Check context relevance to workflow type
- Validate policy references current

## Execution Engine Architecture

### State Machine
```
PENDING → RUNNING → (WAITING ⇄ RUNNING)* → COMPLETED
             ↓           ↓
          FAILED     CANCELLED
```

### Idempotency
- Each execution step has unique ID
- Duplicate execution requests detected via step status
- Non-idempotent actions track completion in execution_metadata

### Concurrency Control
```sql
SELECT * FROM workflow_instance_steps 
WHERE id = $1 AND status = 'PENDING'
FOR UPDATE SKIP LOCKED;
```

### Retry Strategy
- Transient failures: Retry with exponential backoff (max 3 retries)
- Permanent failures: Mark FAILED, no retry
- Track retry_count in workflow_instance_steps

## AI Generation Architecture

### Input Grounding
1. Retrieve relevant document contexts
2. Retrieve active policy versions
3. Retrieve institutional configuration
4. User-provided business intent

### Generation Process
1. User submits workflow request
2. System retrieves context/policies
3. AI generates structured workflow JSON
4. Schema validation
5. Graph validation
6. Save to ai_generation_records
7. Return for human review

### Output Structure
```typescript
{
  workflow: WorkflowDSL,
  metadata: {
    model: string,
    provider: string,
    confidence_score: number,
    context_ids: string[],
    policy_ids: string[],
    prompt_version: string
  }
}
```

### Safety Boundaries
- AI output validated before storage
- No direct execution of AI output
- Human review for high-impact workflows
- Validation must pass before activation

## Testing Strategy

### Unit Tests
- Action registry validation
- Workflow DSL schema validation
- Graph validation algorithms
- State machine transitions
- Idempotency checks

### Integration Tests
- AI generation flow
- Workflow validation pipeline
- Execution engine with mock actions
- Concurrency control

### Security Tests
- Cross-tenant isolation
- Authorization enforcement
- Arbitrary code execution prevention
- Service role protection

## Future Considerations (Out of Scope for EDU-009)

- Visual drag-and-drop editor (EDU-010+)
- Advanced parallel execution (EDU-010+)
- External system integrations (EDU-011+)
- Analytics and reporting (EDU-012+)
- Workflow templates marketplace (Future)
