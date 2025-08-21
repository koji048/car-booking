'use client';

import { useState } from 'react';
import { Button } from '@car-booking/ui';
import { LogOut, Loader2 } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  logoutFromAzure?: boolean;
  onLogout?: () => void;
  className?: string;
}

export function LogoutButton({ 
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  showText = true,
  logoutFromAzure = false, // Changed default to false
  onLogout,
  className = ''
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      // Call logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logoutFromAzure }),
      });

      const data = await response.json();
      
      // Call custom onLogout handler if provided
      if (onLogout) {
        onLogout();
      }
      
      // Redirect to Azure AD logout or login page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        // Fallback to login page
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to login page
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && <span className="ml-2">Signing out...</span>}
        </>
      ) : (
        <>
          {showIcon && <LogOut className="h-4 w-4" />}
          {showText && <span className={showIcon ? "ml-2" : ""}>Sign Out</span>}
        </>
      )}
    </Button>
  );
}