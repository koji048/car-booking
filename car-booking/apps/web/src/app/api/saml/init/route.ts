import { NextRequest, NextResponse } from 'next/server';
import { Strategy as SamlStrategy } from '@node-saml/passport-saml';
import { getSamlStrategyOptions } from '@/lib/saml-config';
import { DUMMY_CERT } from '@/lib/saml-dummy-cert';

/**
 * GET /api/saml/init
 * Alternative SAML login initialization using passport-saml's built-in methods
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const returnTo = searchParams.get('returnTo') || '/';

    // Create a temporary strategy instance to generate the auth request
    const baseOptions = getSamlStrategyOptions();
    const strategyOptions = {
      ...baseOptions,
      // Use dummy cert if real cert is not available (only for request generation)
      cert: process.env.SAML_IDP_CERT || DUMMY_CERT,
      idpCert: process.env.SAML_IDP_CERT || DUMMY_CERT,
    };

    const samlStrategy = new SamlStrategy(
      strategyOptions,
      (profile: any, done: any) => done(null, profile)
    );

    // Generate auth request URL
    const host = request.headers.get('host') || 'localhost:3001';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    
    return new Promise<NextResponse>((resolve) => {
      const req = {
        query: {},
        headers: {
          host: host,
        },
        protocol: protocol,
        url: '/api/saml/init',
      };

      (samlStrategy as any).getAuthorizeUrl(
        req,
        {},
        (err: any, url: string) => {
          if (err) {
            console.error('Error generating SAML auth URL:', err);
            const errorUrl = new URL('/login', `${protocol}://${host}`);
            errorUrl.searchParams.append('error', 'saml_init_failed');
            resolve(NextResponse.redirect(errorUrl.toString()));
            return;
          }

          // Add RelayState if needed
          const authUrl = new URL(url);
          if (returnTo && returnTo !== '/') {
            authUrl.searchParams.set('RelayState', returnTo);
          }

          console.log('Generated SAML auth URL:', authUrl.toString());
          resolve(NextResponse.redirect(authUrl.toString()));
        }
      );
    });
  } catch (error) {
    console.error('Error in SAML init:', error);
    
    const host = request.headers.get('host') || 'localhost:3001';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const errorUrl = new URL('/login', `${protocol}://${host}`);
    errorUrl.searchParams.append('error', 'saml_init_error');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}