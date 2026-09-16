'use client';

/**
 * Workflow Status Actions Component
 * 
 * Provides buttons to change workflow status:
 * - Mark as reviewed
 * - Activate workflow
 * - Deactivate workflow
 * - Archive workflow
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateWorkflowStatusAction,
  markWorkflowReviewedAction,
} from '../actions';

interface WorkflowStatusActionsProps {
  workflowId: string;
  status: string;
  reviewed: boolean;
}

export function WorkflowStatusActions({
  workflowId,
  status,
  reviewed,
}: WorkflowStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkReviewed = async () => {
    if (!confirm('Mark this workflow as reviewed?')) return;

    setLoading(true);
    setError(null);

    const result = await markWorkflowReviewedAction(workflowId);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to mark as reviewed');
    }

    setLoading(false);
  };

  const handleActivate = async () => {
    if (!confirm('Activate this workflow? It will be available for execution.')) return;

    setLoading(true);
    setError(null);

    const result = await updateWorkflowStatusAction(workflowId, 'ACTIVE');

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to activate workflow');
    }

    setLoading(false);
  };

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this workflow? Running instances will not be affected.')) return;

    setLoading(true);
    setError(null);

    const result = await updateWorkflowStatusAction(workflowId, 'INACTIVE');

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to deactivate workflow');
    }

    setLoading(false);
  };

  const handleArchive = async () => {
    if (!confirm('Archive this workflow? This cannot be undone.')) return;

    setLoading(true);
    setError(null);

    const result = await updateWorkflowStatusAction(workflowId, 'ARCHIVED');

    if (result.success) {
      router.push('/workflows');
    } else {
      setError(result.error || 'Failed to archive workflow');
    }

    setLoading(false);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {status === 'READY' && !reviewed && (
            <button
              onClick={handleMarkReviewed}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Mark as Reviewed
            </button>
          )}

          {status === 'READY' && reviewed && (
            <button
              onClick={handleActivate}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Activate Workflow
            </button>
          )}

          {status === 'ACTIVE' && (
            <button
              onClick={handleDeactivate}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Deactivate
            </button>
          )}

          {(status === 'INACTIVE' || status === 'DRAFT') && (
            <button
              onClick={handleArchive}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Archive
            </button>
          )}
        </div>

        {status === 'READY' && !reviewed && (
          <p className="mt-3 text-sm text-gray-500">
            This workflow must be reviewed before it can be activated.
          </p>
        )}
      </div>
    </div>
  );
}
