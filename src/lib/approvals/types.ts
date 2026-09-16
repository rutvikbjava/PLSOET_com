/**
 * Approval Types
 * 
 * Type definitions for EDU-010 approval system.
 * 
 * Note: Using 'any' types where necessary for Supabase client compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// Enums
// ============================================================================

export type ApprovalRequestStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export type ApprovalDecision = 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'RETURNED_FOR_REVISION' 
  | 'DELEGATED';

export type ApprovalRequestType = 
  | 'APPROVAL' 
  | 'REVIEW' 
  | 'SIGN_OFF';

// ============================================================================
// Database Types
// ============================================================================

export interface ApprovalRequest {
  id: string;
  institution_id: string;
  workflow_instance_id: string | null;
  workflow_instance_step_id: string | null;
  document_id: string;
  document_version_id: string | null;
  request_type: ApprovalRequestType;
  title: string;
  description: string | null;
  requested_by: string;
  approver_id: string | null;
  approver_role: string | null;
  status: ApprovalRequestStatus;
  decision: ApprovalDecision | null;
  decision_comments: string | null;
  decided_by: string | null;
  decided_at: string | null;
  expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  institution_id: string;
  workflow_instance_id: string;
  workflow_instance_step_id: string | null;
  document_id: string;
  approver_id: string;
  decision: ApprovalDecision;
  comments: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateApprovalRequestInput {
  document_id: string;
  document_version_id?: string;
  workflow_instance_id?: string;
  workflow_instance_step_id?: string;
  request_type: ApprovalRequestType;
  title: string;
  description?: string;
  approver_id?: string;
  approver_role?: string;
  expires_at?: Date;
  metadata?: Record<string, any>;
}

export interface ApproveRequestInput {
  request_id: string;
  comments?: string;
}

export interface RejectRequestInput {
  request_id: string;
  comments: string; // Required for rejection
}

export interface CancelRequestInput {
  request_id: string;
  reason?: string;
}

// ============================================================================
// Query Types
// ============================================================================

export interface ListApprovalRequestsParams {
  status?: ApprovalRequestStatus | ApprovalRequestStatus[];
  approver_id?: string;
  requested_by?: string;
  document_id?: string;
  workflow_instance_id?: string;
  limit?: number;
  offset?: number;
}

export interface ApprovalRequestWithRelations extends ApprovalRequest {
  requester?: {
    id: string;
    display_name: string;
    email: string;
  };
  approver?: {
    id: string;
    display_name: string;
    email: string;
  } | null;
  decider?: {
    id: string;
    display_name: string;
    email: string;
  } | null;
  document?: {
    id: string;
    title: string;
    document_type: string;
  };
  workflow_instance?: {
    id: string;
    instance_name: string;
    status: string;
  } | null;
  // Additional properties used in UI but not in base type
  decision_made_at?: string | null;
  request_description?: string | null;
  request_data?: Record<string, any> | null;
  workflow_execution_id?: string | null;
  related_entity_type?: string | null;
}

// ============================================================================
// Service Result Types
// ============================================================================

export interface ApprovalServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: ApprovalErrorCode;
}

export type ApprovalErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'INVALID_STATUS'
  | 'EXPIRED'
  | 'SELF_APPROVAL'
  | 'ALREADY_DECIDED'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR';

// ============================================================================
// Authorization Types
// ============================================================================

export interface ApprovalAuthorizationContext {
  user_id: string;
  institution_id: string;
  role: string;
}

export interface CanApproveResult {
  authorized: boolean;
  reason?: string;
}
