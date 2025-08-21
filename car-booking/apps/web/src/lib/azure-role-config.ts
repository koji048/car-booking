/**
 * Azure AD Role Configuration
 * Maps Azure AD groups and email patterns to application roles
 */

export interface RoleMapping {
  groupNames?: string[];
  groupIds?: string[];
  emailPatterns?: string[];
  emailDomains?: string[];
  role: 'Admin' | 'HR' | 'Manager' | 'Employee';
}

/**
 * Configure your role mappings here based on your Azure AD setup
 * Priority: Admin > HR > Manager > Employee
 */
export const roleMappings: RoleMapping[] = [
  {
    // Admin role mapping
    role: 'Admin',
    groupNames: ['carbooking-admin', 'administrators', 'admin', 'car-booking-admin', 'it-admin'],
    groupIds: [
      // Add your specific Azure AD group IDs here
      // Example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      // Paste your CarBooking-Admin group Object ID here
    ],
    emailPatterns: ['admin@', 'administrator@', 'it.admin@'],
    emailDomains: [], // Add specific domains if needed
  },
  {
    // HR role mapping
    role: 'HR',
    groupNames: ['carbooking-hr', 'hr', 'human-resources', 'hr-department', 'people-team'],
    groupIds: [
      // Add your specific Azure AD group IDs here
      // Paste your CarBooking-HR group Object ID here
    ],
    emailPatterns: ['hr@', 'hr.', 'humanresources@'],
    emailDomains: [],
  },
  {
    // Manager role mapping
    role: 'Manager',
    groupNames: ['carbooking-manager', 'managers', 'supervisors', 'team-leads', 'department-heads'],
    groupIds: [
      // Add your specific Azure AD group IDs here
      // Paste your CarBooking-Manager group Object ID here
    ],
    emailPatterns: ['manager@', '.manager@', 'head.', 'lead.'],
    emailDomains: [],
  },
];

/**
 * Determine user role based on Azure AD groups and email
 */
export function determineUserRole(
  groups: any[],
  email: string
): 'Admin' | 'HR' | 'Manager' | 'Employee' {
  const normalizedEmail = email.toLowerCase();
  
  // Check each role mapping in priority order
  for (const mapping of roleMappings) {
    // Check group names
    if (mapping.groupNames && groups.length > 0) {
      for (const group of groups) {
        const groupName = (group.displayName || '').toLowerCase();
        if (mapping.groupNames.some(name => groupName.includes(name))) {
          console.log(`Role ${mapping.role} assigned based on group: ${group.displayName}`);
          return mapping.role;
        }
      }
    }
    
    // Check group IDs
    if (mapping.groupIds && mapping.groupIds.length > 0 && groups.length > 0) {
      for (const group of groups) {
        if (mapping.groupIds.includes(group.id)) {
          console.log(`Role ${mapping.role} assigned based on group ID: ${group.id}`);
          return mapping.role;
        }
      }
    }
    
    // Check email patterns
    if (mapping.emailPatterns) {
      for (const pattern of mapping.emailPatterns) {
        if (normalizedEmail.includes(pattern)) {
          console.log(`Role ${mapping.role} assigned based on email pattern: ${pattern}`);
          return mapping.role;
        }
      }
    }
    
    // Check email domains
    if (mapping.emailDomains && mapping.emailDomains.length > 0) {
      const emailDomain = normalizedEmail.split('@')[1] || '';
      if (mapping.emailDomains.includes(emailDomain)) {
        console.log(`Role ${mapping.role} assigned based on email domain: ${emailDomain}`);
        return mapping.role;
      }
    }
  }
  
  // Default to Employee role
  console.log('Default Employee role assigned');
  return 'Employee';
}

/**
 * Special email addresses that always get admin access
 * Add your admin emails here
 */
export const adminEmails = [
  // 'admin@siamgs.co.th',
  // 'it.support@siamgs.co.th',
];

/**
 * Check if email should have admin override
 */
export function isAdminEmail(email: string): boolean {
  return adminEmails.includes(email.toLowerCase());
}