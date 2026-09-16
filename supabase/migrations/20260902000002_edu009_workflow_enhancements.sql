-- ============================================================================
-- Migration: EDU-009 Workflow Generator and Execution Engine Enhancements
-- Description: Add workflow versioning, action registry, transitions, execution tracking
-- Date: 2026-09-02
-- Dependencies: 20260826000000_initial_edusphere_schema.sql
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Workflow generation source
CREATE TYPE workflow_generation_source AS ENUM (
  'HUMAN_CREATED',
  'AI_GENERATED',
  'AI_GENERATED_REVIEWED'
);

-- Transition types for workflow graph
CREATE TYPE transition_type AS ENUM (
  'SEQUENTIAL',
  'CONDITIONAL',
  'PARALLEL_SPLIT',
  'PARALLEL_JOIN'
);

-- Action execution modes
CREATE TYPE action_execution_mode AS ENUM (
  'SYNCHRONOUS',
  'ASYNCHRONOUS',
  'DEFERRED'
);

-- ============================================================================
-- ENHANCE EXISTING ENUMS
-- ============================================================================

-- Add new workflow_status values for validation lifecycle
ALTER TYPE workflow_status ADD VALUE IF NOT EXISTS 'VALIDATING';
ALTER TYPE workflow_status ADD VALUE IF NOT EXISTS 'READY';

-- Add new workflow_instance_status values for execution states
ALTER TYPE workflow_instance_status ADD VALUE IF NOT EXISTS 'RUNNING';
ALTER TYPE workflow_instance_status ADD VALUE IF NOT EXISTS 'WAITING';
ALTER TYPE workflow_instance_status ADD VALUE IF NOT EXISTS 'FAILED';

-- Add new workflow_step_status values
ALTER TYPE workflow_step_status ADD VALUE IF NOT EXISTS 'RUNNING';
ALTER TYPE workflow_step_status ADD VALUE IF NOT EXISTS 'WAITING';
ALTER TYPE workflow_step_status ADD VALUE IF NOT EXISTS 'FAILED';

-- ============================================================================
-- TABLE: workflow_action_types
-- Purpose: Registry of allowed workflow actions (security boundary)
-- Security: Prevents arbitrary code execution in workflows
-- ============================================================================

CREATE TABLE workflow_action_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Action identity
  action_name TEXT NOT NULL UNIQUE,
  action_category TEXT NOT NULL,
  description TEXT,
  
  -- Configuration schema (JSON Schema for validation)
  config_schema JSONB DEFAULT '{}'::jsonb,
  
  -- Action behavior
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  execution_mode action_execution_mode NOT NULL DEFAULT 'SYNCHRONOUS',
  
  -- System vs custom actions
  is_system_defined BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workflow_action_types_name_not_empty CHECK (length(trim(action_name)) > 0),
  CONSTRAINT workflow_action_types_category_not_empty CHECK (length(trim(action_category)) > 0)
);

-- Indexes
CREATE INDEX workflow_action_types_category_idx ON workflow_action_types(action_category);
CREATE INDEX workflow_action_types_is_active_idx ON workflow_action_types(is_active);

-- Initial system-defined actions
INSERT INTO workflow_action_types (action_name, action_category, description, requires_approval, execution_mode, is_system_defined) VALUES
  ('VALIDATE_DOCUMENT', 'VALIDATION', 'Run document validation against policies', FALSE, 'SYNCHRONOUS', TRUE),
  ('REQUEST_APPROVAL', 'APPROVAL', 'Request approval from designated approver', TRUE, 'ASYNCHRONOUS', TRUE),
  ('GENERATE_NOTIFICATION', 'NOTIFICATION', 'Send notification to user or group', FALSE, 'ASYNCHRONOUS', TRUE),
  ('UPDATE_STATUS', 'STATE', 'Update document or workflow status', FALSE, 'SYNCHRONOUS', TRUE),
  ('WAIT_FOR_CONDITION', 'CONTROL', 'Wait for specified condition to be met', FALSE, 'DEFERRED', TRUE),
  ('AI_REVIEW', 'AI', 'AI-assisted document or workflow review', FALSE, 'ASYNCHRONOUS', TRUE),
  ('COLLECT_INFORMATION', 'DATA', 'Collect additional information from user', FALSE, 'ASYNCHRONOUS', TRUE),
  ('DELEGATE_TASK', 'ASSIGNMENT', 'Delegate task to another user or role', FALSE, 'SYNCHRONOUS', TRUE),
  ('PARALLEL_GATEWAY', 'CONTROL', 'Split workflow into parallel branches', FALSE, 'SYNCHRONOUS', TRUE),
  ('JOIN_GATEWAY', 'CONTROL', 'Wait for parallel branches to complete', FALSE, 'SYNCHRONOUS', TRUE);

-- ============================================================================
-- TABLE: workflow_step_transitions
-- Purpose: Define workflow graph edges (transitions between steps)
-- Security: Institution-isolated, validated during workflow validation
-- ============================================================================

CREATE TABLE workflow_step_transitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Workflow context
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  
  -- Transition endpoints
  from_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  to_step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
  
  -- Transition behavior
  transition_type transition_type NOT NULL DEFAULT 'SEQUENTIAL',
  condition_expression JSONB,
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  transition_label TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workflow_step_transitions_no_self_loop CHECK (from_step_id != to_step_id)
);

-- Indexes
CREATE INDEX workflow_step_transitions_workflow_definition_id_idx 
  ON workflow_step_transitions(workflow_definition_id);
CREATE INDEX workflow_step_transitions_from_step_id_idx 
  ON workflow_step_transitions(from_step_id);
CREATE INDEX workflow_step_transitions_to_step_id_idx 
  ON workflow_step_transitions(to_step_id);

-- ============================================================================
-- TABLE: workflow_execution_log
-- Purpose: Detailed audit trail of workflow execution events
-- Security: Append-only, institution-isolated
-- ============================================================================

CREATE TABLE workflow_execution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Execution context
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  workflow_instance_step_id UUID REFERENCES workflow_instance_steps(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Actor
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workflow_execution_log_event_type_not_empty CHECK (length(trim(event_type)) > 0)
);

-- Indexes
CREATE INDEX workflow_execution_log_workflow_instance_id_idx 
  ON workflow_execution_log(workflow_instance_id);
CREATE INDEX workflow_execution_log_workflow_instance_step_id_idx 
  ON workflow_execution_log(workflow_instance_step_id);
CREATE INDEX workflow_execution_log_created_at_idx 
  ON workflow_execution_log(created_at DESC);
CREATE INDEX workflow_execution_log_event_type_idx 
  ON workflow_execution_log(event_type);

-- ============================================================================
-- ENHANCE EXISTING TABLES
-- ============================================================================

-- workflow_definitions: Add AI generation and review tracking
ALTER TABLE workflow_definitions 
  ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS generation_source workflow_generation_source DEFAULT 'HUMAN_CREATED',
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS trigger_config JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS workflow_definitions_is_ai_generated_idx 
  ON workflow_definitions(is_ai_generated);
CREATE INDEX IF NOT EXISTS workflow_definitions_generation_source_idx 
  ON workflow_definitions(generation_source);
CREATE INDEX IF NOT EXISTS workflow_definitions_reviewed_by_idx 
  ON workflow_definitions(reviewed_by);

-- workflow_steps: Add action type reference and execution config
ALTER TABLE workflow_steps 
  ADD COLUMN IF NOT EXISTS action_type_id UUID REFERENCES workflow_action_types(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS condition_expression JSONB,
  ADD COLUMN IF NOT EXISTS execution_mode action_execution_mode DEFAULT 'SYNCHRONOUS';

CREATE INDEX IF NOT EXISTS workflow_steps_action_type_id_idx 
  ON workflow_steps(action_type_id);

-- ai_generation_records: Add provenance tracking
ALTER TABLE ai_generation_records 
  ADD COLUMN IF NOT EXISTS context_references JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS policy_references JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS generation_prompt_version TEXT,
  ADD COLUMN IF NOT EXISTS model_provider TEXT,
  ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS ai_generation_records_model_provider_idx 
  ON ai_generation_records(model_provider);

-- workflow_instance_steps: Add execution tracking
ALTER TABLE workflow_instance_steps 
  ADD COLUMN IF NOT EXISTS execution_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_category TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by TEXT;

CREATE INDEX IF NOT EXISTS workflow_instance_steps_retry_count_idx 
  ON workflow_instance_steps(retry_count);
CREATE INDEX IF NOT EXISTS workflow_instance_steps_error_category_idx 
  ON workflow_instance_steps(error_category);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE workflow_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_log ENABLE ROW LEVEL SECURITY;

-- workflow_action_types: System-wide read access (no institution filtering)
-- All authenticated users can view action types
CREATE POLICY "Authenticated users can view workflow action types"
  ON workflow_action_types
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only system admins can modify action types
CREATE POLICY "System admins can manage workflow action types"
  ON workflow_action_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SYSTEM_ADMIN')
    )
  );

-- workflow_step_transitions: Institution-isolated through workflow_definitions
CREATE POLICY "Users can view workflow step transitions for their institution"
  ON workflow_step_transitions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_definitions wd
      INNER JOIN profiles p ON p.institution_id = wd.institution_id
      WHERE wd.id = workflow_step_transitions.workflow_definition_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage workflow step transitions for their institution"
  ON workflow_step_transitions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_definitions wd
      INNER JOIN profiles p ON p.institution_id = wd.institution_id
      WHERE wd.id = workflow_step_transitions.workflow_definition_id
      AND p.id = auth.uid()
      AND p.role IN ('ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN', 'DEPARTMENT_HEAD')
    )
  );

-- workflow_execution_log: Institution-isolated through workflow_instances
CREATE POLICY "Users can view workflow execution logs for their institution"
  ON workflow_execution_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_instances wi
      INNER JOIN profiles p ON p.institution_id = wi.institution_id
      WHERE wi.id = workflow_execution_log.workflow_instance_id
      AND p.id = auth.uid()
    )
  );

-- Execution log is append-only (INSERT only)
CREATE POLICY "System can insert workflow execution logs"
  ON workflow_execution_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_instances wi
      INNER JOIN profiles p ON p.institution_id = wi.institution_id
      WHERE wi.id = workflow_execution_log.workflow_instance_id
      AND p.id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Trigger for workflow_action_types
CREATE TRIGGER set_workflow_action_types_updated_at
  BEFORE UPDATE ON workflow_action_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE workflow_action_types IS 'Registry of allowed workflow actions - critical security boundary preventing arbitrary code execution';
COMMENT ON TABLE workflow_step_transitions IS 'Workflow graph edges defining step transitions and conditions';
COMMENT ON TABLE workflow_execution_log IS 'Detailed audit trail of workflow execution events';

COMMENT ON COLUMN workflow_definitions.is_ai_generated IS 'Flag indicating if workflow was generated by AI';
COMMENT ON COLUMN workflow_definitions.generation_source IS 'Source of workflow: human-created, AI-generated, or AI-generated and reviewed';
COMMENT ON COLUMN workflow_definitions.reviewed_by IS 'User who reviewed and approved AI-generated workflow';

COMMENT ON COLUMN workflow_steps.action_type_id IS 'Reference to registered action type - enforces controlled action vocabulary';
COMMENT ON COLUMN workflow_steps.condition_expression IS 'JSON condition expression for conditional step execution';

COMMENT ON COLUMN ai_generation_records.context_references IS 'Array of document_context IDs used as input for generation';
COMMENT ON COLUMN ai_generation_records.policy_references IS 'Array of policy IDs/versions used as constraints for generation';

COMMENT ON COLUMN workflow_instance_steps.retry_count IS 'Number of retry attempts for transient failures';
COMMENT ON COLUMN workflow_instance_steps.locked_at IS 'Timestamp when step was locked for execution (concurrency control)';
COMMENT ON COLUMN workflow_instance_steps.locked_by IS 'Worker/process ID that locked the step';
