/**
 * Workflows List Page
 * 
 * Displays list of workflows with filtering and navigation to:
 * - Workflow details
 * - AI workflow generation
 * - Workflow execution monitoring
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import { listWorkflowsAction } from './actions';
import { AppShell, PageContainer, PageHeader, ErrorState, LoadingState } from '@/components/layout';

interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  version: number;
  step_count?: number;
  created_at: string;
}

async function WorkflowListContent({ status }: { status?: string }) {
  await requireAuth();
  await requireProfile();

  const result = await listWorkflowsAction({ 
    status: status as 'DRAFT' | 'VALIDATING' | 'READY' | 'ACTIVE' | undefined 
  });

  if (!result.success) {
    return <ErrorState message={result.error || 'Failed to load workflows'} />;
  }

  const workflows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <Link
          href="/workflows"
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            !status
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          All
        </Link>
        <Link
          href="/workflows?status=DRAFT"
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            status === 'DRAFT'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Draft
        </Link>
        <Link
          href="/workflows?status=READY"
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            status === 'READY'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Ready
        </Link>
        <Link
          href="/workflows?status=ACTIVE"
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            status === 'ACTIVE'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Active
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
            {status
              ? `No workflows with status "${status}".`
              : 'Get started by generating a workflow from a document.'}
          </p>
          <Link
            href="/workflows/generate"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Generate Workflow
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {workflows.map((workflow: WorkflowItem) => (
              <li key={workflow.id}>
                <Link
                  href={`/workflows/${workflow.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {workflow.name}
                        </p>
                        {workflow.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {workflow.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center gap-3">
                        <StatusBadge status={workflow.status} />
                        <svg
                          className="h-5 w-5 text-gray-400"
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
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex sm:gap-4">
                        <p className="flex items-center text-xs text-gray-500">
                          Version {workflow.version}
                        </p>
                        {workflow.step_count !== undefined && (
                          <p className="flex items-center text-xs text-gray-500">
                            {workflow.step_count} step
                            {workflow.step_count !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500 sm:mt-0">
                        <time dateTime={workflow.created_at}>
                          {new Date(workflow.created_at).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const status = searchParams?.status;

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Workflows"
          description="Manage and execute approval workflows"
          actions={
            <Link
              href="/workflows/generate"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Generate Workflow
            </Link>
          }
        />

        <Suspense fallback={<LoadingState />}>
          <WorkflowListContent status={status} />
        </Suspense>
      </PageContainer>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    DRAFT: 'bg-gray-100 text-gray-800',
    VALIDATING: 'bg-yellow-100 text-yellow-800',
    READY: 'bg-green-100 text-green-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    INACTIVE: 'bg-gray-100 text-gray-600',
    ARCHIVED: 'bg-gray-100 text-gray-500',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status as keyof typeof styles] || styles.DRAFT
      }`}
    >
      {status}
    </span>
  );
}
