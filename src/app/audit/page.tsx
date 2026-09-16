/**
 * EDU-010: Audit Log Page (Admin Only)
 * 
 * Comprehensive audit log viewer for administrators.
 * Shows all system activities with filtering by entity type, user, and date range.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAuth, getUserProfile, getAvailableNavigation } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { getAdminClient } from '@/lib/supabase/admin';
import { AuditLogList } from './AuditLogList';
import { AuditFilters } from './AuditFilters';
import { AuditPagination } from './AuditPagination';

export const metadata: Metadata = {
  title: 'Audit Log',
  description: 'System audit log (Admin only)',
};

interface AuditPageProps {
  searchParams: {
    entity_type?: string;
    user_id?: string;
    action?: string;
    page?: string;
  };
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  // Only roles with VIEW_AUDIT_LOGS capability can access (ADMIN, SYSTEM_ADMIN, PRINCIPAL)
  if (!['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRINCIPAL'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const navigation = getAvailableNavigation(profile.role, profile.status);

  const entityType = searchParams.entity_type;
  const userId = searchParams.user_id;
  const action = searchParams.action;
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 50;

  // Fetch audit logs
  const adminSupabase = getAdminClient();
  
  let query = adminSupabase
    .from('audit_logs')
    .select(`
      *,
      actor:profiles!audit_logs_actor_id_fkey(id, display_name, email)
    `, { count: 'exact' })
    .eq('institution_id', profile.institution_id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  if (userId) {
    query = query.eq('actor_id', userId);
  }

  if (action) {
    query = query.eq('action', action);
  }

  const { data: auditLogs, error, count } = await query;

  if (error) {
    console.error('[AUDIT_LOG_FETCH_ERROR]', error);
  }

  const logs = auditLogs || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Get unique entity types for filter
  const { data: entityTypes } = await adminSupabase
    .from('audit_logs')
    .select('entity_type')
    .eq('institution_id', profile.institution_id);

  const uniqueEntityTypes = Array.from(
    new Set((entityTypes || []).map((e: { entity_type: string }) => e.entity_type))
  ).sort();

  // Get unique actions for filter
  const { data: actions } = await adminSupabase
    .from('audit_logs')
    .select('action')
    .eq('institution_id', profile.institution_id);

  const uniqueActions = Array.from(
    new Set((actions || []).map((a: { action: string }) => a.action))
  ).sort();

  return (
    <AppLayout profile={profile} navigation={navigation}>      <PageContainer>
        <PageHeader
          title="Audit Log"
          description="Comprehensive system activity log for administrators"
        />

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Logs</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalCount.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Entity Types</p>
                  <p className="text-2xl font-semibold text-gray-900">{uniqueEntityTypes.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Action Types</p>
                  <p className="text-2xl font-semibold text-gray-900">{uniqueActions.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <AuditFilters
            entityType={entityType}
            action={action}
            userId={userId}
            uniqueEntityTypes={uniqueEntityTypes}
            uniqueActions={uniqueActions}
          />

          {/* Audit Logs */}
          {logs.length === 0 ? (
            <Card className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs</h3>
              <p className="mt-1 text-sm text-gray-500">
                {entityType || action
                  ? 'No logs match your filters.'
                  : 'No audit logs have been created yet.'}
              </p>
            </Card>
          ) : (
            <AuditLogList logs={logs} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <AuditPagination
              page={page}
              totalPages={totalPages}
              totalLogs={totalCount}
              limit={limit}
            />
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
