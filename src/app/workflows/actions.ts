/**
 * Workflow Server Actions
 * 
 * Server-side actions for workflow operations.
 * All actions enforce authentication and authorization.
 * 
 * Note: Using 'any' types where necessary for Supabase client type compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

'use server';

import { revalidatePath } from 'next/cache';
import {
  generateWorkflow,
  validateWorkflow,
  createWorkflowDefinition,
  updateWorkflowStatus,
  markWorkflowReviewed,
  startWorkflowInstance,
  executeNextStep,
  getWorkflowInstanceStatus,
  cancelWorkflowInstance,
  listWorkflowDefinitions,
  getCompleteWorkflow,
  getRecommendedProvider,
  type WorkflowGenerationInput,
  type CreateWorkflowRequest,
  type ValidateWorkflowOptions,
  type WorkflowDSL,
} from '@/lib/workflows';
import { requireAuth, getUserInstitutionId } from '@/lib/auth';

// ============================================================================
// Response Types
// ============================================================================

type ActionResponse<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// Generation Actions
// ============================================================================

/**
 * Generate workflow from business intent
 */
export async function generateWorkflowAction(input: {
  business_intent: string;
  workflow_type?: string;
  document_ids?: string[];
  policy_ids?: string[];
}): Promise<ActionResponse<{
  generation_id: string;
  workflow: WorkflowDSL;
  confidence_score: number;
  validation_result: any;
}>> {
  try {
    await requireAuth();

    const provider = getRecommendedProvider();
    
    // In production, would fetch documents and policies
    // For now, pass minimal input
    const generationInput: WorkflowGenerationInput = {
      business_intent: input.business_intent,
      workflow_type: input.workflow_type,
      context_documents: [],
      policies: [],
    };

    const result = await generateWorkflow(generationInput, { provider });

    // Validate generated workflow
    const validation = await validateWorkflow(result.workflow, {
      validate_schema: true,
      validate_graph: true,
    });

    return {
      success: true,
      data: {
        generation_id: result.generation_id,
        workflow: result.workflow,
        confidence_score: result.confidence_score,
        validation_result: validation,
      },
    };
  } catch (error) {
    console.error('[GENERATE_WORKFLOW_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate workflow',
    };
  }
}

/**
 * Validate workflow
 */
export async function validateWorkflowAction(
  workflow: WorkflowDSL,
  options?: ValidateWorkflowOptions
): Promise<ActionResponse> {
  try {
    await requireAuth();

    const result = await validateWorkflow(workflow, options);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[VALIDATE_WORKFLOW_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate workflow',
    };
  }
}

// ============================================================================
// Definition Actions
// ============================================================================

/**
 * Create workflow definition from AI-generated workflow
 */
export async function createWorkflowFromGenerationAction(
  generationId: string,
  workflowName?: string
): Promise<ActionResponse<{ workflow_id: string }>> {
  try {
    await requireAuth();
    const institutionId = await getUserInstitutionId();

    if (!institutionId) {
      return { success: false, error: 'Institution ID required' };
    }

    // Get generation record
    const { getGenerationRecord } = await import('@/lib/workflows');
    const generation = await getGenerationRecord(generationId);

    if (!generation) {
      return { success: false, error: 'Generation record not found' };
    }

    const workflow = generation.generated_workflow as WorkflowDSL;

    // Create workflow definition
    const input: CreateWorkflowRequest = {
      name: workflowName || workflow.name,
      description: workflow.description,
      workflow_type: workflow.workflow_type,
      is_ai_generated: true,
      generation_source: 'AI_GENERATED',
      trigger_config: workflow.trigger?.config || {},
      steps: workflow.steps.map((step) => ({
        step_name: step.name,
        step_type: step.action_type,
        sequence_order: step.sequence_order,
        is_mandatory: step.is_mandatory,
        timeout_hours: step.timeout_hours ?? undefined,
        step_config: step.config,
        condition_expression: step.conditions?.[0] ?? undefined,
        execution_mode: step.execution_mode,
      })),
    };

    const definition = await createWorkflowDefinition(input);

    revalidatePath('/workflows');

    return {
      success: true,
      data: { workflow_id: definition.id },
    };
  } catch (error) {
    console.error('[CREATE_WORKFLOW_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflow',
    };
  }
}

/**
 * List workflows
 */
export async function listWorkflowsAction(filters?: {
  status?: string;
  workflow_type?: string;
  is_ai_generated?: boolean;
}): Promise<ActionResponse> {
  try {
    await requireAuth();

    const result = await listWorkflowDefinitions(filters as any);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[LIST_WORKFLOWS_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list workflows',
    };
  }
}

/**
 * Get workflow details
 */
export async function getWorkflowDetailsAction(
  workflowId: string
): Promise<ActionResponse> {
  try {
    await requireAuth();

    const result = await getCompleteWorkflow(workflowId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[GET_WORKFLOW_DETAILS_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflow details',
    };
  }
}

/**
 * Update workflow status
 */
export async function updateWorkflowStatusAction(
  workflowId: string,
  newStatus: 'VALIDATING' | 'READY' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
): Promise<ActionResponse> {
  try {
    await requireAuth();

    await updateWorkflowStatus(workflowId, newStatus);

    revalidatePath('/workflows');
    revalidatePath(`/workflows/${workflowId}`);

    return {
      success: true,
      data: { status: newStatus },
    };
  } catch (error) {
    console.error('[UPDATE_WORKFLOW_STATUS_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update workflow status',
    };
  }
}

/**
 * Mark workflow as reviewed
 */
export async function markWorkflowReviewedAction(
  workflowId: string,
  reviewNotes?: string
): Promise<ActionResponse> {
  try {
    await requireAuth();

    await markWorkflowReviewed(workflowId, reviewNotes);

    revalidatePath('/workflows');
    revalidatePath(`/workflows/${workflowId}`);

    return {
      success: true,
      data: { reviewed: true },
    };
  } catch (error) {
    console.error('[MARK_WORKFLOW_REVIEWED_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark workflow as reviewed',
    };
  }
}

// ============================================================================
// Execution Actions
// ============================================================================

/**
 * Start workflow instance
 */
export async function startWorkflowAction(params: {
  workflow_definition_id: string;
  document_id: string;
  instance_name?: string;
}): Promise<ActionResponse<{ instance_id: string }>> {
  try {
    await requireAuth();

    const instance = await startWorkflowInstance(params);

    // Execute first step
    await executeNextStep(instance.id);

    revalidatePath('/workflows/instances');

    return {
      success: true,
      data: { instance_id: instance.id },
    };
  } catch (error) {
    console.error('[START_WORKFLOW_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start workflow',
    };
  }
}

/**
 * Execute next step in workflow
 */
export async function executeWorkflowStepAction(
  workflowInstanceId: string
): Promise<ActionResponse> {
  try {
    await requireAuth();

    const result = await executeNextStep(workflowInstanceId);

    revalidatePath(`/workflows/instances/${workflowInstanceId}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[EXECUTE_WORKFLOW_STEP_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute workflow step',
    };
  }
}

/**
 * Get workflow instance status
 */
export async function getWorkflowInstanceStatusAction(
  workflowInstanceId: string
): Promise<ActionResponse> {
  try {
    await requireAuth();

    const result = await getWorkflowInstanceStatus(workflowInstanceId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[GET_WORKFLOW_INSTANCE_STATUS_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflow status',
    };
  }
}

/**
 * Cancel workflow instance
 */
export async function cancelWorkflowAction(
  workflowInstanceId: string
): Promise<ActionResponse> {
  try {
    await requireAuth();

    await cancelWorkflowInstance(workflowInstanceId);

    revalidatePath(`/workflows/instances/${workflowInstanceId}`);

    return {
      success: true,
      data: { cancelled: true },
    };
  } catch (error) {
    console.error('[CANCEL_WORKFLOW_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel workflow',
    };
  }
}
