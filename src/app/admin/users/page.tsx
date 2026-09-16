/**
 * Admin User Management Page
 * 
 * Allows admins to approve/reject pending user accounts.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAuth, getUserProfile, getAvailableNavigation } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { listPendingUsers } from './actions';
import { UserApprovalList } from './UserApprovalList';

export const metadata: Metadata = {
  title: 'User Management',
  description: 'Approve or reject pending user accounts',
};

export default async function AdminUsersPage() {
  await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  // Only privileged roles can access user management
  const canManageUsers = ['SYSTEM_ADMIN', 'PRINCIPAL', 'ADMIN'].includes(profile.role);
  if (!canManageUsers) {
    redirect('/dashboard');
  }

  const result = await listPendingUsers();
  const pendingUsers = result.success ? result.data : [];
  const navigation = getAvailableNavigation(profile.role, profile.status);

  return (
    <AppLayout profile={profile} navigation={navigation}>      <PageContainer>
        <PageHeader
          title="User Management"
          description="Approve or reject pending user accounts"
        />

        {pendingUsers.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending users</h3>
            <p className="mt-1 text-sm text-gray-500">
              All user accounts have been reviewed.
            </p>
          </Card>
        ) : (
          <>
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{pendingUsers.length}</strong> user{pendingUsers.length !== 1 ? 's' : ''} awaiting approval
              </p>
            </div>
            <UserApprovalList users={pendingUsers} />
          </>
        )}
      </PageContainer>
    </AppLayout>
  );
}
