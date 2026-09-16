'use client';

/**
 * Workflow Generation Form Component
 * 
 * Form for AI-powered workflow generation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  generateWorkflowAction,
  validateWorkflowAction,
  createWorkflowFromGenerationAction,
} from '../actions';
import type { WorkflowDSL } from '@/lib/workflows';

interface ValidationError {
  message: string;
  field?: string;
  severity?: 'error' | 'warning';
}

interface ValidationResult {
  success: boolean;
  data?: {
    is_valid: boolean;
    errors?: ValidationError[];
    warnings?: ValidationError[];
  };
  error?: string;
}

export function WorkflowGenerationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview' | 'validating'>('input');
  
  const [formData, setFormData] = useState({
    documentId: '',
    name: '',
    description: '',
  });

  const [generatedWorkflow, setGeneratedWorkflow] = useState<WorkflowDSL | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await generateWorkflowAction({
      business_intent: `${formData.name}: ${formData.description}`,
      workflow_type: 'APPROVAL',
      document_ids: [formData.documentId],
    });

    if (result.success && result.data.workflow) {
      setGeneratedWorkflow(result.data.workflow);
      setStep('preview');
    } else {
      setError(result.success ? 'No workflow generated' : result.error);
    }

    setLoading(false);
  };

  const handleValidateAndCreate = async () => {
    if (!generatedWorkflow) return;

    setStep('validating');
    setLoading(true);
    setError(null);

    // Validate first
    const validationResult = await validateWorkflowAction(generatedWorkflow);

    setValidationResult(validationResult);

    if (validationResult.success && validationResult.data?.is_valid) {
      // Create workflow - first we need to get the generation ID
      // For now, we'll create directly with the workflow
      const createResult = await createWorkflowFromGenerationAction(
        'temp-generation-id', // This would come from generateWorkflowAction result
        formData.name
      );

      if (createResult.success) {
        router.push(`/workflows/${createResult.data.workflow_id}`);
        return;
      } else {
        setError(createResult.error || 'Failed to create workflow');
      }
    } else {
      setError('Workflow validation failed. Please review errors below.');
    }

    setLoading(false);
    setStep('preview');
  };

  const handleBack = () => {
    setStep('input');
    setGeneratedWorkflow(null);
    setValidationResult(null);
    setError(null);
  };

  if (step === 'input') {
    return (
      <form onSubmit={handleGenerate} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="documentId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Document ID *
          </label>
          <input
            type="text"
            id="documentId"
            value={formData.documentId}
            onChange={(e) =>
              setFormData({ ...formData, documentId: e.target.value })
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter document UUID"
            required
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            The document to base the workflow on. Must be processed with
            extracted context.
          </p>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Workflow Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Student Attendance Approval"
            required
            maxLength={200}
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Optional description of what this workflow does"
            maxLength={1000}
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Workflow'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (step === 'preview' || step === 'validating') {
    return (
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Generated Workflow Preview
          </h3>

          {validationResult && !validationResult.data?.is_valid && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Validation Issues
              </h4>
              {validationResult.data?.errors && validationResult.data.errors.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-yellow-800">Errors:</p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {validationResult.data.errors.map((err, idx) => (
                      <li key={idx}>{err.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {validationResult.data?.warnings && validationResult.data.warnings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Warnings:
                  </p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {validationResult.data.warnings.map((warn, idx) => (
                      <li key={idx}>{warn.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {generatedWorkflow && generatedWorkflow.steps && (
            <div className="space-y-3">
              {generatedWorkflow.steps.map((step, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {step.name}
                      </h4>
                      <div className="mt-2 flex gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {step.action_type}
                        </span>
                        {step.is_mandatory && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {step === 'preview' && (
            <>
              <button
                onClick={handleValidateAndCreate}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Validate & Create Workflow'}
              </button>
              <button
                onClick={handleBack}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Back
              </button>
            </>
          )}
          {step === 'validating' && (
            <div className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 text-blue-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm text-gray-600">
                Validating and creating workflow...
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
