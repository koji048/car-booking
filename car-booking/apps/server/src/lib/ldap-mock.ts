// Mock LDAP service for development/testing
// This simulates Active Directory authentication when LDAP server is not available

interface MockUser {
  username: string;
  password: string;
  displayName: string;
  email: string;
  role: string;
  department: string;
  title: string;
  employeeId: string;
  groups: string[];
}

// Mock Active Directory users for GS Battery
const MOCK_AD_USERS: MockUser[] = [
  {
    username: 'thanakorn.c',
    password: 'Password123!',
    displayName: 'Thanakorn C',
    email: 'thanakorn.c@gsbattery.co.th',
    role: 'admin',
    department: 'IT',
    title: 'System Administrator',
    employeeId: 'IT001',
    groups: ['Domain Users', 'Car-Booking-Admins', 'IT Team']
  },
  {
    username: 'thanakorn.c@gsbattery.co.th',
    password: 'Password123!',
    displayName: 'Thanakorn C',
    email: 'thanakorn.c@gsbattery.co.th',
    role: 'admin',
    department: 'IT',
    title: 'System Administrator',
    employeeId: 'IT001',
    groups: ['Domain Users', 'Car-Booking-Admins', 'IT Team']
  },
  {
    username: 'john.doe',
    password: 'Password123!',
    displayName: 'John Doe',
    email: 'john.doe@gsbattery.co.th',
    role: 'employee',
    department: 'Engineering',
    title: 'Software Engineer',
    employeeId: 'EMP001',
    groups: ['Domain Users', 'Engineering Team']
  },
  {
    username: 'jane.manager',
    password: 'Manager123!',
    displayName: 'Jane Manager',
    email: 'jane.manager@gsbattery.co.th',
    role: 'manager',
    department: 'Engineering',
    title: 'Engineering Manager',
    employeeId: 'MGR001',
    groups: ['Domain Users', 'Car-Booking-Managers', 'Management Team']
  },
  {
    username: 'jane.manager@gsbattery.co.th',
    password: 'Manager123!',
    displayName: 'Jane Manager',
    email: 'jane.manager@gsbattery.co.th',
    role: 'manager',
    department: 'Engineering',
    title: 'Engineering Manager',
    employeeId: 'MGR001',
    groups: ['Domain Users', 'Car-Booking-Managers', 'Management Team']
  },
  {
    username: 'hr.admin',
    password: 'HRAdmin123!',
    displayName: 'HR Administrator',
    email: 'hr.admin@gsbattery.co.th',
    role: 'hr',
    department: 'Human Resources',
    title: 'HR Manager',
    employeeId: 'HR001',
    groups: ['Domain Users', 'Car-Booking-HR', 'HR Team']
  },
  {
    username: 'hr.admin@gsbattery.co.th',
    password: 'HRAdmin123!',
    displayName: 'HR Administrator',
    email: 'hr.admin@gsbattery.co.th',
    role: 'hr',
    department: 'Human Resources',
    title: 'HR Manager',
    employeeId: 'HR001',
    groups: ['Domain Users', 'Car-Booking-HR', 'HR Team']
  },
  {
    username: 'sys.admin',
    password: 'Admin123!',
    displayName: 'System Administrator',
    email: 'sys.admin@gsbattery.co.th',
    role: 'admin',
    department: 'IT',
    title: 'System Administrator',
    employeeId: 'IT002',
    groups: ['Domain Users', 'Car-Booking-Admins', 'Domain Admins']
  },
  {
    username: 'mike.employee',
    password: 'Employee123!',
    displayName: 'Mike Employee',
    email: 'mike.employee@gsbattery.co.th',
    role: 'employee',
    department: 'Sales',
    title: 'Sales Representative',
    employeeId: 'EMP002',
    groups: ['Domain Users', 'Sales Team']
  },
  {
    username: 'sarah.hr',
    password: 'HR123!',
    displayName: 'Sarah HR',
    email: 'sarah.hr@gsbattery.co.th',
    role: 'hr',
    department: 'Human Resources',
    title: 'HR Specialist',
    employeeId: 'HR002',
    groups: ['Domain Users', 'Car-Booking-HR', 'HR Team']
  }
];

export class MockLDAPService {
  // Simulate LDAP authentication
  public async authenticate(username: string, password: string): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user by username (case-insensitive)
    const user = MOCK_AD_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      throw new Error('User not found in Active Directory');
    }

    // Check password
    if (user.password !== password) {
      throw new Error('Invalid password');
    }

    // Return user data in LDAP format
    return {
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      department: user.department,
      title: user.title,
      employeeId: user.employeeId,
      groups: user.groups
    };
  }

  // Validate user exists
  public async validateUser(username: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return MOCK_AD_USERS.some(
      u => u.username.toLowerCase() === username.toLowerCase()
    );
  }

  // Get user groups
  public async getUserGroups(username: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const user = MOCK_AD_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );
    
    return user ? user.groups : [];
  }
}

export const mockLdapAuth = new MockLDAPService();