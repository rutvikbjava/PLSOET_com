/**
 * Capability and Authorization System
 * 
 * Centralized role-based capability management for EduSphere AI.
 * 
 * IMPORTANT SECURITY NOTE:
 * UI visibility based on capabilities is NOT security enforcement.
 * Actual security is enforced through:
 * - Server-side authorization checks
 * - Supabase Row Level Security (RLS)
 * - Middleware route protection
 * 
 * This system only controls UI visibility and user experience.
 */

import type { Database } from '@/types/database';

type UserRole = string; // Role is TEXT in database
type ProfileStatus = Database['public']['Enums']['profile_status'];

/**
 * Application capabilities
 * 
 * Capabilities represent what actions a user can perform.
 * They are derived from user roles but provide a more flexible
 * and maintainable authorization model.
 */
export enum Capability {
  // Dashboard and profile
  VIEW_DASHBOARD = 'view.dashboard',
  VIEW_PROFILE = 'view.profile',
  
  // Future capabilities (not yet implemented)
  // Document management
  VIEW_DOCUMENTS = 'view.documents',
  CREATE_DOCUMENTS = 'create.documents',
  EDIT_OWN_DOCUMENTS = 'edit.own_documents',
  DELETE_OWN_DOCUMENTS = 'delete.own_documents',
  
  // Workflow management
  VIEW_WORKFLOWS = 'view.workflows',
  CREATE_WORKFLOWS = 'create.workflows',
  APPROVE_WORKFLOWS = 'approve.workflows',
  
  // Approval requests
  VIEW_APPROVALS = 'view.approvals',
  
  // Policy management
  VIEW_POLICIES = 'view.policies',
  MANAGE_POLICIES = 'manage.policies',
  
  // User and institution management
  MANAGE_USERS = 'manage.users',
  MANAGE_DEPARTMENTS = 'manage.departments',
  MANAGE_INSTITUTION = 'manage.institution',
  
  // System administration
  VIEW_AUDIT_LOGS = 'view.audit_logs',
  MANAGE_SYSTEM = 'manage.system',
}

/**
 * Role definitions from database schema
 */
export const UserRoles = {
  FACULTY: 'FACULTY',
  HOD: 'HOD', // Head of Department
  COE: 'COE', // Controller of Examinations
  PRINCIPAL: 'PRINCIPAL',
  ADMIN: 'ADMIN',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
} as const;

/**
 * Role capability mapping
 * 
 * Defines which capabilities each role has access to.
 * This is the central place to manage role-based permissions.
 */
const ROLE_CAPABILITIES: Record<string, Set<Capability>> = {
  // Faculty: Basic access to documents and workflows
  [UserRoles.FACULTY]: new Set([
    Capability.VIEW_DASHBOARD,
    Capability.VIEW_PROFILE,
    Capability.VIEW_DOCUMENTS,
    Capability.CREATE_DOCUMENTS,
    Capability.EDIT_OWN_DOCUMENTS,
    Capability.VIEW_WORKFLOWS,
    Capability.VIEW_APPROVALS,
  ]),
  
  // HOD: Department-level management + workflow creation and approvals
  [UserRoles.HOD]: new Set([
    Capability.VIEW_DASHBOARD,
    Capability.VIEW_PROFILE,
    Capability.VIEW_DOCUMENTS,
    Capability.CREATE_DOCUMENTS,
    Capability.EDIT_OWN_DOCUMENTS,
    Capability.VIEW_WORKFLOWS,
    Capability.CREATE_WORKFLOWS,
    Capability.VIEW_APPROVALS,
    Capability.APPROVE_WORKFLOWS,
    Capability.VIEW_POLICIES,
  ]),
  
  // COE: Examination and workflow oversight + policy viewing
  [UserRoles.COE]: new Set([
    Capability.VIEW_DASHBOARD,
    Capability.VIEW_PROFILE,
    Capability.VIEW_DOCUMENTS,
    Capability.VIEW_WORKFLOWS,
    Capability.VIEW_APPROVALS,
    Capability.APPROVE_WORKFLOWS,
    Capability.VIEW_POLICIES,
    Capability.MANAGE_POLICIES,
  ]),
  
  // Principal: Institution-level oversight + policy and user management
  [UserRoles.PRINCIPAL]: new Set([
    Capability.VIEW_DASHBOARD,
    Capability.VIEW_PROFILE,
    Capability.VIEW_DOCUMENTS,
    Capability.VIEW_WORKFLOWS,
    Capability.VIEW_APPROVALS,
    Capability.APPROVE_WORKFLOWS,
    Capability.VIEW_POLICIES,
    Capability.MANAGE_POLICIES,
    Capability.MANAGE_USERS,
    Capability.VIEW_AUDIT_LOGS,
  ]),
  
  // Admin: User and department management
  [UserRoles.ADMIN]: new Set([
    Capability.VIEW_DASHBOARD,
    Capability.VIEW_PROFILE,
    Capability.VIEW_DOCUMENTS,
    Capability.VIEW_WORKFLOWS,
    Capability.VIEW_APPROVALS,
    Capability.VIEW_POLICIES,
    Capability.MANAGE_USERS,
    Capability.MANAGE_DEPARTMENTS,
    Capability.VIEW_AUDIT_LOGS,
  ]),
  
  // System Admin: Full system access
  [UserRoles.SYSTEM_ADMIN]: new Set([
    // All capabilities
    Capability.VIEW_DASHBOARD,
    Capability.VIEW_PROFILE,
    Capability.VIEW_DOCUMENTS,
    Capability.CREATE_DOCUMENTS,
    Capability.EDIT_OWN_DOCUMENTS,
    Capability.DELETE_OWN_DOCUMENTS,
    Capability.VIEW_WORKFLOWS,
    Capability.CREATE_WORKFLOWS,
    Capability.VIEW_APPROVALS,
    Capability.APPROVE_WORKFLOWS,
    Capability.VIEW_POLICIES,
    Capability.MANAGE_POLICIES,
    Capability.MANAGE_USERS,
    Capability.MANAGE_DEPARTMENTS,
    Capability.MANAGE_INSTITUTION,
    Capability.VIEW_AUDIT_LOGS,
    Capability.MANAGE_SYSTEM,
  ]),
};

/**
 * Check if a role has a specific capability
 */
export function roleHasCapability(role: UserRole, capability: Capability): boolean {
  const capabilities = ROLE_CAPABILITIES[role];
  if (!capabilities) {
    // Unknown role - deny access
    return false;
  }
  return capabilities.has(capability);
}

/**
 * Get all capabilities for a role
 */
export function getRoleCapabilities(role: UserRole): Capability[] {
  const capabilities = ROLE_CAPABILITIES[role];
  if (!capabilities) {
    return [];
  }
  return Array.from(capabilities);
}

/**
 * Check if a user profile has a specific capability
 * 
 * Takes into account:
 * - User role
 * - Account status (ACTIVE required for most actions)
 */
export function userHasCapability(
  role: UserRole,
  status: ProfileStatus,
  capability: Capability
): boolean {
  // Only ACTIVE users can perform actions
  // (except viewing dashboard/profile)
  const allowedForPending = [
    Capability.VIEW_DASHBOARD,
    Capability.VIEW_PROFILE,
  ];
  
  if (status !== 'ACTIVE' && !allowedForPending.includes(capability)) {
    return false;
  }
  
  return roleHasCapability(role, capability);
}

/**
 * Check if a role is an admin role
 * 
 * Admin roles: ADMIN, PRINCIPAL, SYSTEM_ADMIN
 * These roles have elevated privileges for user/institution management.
 */
export function isAdminRole(role: UserRole): boolean {
  const adminRoles: string[] = [
    UserRoles.ADMIN,
    UserRoles.PRINCIPAL,
    UserRoles.SYSTEM_ADMIN,
  ];
  return adminRoles.includes(role);
}

/**
 * Check if a role is a department leadership role
 * 
 * Department leadership: HOD
 * These roles have department-level management privileges.
 */
export function isDepartmentLeadershipRole(role: UserRole): boolean {
  return role === UserRoles.HOD;
}

/**
 * Check if a role is an institutional leadership role
 * 
 * Institutional leadership: COE, PRINCIPAL
 * These roles have institution-wide oversight privileges.
 */
export function isInstitutionalLeadershipRole(role: UserRole): boolean {
  const leadershipRoles: string[] = [
    UserRoles.COE,
    UserRoles.PRINCIPAL,
  ];
  return leadershipRoles.includes(role);
}

/**
 * Get user-friendly role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<string, string> = {
    [UserRoles.FACULTY]: 'Faculty',
    [UserRoles.HOD]: 'Head of Department',
    [UserRoles.COE]: 'Controller of Examinations',
    [UserRoles.PRINCIPAL]: 'Principal',
    [UserRoles.ADMIN]: 'Administrator',
    [UserRoles.SYSTEM_ADMIN]: 'System Administrator',
  };
  
  return displayNames[role] || role;
}

/**
 * Navigation item definition
 */
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  capability?: Capability; // If set, only users with this capability see the item
  activeWhen?: string[]; // Additional paths that should mark this item as active
}

/**
 * Get navigation items available to a user
 * 
 * Filters navigation based on user capabilities.
 * Items without a capability requirement are shown to all authenticated users.
 */
export function getAvailableNavigation(
  role: UserRole,
  status: ProfileStatus
): NavigationItem[] {
  const allNavigation: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'home',
      capability: Capability.VIEW_DASHBOARD,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: 'user',
      capability: Capability.VIEW_PROFILE,
    },
    {
      label: 'Documents',
      href: '/documents',
      icon: 'file',
      capability: Capability.VIEW_DOCUMENTS,
      activeWhen: ['/documents/'],
    },
    {
      label: 'Workflows',
      href: '/workflows',
      icon: 'workflow',
      capability: Capability.VIEW_WORKFLOWS,
      activeWhen: ['/workflows/'],
    },
    {
      label: 'Approvals',
      href: '/approvals',
      icon: 'approval',
      capability: Capability.VIEW_APPROVALS,
      activeWhen: ['/approvals/'],
    },
    {
      label: 'Policies',
      href: '/policies',
      icon: 'policy',
      capability: Capability.VIEW_POLICIES,
      activeWhen: ['/policies/'],
    },
    {
      label: 'Signatures',
      href: '/signatures',
      icon: 'signature',
      // No capability - show to all authenticated users
      activeWhen: ['/signatures/'],
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: 'notification',
      // No capability - show to all authenticated users
      activeWhen: ['/notifications/'],
    },
    {
      label: 'Admin',
      href: '/admin/users',
      icon: 'admin',
      capability: Capability.MANAGE_USERS,
      activeWhen: ['/admin/'],
    },
    {
      label: 'Audit Logs',
      href: '/audit',
      icon: 'audit',
      capability: Capability.VIEW_AUDIT_LOGS,
      activeWhen: ['/audit/'],
    },
  ];
  
  return allNavigation.filter((item) => {
    // Items without capability requirement are shown to all
    if (!item.capability) {
      return true;
    }
    
    // Check if user has the required capability
    return userHasCapability(role, status, item.capability);
  });
}
