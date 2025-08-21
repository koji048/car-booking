# Organizational Hierarchy Setup Guide

## Overview
The car booking system supports organizational hierarchy where:
- **Employees** submit booking requests to their direct manager
- **Managers** can only approve bookings from their direct reports
- **HR** can approve any booking (override)
- **Admin** has full system access

## How It Works

### 1. Manager-Employee Relationships
The system uses Azure AD's built-in manager relationships:
- Each employee has a designated manager in Azure AD
- Managers can see and approve only their direct reports' bookings
- The hierarchy is automatically fetched during login

### 2. Approval Flow
```
Employee → Direct Manager → HR (if needed) → Approved
```

## Setting Up Manager Relationships in Azure AD

### Method 1: Azure Portal (Recommended)

1. **Go to Azure Portal** → Azure Active Directory → Users
2. **Select an employee** user
3. **Click** "Edit properties"
4. **In the Job Information section**:
   - Find the **Manager** field
   - Click "Select manager"
   - Search and select the employee's manager
5. **Save** the changes

### Method 2: Bulk Update via CSV

1. **Prepare a CSV file** with columns:
   ```csv
   UserPrincipalName,Manager
   john.doe@company.com,jane.manager@company.com
   alice.smith@company.com,jane.manager@company.com
   ```

2. **Use PowerShell**:
   ```powershell
   # Connect to Azure AD
   Connect-AzureAD
   
   # Import CSV and update
   $users = Import-Csv "managers.csv"
   foreach ($user in $users) {
       $employee = Get-AzureADUser -ObjectId $user.UserPrincipalName
       $manager = Get-AzureADUser -ObjectId $user.Manager
       Set-AzureADUserManager -ObjectId $employee.ObjectId -RefObjectId $manager.ObjectId
   }
   ```

### Method 3: Microsoft Graph API

```bash
# Update manager for a user
curl -X PUT "https://graph.microsoft.com/v1.0/users/{employee-id}/manager/$ref" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "@odata.id": "https://graph.microsoft.com/v1.0/users/{manager-id}"
  }'
```

## Required Azure AD Permissions

The application needs these permissions to read hierarchy:

1. **User.Read** - Read user profile
2. **User.ReadBasic.All** - Read all users' basic profiles
3. **Directory.Read.All** - Read directory data
4. **User.Read.All** - Read all users' full profiles (optional)

### Granting Permissions:
1. Azure Portal → App registrations → Your app
2. API permissions → Add permission
3. Microsoft Graph → Delegated permissions
4. Select required permissions
5. **Grant admin consent**

## Approval Rules

### Who Can Approve What:

| Role | Can Approve | Cannot Approve |
|------|------------|----------------|
| **Manager** | Direct reports only | Other managers' teams, peers |
| **HR** | All employee bookings | - |
| **Admin** | Everything | - |
| **Employee** | Nothing | All bookings |

### Special Cases:

1. **Skip-Level Approval**: 
   - Can be enabled for manager's manager
   - Useful when direct manager is unavailable

2. **Cross-Team Approval**:
   - HR can delegate to specific managers
   - Requires custom configuration

3. **Executive Approval**:
   - Top-level executives without managers
   - Automatically routed to HR

## Testing the Hierarchy

### 1. Check Manager Assignment
After login, check browser console:
```javascript
User manager: {
  id: "manager-azure-id",
  name: "Jane Manager",
  email: "jane.manager@company.com"
}
```

### 2. Check Direct Reports (for Managers)
```javascript
User has 5 direct reports
```

### 3. Test Approval Permission
```javascript
// API call to check if manager can approve
POST /api/hierarchy/can-approve
{
  "employeeId": "employee-azure-id",
  "employeeEmail": "john.doe@company.com"
}

// Response
{
  "canApprove": true,
  "reason": "Direct report"
}
```

## Common Scenarios

### Scenario 1: New Employee Joins
1. Create user in Azure AD
2. Assign their manager
3. User logs in → System fetches hierarchy
4. Booking requests go to assigned manager

### Scenario 2: Manager Changes
1. Update manager in Azure AD
2. Employee logs out and back in
3. New manager receives future requests
4. Old pending requests remain with old manager

### Scenario 3: Manager on Leave
Options:
1. **Temporary delegation**: Update manager in Azure AD temporarily
2. **HR override**: HR approves on manager's behalf
3. **Skip-level**: Route to manager's manager

## Troubleshooting

### Issue: Manager Not Detected
**Check:**
- Manager assigned in Azure AD?
- Permissions granted to read manager?
- Console errors during login?

**Solution:**
```powershell
# Verify manager in PowerShell
Get-AzureADUserManager -ObjectId "employee@company.com"
```

### Issue: Direct Reports Not Showing
**Check:**
- User has direct reports in Azure AD?
- User role is Manager in the system?
- Graph API permissions granted?

**Solution:**
```powershell
# List direct reports
Get-AzureADUserDirectReport -ObjectId "manager@company.com"
```

### Issue: Wrong Manager Assigned
**Fix in Azure AD:**
1. Go to user profile
2. Edit → Manager field
3. Select correct manager
4. Save changes
5. User must re-login

## Best Practices

1. **Keep Azure AD Updated**
   - Regular audits of manager assignments
   - Update when organizational changes occur

2. **Use Groups for Departments**
   - Create department groups
   - Helps with department-wide policies

3. **Document Special Cases**
   - Executive approval routes
   - Cross-functional team arrangements

4. **Regular Testing**
   - Test approval flows quarterly
   - Verify hierarchy after org changes

## Advanced Configuration

### Custom Approval Rules
Edit `/apps/web/src/lib/organizational-hierarchy.ts`:

```typescript
// Allow skip-level approval
export function canManagerApprove(
  managerId: string,
  employeeId: string,
  allowSkipLevel: boolean = true
): boolean {
  // ... custom logic
}
```

### Department-Based Routing
```typescript
// Route by department instead of direct manager
if (employee.department === 'Sales' && manager.department === 'Sales') {
  return true; // Any sales manager can approve sales bookings
}
```

### Matrix Organization Support
For employees with multiple managers:
```typescript
// Support for dotted-line reporting
interface Employee {
  primaryManagerId: string;
  secondaryManagerIds: string[];
}
```

## API Reference

### Get Approval Chain
```
GET /api/hierarchy/approval-chain?employeeId=xxx
```
Returns list of managers up the hierarchy

### Check Approval Permission
```
POST /api/hierarchy/can-approve
Body: { employeeId, employeeEmail }
```
Returns whether current user can approve

### Get Direct Reports
```
GET /api/hierarchy/direct-reports
```
Returns list of user's direct reports

## Support

For hierarchy issues:
1. Verify Azure AD configuration
2. Check browser console logs
3. Test with Graph Explorer
4. Contact IT support with details