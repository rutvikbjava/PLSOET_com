/**
 * Notification Service
 * 
 * Manages notifications with dual-channel delivery (IN_APP + EMAIL).
 * 
 * Features:
 * - IN_APP notifications always succeed (database insert)
 * - EMAIL notifications with retry logic (max 3 attempts)
 * - Idempotency via unique constraint
 * - Email provider abstraction
 * 
 * Note: Using 'any' types where necessary for Supabase client compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import { getEmailProvider } from './email-providers';
import type {
  Notification,
  NotificationWithRecipient,
  CreateNotificationInput,
  SendEmailNotificationInput,
  MarkNotificationReadInput,
  ArchiveNotificationInput,
  ListNotificationsParams,
  NotificationServiceResult,
  RetryConfig,
} from './types';
import { DEFAULT_RETRY_CONFIG } from './types';

// ============================================================================
// Create Notification (IN_APP only)
// ============================================================================

export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationServiceResult<Notification>> {
  try {
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    // Validate
    if (!input.title?.trim()) {
      return {
        success: false,
        error: 'Title is required',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Verify recipient exists and is in same institution
    const { data: recipient, error: recipientError } = await adminSupabase
      .from('profiles')
      .select('id, institution_id, email')
      .eq('id', input.recipient_id)
      .eq('institution_id', profile.institution_id)
      .single();

    if (recipientError || !recipient) {
      return {
        success: false,
        error: 'Recipient not found or not in same institution',
        errorCode: 'RECIPIENT_NOT_FOUND',
      };
    }

    // Create notification (IN_APP channel)
    const { data, error } = await (adminSupabase
      .from('notifications') as any)
      .insert({
        institution_id: profile.institution_id,
        recipient_id: input.recipient_id,
        notification_type: input.notification_type,
        title: input.title.trim(),
        message: input.message?.trim() || null,
        related_entity_type: input.related_entity_type || null,
        related_entity_id: input.related_entity_id || null,
        status: 'UNREAD',
        delivery_status: 'SENT', // IN_APP always succeeds
        delivery_channel: input.delivery_channel || 'IN_APP',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Check if duplicate (idempotency constraint)
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        // Duplicate notification prevented (idempotency) - silently succeed
        return {
          success: true,
          data: null as any, // Notification already exists
        };
      }

      console.error('[NOTIFICATION_SERVICE_CREATE_ERROR]', error);
      return {
        success: false,
        error: 'Failed to create notification',
        errorCode: 'DATABASE_ERROR',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE_CREATE_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Create Email Notification (IN_APP + EMAIL)
// ============================================================================

export async function createEmailNotification(
  input: SendEmailNotificationInput
): Promise<NotificationServiceResult<Notification>> {
  try {
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    // Validate
    if (!input.title?.trim()) {
      return {
        success: false,
        error: 'Title is required',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    if (!input.email_subject?.trim() || !input.email_html || !input.email_text) {
      return {
        success: false,
        error: 'Email subject, HTML, and text are required for EMAIL notifications',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Verify recipient
    const { data: recipient, error: recipientError } = await adminSupabase
      .from('profiles')
      .select('id, institution_id, email')
      .eq('id', input.recipient_id)
      .eq('institution_id', profile.institution_id)
      .single();

    if (recipientError || !recipient) {
      return {
        success: false,
        error: 'Recipient not found',
        errorCode: 'RECIPIENT_NOT_FOUND',
      };
    }

    const typedRecipient = recipient as any;

    // Create notification with EMAIL channel and PENDING status
    const { data, error } = await (adminSupabase
      .from('notifications') as any)
      .insert({
        institution_id: profile.institution_id,
        recipient_id: input.recipient_id,
        notification_type: input.notification_type,
        title: input.title.trim(),
        message: input.message?.trim() || null,
        related_entity_type: input.related_entity_type || null,
        related_entity_id: input.related_entity_id || null,
        status: 'UNREAD',
        delivery_status: 'PENDING', // EMAIL requires actual delivery
        delivery_channel: 'EMAIL',
        retry_count: 0,
      })
      .select()
      .single();

    if (error) {
      // Check idempotency
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        // Duplicate email notification prevented (idempotency) - silently succeed
        return {
          success: true,
          data: null as any,
        };
      }

      console.error('[NOTIFICATION_SERVICE_CREATE_EMAIL_ERROR]', error);
      return {
        success: false,
        error: 'Failed to create email notification',
        errorCode: 'DATABASE_ERROR',
      };
    }

    // Attempt to deliver email immediately
    await deliverNotification(data.id, {
      to: typedRecipient.email as string,
      subject: input.email_subject,
      html: input.email_html,
      text: input.email_text,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE_CREATE_EMAIL_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Deliver Notification (EMAIL channel)
// ============================================================================

export async function deliverNotification(
  notificationId: string,
  emailParams?: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }
): Promise<NotificationServiceResult<void>> {
  try {
    const adminSupabase = getAdminClient();

    // Get notification
    const { data: notification, error: fetchError } = await adminSupabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      return {
        success: false,
        error: 'Notification not found',
        errorCode: 'NOT_FOUND',
      };
    }

    // Cast to any
    const typedNotification = notification as any;

    // Only deliver EMAIL channel notifications
    if (typedNotification.delivery_channel !== 'EMAIL') {
      return {
        success: true, // IN_APP notifications are already delivered
      };
    }

    // Check if already sent
    if (typedNotification.delivery_status === 'SENT') {
      return {
        success: true, // Already delivered
      };
    }

    // Get email provider
    const emailProvider = getEmailProvider();

    // Send email
    const result = await emailProvider.sendEmail({
      to: emailParams!.to,
      subject: emailParams!.subject,
      html: emailParams!.html,
      text: emailParams!.text,
      metadata: {
        notification_id: notificationId,
        notification_type: typedNotification.notification_type,
      },
    });

    if (result.success) {
      // Update notification as SENT
      await (adminSupabase
        .from('notifications') as any)
        .update({
          delivery_status: 'SENT',
          sent_at: new Date().toISOString(),
          email_provider: emailProvider.getName(),
          email_message_id: result.messageId || null,
        })
        .eq('id', notificationId);

      return {
        success: true,
      };
    } else {
      // Update as FAILED
      await (adminSupabase
        .from('notifications') as any)
        .update({
          delivery_status: 'FAILED',
          failed_at: new Date().toISOString(),
          failure_reason: result.error || 'Unknown error',
          retry_count: typedNotification.retry_count + 1,
        })
        .eq('id', notificationId);

      return {
        success: false,
        error: result.error || 'Email delivery failed',
        errorCode: 'DELIVERY_FAILED',
      };
    }
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE_DELIVER_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Retry Failed Notifications
// ============================================================================

export async function retryFailedNotifications(
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<number> {
  try {
    const adminSupabase = getAdminClient();

    // Get failed EMAIL notifications that haven't exceeded max retries
    const { data: failedNotifications, error } = await adminSupabase
      .from('notifications')
      .select('*, recipient:profiles!recipient_id(email)')
      .eq('delivery_channel', 'EMAIL')
      .eq('delivery_status', 'FAILED')
      .lt('retry_count', config.maxRetries)
      .order('failed_at', { ascending: true })
      .limit(50); // Process in batches

    if (error || !failedNotifications || failedNotifications.length === 0) {
      return 0;
    }

    let retriedCount = 0;

    for (const notification of failedNotifications as any[]) {
      // Check if enough time has passed for retry
      const retryDelay = config.retryDelays[notification.retry_count] || config.retryDelays[config.retryDelays.length - 1] || 60000;
      const failedAt = new Date(notification.failed_at);
      const now = new Date();
      const timeSinceFailure = now.getTime() - failedAt.getTime();

      if (timeSinceFailure < retryDelay) {
        continue; // Not time to retry yet
      }

      // Update status to RETRYING
      await (adminSupabase
        .from('notifications') as any)
        .update({
          delivery_status: 'RETRYING',
        })
        .eq('id', notification.id);

      // Attempt delivery (re-generate email content)
      // Note: In production, you'd need to regenerate the email HTML/text
      // For now, we'll just mark as failed again if recipient email is missing
      if (!notification.recipient?.email) {
        await (adminSupabase
          .from('notifications') as any)
          .update({
            delivery_status: 'FAILED',
            failure_reason: 'Recipient email not found',
            retry_count: notification.retry_count + 1,
          })
          .eq('id', notification.id);
        continue;
      }

      // In production: regenerate email content based on notification_type
      // For now, use simple fallback
      const emailProvider = getEmailProvider();
      
      // Cast to any
      const typedNotification = notification as any;
      const typedRecipient = notification.recipient as any;
      
      const result = await emailProvider.sendEmail({
        to: typedRecipient.email,
        subject: typedNotification.title,
        html: `<p>${typedNotification.message || typedNotification.title}</p>`,
        text: typedNotification.message || typedNotification.title,
      });

      if (result.success) {
        await (adminSupabase
          .from('notifications') as any)
          .update({
            delivery_status: 'SENT',
            sent_at: new Date().toISOString(),
            email_provider: emailProvider.getName(),
            email_message_id: result.messageId || null,
          })
          .eq('id', typedNotification.id);

        retriedCount++;
      } else {
        // Check if max retries exceeded
        const newRetryCount = typedNotification.retry_count + 1;
        const isFinalFailure = newRetryCount >= config.maxRetries;

        await (adminSupabase
          .from('notifications') as any)
          .update({
            delivery_status: 'FAILED',
            failed_at: new Date().toISOString(),
            failure_reason: result.error || 'Retry failed',
            retry_count: newRetryCount,
          })
          .eq('id', typedNotification.id);

        if (isFinalFailure) {
          console.error('[NOTIFICATION_SERVICE] Max retries exceeded for notification:', typedNotification.id);
        }
      }
    }

    return retriedCount;
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE_RETRY_ERROR]', error);
    return 0;
  }
}

// ============================================================================
// List Notifications
// ============================================================================

export async function listNotifications(
  userId: string,
  params: ListNotificationsParams = {}
): Promise<NotificationServiceResult<NotificationWithRecipient[]>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    let query = supabase
      .from('notifications')
      .select('*, recipient:profiles!recipient_id(id, display_name, email)')
      .eq('institution_id', profile.institution_id)
      .eq('recipient_id', userId);

    if (params.status) {
      if (Array.isArray(params.status)) {
        query = query.in('status', params.status);
      } else {
        query = query.eq('status', params.status);
      }
    }

    if (params.unread_only) {
      query = query.eq('status', 'UNREAD');
    }

    if (params.notification_type) {
      if (Array.isArray(params.notification_type)) {
        query = query.in('notification_type', params.notification_type);
      } else {
        query = query.eq('notification_type', params.notification_type);
      }
    }

    if (params.delivery_status) {
      query = query.eq('delivery_status', params.delivery_status);
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[NOTIFICATION_SERVICE_LIST_ERROR]', error);
      return {
        success: false,
        error: 'Failed to list notifications',
        errorCode: 'DATABASE_ERROR',
      };
    }

    return {
      success: true,
      data: (data as any) || [],
    };
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE_LIST_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Mark Notification as Read
// ============================================================================

export async function markNotificationRead(
  input: MarkNotificationReadInput
): Promise<NotificationServiceResult<Notification>> {
  try {
    const session = await requireAuth();
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    const { data, error } = await (adminSupabase
      .from('notifications') as any)
      .update({
        status: 'READ',
        read_at: new Date().toISOString(),
      })
      .eq('id', input.notification_id)
      .eq('institution_id', profile.institution_id)
      .eq('recipient_id', session.userId) // Can only mark own notifications
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Notification not found or unauthorized',
        errorCode: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE_MARK_READ_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Mark All Notifications as Read (for current user)
// ============================================================================

export async function markAllNotificationsRead(): Promise<NotificationServiceResult<{ count: number }>> {
  try {
    const session = await requireAuth();
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    const { data, error } = await (adminSupabase
      .from('notifications') as any)
      .update({
        status: 'READ',
        read_at: new Date().toISOString(),
      })
      .eq('institution_id', profile.institution_id)
      .eq('recipient_id', session.userId)
      .eq('status', 'UNREAD')
      .select('id');

    if (error) {
      return {
        success: false,
        error: 'Failed to mark notifications as read',
        errorCode: 'DATABASE_ERROR',
      };
    }

    return {
      success: true,
      data: { count: (data as { id: string }[])?.length ?? 0 },
    };
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE_MARK_ALL_READ_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Archive Notification
// ============================================================================

export async function archiveNotification(
  input: ArchiveNotificationInput
): Promise<NotificationServiceResult<Notification>> {
  try {
    const session = await requireAuth();
    const profile = await requireProfile();
    const adminSupabase = getAdminClient();

    const { data, error } = await (adminSupabase
      .from('notifications') as any)
      .update({
        status: 'ARCHIVED',
      })
      .eq('id', input.notification_id)
      .eq('institution_id', profile.institution_id)
      .eq('recipient_id', session.userId)
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Notification not found or unauthorized',
        errorCode: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE_ARCHIVE_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'DATABASE_ERROR',
    };
  }
}

// ============================================================================
// Get Unread Count
// ============================================================================

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', profile.institution_id)
      .eq('recipient_id', userId)
      .eq('status', 'UNREAD');

    if (error) {
      console.error('[NOTIFICATION_SERVICE_UNREAD_COUNT_ERROR]', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[NOTIFICATION_SERVICE_UNREAD_COUNT_ERROR]', error);
    return 0;
  }
}
