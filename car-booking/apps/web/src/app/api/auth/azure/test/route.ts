import { NextResponse } from 'next/server';

/**
 * GET /api/auth/azure/test
 * Test endpoint to check OAuth configuration
 */
export async function GET() {
  const config = {
    clientId: '8dbe7621-14fe-46aa-9968-77d6500e429e',
    tenantId: 'ead30324-2c2a-42bf-9541-bf96019df2c6',
    currentRedirectUri: 'http://localhost:3001/api/auth/azure/callback',
    possibleAlternatives: [
      'http://localhost:3001/api/auth/microsoft/callback',
      'http://localhost:3001/api/saml/acs',
      'http://localhost:3001/auth/callback',
      'https://carbooking-sgs.siamgs.co.th/api/auth/azure/callback',
      'https://carbooking-sgs.siamgs.co.th/api/auth/microsoft/callback',
      'https://carbooking-sgs.siamgs.co.th/api/saml/acs',
    ],
    authorizationUrl: `https://login.microsoftonline.com/ead30324-2c2a-42bf-9541-bf96019df2c6/oauth2/v2.0/authorize`,
    instructions: [
      '1. Go to Azure Portal > App registrations',
      '2. Select your app (8dbe7621-14fe-46aa-9968-77d6500e429e)',
      '3. Go to Authentication',
      '4. Add the redirect URI under Web platform',
      '5. Save the changes'
    ]
  };

  return NextResponse.json(config, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}