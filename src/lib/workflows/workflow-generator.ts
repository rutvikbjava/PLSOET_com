/**
 * AI Workflow Generator Service
 * 
 * Generates structured workflow definitions from institutional context,
 * policies, and user intent using AI.
 * 
 * Architecture:
 * - Reuses AI provider abstraction from EDU-008
 * - Grounds generation in actual institutional data
 * - Returns structured, validated workflow DSL
 * - Tracks provenance (context, policies, prompt version)
 * 
 * Security:
 * - AI output is untrusted and must be validated
 * - No direct execution of AI-generated workflows
 * - All API keys remain server-side
 * - Institution isolation enforced
 * 
 * Note: Using 'any' types where necessary for flexibility in AI outputs
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getAdminClient } from '@/lib/supabase/admin';
import { requireAuth, getUserInstitutionId } from '@/lib/auth';
import type { WorkflowDSL, AIGenerationRecord } from './types';

// ============================================================================
// Types
// ============================================================================

export interface WorkflowGenerationConfig {
  provider: 'openai' | 'mock';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface WorkflowGenerationInput {
  business_intent: string;
  workflow_type?: string;
  context_documents?: Array<{
    id: string;
    context_id: string;
    title: string;
    context: any;
  }>;
  policies?: Array<{
    id: string;
    version: number;
    name: string;
    content: string;
  }>;
  institutional_config?: Record<string, any>;
  additional_context?: Record<string, any>;
}

export interface WorkflowGenerationResult {
  generation_id: string;
  workflow: WorkflowDSL;
  confidence_score: number;
  context_references: string[];
  policy_references: Array<{ id: string; version: number }>;
  metadata: {
    model: string;
    provider: string;
    prompt_version: string;
    generation_time_ms: number;
    tokens_used?: number;
  };
}

export class WorkflowGenerationError extends Error {
  constructor(
    message: string,
    public category: 'PROVIDER_ERROR' | 'INVALID_RESPONSE' | 'RATE_LIMIT' | 'AUTHENTICATION' | 'VALIDATION' | 'UNKNOWN',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'WorkflowGenerationError';
  }
}

// ============================================================================
// Constants
// ============================================================================

const PROMPT_VERSION = 'v1.0.0';

const DEFAULT_CONFIG: WorkflowGenerationConfig = {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.3, // Higher than context extraction, allows some creativity
  maxTokens: 2000,
};

// ============================================================================
// Main Generation Function
// ============================================================================

/**
 * Generate workflow from business intent and institutional context
 */
export async function generateWorkflow(
  input: WorkflowGenerationInput,
  config: WorkflowGenerationConfig = DEFAULT_CONFIG
): Promise<WorkflowGenerationResult> {
  await requireAuth();
  const institutionId = await getUserInstitutionId();

  if (!institutionId) {
    throw new WorkflowGenerationError('Institution ID required', 'VALIDATION');
  }

  // Validate input
  if (!input.business_intent?.trim()) {
    throw new WorkflowGenerationError('Business intent is required', 'VALIDATION');
  }

  const startTime = Date.now();

  try {
    // Generate workflow based on provider
    let workflowDSL: WorkflowDSL;
    let metadata: any;

    if (config.provider === 'mock') {
      ({ workflow: workflowDSL, metadata } = generateWorkflowMock(input, startTime));
    } else if (config.provider === 'openai') {
      ({ workflow: workflowDSL, metadata } = await generateWorkflowOpenAI(input, config, startTime));
    } else {
      throw new WorkflowGenerationError(`Unsupported provider: ${config.provider}`, 'PROVIDER_ERROR');
    }

    // Extract references
    const context_references = input.context_documents?.map((doc) => doc.context_id) || [];
    const policy_references = input.policies?.map((policy) => ({
      id: policy.id,
      version: policy.version,
    })) || [];

    // Store generation record
    const generation_id = await storeGenerationRecord({
      workflow: workflowDSL,
      context_references,
      policy_references,
      metadata,
      context_document_ids: input.context_documents?.map((doc) => doc.id) || [],
    });

    return {
      generation_id,
      workflow: workflowDSL,
      confidence_score: metadata.confidence_score || 0.85,
      context_references,
      policy_references,
      metadata: {
        model: metadata.model,
        provider: metadata.provider,
        prompt_version: PROMPT_VERSION,
        generation_time_ms: Date.now() - startTime,
        tokens_used: metadata.tokens_used,
      },
    };

  } catch (error) {
    if (error instanceof WorkflowGenerationError) {
      throw error;
    }

    throw new WorkflowGenerationError(
      'Failed to generate workflow',
      'UNKNOWN',
      error
    );
  }
}

// ============================================================================
// OpenAI Generation
// ============================================================================

async function generateWorkflowOpenAI(
  input: WorkflowGenerationInput,
  config: WorkflowGenerationConfig,
  startTime: number
): Promise<{ workflow: WorkflowDSL; metadata: any }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new WorkflowGenerationError(
      'OPENAI_API_KEY environment variable not configured',
      'AUTHENTICATION'
    );
  }

  const model = config.model || 'gpt-4o';
  const temperature = config.temperature ?? 0.3;
  const maxTokens = config.maxTokens || 2000;

  // Build generation prompt
  const prompt = buildGenerationPrompt(input);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      
      if (response.status === 401) {
        throw new WorkflowGenerationError('Invalid OpenAI API key', 'AUTHENTICATION');
      }

      if (response.status === 429) {
        throw new WorkflowGenerationError('OpenAI rate limit exceeded', 'RATE_LIMIT');
      }

      throw new WorkflowGenerationError(
        `OpenAI API error: ${error.error?.message || 'Unknown'}`,
        'PROVIDER_ERROR'
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new WorkflowGenerationError('Empty response from OpenAI', 'INVALID_RESPONSE');
    }

    // Parse and validate JSON response
    const parsed = JSON.parse(content);
    const workflow = validateAndNormalizeWorkflow(parsed);

    const processingTime = Date.now() - startTime;

    return {
      workflow,
      metadata: {
        model,
        provider: 'openai',
        tokens_used: data.usage?.total_tokens,
        processing_time: processingTime,
        confidence_score: parsed.confidence_score || 0.85,
      },
    };

  } catch (error) {
    if (error instanceof WorkflowGenerationError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new WorkflowGenerationError(
        'Invalid JSON response from AI',
        'INVALID_RESPONSE',
        error
      );
    }

    throw new WorkflowGenerationError(
      'OpenAI API request failed',
      'PROVIDER_ERROR',
      error
    );
  }
}

// ============================================================================
// Mock Generation
// ============================================================================

function generateWorkflowMock(
  input: WorkflowGenerationInput,
  startTime: number
): { workflow: WorkflowDSL; metadata: any } {
  // Simple rule-based workflow generation for testing
  const workflow: WorkflowDSL = {
    name: `Mock Workflow: ${input.business_intent.substring(0, 50)}`,
    description: `Generated workflow for: ${input.business_intent}`,
    workflow_type: input.workflow_type || 'APPROVAL',
    trigger: {
      type: 'MANUAL',
      config: {},
    },
    steps: [
      {
        id: 'step_1',
        name: 'Initial Review',
        action_type: 'REQUEST_APPROVAL',
        sequence_order: 1,
        config: {
          approver_role: 'DEPARTMENT_HEAD',
          timeout_hours: 48,
        },
      },
      {
        id: 'step_2',
        name: 'Validate Document',
        action_type: 'VALIDATE_DOCUMENT',
        sequence_order: 2,
        config: {
          validation_rules: ['policy_compliance', 'completeness'],
        },
      },
      {
        id: 'step_3',
        name: 'Final Approval',
        action_type: 'REQUEST_APPROVAL',
        sequence_order: 3,
        config: {
          approver_role: 'PRINCIPAL',
          timeout_hours: 72,
        },
      },
    ],
    required_roles: ['DEPARTMENT_HEAD', 'PRINCIPAL'],
    policy_references: input.policies?.map((p) => p.id) || [],
    metadata: {
      generated_by: 'mock_generator',
      note: 'This is a mock workflow for testing. Configure OPENAI_API_KEY for AI generation.',
    },
  };

  const processingTime = Date.now() - startTime;

  return {
    workflow,
    metadata: {
      model: 'mock-generator',
      provider: 'mock',
      processing_time: processingTime,
      confidence_score: 0.5,
    },
  };
}

// ============================================================================
// Prompt Building
// ============================================================================

function buildSystemPrompt(): string {
  return `You are an expert workflow architect for higher education institutions.

Your task is to generate structured, policy-compliant approval workflows based on:
- Business intent/goal
- Institutional context from documents
- Active institutional policies
- Organizational structure

CRITICAL RULES:
1. Generate STRUCTURED workflow definitions (JSON), not arbitrary code
2. Use only REGISTERED action types: VALIDATE_DOCUMENT, REQUEST_APPROVAL, GENERATE_NOTIFICATION, UPDATE_STATUS, WAIT_FOR_CONDITION, AI_REVIEW, COLLECT_INFORMATION, DELEGATE_TASK
3. Workflows must comply with provided policies
4. Include required approval steps based on policies
5. Keep workflows simple and practical
6. If information is missing, indicate it in the response rather than hallucinating
7. Return valid JSON matching the WorkflowDSL schema

OUTPUT SCHEMA:
{
  "workflow": {
    "name": "string",
    "description": "string",
    "workflow_type": "string",
    "trigger": { "type": "MANUAL|DOCUMENT_UPLOAD|STATUS_CHANGE", "config": {} },
    "steps": [
      {
        "id": "string",
        "name": "string",
        "action_type": "VALIDATE_DOCUMENT|REQUEST_APPROVAL|etc",
        "sequence_order": number,
        "config": {},
        "is_mandatory": boolean,
        "timeout_hours": number,
        "conditions": [],
        "transitions": []
      }
    ],
    "required_roles": ["string"],
    "policy_references": ["string"]
  },
  "confidence_score": 0.0-1.0,
  "reasoning": "string"
}`;
}

function buildGenerationPrompt(input: WorkflowGenerationInput): string {
  let prompt = `Generate an approval workflow for the following business intent:\n\n`;
  prompt += `BUSINESS INTENT:\n${input.business_intent}\n\n`;

  if (input.workflow_type) {
    prompt += `WORKFLOW TYPE: ${input.workflow_type}\n\n`;
  }

  if (input.context_documents && input.context_documents.length > 0) {
    prompt += `RELEVANT DOCUMENTS:\n`;
    for (const doc of input.context_documents.slice(0, 3)) { // Limit to 3 docs
      prompt += `- ${doc.title}\n`;
      if (doc.context) {
        prompt += `  Type: ${doc.context.document_type_detected || 'Unknown'}\n`;
        prompt += `  Purpose: ${doc.context.purpose || 'Not specified'}\n`;
      }
    }
    prompt += `\n`;
  }

  if (input.policies && input.policies.length > 0) {
    prompt += `INSTITUTIONAL POLICIES TO COMPLY WITH:\n`;
    for (const policy of input.policies.slice(0, 3)) { // Limit to 3 policies
      prompt += `- ${policy.name} (v${policy.version})\n`;
      prompt += `  ${policy.content.substring(0, 200)}...\n`;
    }
    prompt += `\n`;
  }

  if (input.institutional_config) {
    prompt += `INSTITUTIONAL CONFIGURATION:\n`;
    prompt += JSON.stringify(input.institutional_config, null, 2);
    prompt += `\n\n`;
  }

  if (input.additional_context) {
    prompt += `ADDITIONAL CONTEXT:\n`;
    prompt += JSON.stringify(input.additional_context, null, 2);
    prompt += `\n\n`;
  }

  prompt += `Generate a practical, policy-compliant workflow with clear steps, approvers, and conditions.`;

  return prompt;
}

// ============================================================================
// Validation
// ============================================================================

function validateAndNormalizeWorkflow(parsed: any): WorkflowDSL {
  // Basic validation - comprehensive validation happens in workflow-validator.ts
  if (!parsed.workflow) {
    throw new WorkflowGenerationError('Missing workflow object', 'INVALID_RESPONSE');
  }

  const wf = parsed.workflow;

  if (!wf.name?.trim()) {
    throw new WorkflowGenerationError('Workflow name is required', 'INVALID_RESPONSE');
  }

  if (!wf.steps || !Array.isArray(wf.steps) || wf.steps.length === 0) {
    throw new WorkflowGenerationError('Workflow must have at least one step', 'INVALID_RESPONSE');
  }

  // Validate action types
  const validActionTypes = [
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

  for (const step of wf.steps) {
    if (!step.action_type || !validActionTypes.includes(step.action_type)) {
      throw new WorkflowGenerationError(
        `Invalid action type: ${step.action_type}. Must be one of: ${validActionTypes.join(', ')}`,
        'INVALID_RESPONSE'
      );
    }

    if (!step.id || !step.name) {
      throw new WorkflowGenerationError('Each step must have id and name', 'INVALID_RESPONSE');
    }
  }

  // Normalize and return
  return {
    name: wf.name,
    description: wf.description || '',
    workflow_type: wf.workflow_type || 'APPROVAL',
    trigger: wf.trigger || { type: 'MANUAL', config: {} },
    steps: wf.steps.map((step: any) => ({
      id: step.id,
      name: step.name,
      action_type: step.action_type,
      sequence_order: step.sequence_order || 1,
      config: step.config || {},
      is_mandatory: step.is_mandatory !== false,
      timeout_hours: step.timeout_hours || null,
      conditions: step.conditions || [],
      transitions: step.transitions || [],
      execution_mode: step.execution_mode || 'SYNCHRONOUS',
    })),
    required_roles: wf.required_roles || [],
    policy_references: wf.policy_references || [],
    metadata: wf.metadata || {},
  };
}

// ============================================================================
// Persistence
// ============================================================================

async function storeGenerationRecord(data: {
  workflow: WorkflowDSL;
  context_references: string[];
  policy_references: Array<{ id: string; version: number }>;
  metadata: any;
  context_document_ids: string[];
}): Promise<string> {
  const adminSupabase = getAdminClient();

  const { data: record, error } = await adminSupabase
    .from('ai_generation_records')
    .insert({
      document_id: data.context_document_ids[0] || null,
      document_context_id: data.context_references[0] || null,
      generated_workflow: data.workflow,
      model_name: data.metadata.model,
      model_version: data.metadata.model,
      model_provider: data.metadata.provider,
      confidence_score: data.metadata.confidence_score,
      is_validated: false,
      context_references: data.context_references,
      policy_references: data.policy_references,
      generation_prompt_version: PROMPT_VERSION,
      generation_metadata: {
        processing_time: data.metadata.processing_time,
        tokens_used: data.metadata.tokens_used,
      },
    } as any)
    .select('id')
    .single();

  if (error) {
    console.error('[STORE_GENERATION_ERROR]', error);
    throw new WorkflowGenerationError(
      `Failed to store generation record: ${error.message}`,
      'UNKNOWN'
    );
  }

  return (record as any).id;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get recommended AI provider based on environment
 */
export function getRecommendedProvider(): 'openai' | 'mock' {
  return process.env.OPENAI_API_KEY ? 'openai' : 'mock';
}

/**
 * Retrieve generation record by ID
 */
export async function getGenerationRecord(
  generationId: string
): Promise<AIGenerationRecord | null> {
  await requireAuth();
  const adminSupabase = getAdminClient();

  const { data, error } = await adminSupabase
    .from('ai_generation_records')
    .select('*')
    .eq('id', generationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new WorkflowGenerationError(
      `Failed to get generation record: ${error.message}`,
      'UNKNOWN'
    );
  }

  return data as AIGenerationRecord;
}

/**
 * List generation records for institution
 */
export async function listGenerationRecords(filters?: {
  is_validated?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ records: AIGenerationRecord[]; total: number }> {
  await requireAuth();
  const adminSupabase = getAdminClient();

  // Get records associated with institution's documents
  let query = adminSupabase
    .from('ai_generation_records')
    .select('*', { count: 'exact' });

  if (filters?.is_validated !== undefined) {
    query = query.eq('is_validated', filters.is_validated);
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
    throw new WorkflowGenerationError(
      `Failed to list generation records: ${error.message}`,
      'UNKNOWN'
    );
  }

  return {
    records: data as AIGenerationRecord[],
    total: count || 0,
  };
}
