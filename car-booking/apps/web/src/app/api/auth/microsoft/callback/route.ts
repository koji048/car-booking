import { NextRequest, NextResponse } from 'next/server';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { msalConfig, azureConfig } from '@/lib/azure-oauth-config';
import { determineUserRole, isAdminEmail } from '@/lib/azure-role-config';
import { fetchUserManager, fetchDirectReports } from '@/lib/organizational-hierarchy';
import { determineRoleFromAppRoles, parseRolesFromClaims } from '@/lib/azure-app-roles';
import * as jwt from 'jsonwebtoken';

/**
 * GET /api/auth/microsoft/callback
 * Handles OAuth callback from Azure AD
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check for errors from Azure AD
    if (error) {
      console.error('Azure AD Error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=no_code', request.url)
      );
    }

    // Verify state to prevent CSRF attacks
    const cookies = request.cookies;
    const storedState = cookies.get('oauth_state')?.value;
    
    if (!storedState || storedState !== state) {
      console.error('State mismatch:', { storedState, receivedState: state });
      return NextResponse.redirect(
        new URL('/login?error=state_mismatch', request.url)
      );
    }

    // Create MSAL instance
    const cca = new ConfidentialClientApplication(msalConfig);

    // Exchange authorization code for tokens
    const tokenRequest = {
      code: code,
      scopes: azureConfig.scopes.default,
      redirectUri: azureConfig.endpoints.redirectUri,
    };

    console.log('Exchanging code for tokens...');
    const tokenResponse = await cca.acquireTokenByCode(tokenRequest);
    
    if (!tokenResponse) {
      throw new Error('Failed to acquire token');
    }

    console.log('Token acquired successfully');
    console.log('User info:', tokenResponse.account);

    // Check for app roles in ID token first
    const idTokenClaims = tokenResponse.idTokenClaims || {};
    const appRoles = parseRolesFromClaims(idTokenClaims);
    console.log('App roles from token:', appRoles);

    // Fetch user's groups from Microsoft Graph API to determine role
    const userEmail = tokenResponse.account?.username || '';
    let groups: any[] = [];
    
    try {
      // Get user's groups/roles from Graph API
      const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (graphResponse.ok) {
        const groupData = await graphResponse.json();
        groups = groupData.value || [];
        console.log('User groups:', groups.map(g => ({
          id: g.id,
          displayName: g.displayName
        })));
      } else {
        console.log('Graph API response:', graphResponse.status, await graphResponse.text());
      }
    } catch (graphError) {
      console.log('Could not fetch user groups (may need Directory.Read.All permission):', graphError);
      // Continue with role determination based on email
    }

    // Determine user role - prefer app roles over groups
    let userRole: string;
    
    if (appRoles.length > 0) {
      // Use app roles if available (more secure and efficient)
      userRole = determineRoleFromAppRoles(appRoles);
      console.log('Role determined from app roles');
    } else {
      // Fallback to group-based role determination
      userRole = determineUserRole(groups, userEmail);
      console.log('Role determined from groups (app roles not configured)');
    }
    
    // Check for admin email override
    if (isAdminEmail(userEmail)) {
      userRole = 'Admin';
      console.log('Admin role assigned based on email override');
    }

    console.log(`User ${userEmail} assigned role: ${userRole}`);

    // Fetch organizational hierarchy
    let managerInfo = null;
    let directReports = [];
    
    try {
      // Fetch user's manager
      managerInfo = await fetchUserManager(tokenResponse.accessToken);
      if (managerInfo) {
        console.log('User manager:', {
          id: managerInfo.id,
          name: managerInfo.displayName,
          email: managerInfo.mail || managerInfo.userPrincipalName
        });
      }

      // Fetch direct reports (for managers)
      if (userRole === 'Manager' || userRole === 'Admin') {
        directReports = await fetchDirectReports(tokenResponse.accessToken);
        console.log(`User has ${directReports.length} direct reports`);
      }
    } catch (hierarchyError) {
      console.log('Could not fetch organizational hierarchy:', hierarchyError);
      // Continue without hierarchy data
    }

    // Create session data with organizational info
    const sessionData = {
      user: {
        name: tokenResponse.account?.name || 'Unknown User',
        email: userEmail,
        id: tokenResponse.account?.homeAccountId || '',
        azureId: tokenResponse.account?.localAccountId || '', // Azure AD object ID
        role: userRole,
        managerId: managerInfo?.id,
        managerEmail: managerInfo?.mail || managerInfo?.userPrincipalName,
        managerName: managerInfo?.displayName,
        directReportIds: directReports.map((r: any) => r.id),
        directReportCount: directReports.length,
      },
      accessToken: tokenResponse.accessToken,
      idToken: tokenResponse.idToken,
      expiresAt: tokenResponse.expiresOn?.getTime() || Date.now() + 3600000,
    };

    // Create JWT session token
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      throw new Error('SESSION_SECRET not configured');
    }

    const sessionToken = jwt.sign(sessionData, sessionSecret, {
      expiresIn: '8h',
    });

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    // Set user info cookie for client-side access
    response.cookies.set('user_info', JSON.stringify({
      name: sessionData.user.name,
      email: sessionData.user.email,
      role: sessionData.user.role,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    console.log('Authentication successful, redirecting to home page');
    return response;

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, request.url)
    );
  }
}