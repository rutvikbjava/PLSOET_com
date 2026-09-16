/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Validate Policy Button
 * 
 * Triggers policy validation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { validatePolicyAction } from '../actions';

interface Props {
  policyId: string;
}

export function ValidateButton({ policyId }: Props) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await validatePolicyAction(policyId);

      if (result.success) {
        // Refresh page to show new validation
        router.refresh();
      } else {
        setError(result.error || 'Failed to validate policy');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleValidate}
        disabled={isValidating}
        variant="primary"
      >
        {isValidating ? 'Validating...' : 'Validate Policy'}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
