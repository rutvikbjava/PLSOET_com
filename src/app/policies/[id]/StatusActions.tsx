/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Policy Status Actions
 * 
 * Actions for changing policy status (activate, archive, etc.)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { changePolicyStatusAction } from '../actions';

interface Props {
  policy: {
    id: string;
    status: string;
    [key: string]: any;
  };
}

export function StatusActions({ policy }: Props) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      return;
    }

    setIsChanging(true);
    setError(null);

    try {
      const result = await changePolicyStatusAction(policy.id, newStatus as any);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'Failed to change status');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex gap-2">
      {policy.status === 'DRAFT' && (
        <Button
          onClick={() => handleStatusChange('ACTIVE')}
          disabled={isChanging}
          variant="primary"
          size="sm"
        >
          Activate
        </Button>
      )}
      {policy.status === 'ACTIVE' && (
        <>
          <Button
            onClick={() => handleStatusChange('INACTIVE')}
            disabled={isChanging}
            variant="secondary"
            size="sm"
          >
            Deactivate
          </Button>
          <Button
            onClick={() => handleStatusChange('ARCHIVED')}
            disabled={isChanging}
            variant="secondary"
            size="sm"
          >
            Archive
          </Button>
        </>
      )}
      {policy.status === 'INACTIVE' && (
        <>
          <Button
            onClick={() => handleStatusChange('ACTIVE')}
            disabled={isChanging}
            variant="primary"
            size="sm"
          >
            Reactivate
          </Button>
          <Button
            onClick={() => handleStatusChange('ARCHIVED')}
            disabled={isChanging}
            variant="secondary"
            size="sm"
          >
            Archive
          </Button>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
