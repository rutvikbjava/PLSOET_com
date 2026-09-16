/**
 * Workflow Definition Service
 * 
 * Handles workflow definition CRUD operations, versioning, and lifecycle management.
 * 
 * Security:
 * - All operations require authentication
 * - Institution isolation enforced via RLS
 * - Authorization checks for privileged operations
 * 
 * Versioning:
 * - Each version is a separate row with incremented version number
 * - Active version has status='ACTIVE'
 * - Historical versions have status='ARCHIVED'
 * - Workflow instances reference exact workflow_definition_id
 * 
 * Note: Using 'any' types where necessary for Supabase client type compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAuth, getUserInstitutionId } from '@/lib/auth';
import { hasAnyRole } from './utils';

// ============================================================================
// Types
// ============================================================================

export type WorkflowStatus = 
  | 'DRAFT' 
  | 'VALIDATING' 
  | 'READY' 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'ARCHIVED';

export type WorkflowGenerationSource = 
  | 'HUMAN_CREATED' 
  | 'AI_GENERATED' 
  | 'AI_GENERATED_REVIEWED';

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
  execution_mode: 'SYNCHRONOUS' | 'ASYNCHRONOUS' | 'DEFERRED';
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepTransition {
  id: string;
  workflow_definition_id: string;
  from_step_id: string;
  to_step_id: string | null;
  transition_type: 'SEQUENTIAL' | 'CONDITIONAL' | 'PARALLEL_SPLIT' | 'PARALLEL_JOIN';
  condition_expression: Record<string, any> | null;
  priority: number;
  transition_label: string | null;
  created_at: string;
}

export interface CreateWorkflowDefinitionInput {
  name: string;
  description?: string;
  workflow_type: string;
  is_ai_generated?: boolean;
  generation_source?: WorkflowGenerationSource;
  trigger_config?: Record<string, any>;
  steps: CreateWorkflowStepInput[];
  transitions?: CreateWorkflowTransitionInput[];
}

export interface CreateWorkflowStepInput {
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
  execution_mode?: 'SYNCHRONOUS' | 'ASYNCHRONOUS' | 'DEFERRED';
}

export interface CreateWorkflowTransitionInput {
  from_step_id: string;
  to_step_id?: string;
  transition_type?: 'SEQUENTIAL' | 'CONDITIONAL' | 'PARALLEL_SPLIT' | 'PARALLEL_JOIN';
  condition_expression?: Record<string, any>;
  priority?: number;
  transition_label?: string;
}

export interface UpdateWorkflowDefinitionInput {
  name?: string;
  description?: string;
  workflow_type?: string;
  trigger_config?: Record<string, any>;
  review_notes?: string;
}

// ============================================================================
// Errors
// ============================================================================

export class WorkflowDefinitionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WorkflowDefinitionError';
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get workflow definition by ID
 */
export async function getWorkflowDefinition(
  workflowId: string
): Promise<WorkflowDefinition | null> {
  await requireAuth();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new WorkflowDefinitionError(`Failed to get workflow: ${error.message}`);
  }

  return data as WorkflowDefinition;
}

/**
 * Get all versions of a workflow by name
 */
export async function getWorkflowVersions(
  workflowName: string,
  institutionId?: string
): Promise<WorkflowDefinition[]> {
  await requireAuth();
  const supabase = createClient();
  const instId = institutionId || await getUserInstitutionId();

  if (!instId) {
    throw new WorkflowDefinitionError('Institution ID required');
  }

  const { data, error } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('name', workflowName)
    .eq('institution_id', instId)
    .order('version', { ascending: false });

  if (error) {
    throw new WorkflowDefinitionError(`Failed to get workflow versions: ${error.message}`);
  }

  return data as WorkflowDefinition[];
}

/**
 * Get active version of a workflow
 */
export async function getActiveWorkflowVersion(
  workflowName: string,
  institutionId?: string
): Promise<WorkflowDefinition | null> {
  await requireAuth();
  const supabase = createClient();
  const instId = institutionId || await getUserInstitutionId();

  if (!instId) {
    throw new WorkflowDefinitionError('Institution ID required');
  }

  const { data, error } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('name', workflowName)
    .eq('institution_id', instId)
    .eq('status', 'ACTIVE')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new WorkflowDefinitionError(`Failed to get active workflow: ${error.message}`);
  }

  return data as WorkflowDefinition;
}

/**
 * List workflow definitions for institution
 */
export async function listWorkflowDefinitions(filters?: {
  status?: WorkflowStatus;
  workflow_type?: string;
  is_ai_generated?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ workflows: WorkflowDefinition[]; total: number }> {
  await requireAuth();
  const supabase = createClient();
  const institutionId = await getUserInstitutionId();

  if (!institutionId) {
    throw new WorkflowDefinitionError('Institution ID required');
  }

  let query = supabase
    .from('workflow_definitions')
    .select('*', { count: 'exact' })
    .eq('institution_id', institutionId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.workflow_type) {
    query = query.eq('workflow_type', filters.workflow_type);
  }

  if (filters?.is_ai_generated !== undefined) {
    query = query.eq('is_ai_generated', filters.is_ai_generated);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new WorkflowDefinitionError(`Failed to list workflows: ${error.message}`);
  }

  return {
    workflows: data as WorkflowDefinition[],
    total: count || 0,
  };
}

/**
 * Get workflow steps for a definition
 */
export async function getWorkflowSteps(
  workflowDefinitionId: string
): Promise<WorkflowStep[]> {
  await requireAuth();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_steps')
    .select('*')
    .eq('workflow_definition_id', workflowDefinitionId)
    .order('sequence_order', { ascending: true });

  if (error) {
    throw new WorkflowDefinitionError(`Failed to get workflow steps: ${error.message}`);
  }

  return data as WorkflowStep[];
}

/**
 * Get workflow transitions for a definition
 */
export async function getWorkflowTransitions(
  workflowDefinitionId: string
): Promise<WorkflowStepTransition[]> {
  await requireAuth();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_step_transitions')
    .select('*')
    .eq('workflow_definition_id', workflowDefinitionId)
    .order('priority', { ascending: true });

  if (error) {
    throw new WorkflowDefinitionError(`Failed to get workflow transitions: ${error.message}`);
  }

  return data as WorkflowStepTransition[];
}

/**
 * Get complete workflow with steps and transitions
 */
export async function getCompleteWorkflow(workflowDefinitionId: string): Promise<{
  definition: WorkflowDefinition;
  steps: WorkflowStep[];
  transitions: WorkflowStepTransition[];
}> {
  const definition = await getWorkflowDefinition(workflowDefinitionId);
  
  if (!definition) {
    throw new WorkflowDefinitionError('Workflow not found', 'NOT_FOUND');
  }

  const [steps, transitions] = await Promise.all([
    getWorkflowSteps(workflowDefinitionId),
    getWorkflowTransitions(workflowDefinitionId),
  ]);

  return { definition, steps, transitions };
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Create a new workflow definition (version 1)
 */
export async function createWorkflowDefinition(
  input: CreateWorkflowDefinitionInput
): Promise<WorkflowDefinition> {
  const user = await requireAuth();
  const institutionId = await getUserInstitutionId();

  if (!institutionId) {
    throw new WorkflowDefinitionError('Institution ID required');
  }

  // Check authorization
  const canCreate = await hasAnyRole(['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN', 'DEPARTMENT_HEAD']);
  if (!canCreate) {
    throw new WorkflowDefinitionError('Unauthorized to create workflows', 'UNAUTHORIZED');
  }

  // Validate inputs
  if (!input.name?.trim()) {
    throw new WorkflowDefinitionError('Workflow name is required');
  }

  if (!input.workflow_type?.trim()) {
    throw new WorkflowDefinitionError('Workflow type is required');
  }

  if (!input.steps || input.steps.length === 0) {
    throw new WorkflowDefinitionError('At least one step is required');
  }

  // Use admin client for transactional creation
  const adminSupabase = getAdminClient();

  try {
    // Check if workflow with this name already exists
    const { data: existing } = await adminSupabase
      .from('workflow_definitions')
      .select('id')
      .eq('name', input.name)
      .eq('institution_id', institutionId)
      .single();

    if (existing) {
      throw new WorkflowDefinitionError('Workflow with this name already exists', 'DUPLICATE');
    }

    // Create workflow definition
    const { data: workflow, error: workflowError } = await adminSupabase
      .from('workflow_definitions')
      .insert({
        institution_id: institutionId,
        name: input.name,
        description: input.description || null,
        workflow_type: input.workflow_type,
        version: 1,
        status: 'DRAFT' as WorkflowStatus,
        is_ai_generated: input.is_ai_generated || false,
        generation_source: input.generation_source || 'HUMAN_CREATED',
        trigger_config: input.trigger_config || {},
        created_by: user.userId,
      } as any)
      .select()
      .single();

    if (workflowError || !workflow) {
      throw new WorkflowDefinitionError(`Failed to create workflow: ${workflowError?.message}`);
    }

    // Create workflow steps
    const stepsToInsert = input.steps.map((step) => ({
      workflow_definition_id: (workflow as any).id,
      step_name: step.step_name,
      step_type: step.step_type,
      sequence_order: step.sequence_order,
      action_type_id: step.action_type_id || null,
      approver_role: step.approver_role || null,
      approver_user_id: step.approver_user_id || null,
      department_id: step.department_id || null,
      is_mandatory: step.is_mandatory !== undefined ? step.is_mandatory : true,
      timeout_hours: step.timeout_hours || null,
      step_config: step.step_config || {},
      condition_expression: step.condition_expression || null,
      execution_mode: step.execution_mode || 'SYNCHRONOUS',
    }));

    const { data: steps, error: stepsError } = await adminSupabase
      .from('workflow_steps')
      .insert(stepsToInsert as any)
      .select();

    if (stepsError) {
      // Rollback: delete workflow
      await adminSupabase.from('workflow_definitions').delete().eq('id', (workflow as any).id);
      throw new WorkflowDefinitionError(`Failed to create workflow steps: ${stepsError.message}`);
    }

    // Create transitions if provided
    if (input.transitions && input.transitions.length > 0) {
      // Map step names to IDs
      const stepMap = new Map(
        input.steps.map((step, idx) => [step.step_name, (steps as any)[idx].id])
      );

      const transitionsToInsert = input.transitions
        .map((transition) => ({
          workflow_definition_id: (workflow as any).id,
          from_step_id: stepMap.get(transition.from_step_id) || transition.from_step_id,
          to_step_id: transition.to_step_id 
            ? (stepMap.get(transition.to_step_id) || transition.to_step_id)
            : null,
          transition_type: transition.transition_type || 'SEQUENTIAL',
          condition_expression: transition.condition_expression || null,
          priority: transition.priority || 0,
          transition_label: transition.transition_label || null,
        }))
        .filter((t) => t.from_step_id); // Only include valid transitions

      if (transitionsToInsert.length > 0) {
        const { error: transitionsError } = await adminSupabase
          .from('workflow_step_transitions')
          .insert(transitionsToInsert as any);

        if (transitionsError) {
          console.error('[WORKFLOW_TRANSITIONS_ERROR]', transitionsError);
          // Non-fatal: continue without transitions
        }
      }
    }

    return workflow as WorkflowDefinition;

  } catch (error) {
    if (error instanceof WorkflowDefinitionError) {
      throw error;
    }
    throw new WorkflowDefinitionError(
      `Failed to create workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a new version of an existing workflow
 */
export async function createWorkflowVersion(
  workflowName: string,
  input: CreateWorkflowDefinitionInput
): Promise<WorkflowDefinition> {
  const user = await requireAuth();
  const institutionId = await getUserInstitutionId();

  if (!institutionId) {
    throw new WorkflowDefinitionError('Institution ID required');
  }

  // Check authorization
  const canCreate = await hasAnyRole(['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN', 'DEPARTMENT_HEAD']);
  if (!canCreate) {
    throw new WorkflowDefinitionError('Unauthorized to create workflow versions', 'UNAUTHORIZED');
  }

  const adminSupabase = getAdminClient();

  try {
    // Get existing versions
    const { data: versions, error: versionsError } = await adminSupabase
      .from('workflow_definitions')
      .select('version')
      .eq('name', workflowName)
      .eq('institution_id', institutionId)
      .order('version', { ascending: false })
      .limit(1);

    if (versionsError) {
      throw new WorkflowDefinitionError(`Failed to get versions: ${versionsError.message}`);
    }

    if (!versions || versions.length === 0) {
      throw new WorkflowDefinitionError('Workflow not found', 'NOT_FOUND');
    }

    const nextVersion = (versions[0] as any).version + 1;

    // Create new version with same structure as createWorkflowDefinition
    const { data: workflow, error: workflowError } = await adminSupabase
      .from('workflow_definitions')
      .insert({
        institution_id: institutionId,
        name: workflowName,
        description: input.description || null,
        workflow_type: input.workflow_type,
        version: nextVersion,
        status: 'DRAFT' as WorkflowStatus,
        is_ai_generated: input.is_ai_generated || false,
        generation_source: input.generation_source || 'HUMAN_CREATED',
        trigger_config: input.trigger_config || {},
        created_by: user.userId,
      } as any)
      .select()
      .single();

    if (workflowError || !workflow) {
      throw new WorkflowDefinitionError(`Failed to create version: ${workflowError?.message}`);
    }

    // Create steps and transitions (same as createWorkflowDefinition)
    const stepsToInsert = input.steps.map((step) => ({
      workflow_definition_id: (workflow as any).id,
      step_name: step.step_name,
      step_type: step.step_type,
      sequence_order: step.sequence_order,
      action_type_id: step.action_type_id || null,
      approver_role: step.approver_role || null,
      approver_user_id: step.approver_user_id || null,
      department_id: step.department_id || null,
      is_mandatory: step.is_mandatory !== undefined ? step.is_mandatory : true,
      timeout_hours: step.timeout_hours || null,
      step_config: step.step_config || {},
      condition_expression: step.condition_expression || null,
      execution_mode: step.execution_mode || 'SYNCHRONOUS',
    }));

    const { error: stepsError } = await adminSupabase
      .from('workflow_steps')
      .insert(stepsToInsert as any);

    if (stepsError) {
      await adminSupabase.from('workflow_definitions').delete().eq('id', (workflow as any).id);
      throw new WorkflowDefinitionError(`Failed to create steps: ${stepsError.message}`);
    }

    return workflow as WorkflowDefinition;

  } catch (error) {
    if (error instanceof WorkflowDefinitionError) {
      throw error;
    }
    throw new WorkflowDefinitionError(
      `Failed to create version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update workflow definition metadata
 * Note: Steps and transitions cannot be modified once created (create new version instead)
 */
export async function updateWorkflowDefinition(
  workflowId: string,
  input: UpdateWorkflowDefinitionInput
): Promise<WorkflowDefinition> {
  await requireAuth();
  const workflow = await getWorkflowDefinition(workflowId);

  if (!workflow) {
    throw new WorkflowDefinitionError('Workflow not found', 'NOT_FOUND');
  }

  // Check authorization
  const canUpdate = await hasAnyRole(['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN', 'DEPARTMENT_HEAD']);
  if (!canUpdate) {
    throw new WorkflowDefinitionError('Unauthorized to update workflow', 'UNAUTHORIZED');
  }

  // Only DRAFT workflows can be updated
  if (workflow.status !== 'DRAFT') {
    throw new WorkflowDefinitionError('Only DRAFT workflows can be updated', 'INVALID_STATE');
  }

  const adminSupabase = getAdminClient();

  const updates: Partial<WorkflowDefinition> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.workflow_type !== undefined) updates.workflow_type = input.workflow_type;
  if (input.trigger_config !== undefined) updates.trigger_config = input.trigger_config;
  if (input.review_notes !== undefined) updates.review_notes = input.review_notes;

  const { data, error } = await (adminSupabase
    .from('workflow_definitions') as any)
    .update(updates)
    .eq('id', workflowId)
    .select()
    .single();

  if (error) {
    throw new WorkflowDefinitionError(`Failed to update workflow: ${error.message}`);
  }

  return data as WorkflowDefinition;
}

/**
 * Update workflow status (lifecycle transitions)
 */
export async function updateWorkflowStatus(
  workflowId: string,
  newStatus: WorkflowStatus
): Promise<WorkflowDefinition> {
  await requireAuth();
  const workflow = await getWorkflowDefinition(workflowId);

  if (!workflow) {
    throw new WorkflowDefinitionError('Workflow not found', 'NOT_FOUND');
  }

  // Check authorization for status changes
  const canChangeStatus = await hasAnyRole(['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN']);
  if (!canChangeStatus) {
    throw new WorkflowDefinitionError('Unauthorized to change workflow status', 'UNAUTHORIZED');
  }

  // Validate state transition
  const validTransitions: Record<WorkflowStatus, WorkflowStatus[]> = {
    DRAFT: ['VALIDATING', 'ARCHIVED'],
    VALIDATING: ['READY', 'DRAFT', 'ARCHIVED'],
    READY: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
    ACTIVE: ['INACTIVE', 'ARCHIVED'],
    INACTIVE: ['ACTIVE', 'ARCHIVED'],
    ARCHIVED: [], // Terminal state
  };

  if (!validTransitions[workflow.status].includes(newStatus)) {
    throw new WorkflowDefinitionError(
      `Invalid state transition: ${workflow.status} → ${newStatus}`,
      'INVALID_TRANSITION'
    );
  }

  const adminSupabase = getAdminClient();

  // If activating, deactivate other active versions
  if (newStatus === 'ACTIVE') {
    await (adminSupabase
      .from('workflow_definitions') as any)
      .update({ status: 'INACTIVE' })
      .eq('name', workflow.name)
      .eq('institution_id', workflow.institution_id)
      .eq('status', 'ACTIVE')
      .neq('id', workflowId);
  }

  const { data, error } = await (adminSupabase
    .from('workflow_definitions') as any)
    .update({ status: newStatus })
    .eq('id', workflowId)
    .select()
    .single();

  if (error) {
    throw new WorkflowDefinitionError(`Failed to update status: ${error.message}`);
  }

  return data as WorkflowDefinition;
}

/**
 * Mark AI-generated workflow as reviewed
 */
export async function markWorkflowReviewed(
  workflowId: string,
  reviewNotes?: string
): Promise<WorkflowDefinition> {
  const user = await requireAuth();
  const workflow = await getWorkflowDefinition(workflowId);

  if (!workflow) {
    throw new WorkflowDefinitionError('Workflow not found', 'NOT_FOUND');
  }

  if (!workflow.is_ai_generated) {
    throw new WorkflowDefinitionError('Workflow is not AI-generated', 'INVALID_OPERATION');
  }

  const canReview = await hasAnyRole(['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN']);
  if (!canReview) {
    throw new WorkflowDefinitionError('Unauthorized to review workflows', 'UNAUTHORIZED');
  }

  const adminSupabase = getAdminClient();

  const { data, error } = await (adminSupabase
    .from('workflow_definitions') as any)
    .update({
      generation_source: 'AI_GENERATED_REVIEWED',
      reviewed_by: user.userId,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes || null,
    })
    .eq('id', workflowId)
    .select()
    .single();

  if (error) {
    throw new WorkflowDefinitionError(`Failed to mark as reviewed: ${error.message}`);
  }

  return data as WorkflowDefinition;
}

/**
 * Delete workflow definition (soft delete by archiving)
 */
export async function deleteWorkflowDefinition(workflowId: string): Promise<void> {
  await requireAuth();
  const workflow = await getWorkflowDefinition(workflowId);

  if (!workflow) {
    throw new WorkflowDefinitionError('Workflow not found', 'NOT_FOUND');
  }

  const canDelete = await hasAnyRole(['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN']);
  if (!canDelete) {
    throw new WorkflowDefinitionError('Unauthorized to delete workflows', 'UNAUTHORIZED');
  }

  // Only DRAFT workflows can be hard deleted, others are archived
  const adminSupabase = getAdminClient();

  if (workflow.status === 'DRAFT') {
    const { error } = await adminSupabase
      .from('workflow_definitions')
      .delete()
      .eq('id', workflowId);

    if (error) {
      throw new WorkflowDefinitionError(`Failed to delete workflow: ${error.message}`);
    }
  } else {
    await updateWorkflowStatus(workflowId, 'ARCHIVED');
  }
}
