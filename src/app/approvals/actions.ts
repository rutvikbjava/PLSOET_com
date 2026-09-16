/**
 * EDU-010: Approval Server Actions
 * 
 * Next.js server actions for approval request management.
 * All operations require authentication and proper authorization.
 */

'use server';

import { revalidatePath } from 'next/cache';
import {
  createApprovalRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  getApprovalRequest,
  listApprovalRequests,
  canApprove,
} from '@/lib/approvals';
import type {
  CreateApprovalRequestInput,
  ApproveRequestInput,
  RejectRequestInput,
  CancelRequestInput,
  ListApprovalRequestsParams,
} from '@/lib/approvals/types';

// ============================================================================
// Create Approval Request
// ============================================================================

export async function createApprovalRequestAction(input: CreateApprovalRequestInput) {
  const result = await createApprovalRequest(input);

  if (result.success) {
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
  }

  return result;
}

// ============================================================================
// Approve Request
// ============================================================================

export async function approveRequestAction(input: ApproveRequestInput) {
  const result = await approveRequest(input);

  if (result.success) {
    revalidatePath('/approvals');
    revalidatePath(`/approvals/${input.request_id}`);
    revalidatePath('/dashboard');
    revalidatePath('/workflows');
  }

  return result;
}

// ============================================================================
// Reject Request
// ============================================================================

export async function rejectRequestAction(input: RejectRequestInput) {
  const result = await rejectRequest(input);

  if (result.success) {
    revalidatePath('/approvals');
    revalidatePath(`/approvals/${input.request_id}`);
    revalidatePath('/dashboard');
    revalidatePath('/workflows');
  }

  return result;
}

// ============================================================================
// Cancel Request
// ============================================================================

export async function cancelRequestAction(input: CancelRequestInput) {
  const result = await cancelRequest(input);

  if (result.success) {
    revalidatePath('/approvals');
    revalidatePath(`/approvals/${input.request_id}`);
    revalidatePath('/dashboard');
  }

  return result;
}

// ============================================================================
// Get Approval Request
// ============================================================================

export async function getApprovalRequestAction(requestId: string) {
  return await getApprovalRequest(requestId);
}

// ============================================================================
// List Approval Requests
// ============================================================================

export async function listApprovalRequestsAction(params?: ListApprovalRequestsParams) {
  return await listApprovalRequests(params);
}

// ============================================================================
// Check If User Can Approve
// ============================================================================

export async function canApproveAction(requestId: string) {
  // Get current user from session
  const { requireAuth } = await import('@/lib/auth/session');
  const session = await requireAuth();
  
  return await canApprove(requestId, session.userId);
}

// ============================================================================
// Get Pending Approvals Count (for badge)
// ============================================================================

export async function getPendingApprovalsCountAction() {
  const result = await listApprovalRequests({
    status: 'PENDING',
    limit: 100, // Get all pending to count
  });

  if (!result.success) {
    return { success: false as const, count: 0 };
  }

  return {
    success: true as const,
    count: result.data?.length || 0,
  };
}
