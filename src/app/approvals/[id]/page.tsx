/**
 * EDU-010: Approval Request Detail Page
 * 
 * Displays detailed information about a specific approval request.
 * Provides approve/reject/cancel actions based on user permissions.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth, getUserProfile, getAvailableNavigation } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { getApprovalRequestAction, canApproveAction } from '../actions';
import { ApprovalActions } from './ApprovalActions';

export const metadata: Metadata = {
  title: 'Approval Request',
  description: 'View approval request details',
};

interface ApprovalDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ApprovalDetailPage({ params }: ApprovalDetailPageProps) {
  await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  // Fetch approval request
  const result = await getApprovalRequestAction(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const request = result.data;
  const navigation = getAvailableNavigation(profile.role, profile.status);

  // Check if user can approve
  const canApproveResult = await canApproveAction(params.id);
  const userCanApprove = canApproveResult.authorized;

  const isRequester = request.requested_by === profile.id;
  const canCancel = isRequester && request.status === 'PENDING';

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <AppLayout profile={profile} navigation={navigation}>
      <PageContainer>
        <div className="mb-6">
          <Link
            href="/approvals"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Approvals
          </Link>
        </div>

        <PageHeader
          title={request.request_type.replace(/_/g, ' ')}
          description="Approval request details and actions"
        />

        {/* Status and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div>{getStatusBadge(request.status)}</div>
          {request.status === 'PENDING' && (userCanApprove || canCancel) && (
            <ApprovalActions
              requestId={request.id}
              canApprove={userCanApprove}
              canCancel={canCancel}
            />
          )}
        </div>

        {/* Request Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Request Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.request_type.replace(/_/g, ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">{getStatusBadge(request.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Requested By</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.requester?.display_name || 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Approver</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.approver?.display_name || 'Not assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(request.created_at)}</dd>
              </div>
              {request.decision_made_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Decision Made</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(request.decision_made_at)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Description */}
          {request.request_description && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {request.request_description}
              </p>
            </Card>
          )}

          {/* Request Data */}
          {request.request_data && Object.keys(request.request_data).length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Data</h3>
              <pre className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(request.request_data, null, 2)}
              </pre>
            </Card>
          )}

          {/* Decision Comments */}
          {request.decision_comments && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Decision Comments</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {request.decision_comments}
              </p>
            </Card>
          )}

          {/* Related Workflow */}
          {request.workflow_execution_id && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Related Workflow</h3>
              <Link
                href={`/workflows/${request.workflow_execution_id}`}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View Workflow Execution
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </Card>
          )}

          {/* Audit Trail */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Request Created</p>
                  <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
                  <p className="text-sm text-gray-600">
                    by {request.requester?.display_name || 'Unknown'}
                  </p>
                </div>
              </div>

              {request.decision_made_at && (
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      request.status === 'APPROVED'
                        ? 'bg-green-500'
                        : request.status === 'REJECTED'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Decision: {request.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(request.decision_made_at)}
                    </p>
                    <p className="text-sm text-gray-600">
                      by {request.approver?.display_name || 'Unknown'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
