'use client';

/**
 * Audit Filters Component
 * Client component for filtering audit logs
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface AuditFiltersProps {
  entityType?: string;
  action?: string;
  uniqueEntityTypes: string[];
  uniqueActions: string[];
  userId?: string;
}

export function AuditFilters({
  entityType,
  action,
  uniqueEntityTypes,
  uniqueActions,
  userId,
}: AuditFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleEntityTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('entity_type');
    } else {
      params.set('entity_type', value);
    }
    params.delete('page');
    router.push(`/audit?${params.toString()}`);
  };

  const handleActionChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('action');
    } else {
      params.set('action', value);
    }
    params.delete('page');
    router.push(`/audit?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push('/audit');
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Entity Type Filter */}
        <div>
          <label htmlFor="entity-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Entity Type
          </label>
          <select
            id="entity-filter"
            value={entityType || 'all'}
            onChange={(e) => handleEntityTypeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Entities</option>
            {uniqueEntityTypes.map((t: string) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Action
          </label>
          <select
            id="action-filter"
            value={action || 'all'}
            onChange={(e) => handleActionChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((a: string) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(entityType || userId || action) && (
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
