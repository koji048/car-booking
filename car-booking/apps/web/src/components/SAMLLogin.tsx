'use client';

import { Button } from '@car-booking/ui';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function SAMLLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  useEffect(() => {
    // Check if user is already logged in via SAML
    const userInfo = getCookie('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        console.log('User already logged in via SAML:', user);
        // You can redirect or update UI here
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
  }, []);

  const handleSAMLLogin = () => {
    setIsLoading(true);
    // Use the deflate-compressed method (standard SAML)
    window.location.href = '/api/saml/login';
  };

  const handleSAMLLoginPlain = () => {
    setIsLoading(true);
    // Use plain base64 encoding (alternative for some Azure configs)
    window.location.href = '/api/saml/login-plain';
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error === 'saml_auth_failed' && 'SAML authentication failed. Please try again.'}
          {error === 'saml_processing_error' && 'Error processing SAML response. Please contact support.'}
        </div>
      )}
      
      {message && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
          {message === 'logout_successful' && 'You have been successfully logged out.'}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Single Sign-On
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleSAMLLogin}
        className="w-full"
      >
        {isLoading ? (
          'Redirecting to Microsoft...'
        ) : (
          <>
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="microsoft"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
            >
              <path
                fill="currentColor"
                d="M0 32h214.6v214.6H0V32zm233.4 0H448v214.6H233.4V32zM0 265.4h214.6V480H0V265.4zm233.4 0H448V480H233.4V265.4z"
              />
            </svg>
            Sign in with Microsoft (SAML SSO)
          </>
        )}
      </Button>

      <div className="text-xs text-center text-muted-foreground">
        Secure authentication via Microsoft Entra ID
      </div>

      {/* Alternative encoding method for testing */}
      <Button
        variant="secondary"
        type="button"
        disabled={isLoading}
        onClick={handleSAMLLoginPlain}
        className="w-full"
      >
        Try Alternative Encoding (Plain Base64)
      </Button>
    </div>
  );
}

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}