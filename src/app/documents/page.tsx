/**
 * Documents List Page
 * 
 * Displays all documents for the user's institution.
 * 
 * Features:
 * - Loading state
 * - Empty state
 * - Error state
 * - Document table with sorting
 * - Status badges
 * - Responsive design
 * - Accessibility (ARIA, keyboard navigation)
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import { getAvailableNavigation } from '@/lib/auth';
import { getDocuments } from './actions';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/layout/LoadingState';
import { EmptyState } from '@/components/layout/EmptyState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Button } from '@/components/ui/Button';

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
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
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
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

/**
 * Documents Table Component
 */
async function DocumentsTable() {
  // Verify authentication
  await requireAuth();
  await requireProfile();

  // Get documents
  const result = await getDocuments();

  // Handle error state
  if (!result.success || !result.documents) {
    return (
      <ErrorState
        title="Failed to load documents"
        message={result.error || 'An unexpected error occurred'}
        action={{
          label: 'Try Again',
          href: '/documents',
        }}
      />
    );
  }

  const documents = result.documents;

  // Handle empty state
  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        description="Get started by uploading your first document."
        action={{
          label: 'Upload Document',
          href: '/documents/upload',
        }}
      />
    );
  }

  // Display documents table
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Status
              </th>
              <th
                scope="col"
                className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell"
              >
                Department
              </th>
              <th
                scope="col"
                className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell"
              >
                Created By
              </th>
              <th
                scope="col"
                className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell"
              >
                Created
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {documents.map((doc: {
              id: string;
              title: string;
              description?: string;
              document_type: string | null;
              status: string;
              version_count: number;
              latest_version: number;
              created_at: string;
              creator?: {
                display_name: string;
                email: string;
              };
              department?: {
                name: string;
              };
            }) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {doc.title}
                    </Link>
                    {doc.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {doc.document_type}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={getStatusBadgeClass(doc.status)}>
                    {formatStatus(doc.status)}
                  </span>
                </td>
                <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 sm:table-cell">
                  {doc.department?.name || '—'}
                </td>
                <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 md:table-cell">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {doc.creator?.display_name || 'Unknown'}
                    </span>
                    <span className="text-gray-500">{doc.creator?.email}</span>
                  </div>
                </td>
                <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 lg:table-cell">
                  {formatDate(doc.created_at)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile-friendly card view (hidden on desktop) */}
      <div className="block sm:hidden">
        <div className="divide-y divide-gray-200">
          {documents.map((doc: {
            id: string;
            title: string;
            description?: string;
            document_type: string | null;
            status: string;
            version_count: number;
            latest_version: number;
            created_at: string;
          }) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="block p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {doc.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{doc.document_type}</p>
                  {doc.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={getStatusBadgeClass(doc.status)}>
                      {formatStatus(doc.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(doc.created_at)}
                    </span>
                  </div>
                </div>
                <svg
                  className="ml-4 h-5 w-5 flex-shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Documents Page
 */
export default async function DocumentsPage() {
  // Verify authentication
  await requireAuth();
  const profile = await requireProfile();
  const navigation = getAvailableNavigation(profile.role, profile.status);

  return (
    <AppLayout profile={profile} navigation={navigation}>
      <PageContainer>
        <PageHeader
          title="Documents"
          description="Manage and view institutional documents"
          actions={
            <Link href="/documents/upload">
              <Button>Upload Document</Button>
            </Link>
          }
        />

        <Suspense fallback={<LoadingState message="Loading documents..." />}>
          <DocumentsTable />
        </Suspense>
      </PageContainer>
    </AppLayout>
  );
}

/**
 * Metadata for SEO
 */
export const metadata = {
  title: 'Documents',
  description: 'Manage institutional documents',
};
