/**
 * Notification Types
 * 
 * Type definitions for EDU-010 notification system with email provider abstraction.
 * 
 * Note: Using 'any' types where necessary for Supabase client compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// Enums
// ============================================================================

export type NotificationStatus = 
  | 'UNREAD' 
  | 'READ' 
  | 'ARCHIVED';

export type NotificationDeliveryStatus = 
  | 'PENDING' 
  | 'SENT' 
  | 'FAILED' 
  | 'RETRYING';

export type NotificationDeliveryChannel = 
  | 'IN_APP' 
  | 'EMAIL';

// ============================================================================
// Notification Types (Constants)
// ============================================================================

export const NOTIFICATION_TYPES = {
  // Approval
  APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
  APPROVAL_APPROVED: 'APPROVAL_APPROVED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  APPROVAL_CANCELLED: 'APPROVAL_CANCELLED',
  APPROVAL_EXPIRED: 'APPROVAL_EXPIRED',
  
  // Signature
  SIGNATURE_REQUESTED: 'SIGNATURE_REQUESTED',
  SIGNATURE_COMPLETED: 'SIGNATURE_COMPLETED',
  SIGNATURE_REJECTED: 'SIGNATURE_REJECTED',
  SIGNATURE_CANCELLED: 'SIGNATURE_CANCELLED',
  SIGNATURE_EXPIRED: 'SIGNATURE_EXPIRED',
  
  // Workflow
  WORKFLOW_STARTED: 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
  WORKFLOW_FAILED: 'WORKFLOW_FAILED',
  WORKFLOW_WAITING: 'WORKFLOW_WAITING',
  WORKFLOW_RESUMED: 'WORKFLOW_RESUMED',
  
  // Document
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_PROCESSED: 'DOCUMENT_PROCESSED',
  DOCUMENT_SHARED: 'DOCUMENT_SHARED',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// ============================================================================
// Database Types
// ============================================================================

export interface Notification {
  id: string;
  institution_id: string;
  recipient_id: string;
  notification_type: string;
  title: string;
  message: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  status: NotificationStatus;
  delivery_status: NotificationDeliveryStatus;
  delivery_channel: NotificationDeliveryChannel;
  sent_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  retry_count: number;
  email_provider: string | null;
  email_message_id: string | null;
  created_at: string;
  read_at: string | null;
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateNotificationInput {
  recipient_id: string;
  notification_type: NotificationType;
  title: string;
  message?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  delivery_channel?: NotificationDeliveryChannel;
  metadata?: Record<string, any>;
}

export interface SendEmailNotificationInput extends CreateNotificationInput {
  delivery_channel: 'EMAIL';
  email_subject: string;
  email_html: string;
  email_text: string;
}

export interface MarkNotificationReadInput {
  notification_id: string;
}

export interface ArchiveNotificationInput {
  notification_id: string;
}

// ============================================================================
// Query Types
// ============================================================================

export interface ListNotificationsParams {
  status?: NotificationStatus | NotificationStatus[];
  delivery_status?: NotificationDeliveryStatus;
  notification_type?: NotificationType | NotificationType[];
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationWithRecipient extends Notification {
  recipient?: {
    id: string;
    display_name: string;
    email: string;
  };
}

// ============================================================================
// Email Provider Types
// ============================================================================

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  sendEmail(params: EmailParams): Promise<EmailResult>;
  getName(): string;
}

// ============================================================================
// Service Result Types
// ============================================================================

export interface NotificationServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: NotificationErrorCode;
}

export type NotificationErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RECIPIENT_NOT_FOUND'
  | 'DELIVERY_FAILED'
  | 'MAX_RETRIES_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR';

// ============================================================================
// Delivery Types
// ============================================================================

export interface DeliveryAttempt {
  notification_id: string;
  attempt_number: number;
  channel: NotificationDeliveryChannel;
  result: 'SUCCESS' | 'FAILURE';
  error?: string;
  timestamp: Date;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelays: number[]; // Delays in milliseconds
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelays: [60000, 300000, 900000], // 1min, 5min, 15min
};
