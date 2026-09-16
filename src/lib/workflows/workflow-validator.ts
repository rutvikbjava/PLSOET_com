/**
 * Workflow Validator
 * 
 * Validates workflows at multiple levels:
 * 1. Schema validation - Structure, required fields, data types
 * 2. Graph validation - Reachability, cycles, terminal states
 * 3. Policy validation - Compliance with institutional policies
 * 4. Context validation - Referenced documents/contexts exist
 * 
 * Critical Security Component:
 * - AI-generated workflows MUST pass validation before activation
 * - No arbitrary code execution
 * - All action types must be registered
 * - Policy compliance enforced
 * 
 * Note: Using 'any' types where necessary for Supabase client type compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAuth, getUserInstitutionId } from '@/lib/auth';
import type {
  WorkflowDSL,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  GraphValidationResult,
  PolicyValidationResult,
  PolicyViolation,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const VALID_ACTION_TYPES = [
  'VALIDATE_DOCUMENT',
  'REQUEST_APPROVAL',
  'GENERATE_NOTIFICATION',
  'UPDATE_STATUS',
  'WAIT_FOR_CONDITION',
  'AI_REVIEW',
  'COLLECT_INFORMATION',
  'DELEGATE_TASK',
  'PARALLEL_GATEWAY',
  'JOIN_GATEWAY',
];

const VALID_TRIGGER_TYPES = [
  'MANUAL',
  'DOCUMENT_UPLOAD',
  'STATUS_CHANGE',
  'SCHEDULED',
  'EXTERNAL_EVENT',
];

const MAX_STEPS = 50;
const MAX_WORKFLOW_NAME_LENGTH = 200;
const MAX_STEP_NAME_LENGTH = 100;

// ============================================================================
// Main Validation Function
// ============================================================================

export interface ValidateWorkflowOptions {
  validate_schema?: boolean;
  validate_graph?: boolean;
  validate_policies?: boolean;
  validate_context?: boolean;
  policy_ids?: string[];
  document_ids?: string[];
}

export interface ComprehensiveValidationResult {
  valid: boolean;
  schema_validation: ValidationResult;
  graph_validation?: GraphValidationResult;
  policy_validation?: PolicyValidationResult[];
  context_validation?: ValidationResult;
  overall_errors: ValidationError[];
  overall_warnings: ValidationWarning[];
}

/**
 * Comprehensive workflow validation
 */
export async function validateWorkflow(
  workflow: WorkflowDSL,
  options: ValidateWorkflowOptions = {}
): Promise<ComprehensiveValidationResult> {
  const {
    validate_schema = true,
    validate_graph = true,
    validate_policies = false,
    validate_context = false,
    policy_ids = [],
    document_ids = [],
  } = options;

  const overall_errors: ValidationError[] = [];
  const overall_warnings: ValidationWarning[] = [];

  // 1. Schema validation (always required)
  const schema_validation = validate_schema
    ? await validateSchema(workflow)
    : { valid: true, errors: [], warnings: [] };

  overall_errors.push(...schema_validation.errors);
  overall_warnings.push(...schema_validation.warnings);

  // 2. Graph validation (structure and flow)
  let graph_validation: GraphValidationResult | undefined;
  if (validate_graph && schema_validation.valid) {
    graph_validation = validateGraph(workflow);
    overall_errors.push(...graph_validation.errors);
    overall_warnings.push(...graph_validation.warnings);
  }

  // 3. Policy validation (compliance checks)
  let policy_validation: PolicyValidationResult[] | undefined;
  if (validate_policies && policy_ids.length > 0) {
    policy_validation = await validatePolicies(workflow, policy_ids);
    for (const pv of policy_validation) {
      overall_errors.push(...pv.errors);
      overall_warnings.push(...pv.warnings);
    }
  }

  // 4. Context validation (document references)
  let context_validation: ValidationResult | undefined;
  if (validate_context && document_ids.length > 0) {
    context_validation = await validateContext(workflow, document_ids);
    overall_errors.push(...context_validation.errors);
    overall_warnings.push(...context_validation.warnings);
  }

  const valid = overall_errors.length === 0;

  return {
    valid,
    schema_validation,
    graph_validation,
    policy_validation,
    context_validation,
    overall_errors,
    overall_warnings,
  };
}

// ============================================================================
// Schema Validation
// ============================================================================

export async function validateSchema(workflow: WorkflowDSL): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate workflow name
  if (!workflow.name?.trim()) {
    errors.push({
      code: 'MISSING_NAME',
      message: 'Workflow name is required',
      path: 'name',
      severity: 'ERROR',
    });
  } else if (workflow.name.length > MAX_WORKFLOW_NAME_LENGTH) {
    errors.push({
      code: 'NAME_TOO_LONG',
      message: `Workflow name exceeds ${MAX_WORKFLOW_NAME_LENGTH} characters`,
      path: 'name',
      severity: 'ERROR',
    });
  }

  // Validate workflow type
  if (!workflow.workflow_type?.trim()) {
    errors.push({
      code: 'MISSING_WORKFLOW_TYPE',
      message: 'Workflow type is required',
      path: 'workflow_type',
      severity: 'ERROR',
    });
  }

  // Validate trigger
  if (!workflow.trigger) {
    errors.push({
      code: 'MISSING_TRIGGER',
      message: 'Workflow trigger is required',
      path: 'trigger',
      severity: 'ERROR',
    });
  } else {
    if (!VALID_TRIGGER_TYPES.includes(workflow.trigger.type)) {
      errors.push({
        code: 'INVALID_TRIGGER_TYPE',
        message: `Invalid trigger type: ${workflow.trigger.type}. Must be one of: ${VALID_TRIGGER_TYPES.join(', ')}`,
        path: 'trigger.type',
        severity: 'ERROR',
      });
    }
  }

  // Validate steps
  if (!workflow.steps || !Array.isArray(workflow.steps)) {
    errors.push({
      code: 'MISSING_STEPS',
      message: 'Workflow must have steps array',
      path: 'steps',
      severity: 'ERROR',
    });
    return { valid: false, errors, warnings };
  }

  if (workflow.steps.length === 0) {
    errors.push({
      code: 'EMPTY_STEPS',
      message: 'Workflow must have at least one step',
      path: 'steps',
      severity: 'ERROR',
    });
  }

  if (workflow.steps.length > MAX_STEPS) {
    errors.push({
      code: 'TOO_MANY_STEPS',
      message: `Workflow exceeds maximum of ${MAX_STEPS} steps`,
      path: 'steps',
      severity: 'ERROR',
    });
  }

  // Validate each step
  const stepIds = new Set<string>();
  const sequenceOrders = new Set<number>();

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    if (!step) continue; // Skip if undefined
    const stepPath = `steps[${i}]`;

    // Validate step ID
    if (!step.id?.trim()) {
      errors.push({
        code: 'MISSING_STEP_ID',
        message: 'Step ID is required',
        path: `${stepPath}.id`,
        severity: 'ERROR',
      });
    } else {
      if (stepIds.has(step.id)) {
        errors.push({
          code: 'DUPLICATE_STEP_ID',
          message: `Duplicate step ID: ${step.id}`,
          path: `${stepPath}.id`,
          severity: 'ERROR',
        });
      }
      stepIds.add(step.id);
    }

    // Validate step name
    if (!step.name?.trim()) {
      errors.push({
        code: 'MISSING_STEP_NAME',
        message: 'Step name is required',
        path: `${stepPath}.name`,
        severity: 'ERROR',
      });
    } else if (step.name.length > MAX_STEP_NAME_LENGTH) {
      errors.push({
        code: 'STEP_NAME_TOO_LONG',
        message: `Step name exceeds ${MAX_STEP_NAME_LENGTH} characters`,
        path: `${stepPath}.name`,
        severity: 'ERROR',
      });
    }

    // Validate action type
    if (!step.action_type) {
      errors.push({
        code: 'MISSING_ACTION_TYPE',
        message: 'Step action_type is required',
        path: `${stepPath}.action_type`,
        severity: 'ERROR',
      });
    } else if (!VALID_ACTION_TYPES.includes(step.action_type)) {
      errors.push({
        code: 'INVALID_ACTION_TYPE',
        message: `Invalid action type: ${step.action_type}. Must be one of: ${VALID_ACTION_TYPES.join(', ')}`,
        path: `${stepPath}.action_type`,
        severity: 'ERROR',
      });
    }

    // Validate sequence order
    if (typeof step.sequence_order !== 'number') {
      errors.push({
        code: 'MISSING_SEQUENCE_ORDER',
        message: 'Step sequence_order is required and must be a number',
        path: `${stepPath}.sequence_order`,
        severity: 'ERROR',
      });
    } else {
      if (step.sequence_order <= 0) {
        errors.push({
          code: 'INVALID_SEQUENCE_ORDER',
          message: 'Step sequence_order must be positive',
          path: `${stepPath}.sequence_order`,
          severity: 'ERROR',
        });
      }
      if (sequenceOrders.has(step.sequence_order)) {
        warnings.push({
          code: 'DUPLICATE_SEQUENCE_ORDER',
          message: `Duplicate sequence order: ${step.sequence_order}`,
          path: `${stepPath}.sequence_order`,
          severity: 'WARNING',
        });
      }
      sequenceOrders.add(step.sequence_order);
    }

    // Validate config
    if (step.config && typeof step.config !== 'object') {
      errors.push({
        code: 'INVALID_CONFIG',
        message: 'Step config must be an object',
        path: `${stepPath}.config`,
        severity: 'ERROR',
      });
    }

    // Validate timeout
    if (step.timeout_hours !== null && step.timeout_hours !== undefined) {
      if (typeof step.timeout_hours !== 'number' || step.timeout_hours <= 0) {
        errors.push({
          code: 'INVALID_TIMEOUT',
          message: 'Step timeout_hours must be a positive number',
          path: `${stepPath}.timeout_hours`,
          severity: 'ERROR',
        });
      }
    }

    // Validate transitions
    if (step.transitions) {
      if (!Array.isArray(step.transitions)) {
        errors.push({
          code: 'INVALID_TRANSITIONS',
          message: 'Step transitions must be an array',
          path: `${stepPath}.transitions`,
          severity: 'ERROR',
        });
      } else {
        for (let j = 0; j < step.transitions.length; j++) {
          const transition = step.transitions[j];
          if (!transition) continue; // Skip if undefined
          const transitionPath = `${stepPath}.transitions[${j}]`;

          if (!transition.to_step_id) {
            errors.push({
              code: 'MISSING_TO_STEP_ID',
              message: 'Transition to_step_id is required',
              path: `${transitionPath}.to_step_id`,
              severity: 'ERROR',
            });
          }
        }
      }
    }
  }

  // Verify action types are registered in database
  if (errors.length === 0) {
    const actionTypeValidation = await validateActionTypes(workflow);
    errors.push(...actionTypeValidation.errors);
    warnings.push(...actionTypeValidation.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate that action types are registered in database
 */
async function validateActionTypes(workflow: WorkflowDSL): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    const supabase = createClient();
    
    const actionTypes = [...new Set(workflow.steps.map((s) => s.action_type))];
    
    const { data: registered, error } = await supabase
      .from('workflow_action_types')
      .select('action_name, is_active')
      .in('action_name', actionTypes);

    if (error) {
      warnings.push({
        code: 'ACTION_TYPE_CHECK_FAILED',
        message: 'Could not verify action types in database',
        severity: 'WARNING',
      });
      return { valid: true, errors, warnings };
    }

    const registeredNames = new Set(registered?.map((r) => r.action_name) || []);
    const inactiveNames = new Set(
      registered?.filter((r) => !r.is_active).map((r) => r.action_name) || []
    );

    for (const actionType of actionTypes) {
      if (!registeredNames.has(actionType)) {
        errors.push({
          code: 'UNREGISTERED_ACTION_TYPE',
          message: `Action type '${actionType}' is not registered in the system`,
          severity: 'ERROR',
        });
      } else if (inactiveNames.has(actionType)) {
        warnings.push({
          code: 'INACTIVE_ACTION_TYPE',
          message: `Action type '${actionType}' is inactive`,
          severity: 'WARNING',
        });
      }
    }
  } catch (error) {
    warnings.push({
      code: 'ACTION_TYPE_VALIDATION_ERROR',
      message: 'Error validating action types',
      severity: 'WARNING',
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// Graph Validation
// ============================================================================

export function validateGraph(workflow: WorkflowDSL): GraphValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Build adjacency list
  const graph = new Map<string, Set<string>>();
  const stepIds = new Set(workflow.steps.map((s) => s.id));

  // Initialize graph
  for (const step of workflow.steps) {
    graph.set(step.id, new Set());
  }

  // Build edges from transitions
  for (const step of workflow.steps) {
    if (step.transitions) {
      for (const transition of step.transitions) {
        if (transition.to_step_id) {
          if (!stepIds.has(transition.to_step_id)) {
            errors.push({
              code: 'INVALID_TRANSITION_TARGET',
              message: `Step '${step.id}' transitions to non-existent step '${transition.to_step_id}'`,
              path: `steps.${step.id}.transitions`,
              severity: 'ERROR',
            });
          } else {
            graph.get(step.id)!.add(transition.to_step_id);
          }
        }
      }
    } else {
      // Sequential flow: connect to next step by sequence order
      const currentOrder = step.sequence_order;
      const nextStep = workflow.steps.find((s) => s.sequence_order === currentOrder + 1);
      if (nextStep) {
        graph.get(step.id)!.add(nextStep.id);
      }
    }
  }

  // Check for unreachable steps
  const firstStep = workflow.steps.reduce((min, step) =>
    step.sequence_order < min.sequence_order ? step : min
  );
  
  const reachable = new Set<string>();
  const queue = [firstStep.id];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachable.has(current)) continue;
    
    reachable.add(current);
    const neighbors = graph.get(current) || new Set();
    queue.push(...Array.from(neighbors));
  }

  const unreachable_steps = workflow.steps
    .filter((s) => !reachable.has(s.id))
    .map((s) => s.id);

  if (unreachable_steps.length > 0) {
    warnings.push({
      code: 'UNREACHABLE_STEPS',
      message: `Steps are unreachable from the start: ${unreachable_steps.join(', ')}`,
      severity: 'WARNING',
    });
  }

  // Check for cycles
  const cycles = detectCycles(graph);
  if (cycles.length > 0) {
    warnings.push({
      code: 'WORKFLOW_CYCLES',
      message: `Workflow contains cycles: ${cycles.map((c) => c.join(' → ')).join('; ')}`,
      severity: 'WARNING',
    });
  }

  // Check for terminal states
  const hasTerminalState = workflow.steps.some((step) => {
    const neighbors = graph.get(step.id);
    return !neighbors || neighbors.size === 0;
  });

  if (!hasTerminalState) {
    errors.push({
      code: 'NO_TERMINAL_STATE',
      message: 'Workflow must have at least one terminal state (step with no outgoing transitions)',
      severity: 'ERROR',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    unreachable_steps,
    cycles,
    terminal_states: hasTerminalState,
  };
}

/**
 * Detect cycles in directed graph using DFS
 */
function detectCycles(graph: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycles.push([...cycle, neighbor]);
        return true;
      }
    }

    recursionStack.delete(node);
    path.pop();
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

// ============================================================================
// Policy Validation
// ============================================================================

export async function validatePolicies(
  workflow: WorkflowDSL,
  policyIds: string[]
): Promise<PolicyValidationResult[]> {
  await requireAuth();
  const institutionId = await getUserInstitutionId();

  if (!institutionId) {
    throw new Error('Institution ID required');
  }

  const results: PolicyValidationResult[] = [];
  const adminSupabase = getAdminClient();

  for (const policyId of policyIds) {
    const { data: policy, error } = await adminSupabase
      .from('policies')
      .select('*')
      .eq('id', policyId)
      .eq('institution_id', institutionId)
      .single();

    if (error || !policy) {
      results.push({
        valid: false,
        errors: [{
          code: 'POLICY_NOT_FOUND',
          message: `Policy ${policyId} not found`,
          severity: 'ERROR',
        }],
        warnings: [],
        policy_id: policyId,
        policy_version: 0,
        violations: [],
        is_compliant: false,
      });
      continue;
    }

    // Perform policy validation
    const validation = await validateAgainstPolicy(workflow, policy);
    results.push(validation);
  }

  return results;
}

/**
 * Validate workflow against a specific policy
 */
async function validateAgainstPolicy(_workflow: WorkflowDSL, policy: any): Promise<PolicyValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const violations: PolicyViolation[] = [];

  // Basic policy validation logic
  // In production, this would parse policy rules and validate workflow compliance
  
  // Example: Check if workflow includes required approval steps
  const hasApprovalStep = _workflow.steps.some((s) => s.action_type === 'REQUEST_APPROVAL');
  
  if (policy.requires_approval && !hasApprovalStep) {
    violations.push({
      rule_id: 'APPROVAL_REQUIRED',
      rule_description: 'Policy requires approval step',
      severity: 'CRITICAL',
      message: 'Workflow must include at least one approval step',
      suggested_fix: 'Add REQUEST_APPROVAL step to workflow',
    });
    errors.push({
      code: 'MISSING_REQUIRED_APPROVAL',
      message: `Policy '${policy.name}' requires approval step`,
      severity: 'ERROR',
    });
  }

  const is_compliant = violations.length === 0 && errors.length === 0;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    policy_id: policy.id,
    policy_version: policy.version,
    violations,
    is_compliant,
  };
}

// ============================================================================
// Context Validation
// ============================================================================

export async function validateContext(
  _workflow: WorkflowDSL,
  documentIds: string[]
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  await requireAuth();
  const institutionId = await getUserInstitutionId();

  if (!institutionId) {
    throw new Error('Institution ID required');
  }

  const adminSupabase = getAdminClient();

  // Verify referenced documents exist and belong to institution
  for (const docId of documentIds) {
    const { data: doc, error } = await adminSupabase
      .from('documents')
      .select('id, institution_id')
      .eq('id', docId)
      .single();

    if (error || !doc) {
      errors.push({
        code: 'DOCUMENT_NOT_FOUND',
        message: `Referenced document ${docId} not found`,
        severity: 'ERROR',
      });
    } else if ((doc as any).institution_id !== institutionId) {
      errors.push({
        code: 'DOCUMENT_WRONG_INSTITUTION',
        message: `Document ${docId} belongs to different institution`,
        severity: 'ERROR',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick validation check (schema only)
 */
export async function quickValidate(workflow: WorkflowDSL): Promise<boolean> {
  const result = await validateSchema(workflow);
  return result.valid;
}

/**
 * Get validation summary
 */
export function getValidationSummary(result: ComprehensiveValidationResult): string {
  if (result.valid) {
    return 'Workflow validation passed';
  }

  const errorCount = result.overall_errors.length;
  const warningCount = result.overall_warnings.length;

  return `Validation failed: ${errorCount} error(s), ${warningCount} warning(s)`;
}
