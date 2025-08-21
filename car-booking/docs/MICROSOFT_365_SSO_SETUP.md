# Microsoft 365 Single Sign-On Setup Guide

## Prerequisites
To enable Microsoft 365 SSO for the Car Booking System, you need:
1. Azure Active Directory (Azure AD) tenant
2. Admin access to register applications in Azure AD
3. Microsoft 365 licenses for users

## Step 1: Register Application in Azure AD

1. **Go to Azure Portal**
   - Navigate to: https://portal.azure.com
   - Sign in with your admin account

2. **Register New Application**
   - Go to: Azure Active Directory → App registrations → New registration
   - Fill in:
     - **Name**: `Car Booking System - Siam GS`
     - **Supported account types**: 
       - Select: "Accounts in this organizational directory only (Siam GS only - Single tenant)"
     - **Redirect URI**: 
       - Platform: Web
       - URI: `http://localhost:3005/api/auth/microsoft/callback`
       - For production add: `https://carbooking.siamgs.co.th/api/auth/microsoft/callback`

3. **Note the Application IDs**
   After registration, copy these values:
   - **Application (client) ID**: `<your-client-id>`
   - **Directory (tenant) ID**: `<your-tenant-id>`

## Step 2: Configure Authentication

1. **Add Authentication Settings**
   - In your app registration, go to: Authentication
   - Add platform: Web
   - Add redirect URIs:
     ```
     http://localhost:3005/api/auth/microsoft/callback
     http://localhost:3001/auth/callback
     https://carbooking.siamgs.co.th/api/auth/microsoft/callback
     ```
   - Enable: 
     - ✅ Access tokens
     - ✅ ID tokens
   - Supported account types: Single tenant

2. **Create Client Secret**
   - Go to: Certificates & secrets → New client secret
   - Description: `Car Booking System Secret`
   - Expires: 24 months (or as per your policy)
   - **Copy the secret value immediately** (it won't be shown again)

## Step 3: Configure API Permissions

1. **Add Required Permissions**
   - Go to: API permissions → Add a permission
   - Select: Microsoft Graph
   - Select: Delegated permissions
   - Add these permissions:
     ```
     - User.Read (Sign in and read user profile)
     - User.ReadBasic.All (Read all users' basic profiles)
     - email
     - openid
     - profile
     - offline_access (Maintain access to data)
     ```

2. **Grant Admin Consent**
   - Click: "Grant admin consent for Siam GS"
   - Confirm the consent

## Step 4: Update Environment Variables

Add these to your `.env` file in `apps/server/`:

```env
# Microsoft 365 OAuth Configuration
MICROSOFT_CLIENT_ID=<your-client-id>
MICROSOFT_CLIENT_SECRET=<your-client-secret>
MICROSOFT_TENANT_ID=<your-tenant-id>
MICROSOFT_REDIRECT_URI=http://localhost:3005/api/auth/microsoft/callback

# For production, use:
# MICROSOFT_REDIRECT_URI=https://carbooking.siamgs.co.th/api/auth/microsoft/callback
```

## Step 5: Configure Token Settings (Optional)

1. **Token Configuration**
   - Go to: Token configuration → Add optional claim
   - Token type: ID
   - Add claims:
     - email
     - family_name
     - given_name
     - upn (User Principal Name)

## Step 6: Test the Integration

1. **Local Testing**
   ```bash
   # Start the server
   cd apps/server
   npm run dev
   
   # Start the web app
   cd apps/web
   npm run dev
   ```

2. **Test SSO Flow**
   - Navigate to: http://localhost:3001
   - Click "Sign in with Microsoft 365"
   - You'll be redirected to Microsoft login
   - Enter your @siamgs.co.th or @gsbattery.co.th credentials
   - Approve permissions if prompted
   - You'll be redirected back and logged in

## Microsoft OAuth 2.0 Flow

1. **User clicks "Sign in with Microsoft 365"**
2. **Redirect to Microsoft**:
   ```
   https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?
     client_id={client_id}
     &response_type=code
     &redirect_uri={redirect_uri}
     &scope=openid profile email User.Read
     &state={state}
   ```

3. **User authenticates with Microsoft**
4. **Microsoft redirects back with authorization code**
5. **Exchange code for tokens**
6. **Get user profile from Microsoft Graph**
7. **Create session in application**

## Security Considerations

1. **Client Secret**: 
   - Never commit to source control
   - Rotate regularly (every 12-24 months)
   - Use Azure Key Vault in production

2. **Redirect URIs**:
   - Only add trusted URIs
   - Use HTTPS in production
   - Validate state parameter to prevent CSRF

3. **Token Storage**:
   - Store tokens securely
   - Use refresh tokens for long-lived sessions
   - Implement token refresh logic

4. **Permissions**:
   - Request minimal permissions needed
   - Review permissions regularly
   - Remove unused permissions

## Troubleshooting

### Common Issues:

1. **"AADSTS50011: Reply URL mismatch"**
   - Ensure redirect URI in code matches exactly in Azure AD
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **"AADSTS700016: Application not found"**
   - Verify client ID is correct
   - Check tenant ID
   - Ensure app registration is in correct tenant

3. **"AADSTS50058: Silent sign-in failed"**
   - User needs to authenticate interactively
   - Clear browser cookies
   - Check conditional access policies

4. **"AADSTS65001: User or admin has not consented"**
   - Grant admin consent in Azure AD
   - Check API permissions
   - Verify user has necessary licenses

## Production Deployment

1. **Update Redirect URIs**:
   - Add production URLs in Azure AD
   - Update environment variables

2. **Configure Custom Domain**:
   - Use your organization's domain
   - Ensure SSL certificate is valid

3. **Enable Monitoring**:
   - Set up Azure AD sign-in logs
   - Monitor failed authentication attempts
   - Track token refresh failures

## Support

For Azure AD issues:
- Microsoft Support: https://azure.microsoft.com/support/
- Azure AD Documentation: https://docs.microsoft.com/azure/active-directory/

For application issues:
- IT Support: Contact Siam GS IT Department
- Admin: thanakorn.c@gsbattery.co.th