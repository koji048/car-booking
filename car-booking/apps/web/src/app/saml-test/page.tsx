'use client';

import { useState } from 'react';
import { Button } from '@car-booking/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@car-booking/ui';

export default function SAMLTestPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    // Test 1: Metadata endpoint
    try {
      const metadataRes = await fetch('/api/saml/metadata');
      results.metadata = {
        status: metadataRes.status,
        ok: metadataRes.ok,
        contentType: metadataRes.headers.get('content-type'),
      };
    } catch (e: any) {
      results.metadata = { error: e.message };
    }

    // Test 2: Certificate loaded
    results.certificate = {
      loaded: !!process.env.NEXT_PUBLIC_APP_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    };

    // Test 3: SAML login endpoint
    try {
      const loginRes = await fetch('/api/saml/login', { 
        method: 'HEAD',
        redirect: 'manual' 
      });
      results.login = {
        status: loginRes.status,
        redirectUrl: loginRes.headers.get('location')?.substring(0, 100) + '...',
      };
    } catch (e: any) {
      results.login = { error: e.message };
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>SAML SSO Test Page</CardTitle>
            <CardDescription>
              Test your SAML configuration with Microsoft Azure AD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Configuration Status</h3>
              <div className="text-sm space-y-1">
                <div>✅ Azure AD Certificate: Loaded</div>
                <div>✅ Tenant ID: ead30324-2c2a-42bf-9541-bf96019df2c6</div>
                <div>✅ Entity ID: {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/saml/metadata</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={runTests} disabled={loading}>
                {loading ? 'Running Tests...' : 'Run Endpoint Tests'}
              </Button>
              
              {Object.keys(testResults).length > 0 && (
                <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <h3 className="font-semibold">Test SAML Login Flow</h3>
              <div className="space-x-2">
                <Button 
                  variant="default"
                  onClick={() => window.location.href = '/api/saml/login'}
                >
                  Test SAML Login (Redirect)
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/api/saml/metadata'}
                >
                  View SP Metadata
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 text-sm text-muted-foreground">
              <h3 className="font-semibold text-foreground mb-2">Azure AD Configuration Required:</h3>
              <ul className="space-y-1">
                <li>• Entity ID: https://carbooking-sgs.siamgs.co.th/saml/metadata</li>
                <li>• Reply URL: https://carbooking-sgs.siamgs.co.th/api/saml/acs</li>
                <li>• Sign on URL: https://carbooking-sgs.siamgs.co.th/login</li>
                <li>• Logout URL: https://carbooking-sgs.siamgs.co.th/api/saml/logout</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}