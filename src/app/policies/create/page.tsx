/**
 * Create Policy Page
 * 
 * Form for creating new institutional policies
 */

import { requireAuth, requireProfile } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { AppShell, PageContainer, PageHeader } from '@/components/layout';
import { CreatePolicyForm } from './CreatePolicyForm';

export default async function CreatePolicyPage() {
  await requireAuth();
  const profile = await requireProfile();

  // Only authorized roles can create policies
  if (!['HOD', 'COE', 'PRINCIPAL', 'ADMIN', 'SYSTEM_ADMIN'].includes(profile.role)) {
    redirect('/policies');
  }

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Create Policy"
          description="Create a new institutional policy"
        />

        <CreatePolicyForm />
      </PageContainer>
    </AppShell>
  );
}
