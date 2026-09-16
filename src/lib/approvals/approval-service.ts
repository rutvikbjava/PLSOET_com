/**
 * Approval Service
 * 
 * Manages approval request lifecycle with state machine and authorization.
 * 
 * State Machine:
 * PENDING → APPROVED (via approveRequest)
 * PENDING → REJECTED (via rejectRequest)
 * PENDING → CANCELLED (via cancelRequest)
 * PENDING → EXPIRED (via checkExpiredRequests)
 * 
 * Security:
 * - Self-approval prevention (database CHECK constraint + validation)
 * - Institution isolation via RLS
 * - Authorization checks on all operations
 * 
 * Note: Using 'any' types where necessary for Supabase client compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import type {
  ApprovalRequest,
  ApprovalRequestWithRelations,
  CreateApprovalRequestInput,
  ApproveRequestInput,
  RejectRequestInput,
  CancelRequestInput,
  ListApprovalRequestsParams,
  ApprovalServiceResult,
  CanApproveResult,
} from './types';

// ============================================================================
// Create Approval Request
// ============================================================================

export async function createApprovalRequest(
  input: CreateApprovalRequestInput
): Promise<ApprovalServiceResult<ApprovalRequest>> {
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

    if (!input.approver_id && !input.approver_role) {
      return {
        success: false,
        error: 'Either approver_id or approver_role must be specified',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Prevent self-approval at validation level (database has CHECK constraint too)
    if (input.approver_id === session.userId) {
      return {
        success: false,
        error: 'Cannot approve your own request',
        errorCode: 'SELF_APPROVAL',
      };
    }

    // Create approval request
    const { data, error } = await (adminSupabase
      .from('approval_requests') as any)
      .insert({
        institution_id: profile.institution_id,
        workflow_instance_id: input.workflow_instance_id || null,
        workflow_instance_step_id: input.workflow_instance_step_id || null,
        document_id: input.document_id,
        document_version_id: input.document_version_id || null,
        request_type: input.request_type,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        requested_by: session.userId,
        approver_id: input.approver_id || null,
        approver_role: input.approver_role || null,
        status: 'PENDING',
        expires_at: input.expires_at?.toISOString() || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[APPROVAL_SERVICE_CREATE_ERROR]', error);
      return {
        success: false,
        error: 'Failed to create approval request',
        errorCode: 'DATABASE_ERROR',
      };
    }

    // Create audit event
    await createAuditEvent({
      institution_id: profile.institution_id,
      actor_id: session.userId,
      event_type: 'APPROVAL_REQUESTED',
      entity_type: 'approval_request',
      entity_id: data.id,
      event_data: {
        request_type: input.request_type,
        document_id: input.document_id,
        approver_id: input.approver_id,
        approver_role: input.approver_role,
      },
    });

    // Send notification to approver
    if (input.approver_id) {
      await createNotification({
        institution_id: profile.institution_id,
        recipient_id: input.approver_id,
        notification_type: 'APPROVAL_REQUESTED',
        title: `Approval Request: ${input.title}`,
        message: input.description || undefined,
        related_entity_type: 'approval_request',
        related_entity_id: data.id,
      });
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[APPROVAL_SERVICE_CREATE_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Get Approval Request
// ============================================================================

export async function getApprovalRequest(
  requestId: string
): Promise<ApprovalServiceResult<ApprovalRequestWithRelations>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('approval_requests')
      .select(`
        *,
        requester:requested_by(id, display_name, email),
        approver:approver_id(id, display_name, email),
        decider:decided_by(id, display_name, email),
        document:documents(id, title, document_type),
        workflow_instance:workflow_instances(id, instance_name, status)
      `)
      .eq('id', requestId)
      .eq('institution_id', profile.institution_id)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Approval request not found',
        errorCode: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      data: data as any,
    };
  } catch (error) {
    console.error('[APPROVAL_SERVICE_GET_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// List Approval Requests
// ============================================================================

export async function listApprovalRequests(
  params: ListApprovalRequestsParams = {}
): Promise<ApprovalServiceResult<ApprovalRequestWithRelations[]>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    let query = supabase
      .from('approval_requests')
      .select(`
        *,
        requester:requested_by(id, display_name, email),
        approver:approver_id(id, display_name, email),
        decider:decided_by(id, display_name, email),
        document:documents(id, title, document_type),
        workflow_instance:workflow_instances(id, instance_name, status)
      `)
      .eq('institution_id', profile.institution_id);

    // Apply filters
    if (params.status) {
      if (Array.isArray(params.status)) {
        query = query.in('status', params.status);
      } else {
        query = query.eq('status', params.status);
      }
    }

    if (params.approver_id) {
      query = query.eq('approver_id', params.approver_id);
    }

    if (params.requested_by) {
      query = query.eq('requested_by', params.requested_by);
    }

    if (params.document_id) {
      query = query.eq('document_id', params.document_id);
    }

    if (params.workflow_instance_id) {
      query = query.eq('workflow_instance_id', params.workflow_instance_id);
    }

    // Pagination
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[APPROVAL_SERVICE_LIST_ERROR]', error);
      return {
        success: false,
        error: 'Failed to list approval requests',
        errorCode: 'DATABASE_ERROR',
      };
    }

    return {
      success: true,
      data: (data as any) || [],
    };
  } catch (error) {
    console.error('[APPROVAL_SERVICE_LIST_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Approve Request
// ============================================================================

export async function approveRequest(
  input: ApproveRequestInput
): Promise<ApprovalServiceResult<ApprovalRequest>> {
  try {
    const session = await requireAuth();
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    // Get the request
    const { data: request, error: fetchError } = await adminSupabase
      .from('approval_requests')
      .select('*')
      .eq('id', input.request_id)
      .eq('institution_id', profile.institution_id)
      .single();

    if (fetchError || !request) {
      return {
        success: false,
        error: 'Approval request not found',
        errorCode: 'NOT_FOUND',
      };
    }

    // Cast to any to work around Supabase type issues
    const typedRequest = request as any;

    // Check authorization
    const authCheck = await canApprove(input.request_id, session.userId);
    if (!authCheck.authorized) {
      return {
        success: false,
        error: authCheck.reason || 'Not authorized to approve this request',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Check status
    if (typedRequest.status !== 'PENDING') {
      return {
        success: false,
        error: `Cannot approve request with status ${typedRequest.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // Check expiration
    if (typedRequest.expires_at && new Date(typedRequest.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Approval request has expired',
        errorCode: 'EXPIRED',
      };
    }

    // Update approval request status
    const { data, error } = await (adminSupabase
      .from('approval_requests') as any)
      .update({
        status: 'APPROVED',
        decision: 'APPROVED',
        decision_comments: input.comments || null,
        decided_by: session.userId,
        decided_at: new Date().toISOString(),
      })
      .eq('id', input.request_id)
      .eq('status', 'PENDING') // Optimistic locking
      .select()
      .single();

    if (error || !data) {
      console.error('[APPROVAL_SERVICE_APPROVE_ERROR]', error);
      return {
        success: false,
        error: 'Failed to approve request (may have been already decided)',
        errorCode: 'ALREADY_DECIDED',
      };
    }

    // Create immutable approval record in EDU-004 approvals table
    await createApprovalRecord({
      institution_id: profile.institution_id,
      workflow_instance_id: typedRequest.workflow_instance_id,
      workflow_instance_step_id: typedRequest.workflow_instance_step_id,
      document_id: typedRequest.document_id,
      approver_id: session.userId,
      decision: 'APPROVED',
      comments: input.comments || null,
      metadata: {
        approval_request_id: typedRequest.id,
        request_type: typedRequest.request_type,
      },
    });

    // Create audit event
    await createAuditEvent({
      institution_id: profile.institution_id,
      actor_id: session.userId,
      event_type: 'APPROVAL_APPROVED',
      entity_type: 'approval_request',
      entity_id: data.id,
      event_data: {
        decision: 'APPROVED',
        comments: input.comments,
        document_id: typedRequest.document_id,
      },
    });

    // Send notification to requester
    await createNotification({
      institution_id: profile.institution_id,
      recipient_id: typedRequest.requested_by,
      notification_type: 'APPROVAL_APPROVED',
      title: `Approved: ${typedRequest.title}`,
      message: input.comments || undefined,
      related_entity_type: 'approval_request',
      related_entity_id: data.id,
    });

    // Resume workflow if linked
    if (typedRequest.workflow_instance_id && typedRequest.workflow_instance_step_id) {
      await resumeWorkflowAfterApproval(
        typedRequest.workflow_instance_id,
        typedRequest.workflow_instance_step_id
      );
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[APPROVAL_SERVICE_APPROVE_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Reject Request
// ============================================================================

export async function rejectRequest(
  input: RejectRequestInput
): Promise<ApprovalServiceResult<ApprovalRequest>> {
  try {
    const session = await requireAuth();
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    if (!input.comments?.trim()) {
      return {
        success: false,
        error: 'Comments are required for rejection',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Get the request
    const { data: request, error: fetchError } = await adminSupabase
      .from('approval_requests')
      .select('*')
      .eq('id', input.request_id)
      .eq('institution_id', profile.institution_id)
      .single();

    if (fetchError || !request) {
      return {
        success: false,
        error: 'Approval request not found',
        errorCode: 'NOT_FOUND',
      };
    }

    // Cast to any to work around Supabase type issues
    const typedRequest = request as any;

    // Check authorization
    const authCheck = await canApprove(input.request_id, session.userId);
    if (!authCheck.authorized) {
      return {
        success: false,
        error: authCheck.reason || 'Not authorized to reject this request',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Check status
    if (typedRequest.status !== 'PENDING') {
      return {
        success: false,
        error: `Cannot reject request with status ${typedRequest.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // Update approval request status
    const { data, error } = await (adminSupabase
      .from('approval_requests') as any)
      .update({
        status: 'REJECTED',
        decision: 'REJECTED',
        decision_comments: input.comments.trim(),
        decided_by: session.userId,
        decided_at: new Date().toISOString(),
      })
      .eq('id', input.request_id)
      .eq('status', 'PENDING')
      .select()
      .single();

    if (error || !data) {
      console.error('[APPROVAL_SERVICE_REJECT_ERROR]', error);
      return {
        success: false,
        error: 'Failed to reject request (may have been already decided)',
        errorCode: 'ALREADY_DECIDED',
      };
    }

    // Create immutable approval record
    await createApprovalRecord({
      institution_id: profile.institution_id,
      workflow_instance_id: typedRequest.workflow_instance_id,
      workflow_instance_step_id: typedRequest.workflow_instance_step_id,
      document_id: typedRequest.document_id,
      approver_id: session.userId,
      decision: 'REJECTED',
      comments: input.comments.trim(),
      metadata: {
        approval_request_id: typedRequest.id,
        request_type: typedRequest.request_type,
      },
    });

    // Create audit event
    await createAuditEvent({
      institution_id: profile.institution_id,
      actor_id: session.userId,
      event_type: 'APPROVAL_REJECTED',
      entity_type: 'approval_request',
      entity_id: data.id,
      event_data: {
        decision: 'REJECTED',
        comments: input.comments,
        document_id: typedRequest.document_id,
      },
    });

    // Send notification to requester
    await createNotification({
      institution_id: profile.institution_id,
      recipient_id: typedRequest.requested_by,
      notification_type: 'APPROVAL_REJECTED',
      title: `Rejected: ${typedRequest.title}`,
      message: input.comments,
      related_entity_type: 'approval_request',
      related_entity_id: data.id,
    });

    // Resume workflow if linked (rejection path)
    if (typedRequest.workflow_instance_id && typedRequest.workflow_instance_step_id) {
      await resumeWorkflowAfterApproval(
        typedRequest.workflow_instance_id,
        typedRequest.workflow_instance_step_id,
        'REJECTED'
      );
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[APPROVAL_SERVICE_REJECT_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Cancel Request
// ============================================================================

export async function cancelRequest(
  input: CancelRequestInput
): Promise<ApprovalServiceResult<ApprovalRequest>> {
  try {
    const session = await requireAuth();
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    // Get the request
    const { data: request, error: fetchError } = await adminSupabase
      .from('approval_requests')
      .select('*')
      .eq('id', input.request_id)
      .eq('institution_id', profile.institution_id)
      .single();

    if (fetchError || !request) {
      return {
        success: false,
        error: 'Approval request not found',
        errorCode: 'NOT_FOUND',
      };
    }

    // Cast to any to work around Supabase type issues
    const typedRequest = request as any;

    // Check authorization (only requester or admin can cancel)
    const isRequester = typedRequest.requested_by === session.userId;
    const isAdmin = ['ADMIN', 'SYSTEM_ADMIN'].includes(profile.role);

    if (!isRequester && !isAdmin) {
      return {
        success: false,
        error: 'Not authorized to cancel this request',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Check status
    if (typedRequest.status !== 'PENDING') {
      return {
        success: false,
        error: `Cannot cancel request with status ${typedRequest.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // Update status
    const { data, error } = await (adminSupabase
      .from('approval_requests') as any)
      .update({
        status: 'CANCELLED',
        decision_comments: input.reason || 'Cancelled by requester',
      })
      .eq('id', input.request_id)
      .eq('status', 'PENDING')
      .select()
      .single();

    if (error || !data) {
      console.error('[APPROVAL_SERVICE_CANCEL_ERROR]', error);
      return {
        success: false,
        error: 'Failed to cancel request',
        errorCode: 'DATABASE_ERROR',
      };
    }

    // Create audit event
    await createAuditEvent({
      institution_id: profile.institution_id,
      actor_id: session.userId,
      event_type: 'APPROVAL_CANCELLED',
      entity_type: 'approval_request',
      entity_id: data.id,
      event_data: {
        reason: input.reason,
        cancelled_by: session.userId,
      },
    });

    // Send notification to approver if assigned
    if (typedRequest.approver_id && typedRequest.approver_id !== session.userId) {
      await createNotification({
        institution_id: profile.institution_id,
        recipient_id: typedRequest.approver_id,
        notification_type: 'APPROVAL_CANCELLED',
        title: `Cancelled: ${typedRequest.title}`,
        message: input.reason || undefined,
        related_entity_type: 'approval_request',
        related_entity_id: data.id,
      });
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[APPROVAL_SERVICE_CANCEL_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Check Authorization
// ============================================================================

export async function canApprove(
  requestId: string,
  userId: string
): Promise<CanApproveResult> {
  try {
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    const { data: request, error } = await adminSupabase
      .from('approval_requests')
      .select('*')
      .eq('id', requestId)
      .eq('institution_id', profile.institution_id)
      .single();

    if (error || !request) {
      return {
        authorized: false,
        reason: 'Approval request not found',
      };
    }

    // Cast to any
    const typedRequest = request as any;

    // Self-approval check
    if (typedRequest.requested_by === userId) {
      return {
        authorized: false,
        reason: 'Cannot approve your own request',
      };
    }

    // Check if user is assigned approver
    if (typedRequest.approver_id === userId) {
      return { authorized: true };
    }

    // Check if user has required role
    if (typedRequest.approver_role) {
      const userProfile = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .eq('institution_id', profile.institution_id)
        .single();

      const typedUserProfile = userProfile.data as any;

      if (typedUserProfile?.role === typedRequest.approver_role) {
        return { authorized: true };
      }
    }

    // Admin override
    if (['ADMIN', 'SYSTEM_ADMIN'].includes(profile.role)) {
      return { authorized: true };
    }

    return {
      authorized: false,
      reason: 'Not assigned as approver for this request',
    };
  } catch (error) {
    console.error('[APPROVAL_SERVICE_CAN_APPROVE_ERROR]', error);
    return {
      authorized: false,
      reason: 'Authorization check failed',
    };
  }
}

// ============================================================================
// Check Expired Requests (Background Job)
// ============================================================================

export async function checkExpiredRequests(): Promise<number> {
  try {
    const adminSupabase = getAdminClient();

    const { data, error } = await (adminSupabase
      .from('approval_requests') as any)
      .update({
        status: 'EXPIRED',
      })
      .eq('status', 'PENDING')
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null)
      .select('id, institution_id, requested_by, title');

    if (error) {
      console.error('[APPROVAL_SERVICE_CHECK_EXPIRED_ERROR]', error);
      return 0;
    }

    // Create audit events and notifications for expired requests
    if (data && data.length > 0) {
      for (const request of data) {
        await createAuditEvent({
          institution_id: request.institution_id,
          actor_id: null,
          event_type: 'APPROVAL_EXPIRED',
          entity_type: 'approval_request',
          entity_id: request.id,
          event_data: {
            expired_at: new Date().toISOString(),
          },
        });

        await createNotification({
          institution_id: request.institution_id,
          recipient_id: request.requested_by,
          notification_type: 'APPROVAL_EXPIRED',
          title: `Expired: ${request.title}`,
          message: 'The approval request has expired without a decision.',
          related_entity_type: 'approval_request',
          related_entity_id: request.id,
        });
      }
    }

    return data?.length || 0;
  } catch (error) {
    console.error('[APPROVAL_SERVICE_CHECK_EXPIRED_ERROR]', error);
    return 0;
  }
}

// ============================================================================
// Helper: Create Immutable Approval Record
// ============================================================================

async function createApprovalRecord(input: {
  institution_id: string;
  workflow_instance_id: string | null;
  workflow_instance_step_id: string | null;
  document_id: string;
  approver_id: string;
  decision: string;
  comments: string | null;
  metadata: Record<string, any>;
}): Promise<void> {
  try {
    const adminSupabase = getAdminClient();

    await (adminSupabase
      .from('approvals') as any)
      .insert({
        institution_id: input.institution_id,
        workflow_instance_id: input.workflow_instance_id,
        workflow_instance_step_id: input.workflow_instance_step_id,
        document_id: input.document_id,
        approver_id: input.approver_id,
        decision: input.decision,
        comments: input.comments,
        metadata: input.metadata,
      });
  } catch (error) {
    console.error('[APPROVAL_SERVICE_CREATE_APPROVAL_RECORD_ERROR]', error);
    // Don't throw - this is a best-effort operation
  }
}

// ============================================================================
// Helper: Create Audit Event
// ============================================================================

async function createAuditEvent(input: {
  institution_id: string;
  actor_id: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string;
  event_data: Record<string, any>;
}): Promise<void> {
  try {
    const adminSupabase = getAdminClient();

    await (adminSupabase
      .from('audit_events') as any)
      .insert({
        institution_id: input.institution_id,
        actor_id: input.actor_id,
        event_type: input.event_type,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        event_data: input.event_data,
      });
  } catch (error) {
    console.error('[APPROVAL_SERVICE_CREATE_AUDIT_ERROR]', error);
    // Don't throw - audit is best-effort
  }
}

// ============================================================================
// Helper: Create Notification
// ============================================================================

async function createNotification(input: {
  institution_id: string;
  recipient_id: string;
  notification_type: string;
  title: string;
  message?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}): Promise<void> {
  try {
    const adminSupabase = getAdminClient();

    // Try to create notification (idempotency constraint may prevent duplicates)
    await (adminSupabase
      .from('notifications') as any)
      .insert({
        institution_id: input.institution_id,
        recipient_id: input.recipient_id,
        notification_type: input.notification_type,
        title: input.title,
        message: input.message || null,
        related_entity_type: input.related_entity_type || null,
        related_entity_id: input.related_entity_id || null,
        status: 'UNREAD',
        delivery_status: 'PENDING',
        delivery_channel: 'IN_APP',
      });
  } catch (error) {
    // Ignore duplicate errors (idempotency constraint)
    const errorMessage = error instanceof Error ? error.message : '';
    if (!errorMessage.includes('duplicate') && !errorMessage.includes('unique')) {
      console.error('[APPROVAL_SERVICE_CREATE_NOTIFICATION_ERROR]', error);
    }
  }
}

// ============================================================================
// Helper: Resume Workflow After Approval
// ============================================================================

async function resumeWorkflowAfterApproval(
  workflowInstanceId: string,
  workflowStepId: string,
  decision: 'APPROVED' | 'REJECTED' = 'APPROVED'
): Promise<void> {
  try {
    // Import workflow execution engine dynamically to avoid circular dependency
    const { resumeWorkflowAfterApproval: resumeWorkflow } = await import(
      '@/lib/workflows/workflow-execution-engine'
    );

    await resumeWorkflow(workflowInstanceId, workflowStepId, decision);
  } catch (error) {
    console.error('[APPROVAL_SERVICE_RESUME_WORKFLOW_ERROR]', error);
    // Don't throw - workflow resumption is best-effort
  }
}
