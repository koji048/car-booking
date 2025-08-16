# GS Battery Car Booking System - Login Information

## Test URL
http://localhost:3001/ldap-test

## Test Accounts (Mock LDAP)

The system supports login with both username and full email formats:

### Admin Account
- **Username**: `thanakorn.c` or `thanakorn.c@gsbattery.co.th`
- **Password**: `Password123!`
- **Role**: Admin
- **Department**: IT

### Manager Account
- **Username**: `jane.manager` or `jane.manager@gsbattery.co.th`
- **Password**: `Manager123!`
- **Role**: Manager
- **Department**: Engineering

### HR Account
- **Username**: `hr.admin` or `hr.admin@gsbattery.co.th`
- **Password**: `HRAdmin123!`
- **Role**: HR
- **Department**: Human Resources

### Employee Account
- **Username**: `john.doe` or `john.doe@gsbattery.co.th`
- **Password**: `Password123!`
- **Role**: Employee
- **Department**: Engineering

## Authentication Features

1. **LDAP/Active Directory Integration**
   - Configured for Siam GS domain (DC=siamgs,DC=co,DC=th)
   - Server: 192.168.210.228:389
   - Falls back to mock LDAP in development mode

2. **Supported Login Formats**
   - Username only: `thanakorn.c`
   - Full email: `thanakorn.c@gsbattery.co.th`

3. **Role-Based Access Control**
   - Admin: Full system administration
   - Manager: Approve employee bookings
   - HR: Final approval for bookings
   - Employee: Create car bookings

4. **Session Management**
   - Sessions expire after 30 days
   - Secure token-based authentication
   - Automatic user provisioning on first login

## API Endpoints

### LDAP Authentication Endpoint
```bash
POST http://localhost:3005/api/auth/ldap
Content-Type: application/json

{
  "username": "thanakorn.c@gsbattery.co.th",
  "password": "Password123!"
}
```

### Response Format
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "thanakorn.c@gsbattery.co.th",
    "name": "Thanakorn C",
    "role": "admin",
    "department": "IT",
    "title": "System Administrator"
  },
  "session": {
    "id": "session-id",
    "token": "session-token",
    "expiresAt": "2025-09-14T09:00:00.000Z"
  }
}
```

## Testing Instructions

1. **Start the servers**:
   ```bash
   # Terminal 1 - Backend server (port 3005)
   cd apps/server
   npm run dev
   
   # Terminal 2 - Frontend app (port 3001)
   cd apps/web
   npm run dev
   ```

2. **Access the test page**: http://localhost:3001/ldap-test

3. **Login with any test account above**

4. **Navigation Flow**:
   - Login → My Bookings Page
   - My Bookings → Create New Booking → Car Booking Page
   - Car Booking → Submit → Back to My Bookings

## Production Configuration

When deploying to production with real Siam GS LDAP:

1. Set the LDAP admin password in `.env`:
   ```env
   LDAP_ADMIN_PASSWORD=ActualPasswordHere
   ```

2. Ensure network access to 192.168.210.228:389

3. Create required AD security groups:
   - Car-Booking-Admins
   - Car-Booking-Managers
   - Car-Booking-HR

4. Users will automatically be assigned roles based on their AD group membership