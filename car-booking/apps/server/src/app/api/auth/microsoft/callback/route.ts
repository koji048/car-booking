import { NextRequest, NextResponse } from 'next/server';
import { MicrosoftAuthService } from '@/lib/microsoft-auth';
import { db } from '@/db';
import { session as sessionTable } from '@/db/schema/auth';
import crypto from 'crypto';

const microsoftAuth = new MicrosoftAuthService();

// GET - Handle Microsoft OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      console.error('Microsoft OAuth error:', error);
      const errorDescription = searchParams.get('error_description');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}?error=${encodeURIComponent(errorDescription || error)}`
      );
    }
    
    // Validate state for CSRF protection
    const storedState = request.cookies.get('microsoft_auth_state')?.value;
    if (!state || state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}?error=invalid_state`
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}?error=no_code`
      );
    }
    
    // Exchange code for tokens
    const tokenResponse = await microsoftAuth.exchangeCodeForTokens(code, state);
    
    if (!tokenResponse || !tokenResponse.accessToken) {
      throw new Error('Failed to get access token');
    }
    
    // Get user profile from Microsoft Graph
    const profile = await microsoftAuth.getUserProfile(tokenResponse.accessToken);
    
    // Create or update user in database
    const dbUser = await microsoftAuth.createOrUpdateUser(profile, tokenResponse.idToken);
    
    // Create session
    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await db.insert(sessionTable).values({
      id: sessionId,
      userId: dbUser.id,
      token: sessionToken,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || ''
    });
    
    // Create response with redirect
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/success`
    );
    
    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });
    
    // Clear state cookie
    response.cookies.delete('microsoft_auth_state');
    
    // Store user info in localStorage via query params (will be handled by client)
    const userInfo = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    };
    
    const successUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/success`);
    successUrl.searchParams.set('user', Buffer.from(JSON.stringify(userInfo)).toString('base64'));
    
    return NextResponse.redirect(successUrl);
    
  } catch (error: any) {
    console.error('Microsoft callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}?error=${encodeURIComponent(error.message || 'Authentication failed')}`
    );
  }
}