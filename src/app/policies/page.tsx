/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Policies List Page
 * 
 * Shows all institutional policies with filtering
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import { getPolicies } from '@/lib/policies';
import { AppShell, PageContainer, PageHeader, LoadingState, EmptyState } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

async function PoliciesContent() {
  const result = await getPolicies();

  if (!result.success || !result.policies) {
    return (
      <Card>
        <div className="p-6 text-center text-red-600">
          Failed to load policies
        </div>
      </Card>
    );
  }

  const policies = result.policies;

  if (policies.length === 0) {
    return (
      <EmptyState
        title="No policies found"
        description="Get started by creating your first institutional policy"
      />
    );
  }

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-4">
      {policies.map((policy: any) => (
        <Card key={policy.id}>
          <Link href={`/policies/${policy.id}`}>
            <div className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{policy.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[policy.status as keyof typeof statusColors]
                      }`}
                    >
                      {policy.status}
                    </span>
                    <span className="text-xs text-gray-500">v{policy.version}</span>
                  </div>

                  {policy.description && (
                    <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {policy.department && (
                      <span>Department: {policy.department.name}</span>
                    )}
                    {policy.effective_from && (
                      <span>Effective: {new Date(policy.effective_from).toLocaleDateString()}</span>
                    )}
                    {policy.effective_until && (
                      <span>Until: {new Date(policy.effective_until).toLocaleDateString()}</span>
                    )}
                    {policy.creator && (
                      <span>Created by: {policy.creator.display_name}</span>
                    )}
                  </div>
                </div>

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
        </Card>
      ))}
    </div>
  );
}

export default async function PoliciesPage() {
  await requireAuth();
  const profile = await requireProfile();

  const canCreatePolicy = ['HOD', 'COE', 'PRINCIPAL', 'ADMIN', 'SYSTEM_ADMIN'].includes(
    profile.role
  );

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Institutional Policies"
          description="Manage and view institutional policies"
        />

        {canCreatePolicy && (
          <div className="mb-6">
            <Link href="/policies/create">
              <Button>Create Policy</Button>
            </Link>
          </div>
        )}

        <Suspense fallback={<LoadingState />}>
          <PoliciesContent />
        </Suspense>
      </PageContainer>
    </AppShell>
  );
}
