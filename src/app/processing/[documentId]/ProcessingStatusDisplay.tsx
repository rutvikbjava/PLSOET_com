/**
 * Processing Status Display Component
 * 
 * Shows processing status with visual indicators
 */

'use client';

interface ProcessingStatus {
  id: string;
  processing_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retry_count: number;
  error_message: string | null;
  started_at: string | null;
  processed_at: string | null;
  confidence_score: number | null;
  model_version: string | null;
}

interface Props {
  status: ProcessingStatus;
}

export function ProcessingStatusDisplay({ status }: Props) {
  const statusColors = {
    PENDING: 'bg-gray-100 text-gray-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    PENDING: '⏳',
    PROCESSING: '⚙️',
    COMPLETED: '✅',
    FAILED: '❌',
  };

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{statusIcons[status.processing_status]}</span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusColors[status.processing_status]
          }`}
        >
          {status.processing_status}
        </span>
      </div>

      {/* Status Details */}
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {status.started_at && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Started</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(status.started_at).toLocaleString()}
            </dd>
          </div>
        )}
        {status.processed_at && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Completed</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(status.processed_at).toLocaleString()}
            </dd>
          </div>
        )}
        {status.retry_count > 0 && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Retry Count</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {status.retry_count} / 3
            </dd>
          </div>
        )}
        {status.confidence_score !== null && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Confidence</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {(status.confidence_score * 100).toFixed(1)}%
            </dd>
          </div>
        )}
        {status.model_version && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Model</dt>
            <dd className="mt-1 text-sm text-gray-900">{status.model_version}</dd>
          </div>
        )}
      </dl>

      {/* Error Message */}
      {status.error_message && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2">Error Details</h3>
          <p className="text-sm text-red-700">{status.error_message}</p>
        </div>
      )}

      {/* Processing Message */}
      {status.processing_status === 'PROCESSING' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700">
              Processing in progress... This may take a few moments.
            </p>
          </div>
        </div>
      )}

      {/* Pending Message */}
      {status.processing_status === 'PENDING' && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Processing is queued and will begin shortly.
          </p>
        </div>
      )}
    </div>
  );
}
