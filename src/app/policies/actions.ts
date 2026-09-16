/**
 * Policy Server Actions
 * 
 * Handles policy operations from client components
 */

'use server';

import { requireAuth } from '@/lib/auth/session';
import {
  createPolicy,
  updatePolicy,
  changePolicyStatus,
  type CreatePolicyInput,
  type UpdatePolicyInput,
  type PolicyStatus,
} from '@/lib/policies';
import { validatePolicy } from '@/lib/policies/validation';
import { revalidatePath } from 'next/cache';

/**
 * Create a new policy
 */
export async function createPolicyAction(input: CreatePolicyInput) {
  try {
    await requireAuth();
    const result = await createPolicy(input);

    if (result.success) {
      revalidatePath('/policies');
    }

    return result;
  } catch (error) {
    console.error('[CREATE_POLICY_ACTION_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Update an existing policy
 */
export async function updatePolicyAction(policyId: string, input: UpdatePolicyInput) {
  try {
    await requireAuth();
    const result = await updatePolicy(policyId, input);

    if (result.success) {
      revalidatePath(`/policies/${policyId}`);
      revalidatePath('/policies');
    }

    return result;
  } catch (error) {
    console.error('[UPDATE_POLICY_ACTION_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Change policy status
 */
export async function changePolicyStatusAction(policyId: string, newStatus: PolicyStatus) {
  try {
    await requireAuth();
    const result = await changePolicyStatus(policyId, newStatus);

    if (result.success) {
      revalidatePath(`/policies/${policyId}`);
      revalidatePath('/policies');
    }

    return result;
  } catch (error) {
    console.error('[CHANGE_POLICY_STATUS_ACTION_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Validate a policy
 */
export async function validatePolicyAction(policyId: string) {
  try {
    await requireAuth();
    const result = await validatePolicy(policyId);

    revalidatePath(`/policies/${policyId}`);
    revalidatePath(`/validation/${policyId}`);

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('[VALIDATE_POLICY_ACTION_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
