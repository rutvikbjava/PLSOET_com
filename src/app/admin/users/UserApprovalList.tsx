/**
 * User Approval List Component
 * 
 * Displays pending users with approve/reject buttons.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveUser, rejectUser } from './actions';

interface PendingUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  status: string;
  created_at: string;
  institution?: {
    name: string;
  };
}

interface UserApprovalListProps {
  users: PendingUser[];
}

export function UserApprovalList({ users }: UserApprovalListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleApprove(userId: string) {
    setLoading(userId);
    const result = await approveUser(userId);
    if (result.success) {
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
    }
    setLoading(null);
  }

  async function handleReject(userId: string) {
    if (!confirm('Are you sure you want to reject this user?')) {
      return;
    }
    
    setLoading(userId);
    const result = await rejectUser(userId);
    if (result.success) {
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
    }
    setLoading(null);
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{user.display_name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={loading === user.id}
                      className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      {loading === user.id ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      disabled={loading === user.id}
                      className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                    >
                      {loading === user.id ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
