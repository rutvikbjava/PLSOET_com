/**
 * Admin User Management Actions
 * 
 * Server actions for admins to manage user accounts.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireProfile } from '@/lib/auth';

export async function listPendingUsers() {
  const profile = await requireProfile();
  
  // Only ADMIN and SUPER_ADMIN can access
  if (profile.role !== 'ADMIN' && profile.role !== 'SUPER_ADMIN') {
    return {
      success: false as const,
      error: 'Unauthorized',
    };
  }

  const adminSupabase = getAdminClient();

  const { data, error } = await adminSupabase
    .from('profiles')
    .select('id, email, display_name, role, status, created_at, institution:institutions(name)')
    .eq('institution_id', profile.institution_id)
    .eq('status', 'PENDING_VERIFICATION')
    .order('created_at', { ascending: false });

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  return {
    success: true as const,
    data: data || [],
  };
}

export async function approveUser(userId: string) {
  const profile = await requireProfile();
  
  // Only ADMIN and SUPER_ADMIN can approve
  if (profile.role !== 'ADMIN' && profile.role !== 'SUPER_ADMIN') {
    return {
      success: false as const,
      error: 'Unauthorized',
    };
  }

  const adminSupabase = getAdminClient();

  const { error } = await (adminSupabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('profiles') as any)
    .update({ status: 'ACTIVE' })
    .eq('id', userId)
    .eq('institution_id', profile.institution_id);

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  revalidatePath('/admin/users');

  return {
    success: true as const,
  };
}

export async function rejectUser(userId: string) {
  const profile = await requireProfile();
  
  // Only ADMIN and SUPER_ADMIN can reject
  if (profile.role !== 'ADMIN' && profile.role !== 'SUPER_ADMIN') {
    return {
      success: false as const,
      error: 'Unauthorized',
    };
  }

  const adminSupabase = getAdminClient();

  const { error } = await (adminSupabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('profiles') as any)
    .update({ status: 'INACTIVE' })
    .eq('id', userId)
    .eq('institution_id', profile.institution_id);

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  revalidatePath('/admin/users');

  return {
    success: true as const,
  };
}
