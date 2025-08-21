# SAML SSO Setup Guide for Car Booking System

## Overview
This guide will help you configure SAML Single Sign-On (SSO) with Microsoft Entra ID (Azure AD) for the Car Booking System.

## Prerequisites
- Access to Microsoft Azure Portal with Enterprise Application management permissions
- Car booking application deployed or running locally
- SSL certificate for production deployment

## Step 1: Azure AD Configuration

### 1.1 Create Enterprise Application
1. Login to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **Enterprise applications**
3. Click **New application** → **Create your own application**
4. Name: `Carbooking-SGS`
5. Select: **Integrate any other application you don't find in the gallery**
6. Click **Create**

### 1.2 Configure SAML Settings
1. In your application, go to **Single sign-on**
2. Select **SAML**
3. Configure the following:

#### Basic SAML Configuration
```
Identifier (Entity ID): https://carbooking-sgs.siamgs.co.th/saml/metadata
Reply URL (ACS URL): https://carbooking-sgs.siamgs.co.th/api/saml/acs
Sign on URL: https://carbooking-sgs.siamgs.co.th/login
Relay State: (Leave empty)
Logout URL: https://carbooking-sgs.siamgs.co.th/api/saml/logout
```

For local development, use:
```
Identifier (Entity ID): http://localhost:3001/saml/metadata
Reply URL (ACS URL): http://localhost:3001/api/saml/acs
Sign on URL: http://localhost:3001/login
Logout URL: http://localhost:3001/api/saml/logout
```

#### Attributes & Claims
Configure the following attribute mappings:

| Claim Name | Source Attribute |
|------------|-----------------|
| givenname | user.givenname |
| surname | user.surname |
| emailaddress | user.mail |
| name | user.userprincipalname |
| Unique User Identifier | user.userprincipalname |

### 1.3 Download Certificate
1. In **SAML Certificates** section
2. Download **Certificate (Base64)**
3. Save this certificate - you'll need it for the application configuration

### 1.4 Note Configuration Values
From the **Set up Carbooking-SGS** section, note:
- **Login URL**: `https://login.microsoftonline.com/ead30324-2c2a-42bf-9541-bf96019df2c6/saml2`
- **Azure AD Identifier**: `https://sts.windows.net/ead30324-2c2a-42bf-9541-bf96019df2c6/`
- **Logout URL**: `https://login.microsoftonline.com/ead30324-2c2a-42bf-9541-bf96019df2c6/saml2`

## Step 2: Application Configuration

### 2.1 Environment Variables
1. Copy `.env.saml.example` to `.env.local`:
```bash
cd apps/web
cp .env.saml.example .env.local
```

2. Edit `.env.local` and add:
```env
# SAML Identity Provider Certificate
# Open the downloaded certificate file, remove line breaks, and paste as single line
SAML_IDP_CERT=MIIC8DCCAdigAwIBAgIQMOUL6+dgpj....(your full certificate here)

# For local development
SAML_SP_ENTITY_ID=http://localhost:3001/saml/metadata
SAML_SP_ACS_URL=http://localhost:3001/api/saml/acs
SAML_SP_LOGOUT_URL=http://localhost:3001/api/saml/logout
SAML_SP_SIGNON_URL=http://localhost:3001/login
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Session secret (generate a random string)
SESSION_SECRET=your-random-32-character-string-here
```

### 2.2 Certificate Preparation
1. Open the downloaded certificate file in a text editor
2. Remove the header `-----BEGIN CERTIFICATE-----`
3. Remove the footer `-----END CERTIFICATE-----`
4. Remove all line breaks to make it a single line
5. Paste this value as `SAML_IDP_CERT` in your `.env.local`

## Step 3: Testing SAML SSO

### 3.1 Local Testing
1. Start the development server:
```bash
npm run dev
```

2. Navigate to http://localhost:3001/login

3. Click **"Sign in with Microsoft (SAML SSO)"**

4. You should be redirected to Microsoft login page

5. After successful authentication, you'll be redirected back to the application

### 3.2 Verify Metadata Endpoint
Visit: http://localhost:3001/api/saml/metadata

You should see XML metadata for your Service Provider configuration.

### 3.3 Troubleshooting

#### Common Issues:

**1. "Invalid SAML Response"**
- Ensure the certificate is correctly formatted (single line, no headers)
- Verify Reply URL matches exactly in Azure AD

**2. "User not found"**
- Check attribute mappings in Azure AD
- Verify user has required attributes (email, name)

**3. "Redirect loop"**
- Clear browser cookies
- Check session configuration

**4. "Certificate validation failed"**
- Ensure you're using the correct certificate
- Certificate might be expired - download a new one from Azure

## Step 4: Production Deployment

### 4.1 Update Environment Variables
For production, update your environment variables:

```env
# Production URLs
SAML_SP_ENTITY_ID=https://carbooking-sgs.siamgs.co.th/saml/metadata
SAML_SP_ACS_URL=https://carbooking-sgs.siamgs.co.th/api/saml/acs
SAML_SP_LOGOUT_URL=https://carbooking-sgs.siamgs.co.th/api/saml/logout
SAML_SP_SIGNON_URL=https://carbooking-sgs.siamgs.co.th/login
NEXT_PUBLIC_APP_URL=https://carbooking-sgs.siamgs.co.th

# Keep the same certificate and session secret
SAML_IDP_CERT=...
SESSION_SECRET=...
```

### 4.2 Update Azure AD URLs
In Azure Portal, update the SAML configuration URLs to use your production domain.

### 4.3 SSL Certificate
Ensure your production domain has a valid SSL certificate. SAML requires HTTPS in production.

## Step 5: User Management

### 5.1 Role Mapping
The application maps Azure AD attributes to user roles:
- Email containing "admin" → Admin role
- Email containing "hr" → HR role  
- Email containing "manager" → Manager role
- Others → Employee role

You can customize this in `/apps/web/src/lib/saml-auth.ts`

### 5.2 User Provisioning
Users are automatically created on first login via SAML with:
- Name from Azure AD profile
- Email from Azure AD
- Role based on email pattern

### 5.3 Session Management
- Sessions expire after 8 hours
- Users can logout via the application
- Logout redirects to Azure AD logout

## Step 6: Security Considerations

### 6.1 Best Practices
- ✅ Always use HTTPS in production
- ✅ Keep certificates secure and rotate regularly
- ✅ Use strong session secrets
- ✅ Implement proper CORS policies
- ✅ Validate all SAML responses
- ✅ Log authentication events for auditing

### 6.2 Certificate Rotation
When Azure AD certificate expires (Aug 20, 2028):
1. Download new certificate from Azure Portal
2. Update `SAML_IDP_CERT` in environment variables
3. Restart application

### 6.3 Monitoring
Monitor these endpoints:
- `/api/saml/metadata` - Should return XML
- `/api/saml/acs` - Receives SAML responses
- `/api/saml/logout` - Handles logout

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/saml/metadata` | GET | SP metadata XML |
| `/api/saml/login` | GET | Initiate SAML login |
| `/api/saml/acs` | POST | Assertion Consumer Service |
| `/api/saml/logout` | POST/GET | SAML logout |

## Support Contacts

- **Technical Issues**: IT Support Team
- **Certificate Updates**: phongsaton.v@gsbattery.co.th
- **Azure AD Admin**: Your Azure AD administrator

## Additional Resources

- [Microsoft SAML Documentation](https://docs.microsoft.com/en-us/azure/active-directory/manage-apps/configure-saml-single-sign-on)
- [SAML 2.0 Specification](https://docs.oasis-open.org/security/saml/v2.0/)
- [Passport-SAML Documentation](https://github.com/node-saml/passport-saml)

## Testing Checklist

- [ ] Metadata endpoint accessible
- [ ] Login redirects to Microsoft
- [ ] Successful authentication creates session
- [ ] User attributes correctly mapped
- [ ] Logout clears session
- [ ] Session persists across page refreshes
- [ ] Error handling works correctly
- [ ] Production URLs configured in Azure AD