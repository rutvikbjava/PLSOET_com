'use client';

/**
 * Empty State Component
 * 
 * Displays a user-friendly empty state when no data is available.
 * Provides consistent messaging and optional call-to-action.
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && <div className="mx-auto w-16 h-16 mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">{description}</p>
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
