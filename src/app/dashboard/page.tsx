/**
 * Dashboard Page
 * 
 * Main authenticated landing page for EduSphere AI.
 * 
 * Displays:
 * - Welcome message with real user data
 * - Account status information
 * - System overview
 * - Role-appropriate information
 * 
 * Security: Server component with requireAuth and requireProfile checks
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireAuth, getUserProfile, getAvailableNavigation, getRoleDisplayName } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { DashboardStats } from './DashboardStats';

export const metadata: Metadata = {
  title: 'Dashboard | EduSphere AI',
  description: 'Your EduSphere AI dashboard',
};

export default async function DashboardPage() {
  // Require authentication (defense in depth - middleware already checked)
  await requireAuth();
  
  // Get user profile with institution/department data
  const profile = await getUserProfile();

  // Profile should always exist after requireAuth, but check for safety
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-red-100 rounded-full">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
            Your user profile could not be loaded. Please contact support or try signing in again.
          </p>
          <Link
            href="/auth/sign-out"
            className="inline-flex items-center justify-center px-4 py-2 text-base font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
          >
            Sign Out
          </Link>
        </div>
      </div>
    );
  }

  // Get navigation for this user
  const navigation = getAvailableNavigation(profile.role, profile.status);
  
  const isPending = profile.status === 'PENDING_VERIFICATION';
  const isActive = profile.status === 'ACTIVE';
  const isSuspended = profile.status === 'SUSPENDED';
  const isInactive = profile.status === 'INACTIVE';

  return (
    <AppLayout profile={profile} navigation={navigation}>
      <PageContainer>
        <PageHeader
          title={`Welcome, ${profile.display_name}!`}
          description={
            isActive
              ? 'Your dashboard and application overview'
              : isPending
              ? 'Your account is pending verification'
              : isSuspended
              ? 'Your account has been suspended'
              : 'Your account is inactive'
          }
        />

        <div className="space-y-6">
          {/* Account Status Alert */}
          {isPending && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Account Pending Verification
                  </h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    Your account has been created successfully, but requires verification
                    by your institution administrator before you can access all features.
                    You will be notified when your account is activated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSuspended && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Account Suspended
                  </h3>
                  <p className="mt-2 text-sm text-red-700">
                    Your account has been suspended. Please contact your institution
                    administrator for more information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isInactive && (
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    Account Inactive
                  </h3>
                  <p className="mt-2 text-sm text-gray-700">
                    Your account is currently inactive. Please contact your institution
                    administrator to reactivate your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Summary Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Profile
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.display_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getRoleDisplayName(profile.role)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-green-100 text-green-800'
                        : isPending
                        ? 'bg-yellow-100 text-yellow-800'
                        : isSuspended
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {profile.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Institution</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profile.institution?.name || 'Not assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profile.department?.name || 'Not assigned'}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <Link
                href="/profile"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View full profile →
              </Link>
            </div>
          </Card>

          {/* Real-time Stats (for ACTIVE users only) */}
          {isActive && (
            <Suspense fallback={
              <Card className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="h-24 bg-gray-200 rounded"></div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </Card>
            }>
              <DashboardStats />
            </Suspense>
          )}

          {/* Feature Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Features
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              EduSphere AI provides context-aware workflow automation for higher
              education institutions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Document Management', href: '/documents', available: true },
                { label: 'Policy Management', href: '/policies', available: true },
                { label: 'Workflow Automation', href: '/workflows', available: true },
                { label: 'Approval Requests', href: '/approvals', available: true },
                { label: 'Digital Signatures', href: '/signatures', available: true },
                { label: 'Notifications', href: '/notifications', available: true },
                { label: 'Audit Trail', href: '/audit', available: true },
              ].map(({ label, href, available }) => (
                <div key={label} className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className={`h-5 w-5 ${available ? 'text-green-500' : 'text-gray-400'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <Link 
                      href={href} 
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {label}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions (for ACTIVE users only) */}
          {isActive && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/documents/upload"
                  className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                >
                  <svg className="h-6 w-6 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Upload Document</span>
                </Link>
                <Link
                  href="/workflows/generate"
                  className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-center"
                >
                  <svg className="h-6 w-6 text-purple-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Generate Workflow</span>
                </Link>
                <Link
                  href="/policies/create"
                  className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-center"
                >
                  <svg className="h-6 w-6 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Create Policy</span>
                </Link>
                <Link
                  href="/approvals"
                  className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors text-center"
                >
                  <svg className="h-6 w-6 text-yellow-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">View Approvals</span>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
