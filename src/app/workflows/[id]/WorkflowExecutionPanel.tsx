'use client';

/**
 * Workflow Execution Panel Component
 * 
 * Allows users to start workflow execution and monitor progress
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startWorkflowAction } from '../actions';

interface WorkflowExecutionPanelProps {
  workflowId: string;
}

export function WorkflowExecutionPanel({
  workflowId,
}: WorkflowExecutionPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [documentId, setDocumentId] = useState('');

  const handleStartWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentId.trim()) {
      setError('Document ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await startWorkflowAction({
      workflow_definition_id: workflowId,
      document_id: documentId.trim(),
    });

    if (result.success) {
      alert(`Workflow started! Instance ID: ${result.data.instance_id}`);
      setShowForm(false);
      setDocumentId('');
      router.refresh();
    } else {
      setError(result.error || 'Failed to start workflow');
    }

    setLoading(false);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Execute Workflow
        </h3>

        {!showForm ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              This workflow is active and ready for execution. You can start a
              new workflow instance for a document.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Start Workflow
            </button>
          </div>
        ) : (
          <form onSubmit={handleStartWorkflow}>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="documentId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Document ID
              </label>
              <input
                type="text"
                id="documentId"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter document UUID"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                The document this workflow will process
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Start Execution'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                  setDocumentId('');
                }}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
