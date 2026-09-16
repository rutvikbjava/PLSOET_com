/**
 * Capability System Tests
 * 
 * Tests for role-based capability management.
 */

import {
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
} from '@/lib/auth/capabilities';

describe('Capability System', () => {
  describe('roleHasCapability', () => {
    it('should return true for FACULTY viewing dashboard', () => {
      expect(roleHasCapability(UserRoles.FACULTY, Capability.VIEW_DASHBOARD)).toBe(true);
    });

    it('should return true for FACULTY viewing profile', () => {
      expect(roleHasCapability(UserRoles.FACULTY, Capability.VIEW_PROFILE)).toBe(true);
    });

    it('should return false for unknown role', () => {
      expect(roleHasCapability('UNKNOWN_ROLE', Capability.VIEW_DASHBOARD)).toBe(false);
    });

    it('should return true for SYSTEM_ADMIN viewing dashboard', () => {
      expect(roleHasCapability(UserRoles.SYSTEM_ADMIN, Capability.VIEW_DASHBOARD)).toBe(true);
    });
  });

  describe('getRoleCapabilities', () => {
    it('should return capabilities for FACULTY role', () => {
      const capabilities = getRoleCapabilities(UserRoles.FACULTY);
      expect(capabilities).toContain(Capability.VIEW_DASHBOARD);
      expect(capabilities).toContain(Capability.VIEW_PROFILE);
      expect(capabilities.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown role', () => {
      const capabilities = getRoleCapabilities('UNKNOWN_ROLE');
      expect(capabilities).toEqual([]);
    });

    it('should return capabilities for all defined roles', () => {
      Object.values(UserRoles).forEach((role) => {
        const capabilities = getRoleCapabilities(role);
        expect(Array.isArray(capabilities)).toBe(true);
        expect(capabilities.length).toBeGreaterThan(0);
      });
    });
  });

  describe('userHasCapability', () => {
    it('should allow ACTIVE user to view dashboard', () => {
      expect(
        userHasCapability(UserRoles.FACULTY, 'ACTIVE', Capability.VIEW_DASHBOARD)
      ).toBe(true);
    });

    it('should allow PENDING_VERIFICATION user to view dashboard', () => {
      expect(
        userHasCapability(UserRoles.FACULTY, 'PENDING_VERIFICATION', Capability.VIEW_DASHBOARD)
      ).toBe(true);
    });

    it('should allow PENDING_VERIFICATION user to view profile', () => {
      expect(
        userHasCapability(UserRoles.FACULTY, 'PENDING_VERIFICATION', Capability.VIEW_PROFILE)
      ).toBe(true);
    });

    it('should deny SUSPENDED user capabilities beyond basic viewing', () => {
      // This test documents expected behavior for future capabilities
      // Currently, suspended users can still view dashboard/profile
      // Future capabilities will check status more strictly
      expect(
        userHasCapability(UserRoles.FACULTY, 'SUSPENDED', Capability.VIEW_DASHBOARD)
      ).toBe(true);
    });
  });

  describe('isAdminRole', () => {
    it('should return true for ADMIN role', () => {
      expect(isAdminRole(UserRoles.ADMIN)).toBe(true);
    });

    it('should return true for PRINCIPAL role', () => {
      expect(isAdminRole(UserRoles.PRINCIPAL)).toBe(true);
    });

    it('should return true for SYSTEM_ADMIN role', () => {
      expect(isAdminRole(UserRoles.SYSTEM_ADMIN)).toBe(true);
    });

    it('should return false for FACULTY role', () => {
      expect(isAdminRole(UserRoles.FACULTY)).toBe(false);
    });

    it('should return false for HOD role', () => {
      expect(isAdminRole(UserRoles.HOD)).toBe(false);
    });

    it('should return false for COE role', () => {
      expect(isAdminRole(UserRoles.COE)).toBe(false);
    });
  });

  describe('isDepartmentLeadershipRole', () => {
    it('should return true for HOD role', () => {
      expect(isDepartmentLeadershipRole(UserRoles.HOD)).toBe(true);
    });

    it('should return false for FACULTY role', () => {
      expect(isDepartmentLeadershipRole(UserRoles.FACULTY)).toBe(false);
    });

    it('should return false for PRINCIPAL role', () => {
      expect(isDepartmentLeadershipRole(UserRoles.PRINCIPAL)).toBe(false);
    });
  });

  describe('isInstitutionalLeadershipRole', () => {
    it('should return true for COE role', () => {
      expect(isInstitutionalLeadershipRole(UserRoles.COE)).toBe(true);
    });

    it('should return true for PRINCIPAL role', () => {
      expect(isInstitutionalLeadershipRole(UserRoles.PRINCIPAL)).toBe(true);
    });

    it('should return false for FACULTY role', () => {
      expect(isInstitutionalLeadershipRole(UserRoles.FACULTY)).toBe(false);
    });

    it('should return false for HOD role', () => {
      expect(isInstitutionalLeadershipRole(UserRoles.HOD)).toBe(false);
    });

    it('should return false for ADMIN role', () => {
      expect(isInstitutionalLeadershipRole(UserRoles.ADMIN)).toBe(false);
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return display name for FACULTY', () => {
      expect(getRoleDisplayName(UserRoles.FACULTY)).toBe('Faculty');
    });

    it('should return display name for HOD', () => {
      expect(getRoleDisplayName(UserRoles.HOD)).toBe('Head of Department');
    });

    it('should return display name for COE', () => {
      expect(getRoleDisplayName(UserRoles.COE)).toBe('Controller of Examinations');
    });

    it('should return display name for PRINCIPAL', () => {
      expect(getRoleDisplayName(UserRoles.PRINCIPAL)).toBe('Principal');
    });

    it('should return display name for ADMIN', () => {
      expect(getRoleDisplayName(UserRoles.ADMIN)).toBe('Administrator');
    });

    it('should return display name for SYSTEM_ADMIN', () => {
      expect(getRoleDisplayName(UserRoles.SYSTEM_ADMIN)).toBe('System Administrator');
    });

    it('should return original role for unknown role', () => {
      expect(getRoleDisplayName('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE');
    });
  });

  describe('getAvailableNavigation', () => {
    it('should return navigation items for ACTIVE FACULTY', () => {
      const navigation = getAvailableNavigation(UserRoles.FACULTY, 'ACTIVE');
      expect(navigation.length).toBeGreaterThan(0);
      expect(navigation.some((item) => item.href === '/dashboard')).toBe(true);
      expect(navigation.some((item) => item.href === '/profile')).toBe(true);
    });

    it('should return navigation items for PENDING_VERIFICATION FACULTY', () => {
      const navigation = getAvailableNavigation(UserRoles.FACULTY, 'PENDING_VERIFICATION');
      expect(navigation.length).toBeGreaterThan(0);
      expect(navigation.some((item) => item.href === '/dashboard')).toBe(true);
      expect(navigation.some((item) => item.href === '/profile')).toBe(true);
    });

    it('should return navigation items for ADMIN role', () => {
      const navigation = getAvailableNavigation(UserRoles.ADMIN, 'ACTIVE');
      expect(navigation.length).toBeGreaterThan(0);
    });

    it('should filter navigation based on capabilities', () => {
      const navigation = getAvailableNavigation(UserRoles.FACULTY, 'ACTIVE');
      // All returned items should either have no capability requirement
      // or the user should have that capability
      navigation.forEach((item) => {
        if (item.capability) {
          expect(
            userHasCapability(UserRoles.FACULTY, 'ACTIVE', item.capability)
          ).toBe(true);
        }
      });
    });
  });

  describe('Role consistency', () => {
    it('should have all role values defined in UserRoles', () => {
      expect(UserRoles.FACULTY).toBe('FACULTY');
      expect(UserRoles.HOD).toBe('HOD');
      expect(UserRoles.COE).toBe('COE');
      expect(UserRoles.PRINCIPAL).toBe('PRINCIPAL');
      expect(UserRoles.ADMIN).toBe('ADMIN');
      expect(UserRoles.SYSTEM_ADMIN).toBe('SYSTEM_ADMIN');
    });

    it('should have capabilities defined for all roles', () => {
      Object.values(UserRoles).forEach((role) => {
        const capabilities = getRoleCapabilities(role);
        expect(capabilities.length).toBeGreaterThan(0);
      });
    });
  });
});

  describe('Document Management Capabilities', () => {
    it('FACULTY should have document viewing capability', () => {
      expect(roleHasCapability(UserRoles.FACULTY, Capability.VIEW_DOCUMENTS)).toBe(true);
    });

    it('FACULTY should have document creation capability', () => {
      expect(roleHasCapability(UserRoles.FACULTY, Capability.CREATE_DOCUMENTS)).toBe(true);
    });

    it('HOD should have all FACULTY capabilities plus workflow creation', () => {
      expect(roleHasCapability(UserRoles.HOD, Capability.VIEW_DOCUMENTS)).toBe(true);
      expect(roleHasCapability(UserRoles.HOD, Capability.CREATE_WORKFLOWS)).toBe(true);
    });
  });

  describe('Workflow Capabilities', () => {
    it('FACULTY should view workflows but not approve', () => {
      expect(roleHasCapability(UserRoles.FACULTY, Capability.VIEW_WORKFLOWS)).toBe(true);
      expect(roleHasCapability(UserRoles.FACULTY, Capability.APPROVE_WORKFLOWS)).toBe(false);
    });

    it('HOD should approve workflows', () => {
      expect(roleHasCapability(UserRoles.HOD, Capability.APPROVE_WORKFLOWS)).toBe(true);
    });

    it('COE should approve workflows', () => {
      expect(roleHasCapability(UserRoles.COE, Capability.APPROVE_WORKFLOWS)).toBe(true);
    });
  });

  describe('Policy Capabilities', () => {
    it('FACULTY should not view policies', () => {
      expect(roleHasCapability(UserRoles.FACULTY, Capability.VIEW_POLICIES)).toBe(false);
    });

    it('HOD should view policies but not manage them', () => {
      expect(roleHasCapability(UserRoles.HOD, Capability.VIEW_POLICIES)).toBe(true);
      expect(roleHasCapability(UserRoles.HOD, Capability.MANAGE_POLICIES)).toBe(false);
    });

    it('COE should manage policies', () => {
      expect(roleHasCapability(UserRoles.COE, Capability.MANAGE_POLICIES)).toBe(true);
    });
  });

  describe('Admin Capabilities', () => {
    it('ADMIN should manage users', () => {
      expect(roleHasCapability(UserRoles.ADMIN, Capability.MANAGE_USERS)).toBe(true);
    });

    it('PRINCIPAL should manage users and view audit logs', () => {
      expect(roleHasCapability(UserRoles.PRINCIPAL, Capability.MANAGE_USERS)).toBe(true);
      expect(roleHasCapability(UserRoles.PRINCIPAL, Capability.VIEW_AUDIT_LOGS)).toBe(true);
    });

    it('SYSTEM_ADMIN should have all capabilities', () => {
      expect(roleHasCapability(UserRoles.SYSTEM_ADMIN, Capability.VIEW_DOCUMENTS)).toBe(true);
      expect(roleHasCapability(UserRoles.SYSTEM_ADMIN, Capability.MANAGE_POLICIES)).toBe(true);
      expect(roleHasCapability(UserRoles.SYSTEM_ADMIN, Capability.MANAGE_SYSTEM)).toBe(true);
    });
  });

  describe('Navigation Filtering', () => {
    it('FACULTY should see Documents in navigation', () => {
      const nav = getAvailableNavigation(UserRoles.FACULTY, 'ACTIVE');
      const documentNav = nav.find(item => item.href === '/documents');
      expect(documentNav).toBeDefined();
      expect(documentNav?.label).toBe('Documents');
    });

    it('FACULTY should see Workflows and Approvals', () => {
      const nav = getAvailableNavigation(UserRoles.FACULTY, 'ACTIVE');
      const workflowNav = nav.find(item => item.href === '/workflows');
      const approvalNav = nav.find(item => item.href === '/approvals');
      expect(workflowNav).toBeDefined();
      expect(approvalNav).toBeDefined(); // FACULTY can now view their own approval requests
    });

    it('HOD should see Approvals', () => {
      const nav = getAvailableNavigation(UserRoles.HOD, 'ACTIVE');
      const approvalNav = nav.find(item => item.href === '/approvals');
      expect(approvalNav).toBeDefined();
    });

    it('ADMIN should see Admin panel', () => {
      const nav = getAvailableNavigation(UserRoles.ADMIN, 'ACTIVE');
      const adminNav = nav.find(item => item.href === '/admin/users');
      expect(adminNav).toBeDefined();
    });

    it('FACULTY should not see Admin panel', () => {
      const nav = getAvailableNavigation(UserRoles.FACULTY, 'ACTIVE');
      const adminNav = nav.find(item => item.href === '/admin/users');
      expect(adminNav).toBeUndefined();
    });

    it('All users should see Signatures and Notifications (no capability required)', () => {
      const nav = getAvailableNavigation(UserRoles.FACULTY, 'ACTIVE');
      const signatureNav = nav.find(item => item.href === '/signatures');
      const notificationNav = nav.find(item => item.href === '/notifications');
      expect(signatureNav).toBeDefined();
      expect(notificationNav).toBeDefined();
    });

    it('PRINCIPAL should see Audit Logs', () => {
      const nav = getAvailableNavigation(UserRoles.PRINCIPAL, 'ACTIVE');
      const auditNav = nav.find(item => item.href === '/audit');
      expect(auditNav).toBeDefined();
    });
  });
