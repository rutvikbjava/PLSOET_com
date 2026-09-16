/**
 * AI Workflow Generation Page
 * 
 * Allows users to generate workflows using AI based on document context
 */

import Link from 'next/link';
import { requireAuth, requireProfile } from '@/lib/auth/session';
import { AppShell, PageContainer, PageHeader } from '@/components/layout';
import { WorkflowGenerationForm } from './WorkflowGenerationForm';

export default async function GenerateWorkflowPage() {
  await requireAuth();
  await requireProfile();

  return (
    <AppShell>
      <PageContainer>
        <div className="mb-4">
          <Link href="/workflows" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Workflows
          </Link>
        </div>

        <PageHeader
          title="Generate Workflow"
          description="Use AI to generate an approval workflow based on document context and policies"
        />

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <WorkflowGenerationForm />
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About AI Workflow Generation
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>AI analyzes document context to suggest appropriate approval steps</li>
                  <li>Generated workflows are validated against institutional policies</li>
                  <li>All AI-generated workflows require human review before activation</li>
                  <li>You can edit steps after generation to customize the workflow</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
