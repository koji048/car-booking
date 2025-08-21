import { NextRequest, NextResponse } from 'next/server';
import { handleSamlLogout } from '@/lib/saml-auth';
import type { User } from '@car-booking/types';

/**
 * POST /api/saml/logout
 * Handles SAML logout - both SP-initiated and IdP-initiated
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const sessionCookie = request.cookies.get('saml_session');
    
    if (!sessionCookie) {
      // Already logged out
      return NextResponse.redirect(
        new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()
      );
    }

    // Decode session
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    );
    const user = sessionData.user as User;

    // Get logout URL
    const logoutUrl = await handleSamlLogout(user);

    // Clear session cookies
    const response = NextResponse.redirect(logoutUrl);
    response.cookies.delete('saml_session');
    response.cookies.delete('user_info');

    return response;
  } catch (error) {
    console.error('Error during SAML logout:', error);
    
    // Clear cookies and redirect to login even if there's an error
    const response = NextResponse.redirect(
      new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()
    );
    response.cookies.delete('saml_session');
    response.cookies.delete('user_info');
    
    return response;
  }
}

/**
 * GET /api/saml/logout
 * Handle logout response from IdP
 */
export async function GET(request: NextRequest) {
  try {
    // Clear any remaining session cookies
    const response = NextResponse.redirect(
      new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()
    );
    
    response.cookies.delete('saml_session');
    response.cookies.delete('user_info');
    
    // Add logout success message
    const url = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
    url.searchParams.append('message', 'logout_successful');
    
    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error('Error handling SAML logout response:', error);
    
    return NextResponse.redirect(
      new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()
    );
  }
}