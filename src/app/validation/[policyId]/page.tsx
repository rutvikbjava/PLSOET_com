/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Policy Validation Findings Page
 * 
 * Shows detailed validation findings for a policy
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { getPolicy } from '@/lib/policies';
import { getValidationHistory } from '@/lib/policies/validation';
import { AppShell } from '@/components/layout';
import { PageContainer, PageHeader, LoadingState } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PageProps {
  params: {
    policyId: string;
  };
}

async function ValidationContent({ policyId }: { policyId: string }) {
  const [policyResult, validationResult] = await Promise.all([
    getPolicy(policyId),
    getValidationHistory(policyId),
  ]);

  if (!policyResult.success || !policyResult.policy) {
    notFound();
  }

  const policy = policyResult.policy;
  const validations = (validationResult.success ? validationResult.validations : []) || [];

  if (validations.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-500 mb-4">
            This policy has not been validated yet.
          </p>
          <Link href={`/policies/${policyId}`}>
            <Button>Go to Policy</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const latestValidation = validations[0];
  const violations = latestValidation.violations || [];

  const severityColors = {
    ERROR: 'bg-red-100 text-red-800 border-red-200',
    WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    INFO: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const severityIcons = {
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
  };

  return (
    <div className="space-y-6">
      {/* Policy Info */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">{policy.name}</h2>
          <p className="text-sm text-gray-500">Version {policy.version}</p>
        </div>
      </Card>

      {/* Validation Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Validation Summary</h3>
          <div className="space-y-3">
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

            <div className="text-sm text-gray-600">
              <p>Found {violations.length} finding(s)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Findings */}
      {violations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Findings</h3>
          {violations.map((finding: any, index: number) => (
            <Card key={index}>
              <div className={`p-6 border-l-4 ${severityColors[finding.severity as keyof typeof severityColors]}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{severityIcons[finding.severity as keyof typeof severityIcons]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {finding.rule}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          severityColors[finding.severity as keyof typeof severityColors]
                        }`}
                      >
                        {finding.severity}
                      </span>
                      {finding.requires_review && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 font-medium">
                          REQUIRES REVIEW
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2">{finding.message}</h4>
                    <p className="text-sm text-gray-700">{finding.explanation}</p>

                    {finding.source_reference && (
                      <div className="mt-3 text-xs text-gray-500">
                        {finding.source_reference.document_id && (
                          <Link
                            href={`/documents/${finding.source_reference.document_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            View Source Document
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Validation History */}
      {validations.length > 1 && (
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Validation History</h3>
            <div className="space-y-2">
              {validations.slice(1, 6).map((validation: any) => (
                <div
                  key={validation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        validation.is_compliant
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {validation.is_compliant ? 'Compliant' : 'Non-Compliant'}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {new Date(validation.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {(validation.violations || []).length} finding(s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link href={`/policies/${policyId}`}>
          <Button variant="secondary">Back to Policy</Button>
        </Link>
      </div>
    </div>
  );
}

export default async function ValidationFindingsPage({ params }: PageProps) {
  await requireAuth();

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Validation Findings"
          description="Detailed policy validation results"
        />

        <Suspense fallback={<LoadingState />}>
          <ValidationContent policyId={params.policyId} />
        </Suspense>
      </PageContainer>
    </AppShell>
  );
}
