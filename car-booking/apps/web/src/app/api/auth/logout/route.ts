import { NextRequest, NextResponse } from 'next/server';
import { getLogoutUrl } from '@/lib/azure-oauth-config';

/**
 * POST /api/auth/logout
 * Handles user logout - clears session and optionally redirects to Azure AD logout
 */
export async function POST(request: NextRequest) {
  try {
    const { logoutFromAzure = true } = await request.json().catch(() => ({}));
    
    // Create response
    let response: NextResponse;
    
    if (logoutFromAzure) {
      // Redirect to Azure AD logout URL
      const azureLogoutUrl = getLogoutUrl();
      response = NextResponse.json({ 
        success: true, 
        redirectUrl: azureLogoutUrl 
      });
    } else {
      // Just clear local session and redirect to login
      response = NextResponse.json({ 
        success: true,
        redirectUrl: null // Don't redirect via window.location, let React handle it
      });
    }
    
    // Clear all authentication cookies
    response.cookies.delete('session');
    response.cookies.delete('user_info');
    response.cookies.delete('oauth_state');
    
    // Clear any SAML-related cookies if they exist
    response.cookies.delete('saml_session');
    
    console.log('User logged out successfully');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 * Alternative logout endpoint that redirects directly
 */
export async function GET(request: NextRequest) {
  try {
    // Get logout preference from query params
    const searchParams = request.nextUrl.searchParams;
    const logoutFromAzure = searchParams.get('azure') !== 'false';
    
    let redirectUrl = '/login';
    
    if (logoutFromAzure) {
      // Get Azure AD logout URL
      redirectUrl = getLogoutUrl();
    }
    
    // Create redirect response
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    
    // Clear all authentication cookies
    response.cookies.delete('session');
    response.cookies.delete('user_info');
    response.cookies.delete('oauth_state');
    response.cookies.delete('saml_session');
    
    console.log('User logged out via GET request');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback to login page on error
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    response.cookies.delete('user_info');
    return response;
  }
}