/**
 * Upload Version Form Component
 * 
 * Client component for uploading new document versions.
 * Handles file selection, validation, upload progress, and errors.
 */

'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { uploadDocumentVersion } from '../actions';
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_MB,
  validateFile,
} from '@/lib/documents/validation';
import { Button } from '@/components/ui/Button';

interface UploadVersionFormProps {
  documentId: string;
}

export default function UploadVersionForm({
  documentId,
}: UploadVersionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    setErrors([]);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Client-side validation (UX only)
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrors(validation.errors);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setErrors([]);

      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload version
      const result = await uploadDocumentVersion(documentId, formData);

      if (!result.success) {
        setError(result.error || 'Upload failed');
        if (result.errors) {
          setErrors(result.errors);
        }
        return;
      }

      // Success - refresh page to show new version
      router.refresh();

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show success message (optional)
      alert('New version uploaded successfully!');
    } catch (err) {
      console.error('[UPLOAD_VERSION_ERROR]', err);
      setError('An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="version-file"
          className="block text-sm font-medium text-gray-700"
        >
          Select File
        </label>
        <div className="mt-1 flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            id="version-file"
            name="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-describedby="file-constraints"
          />
        </div>
        <p id="file-constraints" className="mt-2 text-xs text-gray-500">
          Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT. Max size:{' '}
          {MAX_FILE_SIZE_MB}MB
        </p>

        {selectedFile && (
          <div className="mt-2 rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Selected:</span> {selectedFile.name}{' '}
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Validation Errors
              </h3>
              <ul className="mt-2 list-disc list-inside text-sm text-red-700">
                {errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="inline-flex justify-center"
        >
          {isUploading ? (
            <>
              <svg
                className="mr-2 -ml-1 h-5 w-5 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
              Uploading...
            </>
          ) : (
            'Upload New Version'
          )}
        </Button>
      </div>
    </form>
  );
}
