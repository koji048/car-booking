import { NextRequest, NextResponse } from 'next/server';
import { getSamlConfig } from '@/lib/saml-config';

/**
 * GET /api/saml/login-plain
 * Alternative SAML login using plain base64 encoding (no compression)
 */
export async function GET(request: NextRequest) {
  try {
    const config = getSamlConfig();
    const searchParams = request.nextUrl.searchParams;
    const returnTo = searchParams.get('returnTo') || '/';

    // Generate SAML AuthnRequest
    const samlRequest = generateSamlAuthRequest(config);
    console.log('Generated SAML Request (plain):', samlRequest);
    
    // Plain base64 encoding (no compression) - some Azure AD configs require this
    const base64 = Buffer.from(samlRequest, 'utf8').toString('base64');
    
    // URL encode for use in query parameter
    const urlEncoded = encodeURIComponent(base64);

    // Build the redirect URL
    const finalUrl = `${config.idp.entryPoint}?SAMLRequest=${urlEncoded}`;
    
    // Add RelayState if needed
    const finalUrlWithRelayState = returnTo && returnTo !== '/' 
      ? `${finalUrl}&RelayState=${encodeURIComponent(returnTo)}`
      : finalUrl;

    console.log('Redirecting (plain encoding) to:', finalUrlWithRelayState.substring(0, 200) + '...');

    // Redirect to IdP
    return NextResponse.redirect(finalUrlWithRelayState);
  } catch (error) {
    console.error('Error initiating SAML login (plain):', error);
    
    // Redirect to login page with error
    const errorUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
    errorUrl.searchParams.append('error', 'saml_init_failed');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}

/**
 * Generate a proper SAML 2.0 AuthnRequest for Azure AD
 */
function generateSamlAuthRequest(config: ReturnType<typeof getSamlConfig>): string {
  const id = '_' + generateRandomId();
  const issueInstant = new Date().toISOString();
  
  // Azure AD compatible SAML request
  const authRequest = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${id}" Version="2.0" IssueInstant="${issueInstant}" Destination="${config.idp.entryPoint}" AssertionConsumerServiceURL="${config.sp.assertionConsumerServiceUrl}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"><saml:Issuer>${config.sp.entityId}</saml:Issuer></samlp:AuthnRequest>`;

  return authRequest;
}

/**
 * Generate a random ID for SAML request
 */
function generateRandomId(): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}