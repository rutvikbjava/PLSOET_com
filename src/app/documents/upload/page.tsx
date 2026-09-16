/**
 * Document Upload Page
 * 
 * Page for uploading new documents.
 * Server component that wraps the client-side upload form.
 */

import Link from 'next/link';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import { getAvailableNavigation } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { createClient as createServerClient } from '@/lib/supabase/server';
import UploadDocumentForm from './UploadDocumentForm';

export default async function UploadDocumentPage() {
  // Verify authentication
  await requireAuth();
  const profile = await requireProfile();
  const navigation = getAvailableNavigation(profile.role, profile.status);

  // Check if user is active
  if (profile.status !== 'ACTIVE') {
    return (
      <AppLayout profile={profile} navigation={navigation}>
        <PageContainer>
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Account Not Active
                </h3>
                <p className="mt-2 text-sm text-yellow-700">
                  Your account must be active to upload documents. Please contact
                  your administrator.
                </p>
                <div className="mt-4">
                  <Link
                    href="/documents"
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    Back to Documents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Get departments for dropdown (if user has a department)
  const supabase = await createServerClient();
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, code')
    .eq('institution_id', profile.institution_id)
    .eq('status', 'ACTIVE')
    .order('name');

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

        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Upload New Document
            </h1>
            <p className="mt-2 text-gray-600">
              Upload a new document to your institution&apos;s document repository.
            </p>
          </div>

          <UploadDocumentForm departments={departments || []} />
        </div>
      </PageContainer>
    </AppLayout>
  );
}

/**
 * Metadata for SEO
 */
export const metadata = {
  title: 'Upload Document',
  description: 'Upload a new document',
};
