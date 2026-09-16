/**
 * Download Button Component
 * 
 * Client component for downloading document versions.
 * Handles signed URL generation and download initiation.
 */

'use client';

import { useState } from 'react';
import { getDocumentDownloadUrl } from '../actions';

interface DownloadButtonProps {
  versionId: string;
  versionNumber: number;
}

export default function DownloadButton({
  versionId,
  versionNumber,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);

      // Get signed download URL from server
      const result = await getDocumentDownloadUrl(versionId);

      if (!result.success || !result.url) {
        setError(result.error || 'Failed to generate download link');
        return;
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename || `document-v${versionNumber}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[DOWNLOAD_ERROR]', err);
      setError('An unexpected error occurred');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
        aria-label={`Download version ${versionNumber}`}
      >
        {isDownloading ? 'Downloading...' : 'Download'}
      </button>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
