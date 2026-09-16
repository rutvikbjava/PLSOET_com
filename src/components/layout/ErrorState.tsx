'use client';

/**
 * Error State Component
 * 
 * Displays user-friendly error messages.
 * Does not expose stack traces or technical details.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-red-100 rounded-full">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">{message}</p>
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button variant="primary">
              {action.label}
            </Button>
          </Link>
        ) : action.onClick ? (
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        ) : null
      )}
    </div>
  );
}
