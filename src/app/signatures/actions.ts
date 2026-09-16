/**
 * EDU-010: Signature Server Actions
 * 
 * Next.js server actions for signature request management.
 * All operations require authentication and proper authorization.
 */

'use server';

import { revalidatePath } from 'next/cache';
import {
  createSignatureRequest,
  completeSignature,
  getSignatureRequest,
  listSignatureRequests,
  canSign,
} from '@/lib/signatures';
import type {
  CreateSignatureRequestInput,
  CompleteSignatureInput,
  ListSignatureRequestsParams,
} from '@/lib/signatures/types';

// ============================================================================
// Create Signature Request
// ============================================================================

export async function createSignatureRequestAction(input: CreateSignatureRequestInput) {
  const result = await createSignatureRequest(input);

  if (result.success) {
    revalidatePath('/signatures');
    revalidatePath('/dashboard');
  }

  return result;
}

// ============================================================================
// Complete Signature (Sign Document)
// ============================================================================

export async function completeSignatureAction(input: CompleteSignatureInput) {
  const result = await completeSignature(input);

  if (result.success) {
    revalidatePath('/signatures');
    revalidatePath(`/signatures/${input.request_id}`);
    revalidatePath('/dashboard');
    revalidatePath('/workflows');
    
    // Revalidate document pages
    if (result.data?.document_id) {
      revalidatePath(`/documents/${result.data.document_id}`);
    }
  }

  return result;
}

// ============================================================================
// Get Signature Request
// ============================================================================

export async function getSignatureRequestAction(requestId: string) {
  return await getSignatureRequest(requestId);
}

// ============================================================================
// List Signature Requests
// ============================================================================

export async function listSignatureRequestsAction(params?: ListSignatureRequestsParams) {
  return await listSignatureRequests(params);
}

// ============================================================================
// Check If User Can Sign
// ============================================================================

export async function canSignAction(requestId: string) {
  // Get current user from session
  const { requireAuth } = await import('@/lib/auth/session');
  const session = await requireAuth();
  
  return await canSign(requestId, session.userId);
}

// ============================================================================
// Get Pending Signatures Count (for badge)
// ============================================================================

export async function getPendingSignaturesCountAction() {
  const result = await listSignatureRequests({
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
