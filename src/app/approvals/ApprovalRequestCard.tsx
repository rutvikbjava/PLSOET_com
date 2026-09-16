/**
 * EDU-010: Approval Request Card Component
 * 
 * Displays a single approval request in a card format.
 * Shows status, requester, approver, and provides link to details.
 */

'use client';

import Link from 'next/link';
import type { ApprovalRequestWithRelations } from '@/lib/approvals/types';

interface ApprovalRequestCardProps {
  request: ApprovalRequestWithRelations;
  currentUserId: string;
}

export function ApprovalRequestCard({ request, currentUserId }: ApprovalRequestCardProps) {
  const isApprover = request.approver_id === currentUserId;
  const isRequester = request.requested_by === currentUserId;

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <Link
      href={`/approvals/${request.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title and Badge */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {request.request_type.replace(/_/g, ' ')}
            </h3>
            {getStatusBadge(request.status)}
            {isApprover && request.status === 'PENDING' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Action Required
              </span>
            )}
          </div>

          {/* Description */}
          {request.request_description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {request.request_description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>
                {isRequester ? 'You requested' : `Requested by ${request.requester?.display_name || 'Unknown'}`}
              </span>
            </div>

            {request.approver && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {isApprover ? 'Assigned to you' : `Approver: ${request.approver.display_name}`}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatDate(request.created_at)}</span>
            </div>
          </div>

          {/* Related Entity */}
          {request.related_entity_type && (
            <div className="mt-2 text-sm text-gray-500">
              Related: {request.related_entity_type}
            </div>
          )}
        </div>

        {/* Arrow Icon */}
        <div className="flex-shrink-0 ml-4">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
