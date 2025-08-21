import { NextRequest, NextResponse } from 'next/server';
import * as zlib from 'zlib';
import { getSamlConfig } from '@/lib/saml-config';

/**
 * GET /api/saml/debug
 * Debug endpoint to test SAML encoding
 */
export async function GET(request: NextRequest) {
  const config = getSamlConfig();
  
  // Simple SAML request for testing
  const testRequest = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_test123" Version="2.0" IssueInstant="2025-01-20T10:00:00Z" Destination="${config.idp.entryPoint}"><saml:Issuer>${config.sp.entityId}</saml:Issuer></samlp:AuthnRequest>`;

  // Try different encoding methods
  const results: any = {};

  // Method 1: deflateRawSync (no zlib header)
  try {
    const deflated1 = zlib.deflateRawSync(Buffer.from(testRequest));
    const base64_1 = deflated1.toString('base64');
    results.method1 = {
      name: 'deflateRawSync',
      base64Length: base64_1.length,
      sample: base64_1.substring(0, 50),
      urlEncoded: encodeURIComponent(base64_1).substring(0, 50),
    };
    
    // Test decode
    const decoded1 = Buffer.from(base64_1, 'base64');
    const inflated1 = zlib.inflateRawSync(decoded1).toString();
    results.method1.canDecode = inflated1 === testRequest;
  } catch (e: any) {
    results.method1 = { error: e.message };
  }

  // Method 2: gzipSync
  try {
    const gzipped = zlib.gzipSync(Buffer.from(testRequest));
    const base64_2 = gzipped.toString('base64');
    results.method2 = {
      name: 'gzipSync',
      base64Length: base64_2.length,
      sample: base64_2.substring(0, 50),
      urlEncoded: encodeURIComponent(base64_2).substring(0, 50),
    };
  } catch (e: any) {
    results.method2 = { error: e.message };
  }

  // Method 3: Plain base64 (no compression)
  try {
    const base64_3 = Buffer.from(testRequest).toString('base64');
    results.method3 = {
      name: 'plain base64',
      base64Length: base64_3.length,
      sample: base64_3.substring(0, 50),
      urlEncoded: encodeURIComponent(base64_3).substring(0, 50),
    };
  } catch (e: any) {
    results.method3 = { error: e.message };
  }

  // Generate actual redirect URLs for testing
  const deflated = zlib.deflateRawSync(Buffer.from(testRequest));
  const base64 = deflated.toString('base64');
  const urlEncoded = encodeURIComponent(base64);
  
  results.testUrls = {
    withCompression: `${config.idp.entryPoint}?SAMLRequest=${urlEncoded}`,
    withoutCompression: `${config.idp.entryPoint}?SAMLRequest=${encodeURIComponent(Buffer.from(testRequest).toString('base64'))}`,
  };

  results.originalRequest = testRequest;
  results.originalLength = testRequest.length;

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}