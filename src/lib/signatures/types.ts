/**
 * Signature Types
 * 
 * Type definitions for EDU-010 signature system with document version binding.
 * 
 * Note: Using 'any' types where necessary for Supabase client compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// Enums
// ============================================================================

export type SignatureRequestStatus = 
  | 'PENDING' 
  | 'COMPLETED' 
  | 'REJECTED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export type SignatureStatus = 
  | 'PENDING' 
  | 'SIGNED' 
  | 'FAILED' 
  | 'EXPIRED';

export type SignatureType = 
  | 'ACKNOWLEDGMENT' 
  | 'APPROVAL_SIGNATURE' 
  | 'AUTHORIZATION';

// ============================================================================
// Database Types
// ============================================================================

export interface SignatureRequest {
  id: string;
  institution_id: string;
  workflow_instance_id: string | null;
  workflow_instance_step_id: string | null;
  approval_request_id: string | null;
  document_id: string;
  document_version_id: string; // REQUIRED: Exact version binding
  signature_type: SignatureType;
  title: string;
  description: string | null;
  requested_by: string;
  signer_id: string;
  status: SignatureRequestStatus;
  signed_at: string | null;
  signature_id: string | null;
  expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Signature {
  id: string;
  institution_id: string;
  approval_id: string | null;
  workflow_instance_id: string;
  document_id: string;
  document_version_id: string; // REQUIRED: Exact version binding
  signature_request_id: string | null;
  signer_id: string;
  requested_by: string | null;
  signature_type: string | null;
  signature_provider: string | null;
  signature_reference: string | null;
  signature_data: Record<string, any>;
  status: SignatureStatus;
  failed_reason: string | null;
  expires_at: string | null;
  created_at: string;
  signed_at: string | null;
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateSignatureRequestInput {
  document_id: string;
  document_version_id: string; // REQUIRED: Must specify exact version
  workflow_instance_id?: string;
  workflow_instance_step_id?: string;
  approval_request_id?: string;
  signature_type: SignatureType;
  title: string;
  description?: string;
  signer_id: string;
  expires_at?: Date;
  metadata?: Record<string, any>;
}

export interface CompleteSignatureInput {
  request_id: string;
  signature_provider?: string;
  signature_reference?: string;
  signature_data?: Record<string, any>;
}

export interface RejectSignatureInput {
  request_id: string;
  reason: string;
}

export interface CancelSignatureRequestInput {
  request_id: string;
  reason?: string;
}

// ============================================================================
// Query Types
// ============================================================================

export interface ListSignatureRequestsParams {
  status?: SignatureRequestStatus | SignatureRequestStatus[];
  signer_id?: string;
  requested_by?: string;
  document_id?: string;
  document_version_id?: string;
  workflow_instance_id?: string;
  limit?: number;
  offset?: number;
}

export interface SignatureRequestWithRelations extends SignatureRequest {
  requester?: {
    id: string;
    display_name: string;
    email: string;
  };
  signer?: {
    id: string;
    display_name: string;
    email: string;
  };
  document?: {
    id: string;
    title: string;
    document_type: string;
    description?: string | null;
  };
  document_version?: {
    id: string;
    version_number: number;
    file_size: number;
  };
  workflow_instance?: {
    id: string;
    instance_name: string;
    status: string;
  } | null;
  signature?: Signature | null;
  // Additional properties used in UI but not in base type
  instructions?: string | null;
  signature_method?: string | null;
  signer_ip_address?: string | null;
  signer_user_agent?: string | null;
  signature_data?: Record<string, any> | null;
  workflow_execution_id?: string | null;
}

// ============================================================================
// Service Result Types
// ============================================================================

export interface SignatureServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: SignatureErrorCode;
}

export type SignatureErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'INVALID_STATUS'
  | 'EXPIRED'
  | 'ALREADY_SIGNED'
  | 'VERSION_MISMATCH'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR';

// ============================================================================
// Authorization Types
// ============================================================================

export interface SignatureAuthorizationContext {
  user_id: string;
  institution_id: string;
  role: string;
}

export interface CanSignResult {
  authorized: boolean;
  reason?: string;
}
