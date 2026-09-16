/**
 * Processing Status Component
 * 
 * Displays document processing status with links to processing and context pages
 */

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProcessingStatusProps {
  documentId: string;
  processingStatus?: string;
  hasContext?: boolean;
}

export function ProcessingStatus({
  documentId,
  processingStatus,
  hasContext,
}: ProcessingStatusProps) {
  if (!processingStatus) {
    return (
      <Card>
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
            Document Processing
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            This document has not been processed yet. Processing extracts context
            and metadata for workflow generation.
          </p>
          <Link href={`/processing/${documentId}`}>
            <Button variant="secondary">View Processing Options</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const statusConfig = {
    PENDING: {
      color: 'bg-gray-100 text-gray-800',
      icon: '⏳',
      message: 'Processing has been queued',
    },
    PROCESSING: {
      color: 'bg-blue-100 text-blue-800',
      icon: '🔄',
      message: 'Currently processing document',
    },
    COMPLETED: {
      color: 'bg-green-100 text-green-800',
      icon: '✅',
      message: 'Processing completed successfully',
    },
    FAILED: {
      color: 'bg-red-100 text-red-800',
      icon: '❌',
      message: 'Processing failed',
    },
  };

  const config = statusConfig[processingStatus as keyof typeof statusConfig] || {
    color: 'bg-gray-100 text-gray-800',
    icon: '•',
    message: processingStatus,
  };

  return (
    <Card>
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Document Processing
        </h3>

        <div className="flex items-start gap-4">
          <span className="text-3xl">{config.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
              >
                {processingStatus}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-4">{config.message}</p>

            <div className="flex gap-3">
              <Link href={`/processing/${documentId}`}>
                <Button variant="secondary" size="sm">
                  View Processing Details
                </Button>
              </Link>

              {processingStatus === 'COMPLETED' && hasContext && (
                <Link href={`/contexts/${documentId}`}>
                  <Button variant="secondary" size="sm">
                    View Extracted Context
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
