# Role-Based Auto-Navigation

## Overview
After successful login via OAuth, users are automatically navigated to their designated page based on their assigned role from Azure AD.

## Navigation Flow

### 1. Login Process
```
User clicks "Sign in with Microsoft"
    ↓
Azure AD Authentication
    ↓
Fetch user groups from Azure AD
    ↓
Determine role based on groups
    ↓
Auto-navigate to role-specific page
```

### 2. Role Assignment Priority
Roles are assigned based on Azure AD group membership in this order:
1. **Admin** - If user is in "Global Administrator" or admin-related groups
2. **HR** - If user is in HR-related groups
3. **Manager** - If user is in manager/supervisor groups
4. **Employee** - Default role for all other users

### 3. Auto-Navigation Mapping

| Role | Auto-Navigate To | Page Description |
|------|-----------------|------------------|
| **Admin** | `/admin` | Full system administration dashboard |
| **HR** | `/hr-approval` | HR approval dashboard for all bookings |
| **Manager** | `/manager-approval` | Manager dashboard for team approvals |
| **Employee** | `/my-bookings` | Personal booking page |

## Current Implementation

### Role Detection (OAuth Callback)
```typescript
// In /api/auth/microsoft/callback/route.ts
// Fetch user groups
const groups = await fetchUserGroups(accessToken);

// Determine role based on groups
let userRole = 'Employee'; // Default

for (const group of groups) {
  if (group.displayName.includes('Administrator')) {
    userRole = 'Admin';
    break;
  } else if (group.displayName.includes('HR')) {
    userRole = 'HR';
    break;
  } else if (group.displayName.includes('Manager')) {
    userRole = 'Manager';
    break;
  }
}
```

### Auto-Navigation Logic
```typescript
// In page.tsx handleLogin()
const handleLogin = (userData: User) => {
  setUser(userData);
  
  // Route based on user role
  if (userData.role === "Manager") {
    setCurrentState("manager-approval");
  } else if (userData.role === "HR") {
    setCurrentState("hr-approval");
  } else if (userData.role === "Admin") {
    setCurrentState("admin");
  } else {
    setCurrentState("my-bookings");
  }
};
```

## Example User Flows

### Admin User Flow
1. User: `admin@company.com`
2. Azure AD Groups: `["Global Administrator", "IT"]`
3. Assigned Role: `Admin`
4. Auto-navigates to: **Admin Dashboard** ✓

### Manager User Flow
1. User: `john.manager@company.com`
2. Azure AD Groups: `["Sales Manager", "Department Heads"]`
3. Assigned Role: `Manager`
4. Auto-navigates to: **Manager Approval Page** ✓

### HR User Flow
1. User: `hr.staff@company.com`
2. Azure AD Groups: `["HR Department", "People Team"]`
3. Assigned Role: `HR`
4. Auto-navigates to: **HR Approval Page** ✓

### Employee User Flow
1. User: `jane.doe@company.com`
2. Azure AD Groups: `["All Users"]`
3. Assigned Role: `Employee` (default)
4. Auto-navigates to: **My Bookings Page** ✓

## Testing Role-Based Navigation

### 1. Check Console Logs
After login, open browser console (F12) to see:
```
User groups: [list of Azure AD groups]
Role [role] assigned based on group: [group name]
User [email] assigned role: [role]
```

### 2. Verify Navigation
- Admin users → Should see admin dashboard
- HR users → Should see HR approval interface  
- Managers → Should see team approval page
- Employees → Should see booking page

### 3. Test Different Accounts
Login with different user accounts to verify each role navigates correctly.

## Troubleshooting

### User Goes to Wrong Page
1. **Check Azure AD groups**: User might not be in the expected group
2. **Check role mapping**: Group name might not match the pattern
3. **Clear cookies**: Old session might be cached
4. **Check console**: Look for role assignment logs

### User Gets Employee Role (Default)
This happens when:
- User is not in any special groups
- Group names don't match the patterns
- Groups couldn't be fetched (permission issue)

### Fix: Update Role Mappings
Edit `/apps/web/src/lib/azure-role-config.ts`:
```typescript
export const roleMappings = [
  {
    role: 'Admin',
    groupNames: ['your-admin-group-name'],
  },
  // Add your group names
];
```

## Security Considerations

1. **Role Verification**: Each page component also verifies the user role
2. **Server-Side Check**: API endpoints validate user permissions
3. **No Client-Side Override**: Roles come from Azure AD, not editable in browser

## Customization

### Add New Role
1. Add role to type definition
2. Update role mapping in `azure-role-config.ts`
3. Add navigation case in `handleLogin()`
4. Create corresponding page component

### Change Navigation Target
In `page.tsx`, update the `handleLogin` function:
```typescript
if (userData.role === "YourRole") {
  setCurrentState("your-page-state");
}
```

## Benefits

1. **Seamless UX**: Users go directly to their workspace
2. **No Manual Navigation**: Reduces clicks and confusion
3. **Role-Appropriate Content**: Users only see what they need
4. **Centralized Management**: Roles managed in Azure AD
5. **Consistent Experience**: Same navigation logic everywhere