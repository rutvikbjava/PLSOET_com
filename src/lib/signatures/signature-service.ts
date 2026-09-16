/**
 * Signature Service
 * 
 * Manages signature requests with EXACT document version binding.
 * 
 * CRITICAL: All signatures must bind to document_version_id for immutability.
 * 
 * State Machine:
 * PENDING → COMPLETED (via completeSignature)
 * PENDING → REJECTED (via rejectSignature)
 * PENDING → CANCELLED (via cancelSignatureRequest)
 * PENDING → EXPIRED (via checkExpiredRequests)
 * 
 * Note: Using 'any' types where necessary for Supabase client compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import type {
  SignatureRequest,
  SignatureRequestWithRelations,
  CreateSignatureRequestInput,
  CompleteSignatureInput,
  ListSignatureRequestsParams,
  SignatureServiceResult,
  CanSignResult,
} from './types';

// ============================================================================
// Create Signature Request
// ============================================================================

export async function createSignatureRequest(
  input: CreateSignatureRequestInput
): Promise<SignatureServiceResult<SignatureRequest>> {
  try {
    const session = await requireAuth();
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    // Validate input
    if (!input.title?.trim()) {
      return {
        success: false,
        error: 'Title is required',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    if (!input.document_version_id) {
      return {
        success: false,
        error: 'document_version_id is REQUIRED for signature requests',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Create signature request
    const { data, error } = await (adminSupabase
      .from('signature_requests') as any)
      .insert({
        institution_id: profile.institution_id,
        workflow_instance_id: input.workflow_instance_id || null,
        workflow_instance_step_id: input.workflow_instance_step_id || null,
        approval_request_id: input.approval_request_id || null,
        document_id: input.document_id,
        document_version_id: input.document_version_id, // REQUIRED
        signature_type: input.signature_type,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        requested_by: session.userId,
        signer_id: input.signer_id,
        status: 'PENDING',
        expires_at: input.expires_at?.toISOString() || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[SIGNATURE_SERVICE_CREATE_ERROR]', error);
      return {
        success: false,
        error: 'Failed to create signature request',
        errorCode: 'DATABASE_ERROR',
      };
    }

    // Create audit event
    await createAuditEvent({
      institution_id: profile.institution_id,
      actor_id: session.userId,
      event_type: 'SIGNATURE_REQUESTED',
      entity_type: 'signature_request',
      entity_id: data.id,
      event_data: {
        signature_type: input.signature_type,
        document_id: input.document_id,
        document_version_id: input.document_version_id,
        signer_id: input.signer_id,
      },
    });

    // Send notification to signer
    await createNotification({
      institution_id: profile.institution_id,
      recipient_id: input.signer_id,
      notification_type: 'SIGNATURE_REQUESTED',
      title: `Signature Request: ${input.title}`,
      message: input.description || undefined,
      related_entity_type: 'signature_request',
      related_entity_id: data.id,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[SIGNATURE_SERVICE_CREATE_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Complete Signature
// ============================================================================

export async function completeSignature(
  input: CompleteSignatureInput
): Promise<SignatureServiceResult<SignatureRequest>> {
  try {
    const session = await requireAuth();
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    // Get the request
    const { data: request, error: fetchError } = await adminSupabase
      .from('signature_requests')
      .select('*')
      .eq('id', input.request_id)
      .eq('institution_id', profile.institution_id)
      .single();

    if (fetchError || !request) {
      return {
        success: false,
        error: 'Signature request not found',
        errorCode: 'NOT_FOUND',
      };
    }

    // Cast to any to work around Supabase type issues
    const typedRequest = request as any;

    // Check authorization
    const authCheck = await canSign(input.request_id, session.userId);
    if (!authCheck.authorized) {
      return {
        success: false,
        error: authCheck.reason || 'Not authorized to sign this request',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Check status
    if (typedRequest.status !== 'PENDING') {
      return {
        success: false,
        error: `Cannot complete signature with status ${typedRequest.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // Check expiration
    if (typedRequest.expires_at && new Date(typedRequest.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Signature request has expired',
        errorCode: 'EXPIRED',
      };
    }

    // Create immutable signature record with EXACT version binding
    const { data: signature, error: signatureError } = await (adminSupabase
      .from('signatures') as any)
      .insert({
        institution_id: profile.institution_id,
        workflow_instance_id: typedRequest.workflow_instance_id,
        document_id: typedRequest.document_id,
        document_version_id: typedRequest.document_version_id, // EXACT version
        signature_request_id: typedRequest.id,
        signer_id: session.userId,
        requested_by: typedRequest.requested_by,
        signature_type: typedRequest.signature_type,
        signature_provider: input.signature_provider || null,
        signature_reference: input.signature_reference || null,
        signature_data: input.signature_data || {},
        status: 'SIGNED',
        signed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (signatureError) {
      console.error('[SIGNATURE_SERVICE_CREATE_SIGNATURE_ERROR]', signatureError);
      return {
        success: false,
        error: 'Failed to create signature record',
        errorCode: 'DATABASE_ERROR',
      };
    }

    // Update signature request status
    const { data, error } = await (adminSupabase
      .from('signature_requests') as any)
      .update({
        status: 'COMPLETED',
        signed_at: new Date().toISOString(),
        signature_id: signature.id,
      })
      .eq('id', input.request_id)
      .eq('status', 'PENDING') // Optimistic locking
      .select()
      .single();

    if (error || !data) {
      console.error('[SIGNATURE_SERVICE_COMPLETE_ERROR]', error);
      return {
        success: false,
        error: 'Failed to complete signature request',
        errorCode: 'ALREADY_SIGNED',
      };
    }

    // Create audit event
    await createAuditEvent({
      institution_id: profile.institution_id,
      actor_id: session.userId,
      event_type: 'SIGNATURE_COMPLETED',
      entity_type: 'signature_request',
      entity_id: data.id,
      event_data: {
        signature_id: signature.id,
        document_version_id: typedRequest.document_version_id,
      },
    });

    // Send notification to requester
    await createNotification({
      institution_id: profile.institution_id,
      recipient_id: typedRequest.requested_by,
      notification_type: 'SIGNATURE_COMPLETED',
      title: `Signed: ${typedRequest.title}`,
      related_entity_type: 'signature_request',
      related_entity_id: data.id,
    });

    // Resume workflow if linked
    if (typedRequest.workflow_instance_id && typedRequest.workflow_instance_step_id) {
      await resumeWorkflowAfterSignature(
        typedRequest.workflow_instance_id,
        typedRequest.workflow_instance_step_id
      );
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[SIGNATURE_SERVICE_COMPLETE_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Get Single Signature Request
// ============================================================================

export async function getSignatureRequest(
  requestId: string
): Promise<SignatureServiceResult<SignatureRequestWithRelations>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('signature_requests')
      .select(`
        *,
        requester:requested_by(id, display_name, email),
        signer:signer_id(id, display_name, email),
        document:documents(id, title, document_type),
        document_version:document_versions(id, version_number, file_size),
        workflow_instance:workflow_instances(id, instance_name, status),
        signature:signatures(*)
      `)
      .eq('id', requestId)
      .eq('institution_id', profile.institution_id)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Signature request not found',
        errorCode: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      data: data as any,
    };
  } catch (error) {
    console.error('[SIGNATURE_SERVICE_GET_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// List Signature Requests
// ============================================================================

export async function listSignatureRequests(
  params: ListSignatureRequestsParams = {}
): Promise<SignatureServiceResult<SignatureRequestWithRelations[]>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    let query = supabase
      .from('signature_requests')
      .select(`
        *,
        requester:requested_by(id, display_name, email),
        signer:signer_id(id, display_name, email),
        document:documents(id, title, document_type),
        document_version:document_versions(id, version_number, file_size),
        workflow_instance:workflow_instances(id, instance_name, status)
      `)
      .eq('institution_id', profile.institution_id);

    if (params.status) {
      if (Array.isArray(params.status)) {
        query = query.in('status', params.status);
      } else {
        query = query.eq('status', params.status);
      }
    }

    if (params.signer_id) {
      query = query.eq('signer_id', params.signer_id);
    }

    if (params.requested_by) {
      query = query.eq('requested_by', params.requested_by);
    }

    if (params.document_id) {
      query = query.eq('document_id', params.document_id);
    }

    if (params.document_version_id) {
      query = query.eq('document_version_id', params.document_version_id);
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[SIGNATURE_SERVICE_LIST_ERROR]', error);
      return {
        success: false,
        error: 'Failed to list signature requests',
        errorCode: 'DATABASE_ERROR',
      };
    }

    return {
      success: true,
      data: (data as any) || [],
    };
  } catch (error) {
    console.error('[SIGNATURE_SERVICE_LIST_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Authorization Check
// ============================================================================

export async function canSign(
  requestId: string,
  userId: string
): Promise<CanSignResult> {
  try {
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    const { data: request, error } = await adminSupabase
      .from('signature_requests')
      .select('*')
      .eq('id', requestId)
      .eq('institution_id', profile.institution_id)
      .single();

    if (error || !request) {
      return {
        authorized: false,
        reason: 'Signature request not found',
      };
    }

    // Cast to any to work around Supabase type issues
    const typedRequest = request as any;

    // Check if user is assigned signer
    if (typedRequest.signer_id === userId) {
      return { authorized: true };
    }

    // Admin override
    if (['ADMIN', 'SYSTEM_ADMIN'].includes(profile.role)) {
      return { authorized: true };
    }

    return {
      authorized: false,
      reason: 'Not assigned as signer for this request',
    };
  } catch (error) {
    console.error('[SIGNATURE_SERVICE_CAN_SIGN_ERROR]', error);
    return {
      authorized: false,
      reason: 'Authorization check failed',
    };
  }
}

// ============================================================================
// Helpers (audit, notification, workflow resumption)
// ============================================================================

async function createAuditEvent(input: any): Promise<void> {
  try {
    const adminSupabase = getAdminClient();
    await (adminSupabase.from('audit_events') as any).insert(input);
  } catch (error) {
    console.error('[SIGNATURE_SERVICE_CREATE_AUDIT_ERROR]', error);
  }
}

async function createNotification(input: any): Promise<void> {
  try {
    const adminSupabase = getAdminClient();
    await (adminSupabase.from('notifications') as any).insert({
      ...input,
      status: 'UNREAD',
      delivery_status: 'PENDING',
      delivery_channel: 'IN_APP',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (!errorMessage.includes('duplicate') && !errorMessage.includes('unique')) {
      console.error('[SIGNATURE_SERVICE_CREATE_NOTIFICATION_ERROR]', error);
    }
  }
}

async function resumeWorkflowAfterSignature(
  workflowInstanceId: string,
  workflowStepId: string
): Promise<void> {
  try {
    const { resumeWorkflowAfterSignature: resumeWorkflow } = await import(
      '@/lib/workflows/workflow-execution-engine'
    );
    await resumeWorkflow(workflowInstanceId, workflowStepId);
  } catch (error) {
    console.error('[SIGNATURE_SERVICE_RESUME_WORKFLOW_ERROR]', error);
  }
}
