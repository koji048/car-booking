import { NextRequest, NextResponse } from 'next/server';
import { getSamlConfig } from '@/lib/saml-config';
import * as zlib from 'zlib';

/**
 * GET /api/saml/login-v2
 * SAML login with minimal request for Azure AD compatibility
 */
export async function GET(request: NextRequest) {
  try {
    const config = getSamlConfig();
    
    // Generate minimal SAML AuthnRequest that Azure AD accepts
    const id = '_' + Math.random().toString(36).substring(2, 15);
    const issueInstant = new Date().toISOString();
    
    // Minimal SAML request - Azure AD doesn't require all attributes
    const samlRequest = [
      '<samlp:AuthnRequest',
      ' xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"',
      ' xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"',
      ` ID="${id}"`,
      ' Version="2.0"',
      ` IssueInstant="${issueInstant}"`,
      ` AssertionConsumerServiceURL="${config.sp.assertionConsumerServiceUrl}">`,
      `<saml:Issuer>${config.sp.entityId}</saml:Issuer>`,
      '</samlp:AuthnRequest>'
    ].join('');

    console.log('SAML Request v2:', samlRequest);
    
    // Compress and encode
    const compressed = zlib.deflateRawSync(Buffer.from(samlRequest, 'utf8'));
    const base64 = compressed.toString('base64');
    const encoded = encodeURIComponent(base64);
    
    // Build redirect URL
    const redirectUrl = `${config.idp.entryPoint}?SAMLRequest=${encoded}`;
    
    console.log('Redirecting v2 to:', redirectUrl.substring(0, 150) + '...');
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in SAML login v2:', error);
    return NextResponse.redirect('/login?error=saml_error');
  }
}