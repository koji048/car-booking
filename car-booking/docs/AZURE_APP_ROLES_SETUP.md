# Azure AD App Roles Setup Guide

## Overview
App Roles provide a more structured and secure way to manage user permissions in your application compared to using groups. They are defined in your Azure AD application and assigned to users/groups.

## Step-by-Step: Creating App Roles in Azure Portal

### Step 1: Access Your App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your application: **Carbooking-SGS**

### Step 2: Create App Roles
1. In your app registration, go to **App roles**
2. Click **Create app role**
3. Create each role with these settings:

#### Admin Role
```
Display name: Administrator
Value: Admin
Description: Full system access to car booking system
Allowed member types: Users/Groups
Enable this app role: ✓
```

#### HR Role
```
Display name: HR Staff
Value: HR
Description: HR staff who can approve all bookings
Allowed member types: Users/Groups
Enable this app role: ✓
```

#### Manager Role
```
Display name: Manager
Value: Manager
Description: Managers who can approve team bookings
Allowed member types: Users/Groups
Enable this app role: ✓
```

#### Employee Role
```
Display name: Employee
Value: Employee
Description: Regular employees who can create bookings
Allowed member types: Users/Groups
Enable this app role: ✓
```

### Step 3: Assign Roles to Users

#### Method 1: Direct User Assignment
1. Go to **Azure Active Directory** → **Enterprise applications**
2. Find and select your app: **Carbooking-SGS**
3. Go to **Users and groups**
4. Click **Add user/group**
5. Select users and assign them a role:
   - Select **Users**: Choose the user(s)
   - Select **Role**: Choose one of your app roles
   - Click **Assign**

#### Method 2: Group Assignment (Recommended)
1. Create Azure AD groups for each role:
   - `CarBooking-Admins`
   - `CarBooking-HR`
   - `CarBooking-Managers`
   - `CarBooking-Employees`
2. In Enterprise applications → Your app → Users and groups
3. Click **Add user/group**
4. Select **Groups** instead of users
5. Assign the appropriate role to each group
6. Add users to these groups as needed

### Step 4: Configure Permissions
1. In App registration → **API permissions**
2. Ensure these permissions are granted:
   ```
   Microsoft Graph (Delegated):
   - User.Read
   - Directory.Read.All (optional, for groups)
   ```
3. Click **Grant admin consent**

## Implementation in Your Application

### 1. Update OAuth Configuration
The app roles will be included in the ID token. Update your callback to read them:

```typescript
// In /api/auth/microsoft/callback/route.ts
export async function GET(request: NextRequest) {
  // ... existing code ...
  
  // Extract roles from ID token
  const idTokenClaims = tokenResponse.idTokenClaims;
  const appRoles = idTokenClaims?.roles || [];
  
  // Determine user role from app roles
  let userRole = 'Employee'; // Default
  
  if (appRoles.includes('Admin')) {
    userRole = 'Admin';
  } else if (appRoles.includes('HR')) {
    userRole = 'HR';
  } else if (appRoles.includes('Manager')) {
    userRole = 'Manager';
  } else if (appRoles.includes('Employee')) {
    userRole = 'Employee';
  }
  
  console.log('User app roles:', appRoles);
  console.log('Assigned role:', userRole);
}
```

### 2. Update Token Claims
App roles appear in the token as a `roles` claim:
```json
{
  "aud": "8dbe7621-14fe-46aa-9968-77d6500e429e",
  "iss": "https://login.microsoftonline.com/.../v2.0",
  "roles": ["Manager"],  // ← App roles appear here
  "name": "John Doe",
  "email": "john.doe@company.com"
}
```

## Benefits of App Roles vs Groups

| Feature | App Roles | Groups |
|---------|-----------|---------|
| **Definition** | Defined in your app | Defined in Azure AD |
| **Scope** | Specific to your app | Organization-wide |
| **Token Size** | Smaller (just role names) | Larger (group IDs) |
| **Management** | Per-application | Global |
| **Security** | More secure | Can expose org structure |
| **Performance** | Faster | Requires additional API calls |

## Testing App Roles

### 1. Check Token Contents
After login, decode the ID token to see roles:
```javascript
// In browser console
const token = "eyJ..."; // Your ID token
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Roles:', payload.roles);
```

### 2. Verify in Application
Check browser console for:
```
User app roles: ["Manager"]
Assigned role: Manager
```

### 3. Test Different Users
1. Assign different roles to test users
2. Login with each user
3. Verify they land on correct page

## Manifest Alternative (Advanced)

You can also define roles in the app manifest:

1. In App registration → **Manifest**
2. Find the `appRoles` array
3. Add your roles:

```json
"appRoles": [
  {
    "allowedMemberTypes": ["User"],
    "description": "Administrators have full access",
    "displayName": "Administrator",
    "id": "a816142a-2e8e-46c4-9997-f984faccb625",
    "isEnabled": true,
    "origin": "Application",
    "value": "Admin"
  },
  {
    "allowedMemberTypes": ["User"],
    "description": "HR staff can approve all bookings",
    "displayName": "HR Staff",
    "id": "b816142a-2e8e-46c4-9997-f984faccb626",
    "isEnabled": true,
    "origin": "Application",
    "value": "HR"
  },
  {
    "allowedMemberTypes": ["User"],
    "description": "Managers can approve team bookings",
    "displayName": "Manager",
    "id": "c816142a-2e8e-46c4-9997-f984faccb627",
    "isEnabled": true,
    "origin": "Application",
    "value": "Manager"
  },
  {
    "allowedMemberTypes": ["User"],
    "description": "Employees can create bookings",
    "displayName": "Employee",
    "id": "d816142a-2e8e-46c4-9997-f984faccb628",
    "isEnabled": true,
    "origin": "Application",
    "value": "Employee"
  }
]
```

Note: Generate unique GUIDs for the `id` field.

## Troubleshooting

### Roles Not Appearing in Token
1. Check role assignment in Enterprise applications
2. Ensure user logged out and back in
3. Verify app role is enabled
4. Check token version (v2.0 required)

### User Has Multiple Roles
- App roles can be cumulative
- Implement priority: Admin > HR > Manager > Employee
- Or support multiple roles simultaneously

### Cannot Assign Roles
- Need Azure AD Premium P1/P2 for group assignments
- User assignment works with free tier
- Check you have proper admin permissions

## Migration from Groups to App Roles

### Phase 1: Create App Roles
1. Define all roles in Azure AD
2. Keep existing group logic as fallback

### Phase 2: Dual Support
```typescript
// Support both app roles and groups
const appRoles = idTokenClaims?.roles || [];
const groups = await fetchUserGroups(); // existing

// Check app roles first
if (appRoles.length > 0) {
  userRole = determineRoleFromAppRoles(appRoles);
} else {
  // Fallback to groups
  userRole = determineRoleFromGroups(groups);
}
```

### Phase 3: Migrate Users
1. Assign app roles to users/groups
2. Test with pilot users
3. Gradually migrate all users

### Phase 4: Remove Group Logic
Once all users have app roles, remove group-based logic

## Best Practices

1. **Use Groups for Assignment**
   - Create one group per role
   - Assign app role to group
   - Manage membership via groups

2. **Keep Roles Simple**
   - 3-5 roles maximum
   - Clear hierarchy
   - Avoid overlapping permissions

3. **Document Role Permissions**
   - What each role can do
   - Who should have each role
   - Approval process for role changes

4. **Regular Audits**
   - Review role assignments quarterly
   - Remove unnecessary elevated roles
   - Document role assignment decisions

## Security Considerations

1. **Principle of Least Privilege**
   - Default to Employee role
   - Elevate only when needed
   - Regular reviews

2. **Separation of Duties**
   - HR approves leave/personnel
   - Managers approve team resources
   - Admin manages system

3. **Audit Trail**
   - Log role assignments
   - Track permission usage
   - Regular compliance checks

## Next Steps

1. ✅ Create app roles in Azure Portal
2. ✅ Assign roles to users/groups
3. ✅ Update application code to read roles from token
4. ✅ Test with different user roles
5. ⬜ Implement role-based UI components
6. ⬜ Add role-based API authorization
7. ⬜ Set up monitoring and alerts