import { NextRequest, NextResponse } from 'next/server';
import * as zlib from 'zlib';

/**
 * GET /api/saml/test
 * Test endpoint to verify SAML request encoding
 */
export async function GET(request: NextRequest) {
  try {
    // Sample SAML request
    const sampleRequest = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_test123" Version="2.0" IssueInstant="2025-01-20T10:00:00Z"><saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">http://localhost:3001/saml/metadata</saml:Issuer></samlp:AuthnRequest>`;

    // Method 1: Using deflateRawSync
    const deflated1 = zlib.deflateRawSync(Buffer.from(sampleRequest, 'utf8'));
    const base64_1 = deflated1.toString('base64');
    const encoded1 = encodeURIComponent(base64_1);

    // Method 2: Using deflateSync
    const deflated2 = zlib.deflateSync(Buffer.from(sampleRequest, 'utf8'));
    const base64_2 = deflated2.toString('base64');
    const encoded2 = encodeURIComponent(base64_2);

    // Test decoding
    const decoded1 = Buffer.from(decodeURIComponent(encoded1), 'base64');
    const inflated1 = zlib.inflateRawSync(decoded1).toString('utf8');

    return NextResponse.json({
      original: sampleRequest,
      method1: {
        deflatedSize: deflated1.length,
        base64: base64_1.substring(0, 50) + '...',
        encoded: encoded1.substring(0, 50) + '...',
        canDecode: inflated1 === sampleRequest
      },
      method2: {
        deflatedSize: deflated2.length,
        base64: base64_2.substring(0, 50) + '...',
        encoded: encoded2.substring(0, 50) + '...',
      },
      testUrls: {
        method1: `/api/saml/login?test=1`,
        method2: `/api/saml/init?test=1`,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}