/**
 * Session and Authentication Utilities
 * 
 * Server-side utilities for checking authentication status,
 * retrieving user profiles, and enforcing authorization.
 * 
 * IMPORTANT: These utilities are SERVER-SIDE ONLY.
 * They use the server Supabase client which requires cookies.
 */

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';
import { cache } from 'react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Institution = Database['public']['Tables']['institutions']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

export interface UserSession {
  userId: string;
  email: string;
}

export interface UserProfile extends Profile {
  institution: Institution | null;
  department: Department | null;
}

/**
 * Get current authenticated session
 * Returns null if not authenticated
 * 
 * This is cached per request to avoid multiple database calls
 */
export const getSession = cache(async (): Promise<UserSession | null> => {
  const supabase = createClient();
  
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email!,
  };
});

/**
 * Get current authenticated user
 * Returns null if not authenticated
 * 
 * This is cached per request
 */
export const getUser = cache(async () => {
  const supabase = createClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});

/**
 * Get user profile with institution and department data
 * Returns null if not authenticated or profile doesn't exist
 * 
 * This is cached per request
 */
export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getUser();
  
  if (!user) {
    console.error('[getUserProfile] No authenticated user found');
    return null;
  }

  // User authenticated - proceeding to fetch profile

  const supabase = createClient();

  // Query profile with institution and department joined
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      institution:institutions(*),
      department:departments(*)
    `)
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[getUserProfile] Profile query error:', error.message, error.details, error.hint);
    console.error('[getUserProfile] Error code:', error.code);
    return null;
  }

  if (!profile) {
    console.error('[getUserProfile] Profile not found for user:', user.id);
    return null;
  }

  // Profile retrieved successfully
  return profile as UserProfile;
});

/**
 * Require authentication - throw error if not authenticated
 * Use this in Server Components/Actions that require authentication
 * 
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Require user profile - throw error if profile doesn't exist
 * Use this in Server Components/Actions that require a complete profile
 * 
 * @throws Error if not authenticated or profile doesn't exist
 */
export async function requireProfile(): Promise<UserProfile> {
  const profile = await getUserProfile();
  
  if (!profile) {
    throw new Error('User profile not found');
  }

  return profile;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const profile = await getUserProfile();
  
  if (!profile) {
    return false;
  }

  return profile.role === role;
}

/**
 * Check if user has admin privileges
 * Admin roles: ADMIN, PRINCIPAL, SYSTEM_ADMIN
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  
  if (!profile) {
    return false;
  }

  return ['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN'].includes(profile.role);
}

/**
 * Check if user profile is active
 */
export async function isProfileActive(): Promise<boolean> {
  const profile = await getUserProfile();
  
  if (!profile) {
    return false;
  }

  return profile.status === 'ACTIVE';
}

/**
 * Get user's institution ID
 */
export async function getUserInstitutionId(): Promise<string | null> {
  const profile = await getUserProfile();
  return profile?.institution_id ?? null;
}

/**
 * Get user's department ID
 */
export async function getUserDepartmentId(): Promise<string | null> {
  const profile = await getUserProfile();
  return profile?.department_id ?? null;
}
