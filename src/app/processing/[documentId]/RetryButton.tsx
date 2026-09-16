/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Retry Processing Button
 * 
 * Allows users to retry failed processing
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { retryProcessingAction } from '@/app/processing/actions';

interface Props {
  documentId: string;
}

export function RetryButton({ documentId }: Props) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);

    try {
      const result = await retryProcessingAction(documentId);

      if (result.success) {
        // Refresh page to show new status
        router.refresh();
      } else {
        setError(result.error || 'Failed to retry processing');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleRetry}
        disabled={isRetrying}
        variant="primary"
      >
        {isRetrying ? 'Retrying...' : 'Retry Processing'}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
