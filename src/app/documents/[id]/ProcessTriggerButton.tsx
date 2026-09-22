/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Process Trigger Button
 * 
 * Allows users to trigger document processing
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { triggerProcessing } from '@/app/processing/actions';

interface Props {
  documentId: string;
}

export function ProcessTriggerButton({ documentId }: Props) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await triggerProcessing(documentId);

      if (result.success) {
        // Navigate to processing status page
        router.push(`/processing/${documentId}`);
      } else {
        setError(result.error || 'Failed to trigger processing');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleProcess}
        disabled={isProcessing}
        variant="primary"
        size="sm"
      >
        {isProcessing ? 'Processing...' : 'Process Document'}
      </Button>
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800 font-medium">Processing Error:</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
