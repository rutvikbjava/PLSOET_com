/**
 * Dashboard Stats Component
 * 
 * Displays real-time statistics from the database:
 * - Document count
 * - Pending approvals
 * - Unread notifications
 */

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { getDocuments } from '@/app/documents/actions';
import { getPendingApprovalsCountAction } from '@/app/approvals/actions';
import { getUnreadCountAction } from '@/app/notifications/actions';

export async function DashboardStats() {
  // Fetch all stats in parallel
  const [documentsResult, approvalsResult, notificationsResult] = await Promise.all([
    getDocuments(),
    getPendingApprovalsCountAction(),
    getUnreadCountAction(),
  ]);

  const documentCount = documentsResult.success ? (documentsResult.documents?.length || 0) : 0;
  const pendingApprovals = approvalsResult.success ? approvalsResult.count : 0;
  const unreadNotifications = notificationsResult.success ? notificationsResult.count : 0;

  const stats = [
    {
      label: 'Documents',
      value: documentCount,
      href: '/documents',
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals,
      href: '/approvals',
      icon: (
        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      badge: pendingApprovals > 0,
    },
    {
      label: 'Unread Notifications',
      value: unreadNotifications,
      href: '/notifications',
      icon: (
        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      badge: unreadNotifications > 0,
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Stats
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="relative block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-full p-3 ${stat.bgColor}`}>
                {stat.icon}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              {stat.badge && stat.value > 0 && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                    {stat.value}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
