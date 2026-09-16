/**
 * AppShell - Authenticated Layout Server Component
 *
 * Drop-in wrapper for any authenticated page that needs the full
 * AppLayout (sidebar + header) with real role-based navigation.
 *
 * Usage:
 *   <AppShell>
 *     <PageContainer>…</PageContainer>
 *   </AppShell>
 *
 * The component fetches the current user profile and builds navigation
 * from their role/status, then renders AppLayout.  If no profile is
 * found the user is redirected to sign-in.
 */

import { redirect } from 'next/navigation';
import { requireAuth, getUserProfile, getAvailableNavigation } from '@/lib/auth';
import { AppLayout } from './AppLayout';

interface AppShellProps {
  children: React.ReactNode;
}

export async function AppShell({ children }: AppShellProps) {
  await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  const navigation = getAvailableNavigation(profile.role, profile.status);

  return (
    <AppLayout profile={profile} navigation={navigation}>
      {children}
    </AppLayout>
  );
}
