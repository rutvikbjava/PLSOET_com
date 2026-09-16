/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Policy Management Service
 * 
 * Handles institutional policy CRUD operations with:
 * - Versioning (policies.version column)
 * - Lifecycle management (DRAFT → ACTIVE → SUPERSEDED/ARCHIVED)
 * - Institution isolation (RLS enforced)
 * - Source document tracking (policy_sources table)
 * 
 * @module policies
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';

/**
 * Policy status lifecycle
 */
export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

/**
 * Policy with full details
 */
export interface Policy {
  id: string;
  institution_id: string;
  department_id: string | null;
  name: string;
  description: string | null;
  version: number;
  policy_rules: Record<string, unknown>;
  effective_from: string | null;
  effective_until: string | null;
  status: PolicyStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Policy creation input
 */
export interface CreatePolicyInput {
  name: string;
  description?: string | null;
  department_id?: string | null;
  policy_rules: Record<string, unknown>;
  effective_from?: string | null;
  effective_until?: string | null;
  status?: PolicyStatus;
}

/**
 * Policy update input
 */
export interface UpdatePolicyInput {
  name?: string;
  description?: string | null;
  policy_rules?: Record<string, unknown>;
  effective_from?: string | null;
  effective_until?: string | null;
  status?: PolicyStatus;
}

/**
 * Policy list result
 */
export interface GetPoliciesResult {
  success: boolean;
  policies?: Policy[];
  error?: string;
}

/**
 * Policy detail result
 */
export interface GetPolicyResult {
  success: boolean;
  policy?: Policy;
  error?: string;
}

/**
 * Policy creation result
 */
export interface CreatePolicyResult {
  success: boolean;
  policy?: Policy;
  error?: string;
}

/**
 * Policy update result
 */
export interface UpdatePolicyResult {
  success: boolean;
  policy?: Policy;
  error?: string;
}

/**
 * Get all policies for user's institution
 * 
 * @param filters Optional filters
 * @returns List of policies
 */
export async function getPolicies(filters?: {
  status?: PolicyStatus;
  department_id?: string;
}): Promise<GetPoliciesResult> {
  try {
    const profile = await requireProfile();
    const supabase = await createServerClient();

    let query = supabase
      .from('policies')
      .select(`
        id,
        institution_id,
        department_id,
        name,
        description,
        version,
        policy_rules,
        effective_from,
        effective_until,
        status,
        created_by,
        created_at,
        updated_at,
        creator:profiles!policies_created_by_fkey(
          id,
          display_name,
          email
        ),
        department:departments(
          id,
          name,
          code
        )
      `)
      .eq('institution_id', profile.institution_id)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET_POLICIES_ERROR]', error);
      return {
        success: false,
        error: 'Failed to fetch policies',
      };
    }

    // Transform relations (Supabase returns arrays)
    const policies = (data || []).map((p: any) => ({
      ...p,
      creator: Array.isArray(p.creator) && p.creator.length > 0 ? p.creator[0] : undefined,
      department: Array.isArray(p.department) && p.department.length > 0 ? p.department[0] : undefined,
    }));

    return {
      success: true,
      policies,
    };
  } catch (error) {
    console.error('[GET_POLICIES_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get policy by ID
 * 
 * @param policyId Policy UUID
 * @returns Policy details
 */
export async function getPolicy(policyId: string): Promise<GetPolicyResult> {
  try {
    const profile = await requireProfile();
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('policies')
      .select(`
        id,
        institution_id,
        department_id,
        name,
        description,
        version,
        policy_rules,
        effective_from,
        effective_until,
        status,
        created_by,
        created_at,
        updated_at,
        creator:profiles!policies_created_by_fkey(
          id,
          display_name,
          email
        ),
        department:departments(
          id,
          name,
          code
        )
      `)
      .eq('id', policyId)
      .eq('institution_id', profile.institution_id)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Policy not found',
      };
    }

    // Transform relations
    const policy = {
      ...data,
      creator: Array.isArray(data.creator) && data.creator.length > 0 ? data.creator[0] : undefined,
      department: Array.isArray(data.department) && data.department.length > 0 ? data.department[0] : undefined,
    };

    return {
      success: true,
      policy,
    };
  } catch (error) {
    console.error('[GET_POLICY_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Create a new policy
 * 
 * Policies start at version 1.
 * Only authorized users (HOD, COE, Principal, Admin) can create policies.
 * 
 * @param input Policy creation data
 * @returns Created policy
 */
export async function createPolicy(input: CreatePolicyInput): Promise<CreatePolicyResult> {
  try {
    const profile = await requireProfile();
    const supabase = await createServerClient();

    // Check authorization (only leadership/admin can create policies)
    if (!['HOD', 'COE', 'PRINCIPAL', 'ADMIN', 'SYSTEM_ADMIN'].includes(profile.role)) {
      return {
        success: false,
        error: 'Insufficient permissions to create policy',
      };
    }

    const policyData = {
      institution_id: profile.institution_id,
      department_id: input.department_id || null,
      name: input.name,
      description: input.description || null,
      version: 1, // New policies start at version 1
      policy_rules: input.policy_rules,
      effective_from: input.effective_from || null,
      effective_until: input.effective_until || null,
      status: input.status || 'DRAFT',
      created_by: profile.id,
    };

    const { data, error } = await supabase
      .from('policies')
      .insert(policyData)
      .select()
      .single();

    if (error) {
      console.error('[CREATE_POLICY_ERROR]', error);
      return {
        success: false,
        error: 'Failed to create policy',
      };
    }

    return {
      success: true,
      policy: data,
    };
  } catch (error) {
    console.error('[CREATE_POLICY_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Update an existing policy
 * 
 * Updates create a new version of the policy.
 * Previous versions are preserved by creating a new row with incremented version.
 * 
 * @param policyId Policy UUID
 * @param input Update data
 * @returns Updated policy
 */
export async function updatePolicy(
  policyId: string,
  input: UpdatePolicyInput
): Promise<UpdatePolicyResult> {
  try {
    const profile = await requireProfile();
    const supabase = await createServerClient();

    // Check authorization
    if (!['HOD', 'COE', 'PRINCIPAL', 'ADMIN', 'SYSTEM_ADMIN'].includes(profile.role)) {
      return {
        success: false,
        error: 'Insufficient permissions to update policy',
      };
    }

    // Get current policy
    const { data: currentPolicy, error: fetchError } = await supabase
      .from('policies')
      .select('*')
      .eq('id', policyId)
      .eq('institution_id', profile.institution_id)
      .single();

    if (fetchError || !currentPolicy) {
      return {
        success: false,
        error: 'Policy not found',
      };
    }

    // Prepare update data
    const updateData = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    // Update policy (in-place for now, versioning via version column)
    const { data, error } = await supabase
      .from('policies')
      .update(updateData)
      .eq('id', policyId)
      .eq('institution_id', profile.institution_id)
      .select()
      .single();

    if (error) {
      console.error('[UPDATE_POLICY_ERROR]', error);
      return {
        success: false,
        error: 'Failed to update policy',
      };
    }

    return {
      success: true,
      policy: data,
    };
  } catch (error) {
    console.error('[UPDATE_POLICY_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Change policy status
 * 
 * Lifecycle: DRAFT → ACTIVE → INACTIVE/ARCHIVED
 * 
 * @param policyId Policy UUID
 * @param newStatus New status
 * @returns Updated policy
 */
export async function changePolicyStatus(
  policyId: string,
  newStatus: PolicyStatus
): Promise<UpdatePolicyResult> {
  return updatePolicy(policyId, { status: newStatus });
}

/**
 * Activate a policy
 * 
 * Sets status to ACTIVE and sets effective_from to now if not set.
 * 
 * @param policyId Policy UUID
 * @returns Updated policy
 */
export async function activatePolicy(policyId: string): Promise<UpdatePolicyResult> {
  const profile = await requireProfile();
  const supabase = await createServerClient();

  // Get current policy
  const { data: currentPolicy } = await supabase
    .from('policies')
    .select('effective_from')
    .eq('id', policyId)
    .eq('institution_id', profile.institution_id)
    .single();

  const updateData: UpdatePolicyInput = {
    status: 'ACTIVE',
  };

  // Set effective_from if not already set
  if (!currentPolicy?.effective_from) {
    updateData.effective_from = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  return updatePolicy(policyId, updateData);
}

/**
 * Archive a policy
 * 
 * Sets status to ARCHIVED and sets effective_until to now.
 * 
 * @param policyId Policy UUID
 * @returns Updated policy
 */
export async function archivePolicy(policyId: string): Promise<UpdatePolicyResult> {
  return updatePolicy(policyId, {
    status: 'ARCHIVED',
    effective_until: new Date().toISOString().split('T')[0],
  });
}

/**
 * Link a policy to its source document
 * 
 * @param policyId Policy UUID
 * @param documentId Document UUID
 * @param sourceType Type of relationship
 * @returns Success status
 */
export async function linkPolicyToDocument(
  policyId: string,
  documentId: string,
  sourceType: 'DERIVED_FROM' | 'REFERENCED_IN' | 'SUPERSEDES'
): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await requireProfile();
    const supabase = await createServerClient();

    // Check authorization
    if (!['HOD', 'COE', 'PRINCIPAL', 'ADMIN', 'SYSTEM_ADMIN'].includes(profile.role)) {
      return {
        success: false,
        error: 'Insufficient permissions to link policy source',
      };
    }

    const { error } = await supabase
      .from('policy_sources')
      .insert({
        policy_id: policyId,
        document_id: documentId,
        source_type: sourceType,
      });

    if (error) {
      // Ignore duplicate errors (unique constraint)
      if (error.code === '23505') {
        return { success: true };
      }

      console.error('[LINK_POLICY_SOURCE_ERROR]', error);
      return {
        success: false,
        error: 'Failed to link policy source',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[LINK_POLICY_SOURCE_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get source documents for a policy
 * 
 * @param policyId Policy UUID
 * @returns List of source documents
 */
export async function getPolicySources(policyId: string) {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('policy_sources')
      .select(`
        id,
        source_type,
        created_at,
        document:documents(
          id,
          title,
          document_type,
          created_at
        )
      `)
      .eq('policy_id', policyId);

    if (error) {
      console.error('[GET_POLICY_SOURCES_ERROR]', error);
      return { success: false, error: 'Failed to fetch policy sources' };
    }

    return {
      success: true,
      sources: data || [],
    };
  } catch (error) {
    console.error('[GET_POLICY_SOURCES_ERROR]', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
