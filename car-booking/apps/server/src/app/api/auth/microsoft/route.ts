import { NextRequest, NextResponse } from 'next/server';
import { MicrosoftAuthService } from '@/lib/microsoft-auth';
import crypto from 'crypto';

const microsoftAuth = new MicrosoftAuthService();

// GET - Redirect to Microsoft login
export async function GET(request: NextRequest) {
  try {
    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in cookie for validation
    const response = NextResponse.redirect(
      await microsoftAuth.getAuthorizationUrl(state)
    );
    
    response.cookies.set('microsoft_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    });
    
    return response;
  } catch (error: any) {
    console.error('Microsoft OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}?error=microsoft_auth_failed`
    );
  }
}