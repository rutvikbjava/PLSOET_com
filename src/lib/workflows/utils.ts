/**
 * Workflow Utility Functions
 */

import { getUserProfile } from '@/lib/auth';

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  try {
    const profile = await getUserProfile();
    if (!profile) return false;
    return roles.includes(profile.role);
  } catch {
    return false;
  }
}

/**
 * Require user to have any of the specified roles
 * @throws Error if user doesn't have required role
 */
export async function requireAnyRole(roles: string[]): Promise<void> {
  const hasRole = await hasAnyRole(roles);
  if (!hasRole) {
    throw new Error(`Unauthorized: requires one of roles: ${roles.join(', ')}`);
  }
}
