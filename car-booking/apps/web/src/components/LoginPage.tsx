'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
// // import companyLogo - removed figma import;
import type { User } from '@/types';

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
            {/* Microsoft 365 Single Sign-On */}
            <div className="space-y-4">
              <Button 
                type="button"
                variant="outline"
                className="w-full h-12 gap-3 border-2 hover:bg-accent/50"
                onClick={handleMicrosoftLogin}
                disabled={isLoading}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 21 21" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                <span className="text-base font-medium">
                  {isLoading ? 'Signing you in...' : 'Sign in with Microsoft 365'}
                </span>
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                Use your company Microsoft account for secure access
              </div>
            </div>

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
      </div>
    </div>
  );
}