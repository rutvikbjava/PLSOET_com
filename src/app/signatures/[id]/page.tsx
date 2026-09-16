/**
 * EDU-010: Signature Request Detail Page
 * 
 * Displays detailed information about a specific signature request.
 * Provides signature form for authorized signers.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth, getUserProfile, getAvailableNavigation } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { getSignatureRequestAction, canSignAction } from '../actions';
import { SignatureForm } from './SignatureForm';

export const metadata: Metadata = {
  title: 'Signature Request',
  description: 'View signature request details',
};

interface SignatureDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SignatureDetailPage({ params }: SignatureDetailPageProps) {
  await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  // Fetch signature request
  const result = await getSignatureRequestAction(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const request = result.data;

  // Check if user can sign
  const canSignResult = await canSignAction(params.id);
  const userCanSign = canSignResult.authorized;

  const isSigner = request.signer_id === profile.id;
  const navigation = getAvailableNavigation(profile.role, profile.status);

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Pending Signature
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Signed
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Expired
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

  const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
  const isExpiringSoon = request.expires_at && new Date(request.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <AppLayout profile={profile} navigation={navigation}>      <PageContainer>
        <div className="mb-6">
          <Link
            href="/signatures"
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Signatures
          </Link>
        </div>

        <PageHeader
          title="Signature Request"
          description="Digital signature request details and signing"
        />

        {/* Status and Expiration Warning */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            {getStatusBadge(request.status)}
            {isSigner && request.status === 'PENDING' && userCanSign && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                Action Required
              </span>
            )}
          </div>

          {isExpiringSoon && request.status === 'PENDING' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Expiring Soon</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    This signature request expires on {formatDate(request.expires_at!)}.
                    Please sign it soon to avoid expiration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Expired</h3>
                  <p className="mt-1 text-sm text-red-700">
                    This signature request expired on {formatDate(request.expires_at!)}.
                    Please contact the requester for a new signature request.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Signature Form (for authorized signers) */}
        {request.status === 'PENDING' && userCanSign && !isExpired && (
          <SignatureForm requestId={request.id} />
        )}

        {/* Request Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <dt className="text-sm font-medium text-gray-500">Signer</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.signer?.display_name || 'Not assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(request.created_at)}</dd>
              </div>
              {request.expires_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expires</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(request.expires_at)}</dd>
                </div>
              )}
              {request.signed_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Signed</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(request.signed_at)}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Document Information */}
          {request.document && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Document</h3>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-medium text-gray-900 mb-1">
                    {request.document.title}
                  </h4>
                  {request.document.description && (
                    <p className="text-sm text-gray-600 mb-2">{request.document.description}</p>
                  )}
                  <Link
                    href={`/documents/${request.document.id}`}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    View Document
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Instructions */}
          {request.instructions && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {request.instructions}
              </p>
            </Card>
          )}

          {/* Signature Details (if completed) */}
          {request.status === 'COMPLETED' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Signature Details</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Signature Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {request.signature_method || 'Digital Signature'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {request.signer_ip_address || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                  <dd className="mt-1 text-sm text-gray-900 break-all">
                    {request.signer_user_agent || 'N/A'}
                  </dd>
                </div>
                {request.signature_data && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Signature Hash</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {JSON.stringify(request.signature_data)}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          {/* Related Workflow */}
          {request.workflow_execution_id && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Related Workflow</h3>
              <Link
                href={`/workflows/${request.workflow_execution_id}`}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
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
                <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Request Created</p>
                  <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
                  <p className="text-sm text-gray-600">
                    by {request.requester?.display_name || 'Unknown'}
                  </p>
                </div>
              </div>

              {request.signed_at && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Document Signed</p>
                    <p className="text-sm text-gray-500">{formatDate(request.signed_at)}</p>
                    <p className="text-sm text-gray-600">
                      by {request.signer?.display_name || 'Unknown'}
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
