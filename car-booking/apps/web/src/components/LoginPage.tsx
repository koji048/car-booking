'use client';

import { useState, useEffect } from 'react';
import { Button } from '@car-booking/ui';
import { Input } from '@car-booking/ui';
import { Label } from '@car-booking/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@car-booking/ui';
import { Separator } from '@car-booking/ui';
import { OAuthLogin } from './OAuthLogin';
// // import companyLogo - removed figma import;
import type { User } from '@car-booking/types';

const MOCK_USERS: User[] = [
  { name: 'John Doe', email: 'john.doe@company.com', role: 'Employee' },
  { name: 'Jane Manager', email: 'jane.manager@company.com', role: 'Manager' },
  { name: 'HR Representative', email: 'hr@company.com', role: 'HR' },
  { name: 'System Admin', email: 'admin@company.com', role: 'Admin' },
];

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');
  
  // Check for OAuth/SAML session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const userInfo = getCookie('user_info');
      if (userInfo) {
        try {
          const user = JSON.parse(decodeURIComponent(userInfo));
          console.log('Existing user session found:', user);
          
          // Show loading state with role info
          setIsLoading(true);
          
          // Set redirect message based on role
          const roleMessages = {
            'Admin': 'Redirecting to Admin Dashboard...',
            'HR': 'Redirecting to HR Approval Dashboard...',
            'Manager': 'Redirecting to Manager Approval Dashboard...',
            'Employee': 'Redirecting to My Bookings...'
          };
          setRedirectMessage(roleMessages[user.role as keyof typeof roleMessages] || 'Redirecting...');
          
          // Small delay to show the redirect message
          setTimeout(() => {
            console.log(`Redirecting ${user.role} user to their dashboard...`);
            onLogin(user);
          }, 1000);
        } catch (e) {
          console.error('Error parsing user info:', e);
        }
      }
    };
    
    checkExistingSession();
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock AD authentication with predefined users
    setTimeout(() => {
      // Find matching user or create default employee
      const matchedUser = MOCK_USERS.find(user => user.email === email);
      
      if (matchedUser) {
        onLogin(matchedUser);
      } else {
        // Default to employee role for other emails
        const mockUser: User = {
          name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: email,
          role: 'Employee'
        };
        onLogin(mockUser);
      }
      
      setIsLoading(false);
    }, 1000);
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    
    // Mock Microsoft 365 authentication
    setTimeout(() => {
      // In a real implementation, this would redirect to Microsoft login
      // For demo purposes, we'll simulate a successful login
      const mockUser: User = {
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'Employee'
      };
      onLogin(mockUser);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Show redirect message if redirecting */}
        {redirectMessage && (
          <div className="mb-8 text-center animate-pulse">
            <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
            <p className="text-muted-foreground">{redirectMessage}</p>
          </div>
        )}
        
        {/* Show login form if not redirecting */}
        {!redirectMessage && (
          <>
            <div className="mb-8 text-center">
              {/* Logo removed */}
              <h1 className="text-2xl mb-2">Car Booking System</h1>
              <p className="text-muted-foreground">Sign in with your corporate account</p>
            </div>
        
        <Card className="border border-border">
          <CardHeader className="space-y-2">
            <CardTitle>Active Directory Login</CardTitle>
            <CardDescription>
              Use your corporate credentials to access the car booking system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* OAuth 2.0 Single Sign-On */}
            <OAuthLogin />

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground bg-background px-2">
                Or sign in with username and password
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Traditional Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <Button 
                type="submit" 
                variant="secondary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Having trouble? Contact IT support
            </div>
            
            {/* Demo Users for Testing */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium mb-2">Demo Users (for testing):</p>
              <div className="space-y-1 text-xs">
                <p><strong>Employee:</strong> john.doe@company.com</p>
                <p><strong>Manager:</strong> jane.manager@company.com</p>
                <p><strong>HR:</strong> hr@company.com</p>
                <p><strong>Admin:</strong> admin@company.com</p>
                <p className="text-muted-foreground mt-1">Password: any value</p>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
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