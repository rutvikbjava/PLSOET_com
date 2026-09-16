/**
 * Profile Page
 * 
 * User profile view and limited self-service management.
 * 
 * Users can view their profile information.
 * Some fields are read-only and can only be modified by administrators:
 * - Institution assignment
 * - Department assignment
 * - Role
 * - Status
 * 
 * Security: Server component with requireAuth and requireProfile checks
 */

import { Metadata } from 'next';
import { requireAuth, getUserProfile, getAvailableNavigation, getRoleDisplayName } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/layout/ErrorState';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Profile | EduSphere AI',
  description: 'Your profile information',
};

export default async function ProfilePage() {
  // Require authentication
  await requireAuth();
  
  // Get user profile
  const profile = await getUserProfile();

  // Profile should always exist after requireAuth
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <ErrorState
          title="Profile Not Found"
          message="Your user profile could not be loaded. Please contact support or try signing in again."
          action={{
            label: 'Sign Out',
            href: '/auth/sign-out',
          }}
        />
      </div>
    );
  }

  // Get navigation
  const navigation = getAvailableNavigation(profile.role, profile.status);
  
  const isPending = profile.status === 'PENDING_VERIFICATION';
  const isActive = profile.status === 'ACTIVE';
  const isSuspended = profile.status === 'SUSPENDED';

  // Format dates
  const createdAt = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const updatedAt = new Date(profile.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppLayout profile={profile} navigation={navigation}>
      <PageContainer>
        <PageHeader
          title="Your Profile"
          description="View and manage your account information"
        />

        <div className="space-y-6">
          {/* Account Status Info */}
          {!isActive && (
            <div className={`border-l-4 p-4 rounded ${
              isPending
                ? 'bg-yellow-50 border-yellow-400'
                : isSuspended
                ? 'bg-red-50 border-red-400'
                : 'bg-gray-50 border-gray-400'
            }`}>
              <div className="flex">
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    isPending
                      ? 'text-yellow-800'
                      : isSuspended
                      ? 'text-red-800'
                      : 'text-gray-800'
                  }`}>
                    {isPending && 'Account Pending Verification'}
                    {isSuspended && 'Account Suspended'}
                    {!isPending && !isSuspended && 'Account Inactive'}
                  </h3>
                  <p className={`mt-2 text-sm ${
                    isPending
                      ? 'text-yellow-700'
                      : isSuspended
                      ? 'text-red-700'
                      : 'text-gray-700'
                  }`}>
                    {isPending && 'Your account requires verification by your institution administrator.'}
                    {isSuspended && 'Your account has been suspended. Contact your administrator for more information.'}
                    {!isPending && !isSuspended && 'Your account is inactive. Contact your administrator to reactivate.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Basic Information
            </h3>
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Display Name
                </dt>
                <dd className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {profile.display_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Email Address
                </dt>
                <dd className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {profile.email}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-gray-500">
              To update your name or email, please contact your institution administrator.
            </p>
          </Card>

          {/* Institutional Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Institutional Information
            </h3>
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Institution
                </dt>
                <dd className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {profile.institution?.name || 'Not assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Department
                </dt>
                <dd className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {profile.department?.name || 'Not assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Role
                </dt>
                <dd className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {getRoleDisplayName(profile.role)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Account Status
                </dt>
                <dd className="text-sm">
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
            </dl>
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Read-only fields:</strong> Institution, department, role, and status
                can only be modified by your institution administrator. This prevents
                unauthorized privilege escalation and maintains proper institutional governance.
              </p>
            </div>
          </Card>

          {/* Account Metadata */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Account Information
            </h3>
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Account Created
                </dt>
                <dd className="text-sm text-gray-900">{createdAt}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Last Updated
                </dt>
                <dd className="text-sm text-gray-900">{updatedAt}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  User ID
                </dt>
                <dd className="text-sm text-gray-900 font-mono text-xs break-all">
                  {profile.id}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Security Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Security
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Authentication
                </h4>
                <p className="text-sm text-gray-600">
                  Your account is secured with email and password authentication via
                  Supabase. All access is logged for security and compliance purposes.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Data Privacy
                </h4>
                <p className="text-sm text-gray-600">
                  Your personal information is protected by Row Level Security (RLS)
                  policies. You can only access data from your assigned institution.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
