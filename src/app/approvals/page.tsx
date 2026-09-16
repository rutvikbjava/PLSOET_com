/**
 * EDU-010: Approvals List Page
 * 
 * Displays approval requests for the current user.
 * Users can view requests they created or requests where they are the approver.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth, getUserProfile, getAvailableNavigation } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { listApprovalRequestsAction } from './actions';
import { ApprovalRequestCard } from './ApprovalRequestCard';

export const metadata: Metadata = {
  title: 'Approvals',
  description: 'Manage approval requests',
};

interface ApprovalsPageProps {
  searchParams: {
    status?: string;
    view?: 'pending' | 'completed' | 'all';
  };
}

export default async function ApprovalsPage({ searchParams }: ApprovalsPageProps) {
  await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  const view = searchParams.view || 'pending';
  const navigation = getAvailableNavigation(profile.role, profile.status);
  
  // Fetch approval requests based on view
  const status = view === 'pending' ? 'PENDING' : view === 'completed' ? undefined : undefined;
  const result = await listApprovalRequestsAction({ status });

  const approvalRequests = result.success ? result.data || [] : [];

  // Filter based on view
  const filteredRequests = view === 'completed'
    ? approvalRequests.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED' || r.status === 'CANCELLED')
    : view === 'pending'
    ? approvalRequests.filter(r => r.status === 'PENDING')
    : approvalRequests;

  const pendingCount = approvalRequests.filter(r => r.status === 'PENDING').length;
  const completedCount = approvalRequests.filter(r => 
    r.status === 'APPROVED' || r.status === 'REJECTED' || r.status === 'CANCELLED'
  ).length;

  return (
    <AppLayout profile={profile} navigation={navigation}>      <PageContainer>
        <PageHeader
          title="Approvals"
          description="Manage approval requests and review pending items"
        />

        {/* View Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/approvals?view=pending"
              className={`${
                view === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending
              {pendingCount > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {pendingCount}
                </span>
              )}
            </Link>
            <Link
              href="/approvals?view=completed"
              className={`${
                view === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Completed
              {completedCount > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {completedCount}
                </span>
              )}
            </Link>
            <Link
              href="/approvals?view=all"
              className={`${
                view === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All
              {approvalRequests.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {approvalRequests.length}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Empty State */}
        {filteredRequests.length === 0 && (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No approval requests
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {view === 'pending'
                ? 'You have no pending approval requests.'
                : view === 'completed'
                ? 'You have no completed approval requests.'
                : 'You have no approval requests.'}
            </p>
          </Card>
        )}

        {/* Approval Requests List */}
        {filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <ApprovalRequestCard
                key={request.id}
                request={request}
                currentUserId={profile.id}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
