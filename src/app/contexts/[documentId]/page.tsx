/**
 * Document Context Viewer Page
 * 
 * Displays full extracted context and metadata for a document
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/session';
import { getDocumentContext } from '@/app/processing/actions';
import { AppShell, PageContainer, PageHeader, LoadingState } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PageProps {
  params: {
    documentId: string;
  };
}

async function ContextContent({ documentId }: { documentId: string }) {
  const result = await getDocumentContext(documentId);

  if (!result.success || !result.document) {
    notFound();
  }

  const { document } = result;
  const context = document.context;

  if (!context || context.processing_status !== 'COMPLETED') {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-500 mb-4">
            This document has not been processed yet or processing is incomplete.
          </p>
          <Link href={`/processing/${documentId}`}>
            <Button>View Processing Status</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Info */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Document</h2>
          <div className="space-y-2">
            <p className="text-lg font-medium">{document.title}</p>
            <p className="text-sm text-gray-500">Type: {document.document_type}</p>
            <p className="text-sm text-gray-500">
              Processed: {new Date(context.processed_at).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Extracted Metadata */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Extracted Metadata</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {context.document_type_detected && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{context.document_type_detected}</dd>
              </div>
            )}
            {context.creator_role_detected && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Creator Role</dt>
                <dd className="mt-1 text-sm text-gray-900">{context.creator_role_detected}</dd>
              </div>
            )}
            {context.department_scope && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Department Scope</dt>
                <dd className="mt-1 text-sm text-gray-900">{context.department_scope}</dd>
              </div>
            )}
            {context.impact_level && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Impact Level</dt>
                <dd className="mt-1 text-sm text-gray-900">{context.impact_level}</dd>
              </div>
            )}
            {context.confidence_score !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Confidence Score</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(context.confidence_score * 100).toFixed(1)}%
                </dd>
              </div>
            )}
            {context.model_version && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Model Version</dt>
                <dd className="mt-1 text-sm text-gray-900">{context.model_version}</dd>
              </div>
            )}
          </dl>

          {context.purpose && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500">Purpose</dt>
              <dd className="mt-1 text-sm text-gray-900">{context.purpose}</dd>
            </div>
          )}
        </div>
      </Card>

      {/* Extracted Attributes */}
      {context.extracted_attributes && Object.keys(context.extracted_attributes).length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Extracted Attributes</h2>
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
              <pre className="text-sm text-gray-900">
                {JSON.stringify(context.extracted_attributes, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link href={`/documents/${documentId}`}>
          <Button variant="secondary">Back to Document</Button>
        </Link>
        <Link href={`/processing/${documentId}`}>
          <Button variant="secondary">View Processing Status</Button>
        </Link>
      </div>
    </div>
  );
}

export default async function ContextViewerPage({ params }: PageProps) {
  await requireAuth();

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Document Context"
          description="View extracted context and metadata"
        />

        <Suspense fallback={<LoadingState />}>
          <ContextContent documentId={params.documentId} />
        </Suspense>
      </PageContainer>
    </AppShell>
  );
}
