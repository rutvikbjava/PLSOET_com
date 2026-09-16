/**
 * EDU-010: Audit Log List Component
 * 
 * Displays audit logs in a detailed table format.
 */

'use client';

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  actor?: {
    id: string;
    display_name: string;
    email: string;
  };
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface AuditLogListProps {
  logs: AuditLog[];
}

export function AuditLogList({ logs }: AuditLogListProps) {
  function getActionBadge(action: string) {
    const actionMap: Record<string, { color: string; label: string }> = {
      CREATE: { color: 'bg-green-100 text-green-800', label: 'Created' },
      UPDATE: { color: 'bg-blue-100 text-blue-800', label: 'Updated' },
      DELETE: { color: 'bg-red-100 text-red-800', label: 'Deleted' },
      APPROVE: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      REJECT: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      SIGN: { color: 'bg-purple-100 text-purple-800', label: 'Signed' },
      VIEW: { color: 'bg-gray-100 text-gray-800', label: 'Viewed' },
      DOWNLOAD: { color: 'bg-indigo-100 text-indigo-800', label: 'Downloaded' },
      UPLOAD: { color: 'bg-blue-100 text-blue-800', label: 'Uploaded' },
    };

    const config = actionMap[action] || { color: 'bg-gray-100 text-gray-800', label: action };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function formatEntityType(entityType: string): string {
    return entityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Timestamp
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actor
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Action
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Entity Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Entity ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(log.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {log.actor?.display_name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">{log.actor?.email || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getActionBadge(log.action)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatEntityType(log.entity_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                  {log.entity_id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4">
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                        View Changes
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="text-sm mt-1">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-700">
                        View Metadata
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                  {(!log.changes || Object.keys(log.changes).length === 0) &&
                    (!log.metadata || Object.keys(log.metadata).length === 0) && (
                      <span className="text-sm text-gray-400">No details</span>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
