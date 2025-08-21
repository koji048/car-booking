'use client';

import { Button } from '@car-booking/ui';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function OAuthLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // Check if user is already logged in via OAuth
    const userInfo = getCookie('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(decodeURIComponent(userInfo));
        console.log('User already logged in via OAuth:', user);
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
  }, []);

  const handleOAuthLogin = () => {
    setIsLoading(true);
    // Redirect to Azure AD OAuth endpoint
    window.location.href = '/api/auth/microsoft/login';
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error === 'oauth_init_failed' && 'Failed to initialize OAuth. Please try again.'}
          {error === 'oauth_callback_failed' && 'Authentication failed. Please try again.'}
          {error === 'state_mismatch' && 'Security validation failed. Please try again.'}
          {error === 'no_code' && 'No authorization code received. Please try again.'}
          {error.startsWith('access_denied') && 'Access was denied. Please contact your administrator.'}
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
        variant="default"
        type="button"
        disabled={isLoading}
        onClick={handleOAuthLogin}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          'Redirecting to Microsoft...'
        ) : (
          <>
            <svg
              className="mr-2 h-5 w-5"
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
            Sign in with Microsoft (OAuth 2.0)
          </>
        )}
      </Button>

      <div className="text-xs text-center text-muted-foreground">
        Secure authentication via Microsoft Azure AD using OAuth 2.0
      </div>
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