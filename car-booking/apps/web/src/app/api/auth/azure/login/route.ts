import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/azure-oauth-config';
import crypto from 'crypto';

/**
 * GET /api/auth/azure/login
 * Initiates OAuth 2.0 login flow with Azure AD
 */
export async function GET(request: NextRequest) {
  try {
    // Generate a random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in cookie for validation during callback
    const authUrl = getAuthorizationUrl(state);
    
    const response = NextResponse.redirect(authUrl);
    
    // Set state cookie for CSRF protection
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    });
    
    console.log('Redirecting to Azure AD OAuth:', authUrl);
    
    return response;
  } catch (error) {
    console.error('Error initiating Azure AD OAuth login:', error);
    
    return NextResponse.redirect(
      new URL('/login?error=oauth_init_failed', 
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      ).toString()
    );
  }
}