import { NextResponse } from 'next/server';
import { generateServiceProviderMetadata } from '@/lib/saml-auth';

/**
 * GET /api/saml/metadata
 * Returns the Service Provider (SP) metadata for SAML configuration
 * This endpoint should be accessible to the Identity Provider
 */
export async function GET() {
  try {
    const metadata = await generateServiceProviderMetadata();
    
    return new NextResponse(metadata, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating SAML metadata:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate SAML metadata' },
      { status: 500 }
    );
  }
}