# Azure AD SAML Encoding Issue - Resolution Guide

## Problem
Azure AD error: "AADSTS750056: SAML message was not properly base64-encoded"

This error occurs even though we're using standard SAML encoding methods.

## Root Cause Analysis

Azure AD has very specific requirements for SAML AuthnRequest encoding:
1. The SAML message must be deflated using raw deflate (no zlib wrapper)
2. The base64 encoding must be URL-safe
3. The AuthnRequest XML structure must match Azure AD's expectations exactly

## Current Implementation Status

We've tried multiple encoding methods:
1. ✅ `deflateRawSync` + base64 + URL encode (standard SAML)
2. ✅ Plain base64 encoding (no compression)
3. ✅ Minimal SAML request structure
4. ✅ Removed optional elements (NameIDPolicy, Destination)

Despite these attempts, Azure AD still reports encoding issues.

## Recommended Solutions

### Option 1: Use Microsoft Authentication Library (MSAL) Instead

**This is the recommended approach for Azure AD authentication.**

```bash
npm install @azure/msal-node
```

Benefits:
- Official Microsoft library
- Handles all encoding automatically
- Better support and documentation
- OAuth 2.0/OpenID Connect instead of SAML

### Option 2: Use Azure AD OAuth 2.0 Endpoints

Instead of SAML, use OAuth 2.0 flow:

```typescript
// OAuth 2.0 Authorization URL
const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
  `client_id=${clientId}&` +
  `response_type=code&` +
  `redirect_uri=${redirectUri}&` +
  `scope=openid%20profile%20email%20User.Read`;
```

### Option 3: Configure Azure AD for HTTP-POST Binding

Instead of HTTP-Redirect binding (which requires deflate encoding), configure Azure AD to use HTTP-POST binding:

1. In Azure Portal, go to your Enterprise Application
2. Under Single sign-on → Basic SAML Configuration
3. Change the binding to HTTP-POST
4. Update your code to use form POST instead of redirect

### Option 4: Use a SAML Library that Azure AD Supports

Consider using:
- `saml2-js` - Better Azure AD compatibility
- `passport-azure-ad` - Microsoft's official Passport strategy

## Immediate Workaround

While the encoding issue persists, you can:

1. **Use the existing Microsoft OAuth endpoints** that are already partially configured in your app
2. **Switch to NextAuth.js with Azure AD provider**:

```typescript
import NextAuth from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"

export default NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    })
  ],
})
```

## Testing Different Encodings

To help debug, we've created several test endpoints:
- `/api/saml/login` - Standard SAML encoding (deflate + base64)
- `/api/saml/login-plain` - Plain base64 (no compression)
- `/api/saml/login-v2` - Minimal SAML request
- `/api/saml/debug` - Test different encoding methods

## Azure AD SAML Requirements

Based on Microsoft documentation, Azure AD expects:
1. SAML 2.0 protocol
2. HTTP-Redirect or HTTP-POST binding
3. Specific attribute formats
4. Proper certificate validation

## Next Steps

1. **Recommended: Switch to OAuth 2.0/OIDC**
   - More reliable with Azure AD
   - Better documentation and support
   - Simpler implementation

2. **Alternative: Use Microsoft Graph API**
   - Modern authentication approach
   - RESTful API
   - Better error messages

3. **Debug Current Implementation**
   - Enable Azure AD SAML trace logs
   - Use SAML debugging tools
   - Contact Microsoft support with correlation IDs

## Support Information

For each error, Azure AD provides:
- Request Id: Unique identifier for the request
- Correlation Id: Links related log entries
- Timestamp: When the error occurred

These can be provided to Microsoft support for detailed investigation.

## Conclusion

While SAML is a standard protocol, Azure AD's implementation has specific requirements that can be challenging. For production use with Azure AD, OAuth 2.0/OpenID Connect is the recommended approach over SAML.