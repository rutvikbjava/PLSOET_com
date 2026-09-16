/**
 * EDU-010: Signature Form Component
 * 
 * Provides interface for signing documents with consent checkbox.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeSignatureAction } from '../actions';

interface SignatureFormProps {
  requestId: string;
}

export function SignatureForm({ requestId }: SignatureFormProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!agreed) {
      setError('You must agree to sign the document');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setShowConfirmation(true);
  }

  async function confirmSignature() {
    setLoading(true);
    setError('');

    const result = await completeSignatureAction({
      request_id: requestId,
      signature_data: {
        full_name: fullName.trim(),
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to complete signature');
      setShowConfirmation(false);
    }

    setLoading(false);
  }

  return (
    <>
      <div className="bg-white border border-purple-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Sign Document</h3>
            <p className="text-sm text-gray-600">
              Please review the document carefully before signing. Your digital signature will be
              legally binding and cannot be undone.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Input */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your full legal name"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Type your full name exactly as it appears on official documents
            </p>
          </div>

          {/* Consent Checkbox */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreed"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="agreed" className="text-sm text-gray-700 flex-1">
                <span className="font-medium">I agree and consent to sign this document.</span>
                <br />
                I understand that my digital signature will have the same legal effect as a
                handwritten signature. By signing, I confirm that I have read and agree to the
                contents of this document.
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!agreed || !fullName.trim() || loading}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign Document
            </button>
            <p className="text-xs text-gray-500">
              Your signature will be recorded with timestamp and IP address
            </p>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Confirm Your Signature
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      You are about to digitally sign this document as:
                    </p>
                    <p className="text-base font-semibold text-gray-900 mb-4">
                      {fullName}
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> This action cannot be undone. Your digital
                        signature will be legally binding and will be recorded with a timestamp
                        and your IP address for audit purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={confirmSignature}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Signing...' : 'Confirm Signature'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmation(false);
                    setError('');
                  }}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
