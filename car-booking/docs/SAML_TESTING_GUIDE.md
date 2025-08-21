# SAML SSO Testing Guide

## ✅ Fixed: SAML AuthnRequest Implementation

The error "AADSTS750054: SAMLRequest or SAMLResponse must be present" has been resolved. The SAML login flow now properly generates and sends a SAML AuthnRequest to Azure AD.

## What Was Fixed

1. **Proper SAML AuthnRequest Generation**
   - Creates valid SAML 2.0 XML request
   - Includes all required attributes (ID, Version, IssueInstant, etc.)
   - Specifies correct NameID format and authentication context

2. **HTTP-Redirect Binding Implementation**
   - Deflates the SAML request using zlib
   - Base64 encodes the compressed data
   - URL encodes for safe transmission
   - Appends as SAMLRequest query parameter

## Testing Steps

### 1. Test SAML Login Flow

Navigate to: http://localhost:3001/login

Click: "Sign in with Microsoft (SAML SSO)"

Expected behavior:
- You'll be redirected to Microsoft login page
- URL will contain `SAMLRequest` parameter
- After authentication, you'll be redirected back to the app

### 2. Verify SAML Request (Optional)

To inspect the SAML request being sent:

1. Open browser developer tools (F12)
2. Go to Network tab
3. Click the SAML login button
4. Look for redirect to `login.microsoftonline.com`
5. Copy the `SAMLRequest` parameter value
6. Decode using online SAML decoder

### 3. Test Metadata Endpoint

Visit: http://localhost:3001/api/saml/metadata

You should see XML metadata for your Service Provider.

## Common Issues and Solutions

### Issue: "Certificate validation failed"

**Solution:** You need to add the Azure AD certificate to your environment:

1. Download certificate from Azure Portal
2. Remove headers/footers and line breaks
3. Add to `.env.local`:
```env
SAML_IDP_CERT=MIIDdzCCAl+gAwIBAgI...
```

### Issue: "Reply URL mismatch"

**Solution:** Ensure Azure AD configuration matches exactly:
- Development: `http://localhost:3001/api/saml/acs`
- Production: `https://carbooking-sgs.siamgs.co.th/api/saml/acs`

### Issue: "User attributes not mapping"

**Solution:** Check Azure AD attribute claims configuration:
- givenname → user.givenname
- surname → user.surname
- emailaddress → user.mail
- name → user.userprincipalname

## Debug Mode

To enable detailed SAML debugging, you can:

1. Check browser console for SAML-related logs
2. Check server logs in terminal running `npm run dev`
3. Use browser network tab to inspect requests/responses

## Test Scenarios

- [ ] New user first-time login
- [ ] Existing user re-authentication
- [ ] Session persistence after login
- [ ] Logout flow
- [ ] Error handling (invalid credentials)
- [ ] Session timeout handling

## Production Readiness Checklist

- [ ] Certificate added to environment variables
- [ ] Production URLs configured in Azure AD
- [ ] HTTPS enabled on production server
- [ ] Session management configured
- [ ] Error logging enabled
- [ ] Audit logging for authentication events

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review server logs for SAML processing errors
3. Verify Azure AD configuration matches exactly
4. Ensure certificate is properly formatted