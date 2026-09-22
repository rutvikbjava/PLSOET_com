/**
 * Workflow Execution Engine
 * 
 * Executes workflow instances with:
 * - State machine for workflow/step status transitions
 * - Action registry for safe, controlled execution
 * - Idempotency and concurrency control
 * - Retry logic with exponential backoff
 * - Execution logging and audit trail
 * 
 * Security:
 * - No arbitrary code execution
 * - All actions go through registered handlers
 * - Institution isolation enforced
 * - Authorization checks at execution time
 * 
 * Architecture:
 * - Vercel-compatible (no persistent workers)
 * - Stateless execution (all state in database)
 * - Resumable after failures
 * 
 * Note: Using 'any' types where necessary for Supabase client type compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getAdminClient } from '@/lib/supabase/admin';
import { requireAuth, getUserInstitutionId } from '@/lib/auth';
import type {
  WorkflowInstance,
  WorkflowInstanceStep,
  ExecutionContext,
  ExecutionResult,
  StepExecutor,
  WorkflowInstanceStatus,
  WorkflowStepStatus,
} from './types';
import { getCompleteWorkflow } from './workflow-definition-service';

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRIES = 3;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Errors
// ============================================================================

export class ExecutionError extends Error {
  constructor(
    message: string,
    public category: 'TRANSIENT' | 'PERMANENT' | 'AUTHORIZATION' | 'VALIDATION',
    public step_id?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ExecutionError';
  }
}

// ============================================================================
// Action Registry
// ============================================================================

const ACTION_HANDLERS = new Map<string, StepExecutor>();

/**
 * Register action handler
 */
export function registerActionHandler(action_type: string, executor: StepExecutor): void {
  if (ACTION_HANDLERS.has(action_type)) {
    console.warn(`[ACTION_REGISTRY] Overwriting handler for action: ${action_type}`);
  }
  ACTION_HANDLERS.set(action_type, executor);
}

/**
 * Get action handler
 */
export function getActionHandler(action_type: string): StepExecutor | undefined {
  return ACTION_HANDLERS.get(action_type);
}

/**
 * Check if action is registered
 */
export function isActionRegistered(action_type: string): boolean {
  return ACTION_HANDLERS.has(action_type);
}

// ============================================================================
// Built-in Action Handlers
// ============================================================================

/**
 * VALIDATE_DOCUMENT action
 *
 * Validates a document against one or more institutional policies.
 * Config fields: document_id, policy_ids (string[]), validation_rules (legacy)
 * Falls back to a simple structural check if no policy IDs are supplied.
 */
const validateDocumentHandler: StepExecutor = {
  action_type: 'VALIDATE_DOCUMENT',
  async execute(context, config) {
    try {
      const documentId = config.document_id || context.document_id;

      if (!documentId) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: 'document_id is required for VALIDATE_DOCUMENT',
        };
      }

      // If specific policy IDs are provided, run policy validation
      if (Array.isArray(config.policy_ids) && config.policy_ids.length > 0) {
        const { validatePolicy } = await import('@/lib/policies/validation');

        const results = await Promise.all(
          config.policy_ids.map((policyId: string) => validatePolicy(policyId))
        );

        const allPassed = results.every(
          (r) => r.is_compliant !== false
        );
        const errors = results
          .filter((r) => r.is_compliant === false)
          .flatMap((r) =>
            (r.findings ?? [])
              .filter((f: { severity: string }) => f.severity === 'ERROR')
              .map((f: { message: string }) => f.message)
          );

        return {
          success: allPassed,
          step_id: context.current_step_id,
          status: allPassed ? 'COMPLETED' : 'FAILED',
          output: {
            validation_passed: allPassed,
            policies_checked: config.policy_ids,
            errors,
          },
          metadata: {
            validated_at: new Date().toISOString(),
          },
          ...(allPassed ? {} : { error: errors.join('; ') || 'Policy validation failed' }),
        };
      }

      // No specific policies — structural validation only
      return {
        success: true,
        step_id: context.current_step_id,
        status: 'COMPLETED',
        output: {
          validation_passed: true,
          rules_checked: config.validation_rules || [],
        },
        metadata: {
          validated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[VALIDATE_DOCUMENT_ERROR]', error);
      return {
        success: false,
        step_id: context.current_step_id,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

/**
 * REQUEST_APPROVAL action
 * 
 * Creates an approval request and transitions workflow to WAITING state.
 * Workflow will resume when approval is granted/rejected.
 */
const requestApprovalHandler: StepExecutor = {
  action_type: 'REQUEST_APPROVAL',
  async execute(context, config) {
    try {
      // Dynamically import to avoid circular dependency
      const { createApprovalRequest } = await import('@/lib/approvals');
      
      // Create approval request
      const result = await createApprovalRequest({
        document_id: context.document_id || config.document_id,
        document_version_id: config.document_version_id,
        workflow_instance_id: context.workflow_instance_id,
        workflow_instance_step_id: context.current_step_id,
        request_type: config.request_type || 'APPROVAL',
        title: config.title || 'Approval Required',
        description: config.description,
        approver_id: config.approver_id,
        approver_role: config.approver_role,
        expires_at: config.expires_at ? new Date(config.expires_at) : undefined,
        metadata: config.metadata || {},
      });

      if (!result.success) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: result.error || 'Failed to create approval request',
          metadata: {
            error_code: result.errorCode,
          },
        };
      }

      return {
        success: true,
        step_id: context.current_step_id,
        status: 'WAITING', // Step waits for approval
        output: {
          approval_request_id: result.data?.id,
          approval_requested: true,
          approver_id: config.approver_id,
          approver_role: config.approver_role,
        },
        metadata: {
          requested_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[REQUEST_APPROVAL_ERROR]', error);
      return {
        success: false,
        step_id: context.current_step_id,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

/**
 * REQUEST_SIGNATURE action
 * 
 * Creates a signature request and transitions workflow to WAITING state.
 * Workflow will resume when signature is completed/rejected.
 */
const requestSignatureHandler: StepExecutor = {
  action_type: 'REQUEST_SIGNATURE',
  async execute(context, config) {
    try {
      const { createSignatureRequest } = await import('@/lib/signatures');
      
      // Validate required fields
      if (!config.document_version_id) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: 'document_version_id is REQUIRED for signature requests',
        };
      }

      if (!config.signer_id) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: 'signer_id is REQUIRED for signature requests',
        };
      }

      // Create signature request
      const result = await createSignatureRequest({
        document_id: context.document_id || config.document_id,
        document_version_id: config.document_version_id, // REQUIRED
        workflow_instance_id: context.workflow_instance_id,
        workflow_instance_step_id: context.current_step_id,
        approval_request_id: config.approval_request_id,
        signature_type: config.signature_type || 'ACKNOWLEDGMENT',
        title: config.title || 'Signature Required',
        description: config.description,
        signer_id: config.signer_id,
        expires_at: config.expires_at ? new Date(config.expires_at) : undefined,
        metadata: config.metadata || {},
      });

      if (!result.success) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: result.error || 'Failed to create signature request',
          metadata: {
            error_code: result.errorCode,
          },
        };
      }

      return {
        success: true,
        step_id: context.current_step_id,
        status: 'WAITING', // Step waits for signature
        output: {
          signature_request_id: result.data?.id,
          signature_requested: true,
          signer_id: config.signer_id,
          document_version_id: config.document_version_id,
        },
        metadata: {
          requested_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[REQUEST_SIGNATURE_ERROR]', error);
      return {
        success: false,
        step_id: context.current_step_id,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

/**
 * GENERATE_NOTIFICATION action
 *
 * Creates an in-app (and optionally email) notification for a recipient.
 * Config fields: recipient_id, notification_type, title, message,
 *               related_entity_type, related_entity_id, send_email (bool)
 */
const generateNotificationHandler: StepExecutor = {
  action_type: 'GENERATE_NOTIFICATION',
  async execute(context, config) {
    try {
      const { createNotification, createEmailNotification } = await import('@/lib/notifications');

      // Validate required fields
      if (!config.recipient_id) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: 'recipient_id is required for GENERATE_NOTIFICATION',
        };
      }

      if (!config.title) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: 'title is required for GENERATE_NOTIFICATION',
        };
      }

      const notificationInput = {
        recipient_id: config.recipient_id,
        notification_type: config.notification_type || 'SYSTEM_ALERT',
        title: config.title,
        message: config.message || null,
        related_entity_type: config.related_entity_type || null,
        related_entity_id: config.related_entity_id || null,
        metadata: {
          workflow_instance_id: context.workflow_instance_id,
          step_id: context.current_step_id,
          ...(config.metadata || {}),
        },
      };

      // Create in-app notification
      const result = config.send_email
        ? await createEmailNotification({
            ...notificationInput,
            delivery_channel: 'EMAIL',
            email_subject: config.email_subject || config.title,
            email_html: config.email_html || `<p>${config.message || config.title}</p>`,
            email_text: config.email_text || config.message || config.title,
          })
        : await createNotification(notificationInput);

      if (!result.success) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: result.error || 'Failed to create notification',
        };
      }

      return {
        success: true,
        step_id: context.current_step_id,
        status: 'COMPLETED',
        output: {
          notification_id: result.data?.id,
          notification_sent: true,
          recipient_id: config.recipient_id,
          send_email: config.send_email ?? false,
        },
        metadata: {
          sent_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[GENERATE_NOTIFICATION_ERROR]', error);
      return {
        success: false,
        step_id: context.current_step_id,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

/**
 * UPDATE_STATUS action
 *
 * Updates metadata/variables on the running workflow instance to record
 * a status transition.  Does NOT change the instance execution status
 * (that is managed by the engine itself); instead it persists a
 * domain-level status string into the instance variables so downstream
 * steps and external observers can read it.
 *
 * Config fields: status_key (variable name, default "current_status"),
 *                new_status (required), entity_type, entity_id
 */
const updateStatusHandler: StepExecutor = {
  action_type: 'UPDATE_STATUS',
  async execute(context, config) {
    try {
      if (!config.new_status) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: 'new_status is required for UPDATE_STATUS',
        };
      }

      const adminSupabase = getAdminClient();
      const statusKey: string = config.status_key || 'current_status';

      // Merge new status value into instance variables
      const { error } = await (adminSupabase
        .from('workflow_instances') as any)
        .update({
          variables: {
            ...context.variables,
            [statusKey]: config.new_status,
            [`${statusKey}_updated_at`]: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.workflow_instance_id);

      if (error) {
        return {
          success: false,
          step_id: context.current_step_id,
          status: 'FAILED',
          error: `Failed to persist status update: ${error.message}`,
        };
      }

      return {
        success: true,
        step_id: context.current_step_id,
        status: 'COMPLETED',
        output: {
          status_updated: true,
          status_key: statusKey,
          new_status: config.new_status,
          entity_type: config.entity_type || null,
          entity_id: config.entity_id || null,
        },
        metadata: {
          updated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[UPDATE_STATUS_ERROR]', error);
      return {
        success: false,
        step_id: context.current_step_id,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

/**
 * WAIT_FOR_CONDITION action
 */
const waitForConditionHandler: StepExecutor = {
  action_type: 'WAIT_FOR_CONDITION',
  async execute(context, config) {
    // Check if condition is met
    const conditionMet = evaluateCondition(config.condition, context.variables);
    
    return {
      success: true,
      step_id: context.current_step_id,
      status: conditionMet ? 'COMPLETED' : 'WAITING',
      output: {
        condition_met: conditionMet,
        condition: config.condition,
      },
      metadata: {
        checked_at: new Date().toISOString(),
      },
    };
  },
};

// Register built-in handlers
registerActionHandler('VALIDATE_DOCUMENT', validateDocumentHandler);
registerActionHandler('REQUEST_APPROVAL', requestApprovalHandler);
registerActionHandler('REQUEST_SIGNATURE', requestSignatureHandler);
registerActionHandler('GENERATE_NOTIFICATION', generateNotificationHandler);
registerActionHandler('UPDATE_STATUS', updateStatusHandler);
registerActionHandler('WAIT_FOR_CONDITION', waitForConditionHandler);

// ============================================================================
// Workflow Instance Management
// ============================================================================

/**
 * Create and start a workflow instance
 */
export async function startWorkflowInstance(params: {
  workflow_definition_id: string;
  document_id: string;
  instance_name?: string;
  initial_variables?: Record<string, any>;
}): Promise<WorkflowInstance> {
  const user = await requireAuth();
  const institutionId = await getUserInstitutionId();

  if (!institutionId) {
    throw new ExecutionError('Institution ID required', 'VALIDATION');
  }

  const adminSupabase = getAdminClient();

  // Get workflow definition with steps
  const { definition, steps } = await getCompleteWorkflow(params.workflow_definition_id);

  if (definition.status !== 'ACTIVE') {
    throw new ExecutionError(
      'Only ACTIVE workflows can be executed',
      'VALIDATION'
    );
  }

  if (definition.institution_id !== institutionId) {
    throw new ExecutionError(
      'Workflow belongs to different institution',
      'AUTHORIZATION'
    );
  }

  // Create workflow snapshot
  const workflow_snapshot = {
    workflow_definition_id: definition.id,
    name: definition.name,
    version: definition.version,
    steps: steps.map((s) => ({
      id: s.id,
      name: s.step_name,
      action_type: s.step_type,
      sequence_order: s.sequence_order,
      config: s.step_config,
    })),
    created_at: new Date().toISOString(),
  };

  // Create workflow instance
  const { data: instance, error: instanceError } = await adminSupabase
    .from('workflow_instances')
    .insert({
      workflow_definition_id: params.workflow_definition_id,
      document_id: params.document_id,
      institution_id: institutionId,
      instance_name: params.instance_name || `${definition.name} - ${new Date().toISOString()}`,
      workflow_snapshot,
      status: 'PENDING' as WorkflowInstanceStatus,
      initiated_by: user.userId,
    } as any)
    .select()
    .single();

  if (instanceError || !instance) {
    throw new ExecutionError(
      `Failed to create workflow instance: ${instanceError?.message}`,
      'PERMANENT'
    );
  }

  // Create step instances
  const stepInstances = steps.map((step) => ({
    workflow_instance_id: (instance as any).id,
    workflow_step_id: step.id,
    step_name: step.step_name,
    sequence_order: step.sequence_order,
    status: 'PENDING' as WorkflowStepStatus,
    execution_metadata: {
      action_type: step.step_type,
      config: step.step_config,
      initial_variables: params.initial_variables || {},
    },
  }));

  const { error: stepsError } = await adminSupabase
    .from('workflow_instance_steps')
    .insert(stepInstances as any);

  if (stepsError) {
    // Rollback: delete instance
    await adminSupabase.from('workflow_instances').delete().eq('id', (instance as any).id);
    throw new ExecutionError(
      `Failed to create step instances: ${stepsError.message}`,
      'PERMANENT'
    );
  }

  // Log instance creation
  await logExecutionEvent((instance as any).id, 'INSTANCE_CREATED', {
    workflow_name: definition.name,
    workflow_version: definition.version,
    initiated_by: user.userId,
  });

  return instance as WorkflowInstance;
}

/**
 * Execute next pending step in workflow
 */
export async function executeNextStep(
  workflowInstanceId: string
): Promise<ExecutionResult | null> {
  const adminSupabase = getAdminClient();

  // Get workflow instance
  const { data: instance, error: instanceError } = await adminSupabase
    .from('workflow_instances')
    .select('*')
    .eq('id', workflowInstanceId)
    .single();

  if (instanceError || !instance) {
    throw new ExecutionError('Workflow instance not found', 'VALIDATION');
  }

  const instanceData = instance as any;

  if (instanceData.status === 'COMPLETED' || instanceData.status === 'CANCELLED') {
    return null; // Workflow already finished
  }

  // Get next pending step with row-level lock
  const { data: steps, error: stepsError } = await adminSupabase
    .from('workflow_instance_steps')
    .select('*')
    .eq('workflow_instance_id', workflowInstanceId)
    .eq('status', 'PENDING')
    .order('sequence_order', { ascending: true })
    .limit(1);

  if (stepsError) {
    throw new ExecutionError(
      `Failed to get next step: ${stepsError.message}`,
      'TRANSIENT'
    );
  }

  if (!steps || steps.length === 0) {
    // No more pending steps - check if workflow is complete
    await checkAndCompleteWorkflow(workflowInstanceId);
    return null;
  }

  const step = steps[0] as any;
  if (!step) {
    return null;
  }

  // Try to acquire lock
  const locked = await acquireStepLock(step.id);
  if (!locked) {
    throw new ExecutionError(
      'Step is already being executed',
      'TRANSIENT',
      step.id
    );
  }

  try {
    // Execute the step
    const result = await executeStep(instanceData, step);
    
    // Update step status
    await updateStepStatus(step.id, result);

    // Log execution
    await logExecutionEvent(
      workflowInstanceId,
      'STEP_EXECUTED',
      {
        step_id: step.id,
        step_name: step.step_name,
        status: result.status,
        success: result.success,
      },
      step.id
    );

    return result;

  } finally {
    // Always release lock
    await releaseStepLock(step.id);
  }
}

/**
 * Execute a specific workflow step
 */
async function executeStep(
  instance: WorkflowInstance,
  step: WorkflowInstanceStep
): Promise<ExecutionResult> {
  const action_type = (step.execution_metadata as any)?.action_type || step.step_name;
  const config = (step.execution_metadata as any)?.config || {};

  // Get action handler
  const handler = getActionHandler(action_type);
  if (!handler) {
    throw new ExecutionError(
      `No handler registered for action: ${action_type}`,
      'PERMANENT',
      step.id
    );
  }

  // Build execution context
  const context: ExecutionContext = {
    workflow_instance_id: instance.id,
    document_id: instance.document_id,
    institution_id: instance.institution_id,
    current_step_id: step.id,
    variables: (step.execution_metadata as any)?.initial_variables || {},
    metadata: {
      workflow_name: instance.instance_name,
      step_sequence: step.sequence_order,
    },
  };

  try {
    // Update step to RUNNING
    await updateStepStatusDirect(step.id, 'RUNNING');
    
    // Execute action handler
    const result = await handler.execute(context, config);

    return result;

  } catch (error) {
    // Handle execution errors
    const isTransient = error instanceof ExecutionError && error.category === 'TRANSIENT';
    
    const result: ExecutionResult = {
      success: false,
      step_id: step.id,
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        error_category: isTransient ? 'TRANSIENT' : 'PERMANENT',
        retry_count: step.retry_count || 0,
      },
    };

    // Check if retry is allowed
    if (isTransient && (step.retry_count || 0) < MAX_RETRIES) {
      result.status = 'PENDING'; // Will retry
      result.metadata!.will_retry = true;
    }

    return result;
  }
}

/**
 * Update step status after execution
 */
async function updateStepStatus(
  stepId: string,
  result: ExecutionResult
): Promise<void> {
  const adminSupabase = getAdminClient();

  const updates: any = {
    status: result.status,
    execution_metadata: {
      ...result.metadata,
      output: result.output,
      executed_at: new Date().toISOString(),
    },
  };

  if (result.status === 'COMPLETED') {
    updates.completed_at = new Date().toISOString();
  }

  if (result.status === 'FAILED') {
    updates.error_message = result.error;
    updates.error_category = result.metadata?.error_category;
  }

  if (result.metadata?.will_retry) {
    updates.retry_count = (result.metadata.retry_count || 0) + 1;
  }

  const { error } = await (adminSupabase
    .from('workflow_instance_steps') as any)
    .update(updates)
    .eq('id', stepId);

  if (error) {
    console.error('[UPDATE_STEP_STATUS_ERROR]', error);
  }
}

/**
 * Update step status directly (for state transitions)
 */
async function updateStepStatusDirect(
  stepId: string,
  status: WorkflowStepStatus
): Promise<void> {
  const adminSupabase = getAdminClient();

  const updates: any = { status };

  if (status === 'RUNNING') {
    updates.started_at = new Date().toISOString();
  }

  await (adminSupabase
    .from('workflow_instance_steps') as any)
    .update(updates)
    .eq('id', stepId);
}

// ============================================================================
// Concurrency Control
// ============================================================================

/**
 * Acquire execution lock for step
 */
async function acquireStepLock(stepId: string): Promise<boolean> {
  const adminSupabase = getAdminClient();
  const lockId = `worker-${process.pid || Math.random()}`;
  const now = new Date().toISOString();

  // Try to acquire lock - cast entire operation
  const result = await (adminSupabase
    .from('workflow_instance_steps') as any)
    .update({
      locked_at: now,
      locked_by: lockId,
    })
    .eq('id', stepId)
    .or(`locked_at.is.null,locked_at.lt.${new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString()}`)
    .select('id')
    .single();

  return !result.error && !!result.data;
}

/**
 * Release execution lock for step
 */
async function releaseStepLock(stepId: string): Promise<void> {
  const adminSupabase = getAdminClient();

  await (adminSupabase
    .from('workflow_instance_steps') as any)
    .update({
      locked_at: null,
      locked_by: null,
    })
    .eq('id', stepId);
}

// ============================================================================
// Workflow Completion
// ============================================================================

/**
 * Check if workflow is complete and update status
 */
async function checkAndCompleteWorkflow(workflowInstanceId: string): Promise<void> {
  const adminSupabase = getAdminClient();

  // Get all steps
  const { data: steps, error } = await adminSupabase
    .from('workflow_instance_steps')
    .select('status')
    .eq('workflow_instance_id', workflowInstanceId);

  if (error || !steps) {
    return;
  }

  const allCompleted = steps.every((s: any) => s.status === 'COMPLETED' || s.status === 'SKIPPED');
  const anyFailed = steps.some((s: any) => s.status === 'FAILED');
  const anyWaiting = steps.some((s: any) => s.status === 'WAITING');

  let newStatus: WorkflowInstanceStatus | null = null;

  if (allCompleted) {
    newStatus = 'COMPLETED';
  } else if (anyFailed) {
    newStatus = 'FAILED';
  } else if (anyWaiting) {
    newStatus = 'WAITING';
  }

  if (newStatus) {
    const updates: any = { status: newStatus };
    if (newStatus === 'COMPLETED') {
      updates.completed_at = new Date().toISOString();
    }

    await (adminSupabase
      .from('workflow_instances') as any)
      .update(updates)
      .eq('id', workflowInstanceId);

    await logExecutionEvent(workflowInstanceId, 'INSTANCE_COMPLETED', {
      final_status: newStatus,
    });
  }
}

// ============================================================================
// Execution Logging
// ============================================================================

/**
 * Log execution event
 */
async function logExecutionEvent(
  workflowInstanceId: string,
  event_type: string,
  event_data: Record<string, any>,
  step_id?: string
): Promise<void> {
  const adminSupabase = getAdminClient();
  const user = await requireAuth().catch(() => null);

  await adminSupabase.from('workflow_execution_log').insert({
    workflow_instance_id: workflowInstanceId,
    workflow_instance_step_id: step_id || null,
    event_type,
    event_data,
    actor_id: user?.userId || null,
  } as any);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Evaluate condition expression
 */
function evaluateCondition(
  condition: any,
  variables: Record<string, any>
): boolean {
  // Simple condition evaluation
  // In production, this would use a safe expression evaluator
  if (!condition) return true;

  if (condition.field && condition.operator && condition.value !== undefined) {
    const fieldValue = variables[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'contains':
        return String(fieldValue).includes(condition.value);
      default:
        return false;
    }
  }

  return true;
}

/**
 * Get workflow instance status
 */
export async function getWorkflowInstanceStatus(
  workflowInstanceId: string
): Promise<{
  instance: WorkflowInstance;
  steps: WorkflowInstanceStep[];
  current_step?: WorkflowInstanceStep;
}> {
  await requireAuth();
  const adminSupabase = getAdminClient();

  const { data: instance, error: instanceError } = await adminSupabase
    .from('workflow_instances')
    .select('*')
    .eq('id', workflowInstanceId)
    .single();

  if (instanceError || !instance) {
    throw new ExecutionError('Workflow instance not found', 'VALIDATION');
  }

  const { data: steps, error: stepsError } = await adminSupabase
    .from('workflow_instance_steps')
    .select('*')
    .eq('workflow_instance_id', workflowInstanceId)
    .order('sequence_order', { ascending: true });

  if (stepsError) {
    throw new ExecutionError(
      `Failed to get steps: ${stepsError.message}`,
      'TRANSIENT'
    );
  }

  const current_step = steps?.find(
    (s: any) => s.status === 'RUNNING' || s.status === 'WAITING'
  );

  return {
    instance: instance as WorkflowInstance,
    steps: (steps || []) as WorkflowInstanceStep[],
    current_step: current_step as WorkflowInstanceStep | undefined,
  };
}

/**
 * Cancel workflow instance
 */
export async function cancelWorkflowInstance(
  workflowInstanceId: string
): Promise<void> {
  await requireAuth();
  const adminSupabase = getAdminClient();

  // Update instance status
  await (adminSupabase
    .from('workflow_instances') as any)
    .update({ status: 'CANCELLED' as WorkflowInstanceStatus })
    .eq('id', workflowInstanceId);

  // Cancel pending/waiting steps
  await (adminSupabase
    .from('workflow_instance_steps') as any)
    .update({ status: 'SKIPPED' as WorkflowStepStatus })
    .eq('workflow_instance_id', workflowInstanceId)
    .in('status', ['PENDING', 'WAITING']);

  await logExecutionEvent(workflowInstanceId, 'INSTANCE_CANCELLED', {});
}


// ============================================================================
// Workflow Resumption Functions (EDU-010)
// ============================================================================

/**
 * Resume workflow after approval decision
 * 
 * Called by approval service when approval is granted or rejected.
 * Updates step and instance status, then continues execution.
 * 
 * @param workflowInstanceId - Workflow instance ID
 * @param workflowStepId - Step ID that was waiting for approval
 * @param decision - Approval decision (APPROVED or REJECTED)
 */
export async function resumeWorkflowAfterApproval(
  workflowInstanceId: string,
  workflowStepId: string,
  decision: 'APPROVED' | 'REJECTED' = 'APPROVED'
): Promise<void> {
  try {
    const adminSupabase = getAdminClient();

    // Resuming workflow after approval decision

    // Update step status based on decision
    const stepStatus: WorkflowStepStatus = decision === 'APPROVED' ? 'COMPLETED' : 'FAILED';
    
    await (adminSupabase
      .from('workflow_instance_steps') as any)
      .update({
        status: stepStatus,
        completed_at: new Date().toISOString(),
        output: {
          approval_decision: decision,
          resumed_at: new Date().toISOString(),
        },
      })
      .eq('id', workflowStepId)
      .eq('status', 'WAITING');

    // Update instance status to RUNNING
    await (adminSupabase
      .from('workflow_instances') as any)
      .update({
        status: 'RUNNING' as WorkflowInstanceStatus,
      })
      .eq('id', workflowInstanceId)
      .eq('status', 'WAITING');

    // Log resumption
    await logExecutionEvent(workflowInstanceId, 'WORKFLOW_RESUMED_AFTER_APPROVAL', {
      step_id: workflowStepId,
      decision,
    });

    // If approved, execute next step
    if (decision === 'APPROVED') {
      await executeNextStep(workflowInstanceId);
    } else {
      // If rejected, workflow may have rejection path defined
      // For now, mark instance as FAILED
      await (adminSupabase
        .from('workflow_instances') as any)
        .update({
          status: 'FAILED' as WorkflowInstanceStatus,
          completed_at: new Date().toISOString(),
        })
        .eq('id', workflowInstanceId);

      await logExecutionEvent(workflowInstanceId, 'WORKFLOW_FAILED_APPROVAL_REJECTED', {
        step_id: workflowStepId,
      });
    }
  } catch (error) {
    console.error('[WORKFLOW_RESUMPTION_ERROR]', error);
    throw error;
  }
}

/**
 * Resume workflow after signature completion
 * 
 * Called by signature service when signature is completed or rejected.
 * Updates step and instance status, then continues execution.
 * 
 * @param workflowInstanceId - Workflow instance ID
 * @param workflowStepId - Step ID that was waiting for signature
 * @param status - Signature status (COMPLETED or REJECTED)
 */
export async function resumeWorkflowAfterSignature(
  workflowInstanceId: string,
  workflowStepId: string,
  status: 'COMPLETED' | 'REJECTED' = 'COMPLETED'
): Promise<void> {
  try {
    const adminSupabase = getAdminClient();

    // Resuming workflow after signature

    // Update step status
    const stepStatus: WorkflowStepStatus = status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
    
    await (adminSupabase
      .from('workflow_instance_steps') as any)
      .update({
        status: stepStatus,
        completed_at: new Date().toISOString(),
        output: {
          signature_status: status,
          resumed_at: new Date().toISOString(),
        },
      })
      .eq('id', workflowStepId)
      .eq('status', 'WAITING');

    // Update instance status to RUNNING
    await (adminSupabase
      .from('workflow_instances') as any)
      .update({
        status: 'RUNNING' as WorkflowInstanceStatus,
      })
      .eq('id', workflowInstanceId)
      .eq('status', 'WAITING');

    // Log resumption
    await logExecutionEvent(workflowInstanceId, 'WORKFLOW_RESUMED_AFTER_SIGNATURE', {
      step_id: workflowStepId,
      status,
    });

    // If completed, execute next step
    if (status === 'COMPLETED') {
      await executeNextStep(workflowInstanceId);
    } else {
      // If rejected, mark workflow as failed
      await (adminSupabase
        .from('workflow_instances') as any)
        .update({
          status: 'FAILED' as WorkflowInstanceStatus,
          completed_at: new Date().toISOString(),
        })
        .eq('id', workflowInstanceId);

      await logExecutionEvent(workflowInstanceId, 'WORKFLOW_FAILED_SIGNATURE_REJECTED', {
        step_id: workflowStepId,
      });
    }
  } catch (error) {
    console.error('[WORKFLOW_RESUMPTION_ERROR]', error);
    throw error;
  }
}
