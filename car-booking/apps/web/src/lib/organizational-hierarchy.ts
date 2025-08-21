/**
 * Organizational Hierarchy Management
 * Manages manager-employee relationships from Azure AD
 */

export interface Employee {
  id: string;
  email: string;
  name: string;
  managerId?: string;
  managerEmail?: string;
  managerName?: string;
  department?: string;
  directReports?: Employee[];
}

export interface OrganizationalUnit {
  managerId: string;
  managerEmail: string;
  managerName: string;
  directReports: string[]; // Employee IDs
  department?: string;
}

/**
 * Fetch user's manager from Microsoft Graph API
 */
export async function fetchUserManager(accessToken: string): Promise<any> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/manager', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      // User has no manager (might be top-level executive)
      return null;
    } else {
      console.error('Failed to fetch manager:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching manager:', error);
    return null;
  }
}

/**
 * Fetch user's direct reports from Microsoft Graph API
 */
export async function fetchDirectReports(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/directReports', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.value || [];
    } else {
      console.error('Failed to fetch direct reports:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching direct reports:', error);
    return [];
  }
}

/**
 * Fetch complete organizational structure for a user
 */
export async function fetchOrganizationalStructure(
  accessToken: string,
  userId: string
): Promise<Employee> {
  try {
    // Fetch user details
    const userResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    
    // Fetch manager
    const manager = await fetchUserManager(accessToken);
    
    // Fetch direct reports
    const directReports = await fetchDirectReports(accessToken);

    const employee: Employee = {
      id: userData.id,
      email: userData.mail || userData.userPrincipalName,
      name: userData.displayName,
      department: userData.department,
      managerId: manager?.id,
      managerEmail: manager?.mail || manager?.userPrincipalName,
      managerName: manager?.displayName,
      directReports: directReports.map(report => ({
        id: report.id,
        email: report.mail || report.userPrincipalName,
        name: report.displayName,
        department: report.department,
      })),
    };

    return employee;
  } catch (error) {
    console.error('Error fetching organizational structure:', error);
    throw error;
  }
}

/**
 * Check if a manager can approve a specific employee's request
 */
export function canManagerApprove(
  managerId: string,
  employeeId: string,
  organizationalData: Map<string, Employee>
): boolean {
  const employee = organizationalData.get(employeeId);
  
  if (!employee) {
    return false;
  }

  // Check direct manager
  if (employee.managerId === managerId) {
    return true;
  }

  // Check skip-level (manager's manager) if needed
  if (employee.managerId) {
    const directManager = organizationalData.get(employee.managerId);
    if (directManager?.managerId === managerId) {
      // This is skip-level approval - you can enable/disable this
      return true;
    }
  }

  return false;
}

/**
 * Get all employees under a manager (including indirect reports)
 */
export function getAllSubordinates(
  managerId: string,
  organizationalData: Map<string, Employee>,
  includeIndirect: boolean = false
): string[] {
  const subordinates: Set<string> = new Set();
  const manager = organizationalData.get(managerId);

  if (!manager?.directReports) {
    return [];
  }

  // Add direct reports
  manager.directReports.forEach(report => {
    subordinates.add(report.id);

    // Recursively add indirect reports if requested
    if (includeIndirect) {
      const indirectReports = getAllSubordinates(report.id, organizationalData, true);
      indirectReports.forEach(id => subordinates.add(id));
    }
  });

  return Array.from(subordinates);
}

/**
 * Build organizational tree from flat employee list
 */
export function buildOrganizationalTree(employees: Employee[]): Map<string, Employee> {
  const orgMap = new Map<string, Employee>();
  
  // First pass: add all employees to map
  employees.forEach(emp => {
    orgMap.set(emp.id, emp);
  });

  // Second pass: link managers and direct reports
  employees.forEach(emp => {
    if (emp.managerId) {
      const manager = orgMap.get(emp.managerId);
      if (manager) {
        if (!manager.directReports) {
          manager.directReports = [];
        }
        // Add this employee as a direct report of their manager
        if (!manager.directReports.find(r => r.id === emp.id)) {
          manager.directReports.push({
            id: emp.id,
            email: emp.email,
            name: emp.name,
            department: emp.department,
          });
        }
      }
    }
  });

  return orgMap;
}

/**
 * Get approval chain for an employee (list of managers up the hierarchy)
 */
export function getApprovalChain(
  employeeId: string,
  organizationalData: Map<string, Employee>
): Employee[] {
  const chain: Employee[] = [];
  let currentEmployee = organizationalData.get(employeeId);

  while (currentEmployee?.managerId) {
    const manager = organizationalData.get(currentEmployee.managerId);
    if (manager) {
      chain.push(manager);
      currentEmployee = manager;
    } else {
      break;
    }
  }

  return chain;
}

/**
 * Determine if user needs HR approval based on hierarchy
 * (e.g., if they're a senior manager or executive)
 */
export function needsHRApproval(
  employeeId: string,
  organizationalData: Map<string, Employee>
): boolean {
  const employee = organizationalData.get(employeeId);
  
  if (!employee) {
    return true; // Default to HR approval if we can't determine
  }

  // If user has no manager, they're likely an executive - needs HR approval
  if (!employee.managerId) {
    return true;
  }

  // If user has many direct reports (e.g., > 10), might need HR approval
  if (employee.directReports && employee.directReports.length > 10) {
    return true;
  }

  return false;
}

/**
 * Cache organizational data with expiry
 */
export class OrganizationalCache {
  private cache: Map<string, { data: Employee; expiry: number }> = new Map();
  private ttl: number = 3600000; // 1 hour default TTL

  set(key: string, data: Employee): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl,
    });
  }

  get(key: string): Employee | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}