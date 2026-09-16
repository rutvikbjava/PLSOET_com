/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Policy Validation Engine
 * 
 * Validates policies against institutional context:
 * - Deterministic rules where possible
 * - AI-assisted interpretation where needed
 * - Generates explainable validation findings
 * - Supports "requires review" state for uncertain findings
 * 
 * IMPORTANT: Validation does NOT modify source documents or policies
 * IMPORTANT: Prefer deterministic validation over AI where possible
 * 
 * @module policies/validation
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { requireProfile } from '@/lib/auth/session';

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

/**
 * Validation finding
 */
export interface ValidationFinding {
  severity: ValidationSeverity;
  rule: string;
  message: string;
  explanation: string;
  requires_review: boolean;
  source_reference?: {
    document_id?: string;
    policy_id?: string;
    context_id?: string;
  };
}

/**
 * Validation result
 */
export interface ValidationResult {
  is_compliant: boolean;
  findings: ValidationFinding[];
  confidence_score: number;
  validated_at: string;
}

/**
 * Validate policy against institutional context
 * 
 * Performs:
 * 1. Deterministic rule validation (required fields, date logic, etc.)
 * 2. Context-based validation (if document contexts available)
 * 3. AI-assisted interpretation (if needed and configured)
 * 
 * @param policyId Policy UUID
 * @returns Validation result with findings
 */
export async function validatePolicy(policyId: string): Promise<ValidationResult> {
  const findings: ValidationFinding[] = [];
  let confidenceScore = 1.0; // Start with full confidence

  // Step 1: Get policy details
  const profile = await requireProfile();
  const supabase = await createServerClient();

  const { data: policy, error: policyError } = await supabase
    .from('policies')
    .select('*')
    .eq('id', policyId)
    .eq('institution_id', profile.institution_id)
    .single();

  if (policyError || !policy) {
    throw new Error('Policy not found');
  }

  // Step 2: Deterministic validations
  validatePolicyStructure(policy, findings);
  validatePolicyDates(policy, findings);
  validatePolicyRules(policy, findings);

  // Step 3: Context-based validations (if source documents exist)
  await validateAgainstContext(policy, findings);

  // Step 4: Determine overall compliance
  const hasErrors = findings.some((f) => f.severity === 'ERROR');
  const requiresReview = findings.some((f) => f.requires_review);

  // If any findings require review, reduce confidence
  if (requiresReview) {
    confidenceScore = 0.7;
  }

  // Store validation record
  await storeValidationRecord(policy, findings, !hasErrors, confidenceScore);

  return {
    is_compliant: !hasErrors,
    findings,
    confidence_score: confidenceScore,
    validated_at: new Date().toISOString(),
  };
}

/**
 * Validate policy structure (deterministic)
 * 
 * Checks:
 * - Required fields present
 * - Valid status
 * - Policy rules structure
 */
function validatePolicyStructure(
  policy: any,
  findings: ValidationFinding[]
): void {
  // Check required fields
  if (!policy.name || policy.name.trim().length === 0) {
    findings.push({
      severity: 'ERROR',
      rule: 'REQUIRED_FIELD',
      message: 'Policy name is required',
      explanation: 'Every policy must have a non-empty name for identification',
      requires_review: false,
      source_reference: { policy_id: policy.id },
    });
  }

  // Check policy_rules is valid JSON object
  if (!policy.policy_rules || typeof policy.policy_rules !== 'object') {
    findings.push({
      severity: 'ERROR',
      rule: 'INVALID_RULES',
      message: 'Policy rules must be a valid JSON object',
      explanation: 'The policy_rules field must contain structured policy configuration',
      requires_review: false,
      source_reference: { policy_id: policy.id },
    });
  }

  // Check valid status
  const validStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];
  if (!validStatuses.includes(policy.status)) {
    findings.push({
      severity: 'ERROR',
      rule: 'INVALID_STATUS',
      message: `Invalid policy status: ${policy.status}`,
      explanation: `Status must be one of: ${validStatuses.join(', ')}`,
      requires_review: false,
      source_reference: { policy_id: policy.id },
    });
  }
}

/**
 * Validate policy dates (deterministic)
 * 
 * Checks:
 * - effective_from before effective_until
 * - ACTIVE policies have effective_from
 * - ARCHIVED policies have effective_until
 */
function validatePolicyDates(
  policy: any,
  findings: ValidationFinding[]
): void {
  // Check date logic
  if (policy.effective_from && policy.effective_until) {
    const from = new Date(policy.effective_from);
    const until = new Date(policy.effective_until);

    if (from >= until) {
      findings.push({
        severity: 'ERROR',
        rule: 'INVALID_DATE_RANGE',
        message: 'effective_from must be before effective_until',
        explanation: 'Policy date range is logically invalid',
        requires_review: false,
        source_reference: { policy_id: policy.id },
      });
    }
  }

  // ACTIVE policies should have effective_from
  if (policy.status === 'ACTIVE' && !policy.effective_from) {
    findings.push({
      severity: 'WARNING',
      rule: 'MISSING_EFFECTIVE_DATE',
      message: 'Active policy missing effective_from date',
      explanation: 'Active policies should specify when they take effect',
      requires_review: true, // May be intentional
      source_reference: { policy_id: policy.id },
    });
  }

  // ARCHIVED policies should have effective_until
  if (policy.status === 'ARCHIVED' && !policy.effective_until) {
    findings.push({
      severity: 'WARNING',
      rule: 'MISSING_EXPIRY_DATE',
      message: 'Archived policy missing effective_until date',
      explanation: 'Archived policies should specify when they expired',
      requires_review: true, // May be intentional
      source_reference: { policy_id: policy.id },
    });
  }
}

/**
 * Validate policy rules structure (deterministic)
 * 
 * Checks:
 * - Rules contain expected fields
 * - Rules are not empty
 */
function validatePolicyRules(
  policy: any,
  findings: ValidationFinding[]
): void {
  const rules = policy.policy_rules;

  if (!rules || Object.keys(rules).length === 0) {
    findings.push({
      severity: 'WARNING',
      rule: 'EMPTY_RULES',
      message: 'Policy rules are empty',
      explanation: 'Policy contains no configuration or rules',
      requires_review: true, // May be draft in progress
      source_reference: { policy_id: policy.id },
    });
  }

  // Check for common rule structure issues
  if (rules && typeof rules === 'object') {
    // If rules contain arrays, check they're not empty
    for (const [key, value] of Object.entries(rules)) {
      if (Array.isArray(value) && value.length === 0) {
        findings.push({
          severity: 'INFO',
          rule: 'EMPTY_RULE_ARRAY',
          message: `Rule field '${key}' is an empty array`,
          explanation: `The ${key} rule contains no items`,
          requires_review: true,
          source_reference: { policy_id: policy.id },
        });
      }
    }
  }
}

/**
 * Validate against document context (uses extracted contexts)
 * 
 * Checks if policy requirements are satisfied by institutional documents
 */
async function validateAgainstContext(
  policy: any,
  findings: ValidationFinding[]
): Promise<void> {
  const adminSupabase = createAdminClient();

  // Get related document contexts
  const { data: contexts } = await adminSupabase
    .from('document_contexts')
    .select(`
      id,
      document_id,
      document_type_detected,
      purpose,
      extracted_attributes
    `)
    .eq('processing_status', 'COMPLETED');

  if (!contexts || contexts.length === 0) {
    findings.push({
      severity: 'INFO',
      rule: 'NO_CONTEXT',
      message: 'No processed documents available for context validation',
      explanation: 'Policy validation is limited without institutional document context',
      requires_review: false,
    });
    return;
  }

  // Example validation: Check if policy type matches any document types
  const policyRules = policy.policy_rules || {};
  const requiredDocumentTypes = policyRules.required_document_types as string[] | undefined;

  if (requiredDocumentTypes && Array.isArray(requiredDocumentTypes)) {
    const availableTypes = new Set(
      contexts.map((c: any) => c.document_type_detected).filter(Boolean)
    );

    for (const requiredType of requiredDocumentTypes) {
      if (!availableTypes.has(requiredType)) {
        findings.push({
          severity: 'WARNING',
          rule: 'MISSING_REQUIRED_DOCUMENT',
          message: `Required document type not found: ${requiredType}`,
          explanation: `Policy requires ${requiredType} but no such documents have been processed`,
          requires_review: true, // Documents may exist but not processed yet
          source_reference: { policy_id: policy.id },
        });
      }
    }
  }

  // Additional context-based validations can be added here
  // For example: budget requirements, approval chains, deadlines, etc.
}

/**
 * Store validation record in database
 */
async function storeValidationRecord(
  policy: any,
  findings: ValidationFinding[],
  isCompliant: boolean,
  _confidenceScore: number
): Promise<void> {
  const adminSupabase = createAdminClient();

  // Format violations as JSONB array
  const violations = findings.map((f) => ({
    severity: f.severity,
    rule: f.rule,
    message: f.message,
    explanation: f.explanation,
    requires_review: f.requires_review,
    source_reference: f.source_reference,
  }));

  const validationData = {
    policy_id: policy.id,
    policy_version: policy.version,
    is_compliant: isCompliant,
    validation_result: findings.length > 0 
      ? `Found ${findings.length} finding(s): ${findings.map(f => f.message).join('; ')}`
      : 'No issues found',
    violations,
    validator_version: 'v1.0.0',
  };

  await adminSupabase
    .from('policy_validation_records')
    .insert(validationData as any);
}

/**
 * Get validation history for a policy
 * 
 * @param policyId Policy UUID
 * @returns List of validation records
 */
export async function getValidationHistory(policyId: string) {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('policy_validation_records')
      .select('*')
      .eq('policy_id', policyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET_VALIDATION_HISTORY_ERROR]', error);
      return { success: false, error: 'Failed to fetch validation history' };
    }

    return {
      success: true,
      validations: data || [],
    };
  } catch (error) {
    console.error('[GET_VALIDATION_HISTORY_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Batch validate multiple policies
 * 
 * @param policyIds Array of policy UUIDs
 * @returns Map of policy ID to validation result
 */
export async function batchValidatePolicies(
  policyIds: string[]
): Promise<Map<string, ValidationResult>> {
  const results = new Map<string, ValidationResult>();

  for (const policyId of policyIds) {
    try {
      const result = await validatePolicy(policyId);
      results.set(policyId, result);
    } catch (error) {
      console.error('[BATCH_VALIDATE_ERROR]', { policyId, error });
      // Continue with other policies
    }
  }

  return results;
}
