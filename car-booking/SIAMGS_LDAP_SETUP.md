# Siam GS - Car Booking System LDAP Configuration

## Active Directory Server Details

- **Server IP**: 192.168.210.228
- **Port**: 389 (LDAP)
- **Base DN**: DC=siamgs,DC=co,DC=th
- **Admin Account**: CN=Admin carbooking,OU=IT,OU=Siamgs User,DC=siamgs,DC=co,DC=th

## Configuration Steps

### 1. Update Environment Variables

Add the admin password to `/apps/server/.env`:
```env
LDAP_ADMIN_PASSWORD=YourActualPasswordHere
```

### 2. Active Directory Groups Setup

Create these security groups in Siam GS Active Directory:

| Group Name | Distinguished Name | Role |
|------------|-------------------|------|
| Car-Booking-Admins | CN=Car-Booking-Admins,OU=Groups,DC=siamgs,DC=co,DC=th | Admin |
| Car-Booking-Managers | CN=Car-Booking-Managers,OU=Groups,DC=siamgs,DC=co,DC=th | Manager |
| Car-Booking-HR | CN=Car-Booking-HR,OU=Groups,DC=siamgs,DC=co,DC=th | HR |

### 3. User Account Structure

Users should be in the following OU structure:
- **Siamgs User** (OU)
  - **IT** (OU) - IT department users
  - **HR** (OU) - HR department users
  - **Finance** (OU) - Finance department users
  - **Operations** (OU) - Operations department users

## Testing Connection

### 1. Test LDAP Connection
```bash
# Test from command line (requires ldapsearch)
ldapsearch -x -H ldap://192.168.210.228:389 \
  -D "CN=Admin carbooking,OU=IT,OU=Siamgs User,DC=siamgs,DC=co,DC=th" \
  -w "YourPassword" \
  -b "DC=siamgs,DC=co,DC=th" \
  "(sAMAccountName=testuser)"
```

### 2. Test via Application
1. Start the server:
   ```bash
   cd apps/server
   npm run dev
   ```

2. Start the web app:
   ```bash
   cd apps/web
   npm run dev
   ```

3. Navigate to: http://localhost:3001/ldap-test

4. Login with Siam GS credentials:
   - Username: Your AD username (e.g., `john.doe`)
   - Password: Your AD password

## User Login Flow

1. User enters Siam GS username (without @siamgs.co.th)
2. System authenticates against 192.168.210.228
3. Retrieves user information and group membership
4. Assigns role based on AD group membership
5. Creates/updates user in local database

## Role Assignment

Users will be assigned roles based on their AD group membership:

| AD Group | Application Role | Access Level |
|----------|-----------------|--------------|
| Car-Booking-Admins | Admin | Full system administration |
| Car-Booking-Managers | Manager | Approve employee bookings |
| Car-Booking-HR | HR | Final approval for bookings |
| Domain Users (default) | Employee | Create car bookings |

## Security Considerations

1. **Network Access**: Ensure the application server can reach 192.168.210.228:389
2. **Firewall Rules**: Open port 389 between app server and AD server
3. **Service Account**: The "Admin carbooking" account should have minimal read-only permissions
4. **Password Security**: Never commit the LDAP password to source control

## Troubleshooting

### Common Issues and Solutions

1. **"Connection refused" error**
   - Check if 192.168.210.228 is reachable: `ping 192.168.210.228`
   - Verify port 389 is open: `telnet 192.168.210.228 389`
   - Check firewall rules

2. **"Invalid credentials" error**
   - Verify the Admin carbooking password
   - Check if account is not locked in AD
   - Ensure account has read permissions

3. **"User not found" error**
   - Verify user exists in AD
   - Check if user is in the correct OU
   - Verify search filter syntax

4. **Role not assigned correctly**
   - Check user's group membership in AD
   - Verify group DN mappings in ldap-config.ts
   - Check if groups exist in AD

## Production Deployment

### For Production Environment:

1. **Use LDAPS (Secure LDAP)** if available:
   ```env
   LDAP_URL=ldaps://192.168.210.228:636
   ```

2. **Implement Connection Pooling**:
   - Already configured in ldap-config.ts
   - Adjust timeout values if needed

3. **Enable Logging**:
   ```typescript
   // In ldap-auth.ts
   console.log('LDAP Auth:', {
     server: '192.168.210.228',
     user: username,
     timestamp: new Date()
   });
   ```

4. **Monitor Authentication**:
   - Track failed login attempts
   - Alert on service account issues
   - Monitor LDAP server availability

## Support Contacts

For LDAP/AD issues at Siam GS:
- IT Department: OU=IT,OU=Siamgs User
- Admin Account: Admin carbooking

## Testing Without LDAP Access

If you cannot connect to the Siam GS LDAP server, the system will automatically fall back to mock authentication with these test accounts:

| Username | Password | Role |
|----------|----------|------|
| john.doe | Password123! | Employee |
| jane.manager | Manager123! | Manager |
| hr.admin | HRAdmin123! | HR |
| sys.admin | Admin123! | Admin |

This allows development and testing without VPN or network access to the Siam GS domain.