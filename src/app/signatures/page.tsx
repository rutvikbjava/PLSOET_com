/**
 * EDU-010: Signatures List Page
 * 
 * Displays signature requests for the current user.
 * Users can view requests they created or requests where they are the signer.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth, getUserProfile, getAvailableNavigation } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { listSignatureRequestsAction } from './actions';
import { SignatureRequestCard } from './SignatureRequestCard';

export const metadata: Metadata = {
  title: 'Signatures',
  description: 'Manage signature requests',
};

interface SignaturesPageProps {
  searchParams: {
    status?: string;
    view?: 'pending' | 'completed' | 'all';
  };
}

export default async function SignaturesPage({ searchParams }: SignaturesPageProps) {
  await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  const view = searchParams.view || 'pending';
  const navigation = getAvailableNavigation(profile.role, profile.status);
  
  // Fetch signature requests based on view
  const status = view === 'pending' ? 'PENDING' : view === 'completed' ? undefined : undefined;
  const result = await listSignatureRequestsAction({ status });

  const signatureRequests = result.success ? result.data || [] : [];

  // Filter based on view
  const filteredRequests = view === 'completed'
    ? signatureRequests.filter(r => r.status === 'COMPLETED' || r.status === 'EXPIRED')
    : view === 'pending'
    ? signatureRequests.filter(r => r.status === 'PENDING')
    : signatureRequests;

  const pendingCount = signatureRequests.filter(r => r.status === 'PENDING').length;
  const completedCount = signatureRequests.filter(r => 
    r.status === 'COMPLETED' || r.status === 'EXPIRED'
  ).length;

  return (
    <AppLayout profile={profile} navigation={navigation}>
      <PageContainer>
        <PageHeader
          title="Signatures"
          description="Manage digital signature requests and sign documents"
        />

        {/* View Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/signatures?view=pending"
              className={`${
                view === 'pending'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending
              {pendingCount > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {pendingCount}
                </span>
              )}
            </Link>
            <Link
              href="/signatures?view=completed"
              className={`${
                view === 'completed'
                  ? 'border-purple-500 text-purple-600'
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
              href="/signatures?view=all"
              className={`${
                view === 'all'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All
              {signatureRequests.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {signatureRequests.length}
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
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No signature requests
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {view === 'pending'
                ? 'You have no pending signature requests.'
                : view === 'completed'
                ? 'You have no completed signature requests.'
                : 'You have no signature requests.'}
            </p>
          </Card>
        )}

        {/* Signature Requests List */}
        {filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <SignatureRequestCard
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
