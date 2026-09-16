/**
 * Upload Document Form Component
 * 
 * Client component for uploading new documents.
 * Handles file selection, metadata input, validation, upload progress, and errors.
 */

'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { uploadDocument } from '../actions';
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_MB,
  validateFile,
  validateDocumentMetadata,
} from '@/lib/documents/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface UploadDocumentFormProps {
  departments: Department[];
}

export default function UploadDocumentForm({
  departments,
}: UploadDocumentFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // UI state
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

    // Auto-fill title from filename if empty
    if (!title) {
      const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setTitle(filename);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setErrors([]);

    // Validate metadata
    const metadataValidation = validateDocumentMetadata({
      title,
      document_type: documentType,
      description,
      department_id: departmentId || undefined,
    });

    if (!metadataValidation.valid) {
      setErrors(metadataValidation.errors);
      return;
    }

    // Validate file
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    const fileValidation = validateFile(selectedFile);
    if (!fileValidation.valid) {
      setErrors(fileValidation.errors);
      return;
    }

    try {
      setIsUploading(true);

      // Upload document
      const result = await uploadDocument({
        title: title.trim(),
        document_type: documentType.trim(),
        description: description.trim() || undefined,
        department_id: departmentId || null,
        file: selectedFile,
      });

      if (!result.success) {
        setError(result.error || 'Upload failed');
        if (result.errors) {
          setErrors(result.errors);
        }
        return;
      }

      // Success - redirect to document detail
      if (result.documentId) {
        router.push(`/documents/${result.documentId}`);
      } else {
        router.push('/documents');
      }
    } catch (err) {
      console.error('[UPLOAD_DOCUMENT_ERROR]', err);
      setError('An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* File Upload */}
        <div>
          <label
            htmlFor="document-file"
            className="block text-sm font-medium text-gray-700"
          >
            Document File <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              ref={fileInputRef}
              type="file"
              id="document-file"
              name="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileSelect}
              disabled={isUploading}
              required
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
                <span className="font-medium">Selected:</span>{' '}
                {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Document Title <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <Input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              required
              maxLength={200}
              placeholder="Enter document title"
              aria-describedby="title-description"
            />
          </div>
          <p id="title-description" className="mt-2 text-xs text-gray-500">
            A clear, descriptive title for the document
          </p>
        </div>

        {/* Document Type */}
        <div>
          <label
            htmlFor="document_type"
            className="block text-sm font-medium text-gray-700"
          >
            Document Type <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <select
              id="document_type"
              name="document_type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={isUploading}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select document type</option>
              <option value="Application">Application</option>
              <option value="Report">Report</option>
              <option value="Form">Form</option>
              <option value="Certificate">Certificate</option>
              <option value="Letter">Letter</option>
              <option value="Policy">Policy</option>
              <option value="Procedure">Procedure</option>
              <option value="Minutes">Minutes</option>
              <option value="Agenda">Agenda</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              rows={3}
              maxLength={1000}
              placeholder="Optional description of the document"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-describedby="description-hint"
            />
          </div>
          <p id="description-hint" className="mt-2 text-xs text-gray-500">
            Optional. Provide additional context or details about the document.
          </p>
        </div>

        {/* Department (optional) */}
        {departments.length > 0 && (
          <div>
            <label
              htmlFor="department_id"
              className="block text-sm font-medium text-gray-700"
            >
              Department
            </label>
            <div className="mt-1">
              <select
                id="department_id"
                name="department_id"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={isUploading}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">No specific department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} {dept.code && `(${dept.code})`}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Optional. Associate this document with a specific department.
            </p>
          </div>
        )}

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

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={() => router.back()}
            disabled={isUploading}
            className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedFile || isUploading}>
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
              'Upload Document'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
