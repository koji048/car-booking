import { NextRequest, NextResponse } from 'next/server';

// GET - Check if Microsoft OAuth is configured and accessible
export async function GET(request: NextRequest) {
  try {
    // Check if Microsoft OAuth is configured
    const isConfigured = !!(
      process.env.MICROSOFT_CLIENT_ID &&
      process.env.MICROSOFT_CLIENT_SECRET &&
      process.env.MICROSOFT_TENANT_ID &&
      process.env.MICROSOFT_CLIENT_ID !== 'your-client-id-here'
    );

    if (!isConfigured) {
      return NextResponse.json({
        available: false,
        reason: 'Microsoft OAuth not configured'
      }, { status: 503 });
    }

    // Try to reach Microsoft login endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    try {
      const response = await fetch('https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration', {
        signal: controller.signal,
        method: 'HEAD'
      });
      
      clearTimeout(timeoutId);

      if (response.ok || response.status === 405) { // HEAD might return 405 but still means it's accessible
        return NextResponse.json({
          available: true,
          configured: true
        });
      } else {
        return NextResponse.json({
          available: false,
          reason: 'Microsoft services unreachable'
        }, { status: 503 });
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          available: false,
          reason: 'Network timeout - Microsoft services may be blocked'
        }, { status: 503 });
      }
      
      return NextResponse.json({
        available: false,
        reason: 'Network error - Unable to reach Microsoft services'
      }, { status: 503 });
    }
  } catch (error: any) {
    console.error('Microsoft OAuth check error:', error);
    return NextResponse.json({
      available: false,
      reason: 'Internal error checking Microsoft OAuth'
    }, { status: 500 });
  }
}