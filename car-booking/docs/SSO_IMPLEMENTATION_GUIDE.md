# SSO Implementation Guide for Car Booking System

## Current Status
- ✅ Microsoft Azure AD authentication routes configured
- ✅ LDAP authentication available
- ⚠️ Missing: Environment variables configuration
- ⚠️ Missing: Frontend SSO login button
- ⚠️ Missing: Session management

## Quick Start: Complete Microsoft Azure AD SSO

### Step 1: Azure AD App Registration

1. **Login to Azure Portal**
   - Navigate to: https://portal.azure.com
   - Go to: Azure Active Directory → App registrations → New registration

2. **Configure Application**
   ```
   Name: Car Booking System
   Supported account types: Single tenant (your organization only)
   Redirect URI: 
     - Platform: Web
     - URL: http://localhost:3001/api/auth/microsoft/callback
   ```

3. **After Registration, Note Down:**
   - Application (client) ID
   - Directory (tenant) ID

4. **Create Client Secret**
   - Go to: Certificates & secrets → New client secret
   - Description: Car Booking App Secret
   - Expires: 24 months
   - Copy the secret value immediately (shown only once)

5. **Configure API Permissions**
   - Go to: API permissions → Add a permission
   - Microsoft Graph → Delegated permissions:
     - User.Read
     - email
     - openid
     - profile
   - Click "Grant admin consent"

### Step 2: Configure Environment Variables

Create `.env.local` in `/apps/web/`:

```env
# Microsoft Azure AD
MICROSOFT_CLIENT_ID=your-application-client-id
MICROSOFT_TENANT_ID=your-directory-tenant-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value
MICROSOFT_REDIRECT_URI=http://localhost:3001/api/auth/microsoft/callback
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Session Secret (generate a random string)
NEXTAUTH_SECRET=generate-random-32-char-string
NEXTAUTH_URL=http://localhost:3001

# Database (if using for session storage)
DATABASE_URL=your-database-connection-string
```

### Step 3: Install Required Packages

```bash
cd apps/web
npm install @azure/msal-node next-auth@beta @auth/drizzle-adapter
```

### Step 4: Create SSO Login Component

Create `/apps/web/src/components/SSOLogin.tsx`:

```tsx
'use client';

import { Button } from '@car-booking/ui';
import { useState } from 'react';

export function SSOLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const handleMicrosoftLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/microsoft';
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleMicrosoftLogin}
        className="w-full"
      >
        {isLoading ? (
          'Redirecting...'
        ) : (
          <>
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="microsoft"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
            >
              <path
                fill="currentColor"
                d="M0 32h214.6v214.6H0V32zm233.4 0H448v214.6H233.4V32zM0 265.4h214.6V480H0V265.4zm233.4 0H448V480H233.4V265.4z"
              />
            </svg>
            Sign in with Microsoft
          </>
        )}
      </Button>
    </div>
  );
}
```

### Step 5: Update Login Page

Add SSO button to your login page:

```tsx
import { SSOLogin } from './SSOLogin';

export function LoginPage({ onLogin }: LoginPageProps) {
  // ... existing code ...

  return (
    <Card>
      {/* ... existing form ... */}
      
      <Separator className="my-6" />
      
      <SSOLogin />
    </Card>
  );
}
```

### Step 6: Test SSO Flow

1. Start your development server
2. Navigate to login page
3. Click "Sign in with Microsoft"
4. Authenticate with your Microsoft account
5. Get redirected back to your app with user session

## Alternative SSO Providers

### Option 1: Implement Multiple Providers with NextAuth.js

```typescript
// /apps/web/src/lib/auth.ts
import NextAuth from "next-auth"
import MicrosoftEntraID from "@auth/core/providers/microsoft-entra-id"
import Google from "@auth/core/providers/google"
import Okta from "@auth/core/providers/okta"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Okta({
      clientId: process.env.OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET,
      issuer: process.env.OKTA_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Map provider profile to your user roles
      if (account && profile) {
        token.role = mapProviderRoleToAppRole(profile);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
  },
})
```

### Option 2: SAML 2.0 Implementation

For enterprise SAML SSO:

```bash
npm install @node-saml/passport-saml
```

```typescript
// Configure SAML strategy
const samlStrategy = new SamlStrategy(
  {
    path: '/api/auth/saml/callback',
    entryPoint: 'https://your-idp.com/saml/sso',
    issuer: 'car-booking-app',
    cert: fs.readFileSync('./certs/idp-cert.pem', 'utf-8'),
  },
  (profile, done) => {
    // Handle user profile
    return done(null, profile);
  }
);
```

## Security Best Practices

### 1. Session Management
- Use secure, httpOnly cookies
- Implement session timeout (e.g., 8 hours)
- Support session revocation

### 2. Token Storage
```typescript
// Use encrypted JWT tokens
const token = jwt.sign(
  { userId, email, role },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

// Store in httpOnly cookie
response.cookies.set('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 8 * 60 * 60, // 8 hours
});
```

### 3. Role-Based Access Control (RBAC)
```typescript
// Middleware for route protection
export function withAuth(requiredRole?: string) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    
    if (!session) {
      return NextResponse.redirect('/login');
    }
    
    if (requiredRole && session.role !== requiredRole) {
      return NextResponse.redirect('/unauthorized');
    }
    
    return NextResponse.next();
  };
}
```

### 4. Audit Logging
```typescript
// Log authentication events
async function logAuthEvent(event: {
  type: 'login' | 'logout' | 'failed_login';
  userId?: string;
  email: string;
  ip: string;
  userAgent: string;
}) {
  await db.insert(auditLog).values({
    ...event,
    timestamp: new Date(),
  });
}
```

## Testing SSO

### Local Testing
1. Use ngrok for HTTPS tunnel: `ngrok http 3001`
2. Update redirect URI in Azure AD to ngrok URL
3. Test with real Microsoft accounts

### Test Scenarios
- [ ] New user registration via SSO
- [ ] Existing user login
- [ ] Role mapping from AD groups
- [ ] Session persistence
- [ ] Logout flow
- [ ] Token refresh
- [ ] Error handling (invalid credentials, network issues)

## Production Deployment

### 1. Update Environment Variables
```env
MICROSOFT_REDIRECT_URI=https://your-domain.com/api/auth/microsoft/callback
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

### 2. Azure AD Configuration
- Add production redirect URI
- Configure app roles in Azure AD
- Set up conditional access policies

### 3. Security Headers
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline';",
  },
];
```

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Ensure Azure AD redirect URI exactly matches your app
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **Token Expiration**
   - Implement token refresh logic
   - Handle expired sessions gracefully

3. **CORS Issues**
   - Configure CORS for your API routes
   - Add Microsoft domains to allowed origins

4. **User Role Mapping**
   - Verify AD group claims are included
   - Check job title mapping logic
   - Test with different user types

## Support & Resources

- [Microsoft Identity Platform Docs](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Next Steps

1. ✅ Complete Azure AD app registration
2. ✅ Configure environment variables
3. ✅ Test SSO login flow
4. ⬜ Implement session management
5. ⬜ Add role-based access control
6. ⬜ Set up audit logging
7. ⬜ Configure production deployment
8. ⬜ Perform security testing