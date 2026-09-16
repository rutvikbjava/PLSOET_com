'use client';

/**
 * Notification Pagination Component
 * Client component for navigating notification pages
 */

import { useRouter, useSearchParams } from 'next/navigation';

interface NotificationPaginationProps {
  page: number;
  hasMore: boolean;
}

export function NotificationPagination({
  page,
  hasMore,
}: NotificationPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePrevPage = () => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(Math.max(1, page - 1)));
    router.push(`/notifications?${params.toString()}`);
  };

  const handleNextPage = () => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page + 1));
    router.push(`/notifications?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={handlePrevPage}
        disabled={page === 1}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="text-sm text-gray-700">Page {page}</span>
      <button
        onClick={handleNextPage}
        disabled={!hasMore}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
