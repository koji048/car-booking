// LDAP/Active Directory Configuration for GS Battery (Siam GS)
export const ldapConfig = {
  // Active Directory server configuration
  url: process.env.LDAP_URL || '',
  
  // Base DN for user search
  baseDN: process.env.LDAP_BASE_DN || 'DC=siamgs,DC=co,DC=th',
  
  // Admin bind credentials (service account)
  adminDN: process.env.LDAP_ADMIN_DN || 'CN=Admin carbooking,OU=IT,OU=Siamgs User,DC=siamgs,DC=co,DC=th',
  adminPassword: process.env.LDAP_ADMIN_PASSWORD || '',
  
  // User search filter
  searchFilter: process.env.LDAP_SEARCH_FILTER || '(&(objectClass=user)(sAMAccountName={{username}}))',
  
  // User attributes to retrieve
  searchAttributes: [
    'sAMAccountName',
    'displayName',
    'mail',
    'memberOf',
    'department',
    'title',
    'manager',
    'employeeID'
  ],
  
  // Group mappings for roles (Siam GS)
  groupMappings: {
    'CN=Car-Booking-Admins,OU=Groups,DC=siamgs,DC=co,DC=th': 'admin',
    'CN=Car-Booking-Managers,OU=Groups,DC=siamgs,DC=co,DC=th': 'manager',
    'CN=Car-Booking-HR,OU=Groups,DC=siamgs,DC=co,DC=th': 'hr',
    'CN=Domain Users,CN=Users,DC=siamgs,DC=co,DC=th': 'employee'
  },
  
  // Connection options
  options: {
    reconnect: true,
    connectTimeout: 10000,
    idleTimeout: 10000
  }
};

// Helper function to extract role from AD groups
export function getRoleFromGroups(memberOf: string | string[]): string {
  const groups = Array.isArray(memberOf) ? memberOf : [memberOf];
  
  // Check groups in priority order
  for (const [groupDN, role] of Object.entries(ldapConfig.groupMappings)) {
    if (groups.some(group => group.includes(groupDN.split(',')[0]))) {
      return role;
    }
  }
  
  return 'employee'; // Default role
}