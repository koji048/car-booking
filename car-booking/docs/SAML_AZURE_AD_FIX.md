# SAML Azure AD Authentication Fix

## Problem Summary
Azure AD error: "AADSTS750056: SAML message was not properly base64-encoded"

## Root Cause
Azure AD has strict requirements for SAML AuthnRequest encoding:
1. Must use deflate compression (not gzip)
2. Must be properly base64 encoded
3. Must be URL encoded for query parameter

## Solution Implemented

### 1. Direct SAML Request Generation
Instead of relying on passport-saml's internal methods (which have changed in v5), we generate the SAML AuthnRequest directly:

```typescript
// Generate proper SAML 2.0 AuthnRequest
const authRequest = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ...>
  <saml:Issuer>...</saml:Issuer>
  <samlp:NameIDPolicy Format="..." AllowCreate="true"/>
</samlp:AuthnRequest>`;

// Compress using deflateRaw (required by Azure AD)
const deflated = zlib.deflateRawSync(Buffer.from(authRequest));

// Base64 encode
const base64 = deflated.toString('base64');

// URL encode for query parameter
const encoded = encodeURIComponent(base64);
```

### 2. Configuration Updates
- Added dummy certificate for request generation (not validation)
- Updated `validateInResponseTo` to use string value ('never' instead of false)
- Added both `cert` and `idpCert` parameters for compatibility

## Current Status

### Working:
✅ SAML metadata endpoint: `/api/saml/metadata`
✅ SAML AuthnRequest generation
✅ Proper encoding for Azure AD

### Pending:
⚠️ Need actual Azure AD certificate for response validation
⚠️ ACS endpoint needs certificate to validate SAML responses

## Next Steps

### 1. Add Azure AD Certificate

Download the certificate from Azure Portal and add to `.env.local`:

```bash
# Remove headers, footers, and line breaks from certificate
SAML_IDP_CERT=MIIDdzCCAl+gAwIBAgI...
```

### 2. Test Authentication Flow

1. Navigate to: http://localhost:3001/login
2. Click: "Sign in with Microsoft (SAML SSO)"
3. Authenticate with Azure AD
4. Should redirect back to `/api/saml/acs`

### 3. Production Configuration

Update URLs in `.env.local` for production:
```env
SAML_SP_ENTITY_ID=https://carbooking-sgs.siamgs.co.th/saml/metadata
SAML_SP_ACS_URL=https://carbooking-sgs.siamgs.co.th/api/saml/acs
SAML_SP_LOGOUT_URL=https://carbooking-sgs.siamgs.co.th/api/saml/logout
SAML_SP_SIGNON_URL=https://carbooking-sgs.siamgs.co.th/login
NEXT_PUBLIC_APP_URL=https://carbooking-sgs.siamgs.co.th
```

## Alternative Approaches

If issues persist, consider:

1. **Use Microsoft Graph SDK** instead of SAML:
   - Simpler implementation
   - Better Microsoft integration
   - OAuth 2.0 flow

2. **Use NextAuth.js with Azure AD Provider**:
   - Built-in Azure AD support
   - Handles all OAuth/OIDC complexity
   - Better session management

3. **Use Azure AD B2C**:
   - More flexible authentication flows
   - Built-in user management
   - Custom policies support

## Troubleshooting

### Common Errors and Solutions:

1. **"SAMLRequest must be present"**
   - Ensure SAMLRequest is added as query parameter
   - Check URL encoding

2. **"SAML message not properly base64-encoded"**
   - Use deflateRawSync (not deflateSync)
   - Ensure proper base64 encoding
   - Check URL encoding of base64 string

3. **"Reply URL mismatch"**
   - Verify ACS URL in Azure AD matches exactly
   - Check for trailing slashes
   - Ensure protocol (http/https) matches

4. **"Certificate validation failed"**
   - Add Azure AD certificate to environment
   - Ensure certificate is properly formatted
   - Check certificate expiration date