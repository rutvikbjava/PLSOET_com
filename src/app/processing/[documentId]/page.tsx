/**
 * Document Processing Status Page
 * 
 * Shows processing status, progress, and results for a document
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { getProcessingStatusAction, getDocumentContext } from '@/app/processing/actions';
import { AppShell, PageContainer, PageHeader, LoadingState } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProcessingStatusDisplay } from './ProcessingStatusDisplay';
import { RetryButton } from './RetryButton';
import Link from 'next/link';

interface PageProps {
  params: {
    documentId: string;
  };
}

async function ProcessingContent({ documentId }: { documentId: string }) {
  const [statusResult, contextResult] = await Promise.all([
    getProcessingStatusAction(documentId),
    getDocumentContext(documentId),
  ]);

  // Debug logging (will show in server logs)
  if (!contextResult.success) {
    console.error('[PROCESSING_PAGE] Failed to get document context:', {
      documentId,
      error: contextResult.error,
    });
  }

  if (!statusResult.success) {
    console.error('[PROCESSING_PAGE] Failed to get processing status:', {
      documentId,
      error: statusResult.error,
    });
  }

  if (!contextResult.success || !contextResult.document) {
    notFound();
  }

  const { status } = statusResult;
  const { document } = contextResult;

  return (
    <div className="space-y-6">
      {/* Document Info */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Document Information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{document.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{document.document_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{document.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(document.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* Processing Status */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Processing Status</h2>
            {status && status.processing_status === 'FAILED' && status.retry_count < 3 && (
              <RetryButton documentId={documentId} />
            )}
          </div>
          
          {status ? (
            <ProcessingStatusDisplay status={status} />
          ) : (
            <div className="text-sm text-gray-500">
              <p>This document has not been processed yet.</p>
              <div className="mt-4">
                <Link href={`/documents/${documentId}`}>
                  <Button>Go to Document</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Context Preview */}
      {document.context && document.context.processing_status === 'COMPLETED' && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Extracted Context</h2>
              <Link href={`/contexts/${documentId}`}>
                <Button variant="secondary">View Full Context</Button>
              </Link>
            </div>

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {document.context.document_type_detected && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.context.document_type_detected}
                  </dd>
                </div>
              )}
              {document.context.creator_role_detected && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Creator Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.context.creator_role_detected}
                  </dd>
                </div>
              )}
              {document.context.department_scope && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department Scope</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.context.department_scope}
                  </dd>
                </div>
              )}
              {document.context.impact_level && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Impact Level</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.context.impact_level}
                  </dd>
                </div>
              )}
              {document.context.confidence_score !== null && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Confidence Score</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {(document.context.confidence_score * 100).toFixed(1)}%
                  </dd>
                </div>
              )}
              {document.context.model_version && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Model Version</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.context.model_version}
                  </dd>
                </div>
              )}
            </dl>

            {document.context.purpose && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500">Purpose</dt>
                <dd className="mt-1 text-sm text-gray-900">{document.context.purpose}</dd>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link href={`/documents/${documentId}`}>
          <Button variant="secondary">Back to Document</Button>
        </Link>
        {document.context && document.context.processing_status === 'COMPLETED' && (
          <Link href={`/contexts/${documentId}`}>
            <Button>View Full Context</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function ProcessingStatusPage({ params }: PageProps) {
  await requireAuth();

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Processing Status"
          description="View document processing status and results"
        />

        <Suspense fallback={<LoadingState />}>
          <ProcessingContent documentId={params.documentId} />
        </Suspense>
      </PageContainer>
    </AppShell>
  );
}
