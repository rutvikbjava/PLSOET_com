/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Policy Detail Page
 * 
 * Shows full policy details with validation and actions
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/session';
import { getPolicy, getPolicySources } from '@/lib/policies';
import { getValidationHistory } from '@/lib/policies/validation';
import { AppShell, PageContainer, PageHeader, LoadingState } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ValidateButton } from './ValidateButton';
import { StatusActions } from './StatusActions';

interface PageProps {
  params: {
    id: string;
  };
}

async function PolicyContent({ policyId }: { policyId: string }) {
  const [policyResult, sourcesResult, validationResult] = await Promise.all([
    getPolicy(policyId),
    getPolicySources(policyId),
    getValidationHistory(policyId),
  ]);

  if (!policyResult.success || !policyResult.policy) {
    notFound();
  }

  const policy = policyResult.policy;
  const sources = sourcesResult.success ? (sourcesResult.sources || []) : [];
  const validations = validationResult.success ? (validationResult.validations || []) : [];
  const latestValidation = validations.length > 0 ? validations[0] : null;

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Policy Header */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{policy.name}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[policy.status as keyof typeof statusColors]
                  }`}
                >
                  {policy.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">Version {policy.version}</p>
            </div>
            <StatusActions policy={policy} />
          </div>

          {policy.description && (
            <p className="text-gray-700 mb-4">{policy.description}</p>
          )}

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policy.department_id && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{policy.department_id}</dd>
              </div>
            )}
            {policy.effective_from && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Effective From</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(policy.effective_from).toLocaleDateString()}
                </dd>
              </div>
            )}
            {policy.effective_until && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Effective Until</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(policy.effective_until).toLocaleDateString()}
                </dd>
              </div>
            )}
            {policy.created_by && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900">{policy.created_by}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(policy.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(policy.updated_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* Policy Rules */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Policy Rules</h3>
          <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
            <pre className="text-sm text-gray-900">
              {JSON.stringify(policy.policy_rules, null, 2)}
            </pre>
          </div>
        </div>
      </Card>

      {/* Validation Status */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Validation Status</h3>
            <ValidateButton policyId={policy.id} />
          </div>

          {latestValidation ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    latestValidation.is_compliant
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {latestValidation.is_compliant ? 'Compliant' : 'Non-Compliant'}
                </span>
                <span className="text-sm text-gray-500">
                  Validated {new Date(latestValidation.created_at).toLocaleString()}
                </span>
              </div>

              {latestValidation.validation_result && (
                <p className="text-sm text-gray-700">{latestValidation.validation_result}</p>
              )}

              {latestValidation.violations && latestValidation.violations.length > 0 && (
                <div className="mt-4">
                  <Link href={`/validation/${policy.id}`}>
                    <Button variant="secondary">View Findings</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              This policy has not been validated yet.
            </p>
          )}
        </div>
      </Card>

      {/* Source Documents */}
      {sources && sources.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Source Documents</h3>
            <div className="space-y-2">
              {sources.map((source: any) => (
                <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{source.document?.title || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">
                      {source.source_type} • {source.document?.document_type}
                    </p>
                  </div>
                  <Link href={`/documents/${source.document?.id}`}>
                    <Button variant="secondary" size="sm">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/policies">
          <Button variant="secondary">Back to Policies</Button>
        </Link>
      </div>
    </div>
  );
}

export default async function PolicyDetailPage({ params }: PageProps) {
  await requireAuth();

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Policy Details"
          description="View policy information and validation status"
        />

        <Suspense fallback={<LoadingState />}>
          <PolicyContent policyId={params.id} />
        </Suspense>
      </PageContainer>
    </AppShell>
  );
}
