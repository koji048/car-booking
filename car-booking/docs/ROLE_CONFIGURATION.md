# Role-Based Access Control (RBAC) Configuration

## Overview
The car booking system uses Azure AD groups and email patterns to determine user roles. Users are automatically assigned one of four roles:
- **Admin**: Full system access, can manage all bookings and settings
- **HR**: Can approve/reject bookings, view all employee bookings
- **Manager**: Can approve team member bookings
- **Employee**: Can create and view own bookings

## Role Assignment Priority
Roles are assigned in the following priority order:
1. Admin
2. HR  
3. Manager
4. Employee (default)

## Configuration Methods

### Method 1: Azure AD Groups (Recommended)

#### Step 1: Create Groups in Azure AD
1. Go to Azure Portal → Azure Active Directory → Groups
2. Create groups for each role:
   - `CarBooking-Admin`
   - `CarBooking-HR`
   - `CarBooking-Manager`

#### Step 2: Add Users to Groups
1. Select the group
2. Go to Members → Add members
3. Search and add users

#### Step 3: Update Role Configuration
Edit `/apps/web/src/lib/azure-role-config.ts`:

```typescript
export const roleMappings: RoleMapping[] = [
  {
    role: 'Admin',
    groupNames: ['carbooking-admin'],
    groupIds: ['your-admin-group-id'], // Optional: use specific group ID
  },
  {
    role: 'HR',
    groupNames: ['carbooking-hr'],
  },
  {
    role: 'Manager',
    groupNames: ['carbooking-manager'],
  },
];
```

### Method 2: Email Patterns

Configure roles based on email patterns in `/apps/web/src/lib/azure-role-config.ts`:

```typescript
export const roleMappings: RoleMapping[] = [
  {
    role: 'Admin',
    emailPatterns: ['admin@', 'it.admin@'],
    emailDomains: ['admin.siamgs.co.th'],
  },
  {
    role: 'HR',
    emailPatterns: ['hr@', 'hr.'],
  },
  {
    role: 'Manager',
    emailPatterns: ['manager@', '.manager@'],
  },
];
```

### Method 3: Specific Email Override

For specific users who always need admin access:

```typescript
export const adminEmails = [
  'john.doe@siamgs.co.th',
  'admin@siamgs.co.th',
];
```

## Azure AD Permissions Required

### For Group-Based Roles
The application needs these permissions in Azure AD:
- `User.Read` - Read user profile
- `Directory.Read.All` - Read directory data (for groups)
- `Group.Read.All` - Read all groups

#### Granting Permissions:
1. Go to Azure Portal → App registrations
2. Select your app → API permissions
3. Add permissions:
   - Microsoft Graph → Delegated permissions
   - Select required permissions
4. Click "Grant admin consent"

## Testing Role Assignment

### Check Current Role
After logging in, check the browser console for:
```
User groups: [...]
User email@domain.com assigned role: Admin
```

### Test Different Roles
1. **Admin Test**: 
   - Add user to admin group or use admin email pattern
   - Should see Admin dashboard after login

2. **HR Test**:
   - Add user to HR group
   - Should see approval workflows

3. **Manager Test**:
   - Add user to manager group
   - Should see team approvals

4. **Employee Test**:
   - Default role for all users
   - Can only create/view own bookings

## Troubleshooting

### User Gets Wrong Role
1. Check browser console for role assignment logs
2. Verify Azure AD group membership
3. Check email pattern matching
4. Ensure permissions are granted in Azure AD

### Groups Not Fetching
If you see "Could not fetch user groups":
1. Ensure `Directory.Read.All` permission is granted
2. Admin consent may be required
3. Check Graph API response in console

### Fallback Behavior
If groups cannot be fetched:
- System falls back to email pattern matching
- Default role is Employee if no patterns match

## Production Deployment

### Update Environment Variables
```env
# Production Azure AD settings
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-secret
```

### Configure Production Groups
1. Create production groups in Azure AD
2. Update group IDs in role configuration
3. Test with production user accounts

## Security Best Practices

1. **Use Groups Over Email Patterns**
   - More secure and manageable
   - Centralized in Azure AD

2. **Regular Audits**
   - Review group memberships monthly
   - Check for unnecessary admin access

3. **Principle of Least Privilege**
   - Only grant minimum required access
   - Use Manager role instead of Admin where possible

4. **Document Group IDs**
   - Keep record of group IDs used
   - Document role assignments

## Quick Reference

| Role | Capabilities | Typical Users |
|------|-------------|---------------|
| Admin | Full system access, all bookings, settings | IT, System admins |
| HR | Approve/reject all bookings, reports | HR department |
| Manager | Approve team bookings | Department heads |
| Employee | Create/view own bookings | All staff |

## Support
For role configuration issues:
1. Check this documentation
2. Review console logs
3. Contact IT support with error details