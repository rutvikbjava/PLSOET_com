/**
 * Document Detail Page
 * 
 * Displays document information and version history.
 * 
 * Features:
 * - Document metadata display
 * - Version history table
 * - Download functionality
 * - Upload new version
 * - Status badges
 * - Responsive design
 * - Accessibility
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import { getAvailableNavigation } from '@/lib/auth';
import { getDocument, getDocumentProcessingStatus } from '../actions';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingState } from '@/components/layout/LoadingState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Card } from '@/components/ui/Card';
import { formatBytes } from '@/lib/documents/storage';
import DownloadButton from './DownloadButton';
import UploadVersionForm from './UploadVersionForm';
import { ProcessTriggerButton } from './ProcessTriggerButton';
import { ProcessingStatus } from './ProcessingStatus';

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date (short)
 */
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get badge color for document status
 */
function getStatusBadgeClass(status: string): string {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
  
  switch (status) {
    case 'DRAFT':
      return `${baseClasses} bg-gray-100 text-gray-800`;
    case 'SUBMITTED':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case 'IN_REVIEW':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'APPROVED':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'REJECTED':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'ARCHIVED':
      return `${baseClasses} bg-gray-100 text-gray-600`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
}

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

interface DocumentDetailContentProps {
  documentId: string;
}

/**
 * Document Detail Content
 */
async function DocumentDetailContent({ documentId }: DocumentDetailContentProps) {
  // Verify authentication
  await requireAuth();
  const profile = await requireProfile();

  // Get document
  const result = await getDocument(documentId);

  // Get processing status
  const processingResult = await getDocumentProcessingStatus(documentId);

  // Handle error
  if (!result.success || !result.document) {
    if (result.error === 'Document not found') {
      notFound();
    }

    return (
      <ErrorState
        title="Failed to load document"
        message={result.error || 'An unexpected error occurred'}
        action={{
          label: 'Back to Documents',
          onClick: () => window.location.href = '/documents',
        }}
      />
    );
  }

  const document = result.document;
  const versions = result.versions || [];
  const processingStatus = processingResult.success ? processingResult.data : null;

  // Check if user can upload new versions
  const canUploadVersion =
    profile.status === 'ACTIVE' && document.status !== 'ARCHIVED';

  return (
    <div className="space-y-6">
      {/* Document Information Card */}
      <Card>
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {document.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={getStatusBadgeClass(document.status)}>
                  {formatStatus(document.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {document.document_type}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <ProcessTriggerButton documentId={document.id} />
            </div>
          </div>

          {document.description && (
            <p className="mt-4 text-gray-700">{document.description}</p>
          )}
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {document.creator?.display_name || 'Unknown'}
                  </span>
                  <span className="text-gray-500">
                    {document.creator?.email}
                  </span>
                </div>
              </dd>
            </div>

            {document.department && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Department
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {document.department.name}
                  {document.department.code && (
                    <span className="ml-2 text-gray-500">
                      ({document.department.code})
                    </span>
                  )}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(document.created_at)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(document.updated_at)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Total Versions
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{versions.length}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Document ID</dt>
              <dd className="mt-1 text-sm font-mono text-gray-900">
                {document.id}
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* Processing Status */}
      {processingStatus && (
        <ProcessingStatus
          documentId={document.id}
          processingStatus={processingStatus.processingStatus || undefined}
          hasContext={processingStatus.hasContext}
        />
      )}

      {/* Upload New Version */}
      {canUploadVersion && (
        <Card>
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Upload New Version
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload a new version of this document. Previous versions will be
              preserved.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <UploadVersionForm documentId={document.id} />
          </div>
        </Card>
      )}

      {/* Version History */}
      <Card>
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Version History
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            All versions of this document, from newest to oldest.
          </p>
        </div>

        {versions.length === 0 ? (
          <div className="border-t border-gray-200 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No versions available</p>
          </div>
        ) : (
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Version
                    </th>
                    <th
                      scope="col"
                      className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell"
                    >
                      File Size
                    </th>
                    <th
                      scope="col"
                      className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell"
                    >
                      Uploaded By
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Uploaded
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Download</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {versions.map((version: {
                    id: string;
                    version_number: number;
                    file_size_bytes: number | null;
                    created_at: string;
                    uploaded_by: string;
                    uploader?: {
                      display_name: string;
                      email: string;
                    };
                  }, index: number) => (
                    <tr key={version.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            Version {version.version_number}
                          </span>
                          {index === 0 && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              Current
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 sm:table-cell">
                        {version.file_size_bytes
                          ? formatBytes(version.file_size_bytes)
                          : '—'}
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 md:table-cell">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {version.uploader?.display_name || 'Unknown'}
                          </span>
                          <span className="text-gray-500">
                            {version.uploader?.email}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatDateShort(version.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <DownloadButton
                          versionId={version.id}
                          versionNumber={version.version_number}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile-friendly version list */}
            <div className="block sm:hidden divide-y divide-gray-200">
              {versions.map((version: {
                id: string;
                version_number: number;
                file_size_bytes: number | null;
                created_at: string;
              }, index: number) => (
                <div key={version.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          Version {version.version_number}
                        </p>
                        {index === 0 && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDateShort(version.created_at)}
                      </p>
                      {version.file_size_bytes && (
                        <p className="mt-1 text-sm text-gray-500">
                          {formatBytes(version.file_size_bytes)}
                        </p>
                      )}
                    </div>
                    <DownloadButton
                      versionId={version.id}
                      versionNumber={version.version_number}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

interface DocumentDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * Document Detail Page
 */
export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  // Verify authentication
  await requireAuth();
  const profile = await requireProfile();
  const navigation = getAvailableNavigation(profile.role, profile.status);

  return (
    <AppLayout profile={profile} navigation={navigation}>
      <PageContainer>
        <div className="mb-6">
          <Link
            href="/documents"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Documents
          </Link>
        </div>

        <Suspense fallback={<LoadingState message="Loading document..." />}>
          <DocumentDetailContent documentId={params.id} />
        </Suspense>
      </PageContainer>
    </AppLayout>
  );
}

/**
 * Metadata for SEO
 */
export async function generateMetadata() {
  return {
    title: 'Document Details',
    description: 'View document information and version history',
  };
}
