/**
 * EDU-010: Signature Request Card Component
 * 
 * Displays a single signature request in a card format.
 * Shows status, requester, signer, and provides link to details.
 */

'use client';

import Link from 'next/link';
import type { SignatureRequestWithRelations } from '@/lib/signatures/types';

interface SignatureRequestCardProps {
  request: SignatureRequestWithRelations;
  currentUserId: string;
}

export function SignatureRequestCard({ request, currentUserId }: SignatureRequestCardProps) {
  const isSigner = request.signer_id === currentUserId;
  const isRequester = request.requested_by === currentUserId;

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending Signature
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Signed
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Expired
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

  const isExpiringSoon = request.expires_at && new Date(request.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <Link
      href={`/signatures/${request.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title and Badge */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900">
              Document Signature Request
            </h3>
            {getStatusBadge(request.status)}
            {isSigner && request.status === 'PENDING' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Action Required
              </span>
            )}
            {isExpiringSoon && request.status === 'PENDING' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Expiring Soon
              </span>
            )}
          </div>

          {/* Document Information */}
          {request.document && (
            <p className="text-sm text-gray-900 font-medium mb-1">
              📄 {request.document.title}
            </p>
          )}

          {/* Instructions */}
          {request.instructions && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {request.instructions}
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

            {request.signer && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span>
                  {isSigner ? 'Assigned to you' : `Signer: ${request.signer.display_name}`}
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

            {request.expires_at && request.status === 'PENDING' && (
              <div className="flex items-center gap-1 text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Expires {formatDate(request.expires_at)}</span>
              </div>
            )}
          </div>

          {/* Signature Info (if completed) */}
          {request.status === 'COMPLETED' && request.signed_at && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Signed on {formatDate(request.signed_at)}</span>
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
