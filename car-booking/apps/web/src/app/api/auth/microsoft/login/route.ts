import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/azure-oauth-config';
import * as crypto from 'crypto';

/**
 * GET /api/auth/microsoft/login
 * Redirects to Azure AD OAuth login
 */
export async function GET() {
  try {
    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Get authorization URL
    const authUrl = getAuthorizationUrl(state);
    
    console.log('Redirecting to Azure AD OAuth:', authUrl);
    
    // Create response with redirect
    const response = NextResponse.redirect(authUrl);
    
    // Store state in cookie for verification
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('OAuth login error:', error);
    return NextResponse.redirect('/login?error=oauth_init_failed');
  }
}