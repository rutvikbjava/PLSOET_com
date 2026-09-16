'use client';

/**
 * Audit Pagination Component
 * Client component for navigating audit log pages
 */

import { useRouter, useSearchParams } from 'next/navigation';

interface AuditPaginationProps {
  page: number;
  totalPages: number;
  totalLogs: number;
  limit: number;
}

export function AuditPagination({
  page,
  totalPages,
  totalLogs,
  limit,
}: AuditPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePrevPage = () => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(Math.max(1, page - 1)));
    router.push(`/audit?${params.toString()}`);
  };

  const handleNextPage = () => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(Math.min(totalPages, page + 1)));
    router.push(`/audit?${params.toString()}`);
  };

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalLogs);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevPage}
          disabled={page <= 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="mx-4 text-sm text-gray-700">
          Page {page} of {totalPages} ({start}-{end} of {totalLogs})
        </span>
        <button
          onClick={handleNextPage}
          disabled={page >= totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
