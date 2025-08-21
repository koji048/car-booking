import { NextRequest, NextResponse } from 'next/server';
import passport from 'passport';
import { initializeSamlStrategy, validateSamlResponse } from '@/lib/saml-auth';
import type { User } from '@car-booking/types';

// Initialize SAML strategy
initializeSamlStrategy();

/**
 * POST /api/saml/acs
 * Assertion Consumer Service (ACS) endpoint
 * Receives and processes SAML responses from the Identity Provider
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const samlResponse = formData.get('SAMLResponse') as string;
    const relayState = formData.get('RelayState') as string;

    if (!samlResponse) {
      return NextResponse.json(
        { error: 'No SAML response received' },
        { status: 400 }
      );
    }

    // Validate SAML response format
    if (!validateSamlResponse(samlResponse)) {
      return NextResponse.json(
        { error: 'Invalid SAML response format' },
        { status: 400 }
      );
    }

    // Process SAML response using passport
    return new Promise<NextResponse>((resolve) => {
      const req = {
        body: {
          SAMLResponse: samlResponse,
          RelayState: relayState,
        },
        method: 'POST',
        url: '/api/saml/acs',
      };

      passport.authenticate('saml', { session: false }, (err: any, user: User | false) => {
        if (err || !user) {
          console.error('SAML authentication failed:', err);
          
          // Redirect to login with error
          const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
          loginUrl.searchParams.append('error', 'saml_auth_failed');
          
          resolve(NextResponse.redirect(loginUrl.toString()));
          return;
        }

        // Create session token
        const sessionData = {
          user: user,
          loginTime: new Date().toISOString(),
          authMethod: 'saml',
        };

        // Encode session data
        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

        // Determine redirect URL
        const redirectUrl = relayState || '/';
        const finalRedirectUrl = new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');

        // Create response with session cookie
        const response = NextResponse.redirect(finalRedirectUrl.toString());
        
        // Set session cookie
        response.cookies.set('saml_session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 8 * 60 * 60, // 8 hours
          path: '/',
        });

        // Also set a user info cookie for client-side access
        response.cookies.set('user_info', JSON.stringify(user), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 8 * 60 * 60, // 8 hours
          path: '/',
        });

        console.log('SAML authentication successful for user:', user.email);
        
        resolve(response);
      })(req as any, {} as any, () => {});
    });
  } catch (error) {
    console.error('Error processing SAML response:', error);
    
    // Redirect to login with error
    const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
    loginUrl.searchParams.append('error', 'saml_processing_error');
    
    return NextResponse.redirect(loginUrl.toString());
  }
}