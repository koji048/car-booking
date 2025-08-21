import { NextRequest, NextResponse } from 'next/server';
import { getSamlConfig } from '@/lib/saml-config';
import * as zlib from 'zlib';

/**
 * GET /api/saml/login
 * Initiates SAML login by redirecting to the Identity Provider with a proper SAMLRequest
 */
export async function GET(request: NextRequest) {
  try {
    const config = getSamlConfig();
    const searchParams = request.nextUrl.searchParams;
    const returnTo = searchParams.get('returnTo') || '/';

    // Generate SAML AuthnRequest
    const samlRequest = generateSamlAuthRequest(config);
    console.log('Generated SAML Request:', samlRequest);
    
    // Method for Azure AD: deflate without wrapper
    const buffer = Buffer.from(samlRequest, 'utf8');
    
    // Use deflateRaw to avoid zlib wrapper (required by Azure AD)
    const deflated = zlib.deflateRawSync(buffer);
    
    // Base64 encode the deflated data
    const base64 = deflated.toString('base64');
    
    // URL encode for use in query parameter
    const urlEncoded = encodeURIComponent(base64);

    // Build the redirect URL
    const samlLoginUrl = new URL(config.idp.entryPoint);
    
    // Add SAMLRequest as query parameter (not using searchParams.set to avoid double encoding)
    const finalUrl = `${config.idp.entryPoint}?SAMLRequest=${urlEncoded}`;
    
    // Add RelayState if needed
    const finalUrlWithRelayState = returnTo && returnTo !== '/' 
      ? `${finalUrl}&RelayState=${encodeURIComponent(returnTo)}`
      : finalUrl;

    console.log('Redirecting to:', finalUrlWithRelayState.substring(0, 200) + '...');

    // Redirect to IdP
    return NextResponse.redirect(finalUrlWithRelayState);
  } catch (error) {
    console.error('Error initiating SAML login:', error);
    
    // Redirect to login page with error
    const errorUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
    errorUrl.searchParams.append('error', 'saml_init_failed');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}

/**
 * Generate a proper SAML 2.0 AuthnRequest for Azure AD
 * Note: Azure AD requires specific formatting without XML declaration
 */
function generateSamlAuthRequest(config: ReturnType<typeof getSamlConfig>): string {
  const id = '_' + generateRandomId();
  const issueInstant = new Date().toISOString();
  
  // Important: No XML declaration, no extra whitespace for Azure AD
  // Remove NameIDPolicy as it might be causing issues
  const authRequest = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${id}" Version="2.0" IssueInstant="${issueInstant}" AssertionConsumerServiceURL="${config.sp.assertionConsumerServiceUrl}"><saml:Issuer>${config.sp.entityId}</saml:Issuer></samlp:AuthnRequest>`;

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