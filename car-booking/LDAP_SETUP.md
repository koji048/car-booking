# LDAP/Active Directory Authentication Setup

## Overview
This car booking system supports authentication via Microsoft Active Directory (LDAP), allowing users to sign in with their corporate credentials.

## Features
- **Single Sign-On (SSO)**: Users authenticate with their AD credentials
- **Automatic Role Assignment**: Roles are mapped from AD security groups
- **User Provisioning**: New users are automatically created on first login
- **Fallback Authentication**: Demo mode available when LDAP is unavailable

## Configuration

### 1. Environment Variables
Add these to your `.env` file in `apps/server/`:

```env
# LDAP/Active Directory Configuration
LDAP_URL=ldap://dc.company.local:389
LDAP_BASE_DN=DC=company,DC=local
LDAP_ADMIN_DN=CN=Service Account,CN=Users,DC=company,DC=local
LDAP_ADMIN_PASSWORD=service_account_password
LDAP_SEARCH_FILTER=(&(objectClass=user)(sAMAccountName={{username}}))
```

### 2. Active Directory Groups
Create these security groups in AD for role-based access:

- `Car-Booking-Admins` → Admin role
- `Car-Booking-Managers` → Manager role  
- `Car-Booking-HR` → HR role
- `Domain Users` → Employee role (default)

### 3. Service Account
Create a service account in AD with read permissions:
- Username: `Service Account`
- Password: Set a secure password
- Permissions: Read access to user objects

## Testing

### Test with Mock LDAP (Development)
The system includes mock LDAP authentication for testing:

1. Navigate to: http://localhost:3001/ldap-test
2. Use these test credentials:

| Username | Password | Role |
|----------|----------|------|
| john.doe | Password123! | Employee |
| jane.manager | Manager123! | Manager |
| hr.admin | HRAdmin123! | HR |
| sys.admin | Admin123! | Admin |

### Test with Real LDAP
1. Configure your LDAP server details in `.env`
2. Ensure the server is accessible from your application
3. Login with your AD username (without domain)

## Authentication Flow

1. User enters AD username and password
2. System connects to LDAP server using service account
3. Searches for user in Active Directory
4. Validates user credentials
5. Retrieves user groups and attributes
6. Maps AD groups to application roles
7. Creates/updates user in local database
8. Establishes session

## Security Considerations

- **SSL/TLS**: Use `ldaps://` for production (port 636)
- **Service Account**: Use minimal permissions
- **Password Policy**: Enforce AD password policies
- **Network Security**: Restrict LDAP access to application servers
- **Audit Logging**: Monitor authentication attempts

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check LDAP server URL and port
   - Verify network connectivity
   - Check firewall rules

2. **Authentication Failed**
   - Verify service account credentials
   - Check user search filter
   - Ensure user exists in AD

3. **Role Not Assigned**
   - Check AD group membership
   - Verify group DN mappings
   - Review group search configuration

### Debug Mode
Enable debug logging in `apps/server/src/lib/ldap-auth.ts`:
```typescript
console.log('LDAP Debug:', {
  url: ldapConfig.url,
  baseDN: ldapConfig.baseDN,
  searchFilter: searchFilter
});
```

## API Endpoints

### LDAP Authentication
```
POST /api/auth/ldap
Content-Type: application/json

{
  "username": "john.doe",
  "password": "userPassword"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "john.doe@company.com",
    "name": "John Doe",
    "role": "Employee",
    "department": "Engineering",
    "title": "Software Engineer"
  }
}
```

## Production Deployment

1. **Use LDAPS (Secure LDAP)**:
   ```env
   LDAP_URL=ldaps://dc.company.local:636
   ```

2. **Configure Certificate**:
   ```typescript
   const client = ldap.createClient({
     url: ldapConfig.url,
     tlsOptions: {
       rejectUnauthorized: true,
       ca: [fs.readFileSync('path/to/ca-cert.pem')]
     }
   });
   ```

3. **Enable Connection Pooling**:
   ```typescript
   reconnect: true,
   idleTimeout: 60000,
   connectTimeout: 10000
   ```

4. **Implement Rate Limiting**:
   - Limit authentication attempts per user
   - Implement account lockout policies

## Support
For issues with LDAP configuration, contact:
- IT Support: ext. 1234
- System Administrator: sys.admin@company.com