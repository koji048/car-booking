/**
 * Azure AD App Roles Configuration
 * Handles role determination from app roles in ID token
 */

export type AppRole = 'Admin' | 'HR' | 'Manager' | 'Employee';

/**
 * Map of app role values to application roles
 * These should match the values defined in Azure AD
 */
export const APP_ROLE_MAPPING: Record<string, AppRole> = {
  'Admin': 'Admin',
  'Administrator': 'Admin',
  'HR': 'HR',
  'HRStaff': 'HR',
  'Manager': 'Manager',
  'Employee': 'Employee',
};

/**
 * Priority order for roles (highest to lowest)
 * Used when user has multiple roles
 */
export const ROLE_PRIORITY: AppRole[] = ['Admin', 'HR', 'Manager', 'Employee'];

/**
 * Determine user role from app roles in token
 * @param appRoles Array of role values from ID token
 * @returns Highest priority role or default Employee role
 */
export function determineRoleFromAppRoles(appRoles: string[] | undefined): AppRole {
  if (!appRoles || appRoles.length === 0) {
    console.log('No app roles found, defaulting to Employee');
    return 'Employee';
  }

  console.log('App roles from token:', appRoles);

  // Map token roles to app roles
  const mappedRoles: AppRole[] = appRoles
    .map(role => APP_ROLE_MAPPING[role])
    .filter(Boolean) as AppRole[];

  if (mappedRoles.length === 0) {
    console.log('No matching app roles found, defaulting to Employee');
    return 'Employee';
  }

  // Return highest priority role
  for (const priorityRole of ROLE_PRIORITY) {
    if (mappedRoles.includes(priorityRole)) {
      console.log(`Assigned role ${priorityRole} based on app roles`);
      return priorityRole;
    }
  }

  return 'Employee';
}

/**
 * Check if user has a specific app role
 * @param appRoles Array of role values from ID token
 * @param role Role to check for
 * @returns Boolean indicating if user has the role
 */
export function hasAppRole(appRoles: string[] | undefined, role: AppRole): boolean {
  if (!appRoles) return false;
  
  return appRoles.some(tokenRole => {
    const mappedRole = APP_ROLE_MAPPING[tokenRole];
    return mappedRole === role;
  });
}

/**
 * Get all app roles for a user
 * @param appRoles Array of role values from ID token
 * @returns Array of mapped app roles
 */
export function getUserAppRoles(appRoles: string[] | undefined): AppRole[] {
  if (!appRoles) return [];
  
  const mappedRoles = appRoles
    .map(role => APP_ROLE_MAPPING[role])
    .filter(Boolean) as AppRole[];
  
  // Remove duplicates
  return [...new Set(mappedRoles)];
}

/**
 * Check if user has any administrative role
 * @param appRoles Array of role values from ID token
 * @returns Boolean indicating if user is admin or HR
 */
export function isAdministrative(appRoles: string[] | undefined): boolean {
  const userRoles = getUserAppRoles(appRoles);
  return userRoles.includes('Admin') || userRoles.includes('HR');
}

/**
 * Check if user can approve bookings
 * @param appRoles Array of role values from ID token
 * @returns Boolean indicating if user can approve
 */
export function canApprove(appRoles: string[] | undefined): boolean {
  const userRoles = getUserAppRoles(appRoles);
  return userRoles.includes('Admin') || 
         userRoles.includes('HR') || 
         userRoles.includes('Manager');
}

/**
 * Get role display name
 * @param role Application role
 * @returns Human-readable role name
 */
export function getRoleDisplayName(role: AppRole): string {
  const displayNames: Record<AppRole, string> = {
    'Admin': 'Administrator',
    'HR': 'HR Staff',
    'Manager': 'Manager',
    'Employee': 'Employee',
  };
  
  return displayNames[role] || role;
}

/**
 * Get role description
 * @param role Application role
 * @returns Role description
 */
export function getRoleDescription(role: AppRole): string {
  const descriptions: Record<AppRole, string> = {
    'Admin': 'Full system access and configuration',
    'HR': 'Approve all bookings and manage policies',
    'Manager': 'Approve team member bookings',
    'Employee': 'Create and manage own bookings',
  };
  
  return descriptions[role] || 'Standard user access';
}

/**
 * Parse roles from ID token claims
 * Handles both single role (string) and multiple roles (array)
 * @param claims ID token claims object
 * @returns Array of role strings
 */
export function parseRolesFromClaims(claims: any): string[] {
  if (!claims) return [];
  
  // Azure AD can return roles as string or array
  const roles = claims.roles;
  
  if (!roles) return [];
  
  if (typeof roles === 'string') {
    return [roles];
  }
  
  if (Array.isArray(roles)) {
    return roles;
  }
  
  return [];
}