/**
 * Workflow Type Definitions
 * 
 * Shared types for workflow system across services, UI, and APIs.
 * 
 * Note: Using 'any' types where necessary for flexible workflow configurations
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// Enums
// ============================================================================

export type WorkflowStatus = 
  | 'DRAFT' 
  | 'VALIDATING' 
  | 'READY' 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'ARCHIVED';

export type WorkflowInstanceStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'CANCELLED';

export type WorkflowStepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'REJECTED'
  | 'WAITING';

export type WorkflowGenerationSource = 
  | 'HUMAN_CREATED' 
  | 'AI_GENERATED' 
  | 'AI_GENERATED_REVIEWED';

export type TransitionType = 
  | 'SEQUENTIAL' 
  | 'CONDITIONAL' 
  | 'PARALLEL_SPLIT' 
  | 'PARALLEL_JOIN';

export type ActionExecutionMode = 
  | 'SYNCHRONOUS' 
  | 'ASYNCHRONOUS' 
  | 'DEFERRED';

export type ApprovalDecision = 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'RETURNED_FOR_REVISION' 
  | 'DELEGATED';

// ============================================================================
// Workflow DSL
// ============================================================================

/**
 * Workflow DSL - JSON-based structured workflow definition
 */
export interface WorkflowDSL {
  name: string;
  description: string;
  workflow_type: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStepDSL[];
  required_roles?: string[];
  policy_references?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowTrigger {
  type: 'MANUAL' | 'DOCUMENT_UPLOAD' | 'STATUS_CHANGE' | 'SCHEDULED' | 'EXTERNAL_EVENT';
  config?: Record<string, any>;
}

export interface WorkflowStepDSL {
  id: string;
  name: string;
  action_type: string;
  sequence_order: number;
  config: Record<string, any>;
  is_mandatory?: boolean;
  timeout_hours?: number;
  conditions?: WorkflowCondition[];
  transitions?: WorkflowTransitionDSL[];
  execution_mode?: ActionExecutionMode;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface WorkflowTransitionDSL {
  to_step_id: string;
  type: TransitionType;
  condition?: string;
  priority?: number;
  label?: string;
}

// ============================================================================
// Database Entities
// ============================================================================

export interface WorkflowDefinition {
  id: string;
  institution_id: string;
  name: string;
  description: string | null;
  workflow_type: string;
  version: number;
  status: WorkflowStatus;
  is_ai_generated: boolean;
  generation_source: WorkflowGenerationSource;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  trigger_config: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  workflow_definition_id: string;
  step_name: string;
  step_type: string;
  sequence_order: number;
  action_type_id: string | null;
  approver_role: string | null;
  approver_user_id: string | null;
  department_id: string | null;
  is_mandatory: boolean;
  timeout_hours: number | null;
  step_config: Record<string, any>;
  condition_expression: Record<string, any> | null;
  execution_mode: ActionExecutionMode;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepTransition {
  id: string;
  workflow_definition_id: string;
  from_step_id: string;
  to_step_id: string | null;
  transition_type: TransitionType;
  condition_expression: Record<string, any> | null;
  priority: number;
  transition_label: string | null;
  created_at: string;
}

export interface WorkflowActionType {
  id: string;
  action_name: string;
  action_category: string;
  description: string | null;
  config_schema: Record<string, any>;
  requires_approval: boolean;
  execution_mode: ActionExecutionMode;
  is_system_defined: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInstance {
  id: string;
  workflow_definition_id: string;
  document_id: string;
  institution_id: string;
  instance_name: string;
  workflow_snapshot: Record<string, any>;
  status: WorkflowInstanceStatus;
  initiated_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface WorkflowInstanceStep {
  id: string;
  workflow_instance_id: string;
  workflow_step_id: string | null;
  step_name: string;
  sequence_order: number;
  assigned_approver_id: string | null;
  status: WorkflowStepStatus;
  decision: ApprovalDecision | null;
  comments: string | null;
  execution_metadata: Record<string, any>;
  retry_count: number;
  error_category: string | null;
  error_message: string | null;
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface WorkflowExecutionLog {
  id: string;
  workflow_instance_id: string;
  workflow_instance_step_id: string | null;
  event_type: string;
  event_data: Record<string, any>;
  actor_id: string | null;
  created_at: string;
}

export interface AIGenerationRecord {
  id: string;
  document_id: string | null;
  document_context_id: string | null;
  generated_workflow: Record<string, any>;
  model_name: string | null;
  model_version: string | null;
  model_provider: string | null;
  confidence_score: number | null;
  is_validated: boolean;
  validation_status: string | null;
  context_references: string[];
  policy_references: string[];
  generation_prompt_version: string | null;
  generation_metadata: Record<string, any>;
  created_at: string;
  validated_at: string | null;
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'ERROR';
}

export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
  severity: 'WARNING';
}

export interface GraphValidationResult extends ValidationResult {
  unreachable_steps?: string[];
  cycles?: string[][];
  terminal_states?: boolean;
}

export interface PolicyValidationResult extends ValidationResult {
  policy_id: string;
  policy_version: number;
  violations: PolicyViolation[];
  is_compliant: boolean;
}

export interface PolicyViolation {
  rule_id: string;
  rule_description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  suggested_fix?: string;
}

// ============================================================================
// Execution
// ============================================================================

export interface ExecutionContext {
  workflow_instance_id: string;
  document_id: string;
  institution_id: string;
  current_step_id: string;
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  step_id: string;
  status: WorkflowStepStatus;
  output?: any;
  error?: string;
  next_step_id?: string;
  metadata?: Record<string, any>;
}

export interface StepExecutor {
  action_type: string;
  execute(context: ExecutionContext, config: Record<string, any>): Promise<ExecutionResult>;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  workflow_type: string;
  is_ai_generated?: boolean;
  generation_source?: WorkflowGenerationSource;
  trigger_config?: Record<string, any>;
  steps: CreateWorkflowStepRequest[];
  transitions?: CreateWorkflowTransitionRequest[];
}

export interface CreateWorkflowStepRequest {
  step_name: string;
  step_type: string;
  sequence_order: number;
  action_type_id?: string;
  approver_role?: string;
  approver_user_id?: string;
  department_id?: string;
  is_mandatory?: boolean;
  timeout_hours?: number;
  step_config?: Record<string, any>;
  condition_expression?: Record<string, any>;
  execution_mode?: ActionExecutionMode;
}

export interface CreateWorkflowTransitionRequest {
  from_step_id: string;
  to_step_id?: string;
  transition_type?: TransitionType;
  condition_expression?: Record<string, any>;
  priority?: number;
  transition_label?: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  workflow_type?: string;
  trigger_config?: Record<string, any>;
  review_notes?: string;
}

export interface GenerateWorkflowRequest {
  business_intent: string;
  workflow_type?: string;
  document_ids?: string[];
  policy_ids?: string[];
  additional_context?: Record<string, any>;
}

export interface GenerateWorkflowResponse {
  generation_id: string;
  workflow: WorkflowDSL;
  confidence_score: number;
  context_references: string[];
  policy_references: string[];
  validation_result: ValidationResult;
  metadata: {
    model: string;
    provider: string;
    prompt_version: string;
    generation_time_ms: number;
  };
}

export interface ValidateWorkflowRequest {
  workflow: WorkflowDSL | string; // DSL object or workflow_definition_id
  validate_policies?: boolean;
  validate_graph?: boolean;
}

export interface ValidateWorkflowResponse {
  valid: boolean;
  schema_validation: ValidationResult;
  graph_validation?: GraphValidationResult;
  policy_validation?: PolicyValidationResult[];
  overall_errors: ValidationError[];
  overall_warnings: ValidationWarning[];
}

export interface ExecuteWorkflowRequest {
  workflow_definition_id: string;
  document_id: string;
  instance_name?: string;
  initial_variables?: Record<string, any>;
}

export interface ExecuteWorkflowResponse {
  workflow_instance_id: string;
  status: WorkflowInstanceStatus;
  current_step_id?: string;
  message: string;
}
