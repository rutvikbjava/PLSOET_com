/**
 * EDU-010: Notification List Component
 * 
 * Displays a list of notifications with mark as read functionality.
 */

'use client';

import { useRouter } from 'next/navigation';
import { markNotificationAsReadAction } from './actions';
import type { Notification } from '@/lib/notifications/types';

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();

  async function handleMarkAsRead(notificationId: string) {
    await markNotificationAsReadAction(notificationId);
    router.refresh();
  }

  function handleNavigate(notification: Notification) {
    // Mark as read if unread
    if (notification.status === 'UNREAD') {
      handleMarkAsRead(notification.id);
    }

    // Navigate to related entity
    if (notification.related_entity_type && notification.related_entity_id) {
      if (notification.related_entity_type === 'APPROVAL_REQUEST') {
        router.push(`/approvals/${notification.related_entity_id}`);
      } else if (notification.related_entity_type === 'SIGNATURE_REQUEST') {
        router.push(`/signatures/${notification.related_entity_id}`);
      } else if (notification.related_entity_type === 'WORKFLOW') {
        router.push(`/workflows/${notification.related_entity_id}`);
      } else if (notification.related_entity_type === 'DOCUMENT') {
        router.push(`/documents/${notification.related_entity_id}`);
      }
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'APPROVAL_REQUESTED':
      case 'APPROVAL_APPROVED':
      case 'APPROVAL_REJECTED':
        return (
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'SIGNATURE_REQUESTED':
      case 'SIGNATURE_COMPLETED':
        return (
          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
        );
      case 'WORKFLOW_STARTED':
      case 'WORKFLOW_COMPLETED':
      case 'WORKFLOW_FAILED':
        return (
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'DOCUMENT_UPLOADED':
      case 'DOCUMENT_PROCESSED':
        return (
          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  }

  function formatDate(date: string): string {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return notificationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 hover:bg-gray-50 transition-colors ${
            notification.status === 'UNREAD' ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            {getNotificationIcon(notification.notification_type)}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-gray-500">
                      {formatDate(notification.created_at)}
                    </p>
                    {notification.status === 'UNREAD' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {notification.status === 'UNREAD' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                  {notification.related_entity_type && notification.related_entity_id && (
                    <button
                      onClick={() => handleNavigate(notification)}
                      className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      View
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
