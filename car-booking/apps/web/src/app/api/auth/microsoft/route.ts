import { NextRequest, NextResponse } from 'next/server';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { msalConfig, azureConfig, graphConfig } from '@/lib/azure-oauth-config';
import jwt from 'jsonwebtoken';
import type { User } from '@car-booking/types';

/**
 * GET /api/auth/azure/callback
 * Handles OAuth 2.0 callback from Azure AD
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    // Check for errors from Azure AD
    if (error) {
      console.error('Azure AD OAuth error:', error, error_description);
      return NextResponse.redirect(
        new URL(`/login?error=${error}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()
      );
    }

    // Validate state for CSRF protection
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!state || state !== storedState) {
      console.error('State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        new URL('/login?error=state_mismatch', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/login?error=no_code', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()
      );
    }

    // Initialize MSAL
    const cca = new ConfidentialClientApplication(msalConfig);

    // Exchange authorization code for tokens
    const tokenRequest = {
      code: code,
      scopes: azureConfig.scopes.default,
      redirectUri: azureConfig.endpoints.redirectUri,
    };

    console.log('Exchanging authorization code for tokens...');
    const tokenResponse = await cca.acquireTokenByCode(tokenRequest);

    if (!tokenResponse) {
      throw new Error('Failed to acquire tokens');
    }

    console.log('Successfully acquired tokens');

    // Get user information from Microsoft Graph
    let userProfile = null;
    try {
      const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (graphResponse.ok) {
        userProfile = await graphResponse.json();
        console.log('User profile from Graph API:', userProfile);
      }
    } catch (graphError) {
      console.error('Error fetching user profile from Graph:', graphError);
    }

    // Create user object from token claims and Graph API
    const idTokenClaims = tokenResponse.idTokenClaims as any;
    const user: User = {
      name: userProfile?.displayName || idTokenClaims?.name || 'Unknown User',
      email: userProfile?.mail || userProfile?.userPrincipalName || idTokenClaims?.preferred_username || '',
      role: determineUserRole(userProfile?.jobTitle, userProfile?.department),
    };

    console.log('Authenticated user:', user);

    // Create session data
    const sessionData = {
      user: user,
      accessToken: tokenResponse.accessToken,
      idToken: tokenResponse.idToken,
      expiresAt: new Date(Date.now() + (tokenResponse.expiresIn || 3600) * 1000).toISOString(),
      authMethod: 'oauth',
    };

    // Create JWT session token
    const sessionToken = jwt.sign(
      sessionData,
      process.env.SESSION_SECRET || 'your-session-secret',
      { expiresIn: '8h' }
    );

    // Redirect to home page with session
    const response = NextResponse.redirect(
      new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()
    );

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    // Set user info cookie for client-side access
    response.cookies.set('user_info', JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    return response;
  } catch (error: any) {
    console.error('Error in Azure AD OAuth callback:', error);
    
    return NextResponse.redirect(
      new URL('/login?error=oauth_callback_failed', 
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      ).toString()
    );
  }
}

/**
 * Determine user role based on job title and department
 */
function determineUserRole(jobTitle?: string, department?: string): 'Employee' | 'Manager' | 'HR' | 'Admin' {
  const title = (jobTitle || '').toLowerCase();
  const dept = (department || '').toLowerCase();

  if (title.includes('admin') || dept.includes('it')) {
    return 'Admin';
  } else if (title.includes('hr') || dept.includes('human')) {
    return 'HR';
  } else if (title.includes('manager') || title.includes('lead') || title.includes('supervisor')) {
    return 'Manager';
  }

  return 'Employee';
}