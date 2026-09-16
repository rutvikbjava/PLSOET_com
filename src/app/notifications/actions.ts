/**
 * EDU-010: Notification Server Actions
 * 
 * Next.js server actions for notification management.
 * All operations require authentication.
 */

'use server';

import { revalidatePath } from 'next/cache';
import {
  createNotification,
  createEmailNotification,
  markNotificationRead,
  markAllNotificationsRead,
  listNotifications,
  getUnreadCount,
} from '@/lib/notifications';
import type {
  CreateNotificationInput,
  SendEmailNotificationInput,
  ListNotificationsParams,
} from '@/lib/notifications/types';

// ============================================================================
// Create Notification (usually called by system, not directly by users)
// ============================================================================

export async function createNotificationAction(input: CreateNotificationInput) {
  const result = await createNotification(input);

  if (result.success) {
    revalidatePath('/notifications');
    revalidatePath('/dashboard');
  }

  return result;
}

// ============================================================================
// Create Email Notification (usually called by system)
// ============================================================================

export async function createEmailNotificationAction(input: SendEmailNotificationInput) {
  const result = await createEmailNotification(input);

  if (result.success) {
    revalidatePath('/notifications');
  }

  return result;
}

// ============================================================================
// Mark Notification as Read
// ============================================================================

export async function markNotificationAsReadAction(notificationId: string) {
  const result = await markNotificationRead({ notification_id: notificationId });

  if (result.success) {
    revalidatePath('/notifications');
    revalidatePath('/dashboard');
  }

  return result;
}

// ============================================================================
// Mark All Notifications as Read
// ============================================================================

export async function markAllNotificationsAsReadAction() {
  const result = await markAllNotificationsRead();

  if (result.success) {
    revalidatePath('/notifications');
    revalidatePath('/dashboard');
  }

  return result;
}

// ============================================================================
// List Notifications
// ============================================================================

export async function listNotificationsAction(params?: ListNotificationsParams) {
  // Get current user from session
  const { requireAuth } = await import('@/lib/auth/session');
  const session = await requireAuth();
  
  return await listNotifications(session.userId, params || {});
}

// ============================================================================
// Get Unread Count (for badge)
// ============================================================================

export async function getUnreadCountAction() {
  // Get current user from session
  const { requireAuth } = await import('@/lib/auth/session');
  const session = await requireAuth();
  
  const count = await getUnreadCount(session.userId);

  return {
    success: true as const,
    count,
  };
}

// ============================================================================
// Get Recent Notifications (for dropdown)
// ============================================================================

export async function getRecentNotificationsAction(limit = 5) {
  // Get current user from session
  const { requireAuth } = await import('@/lib/auth/session');
  const session = await requireAuth();
  
  return await listNotifications(session.userId, {
    limit,
    status: undefined, // Get both read and unread
  });
}
