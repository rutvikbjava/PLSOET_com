/**
 * EDU-010: Notifications Center Page
 * 
 * Comprehensive notification center with filtering and pagination.
 * Users can view all their notifications, filter by type/status, and mark as read.
 */

import { Metadata } from 'next';
import { requireAuth, getUserProfile, getAvailableNavigation } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { listNotificationsAction } from './actions';
import { NotificationList } from './NotificationList';
import { NotificationFilters } from './NotificationFilters';
import { NotificationPagination } from './NotificationPagination';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'View all your notifications',
};

interface NotificationsPageProps {
  searchParams: {
    status?: 'UNREAD' | 'READ';
    type?: string;
    page?: string;
  };
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  const status = searchParams.status;
  const navigation = getAvailableNavigation(profile.role, profile.status);
  const type = searchParams.type;
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 20;

  // Fetch notifications
  const result = await listNotificationsAction({
    status,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notification_type: type as any, // Type comes from URL params, cast to avoid type error
    limit,
    offset: (page - 1) * limit,
  });

  const notifications = result.success ? result.data || [] : [];

  // Get counts for tabs
  const allResult = await listNotificationsAction({ limit: 1000 });
  const allNotifications = allResult.success ? allResult.data || [] : [];
  
  const unreadCount = allNotifications.filter(n => n.status === 'UNREAD').length;
  const readCount = allNotifications.filter(n => n.status === 'READ').length;

  // Get available notification types
  const notificationTypes = Array.from(
    new Set(allNotifications.map(n => n.notification_type))
  );

  return (
    <AppLayout profile={profile} navigation={navigation}>
      <PageContainer>
        <PageHeader
          title="Notifications"
          description="View and manage all your notifications"
        />

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{allNotifications.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unread</p>
                  <p className="text-2xl font-semibold text-gray-900">{unreadCount}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Read</p>
                  <p className="text-2xl font-semibold text-gray-900">{readCount}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <NotificationFilters
            status={status}
            type={type}
            notificationTypes={notificationTypes}
          />

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {status || type
                  ? 'No notifications match your filters.'
                  : 'You have no notifications yet.'}
              </p>
            </Card>
          ) : (
            <NotificationList notifications={notifications} />
          )}

          {/* Pagination */}
          {notifications.length === limit && (
            <NotificationPagination page={page} hasMore={notifications.length === limit} />
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
