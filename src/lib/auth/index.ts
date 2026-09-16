/**
 * Authentication Library
 * 
 * Central export point for authentication utilities
 */

export {
  getSession,
  getUser,
  getUserProfile,
  requireAuth,
  requireProfile,
  hasRole,
  isAdmin,
  isProfileActive,
  getUserInstitutionId,
  getUserDepartmentId,
  type UserSession,
  type UserProfile,
} from './session';

export {
  Capability,
  UserRoles,
  roleHasCapability,
  getRoleCapabilities,
  userHasCapability,
  isAdminRole,
  isDepartmentLeadershipRole,
  isInstitutionalLeadershipRole,
  getRoleDisplayName,
  getAvailableNavigation,
  type NavigationItem,
} from './capabilities';
