'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { AlertCircle, Shield, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { GSLogo } from './GSLogo';
import type { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [microsoftAvailable, setMicrosoftAvailable] = useState<boolean | null>(null);
  const [ldapAvailable, setLdapAvailable] = useState<boolean | null>(null);
  const [ldapServer, setLdapServer] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Check if LDAP is available before attempting login
    if (ldapAvailable === false) {
      setError(
        `Cannot connect to Siam GS Active Directory server (${ldapServer}). ` +
        'You may need to connect to the corporate network or use VPN to access the authentication service.'
      );
      setIsLoading(false);
      return;
    }
    
    try {
      // Call real LDAP authentication endpoint
      const response = await fetch('http://localhost:3005/api/auth/ldap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Map lowercase roles to capitalized format for UI
      const roleMapping: Record<string, 'Employee' | 'Manager' | 'HR' | 'Admin'> = {
        'employee': 'Employee',
        'manager': 'Manager',
        'hr': 'HR',
        'admin': 'Admin'
      };
      
      // Login successful - use real user data from AD
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: roleMapping[data.user.role] || 'Employee',
      };

      // Store session token if needed
      if (data.session?.token) {
        localStorage.setItem('sessionToken', data.session.token);
      }

      onLogin(user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if Microsoft OAuth endpoint is accessible
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('http://localhost:3005/api/auth/microsoft/check', {
        signal: controller.signal
      }).catch(err => {
        throw new Error('network');
      });
      
      clearTimeout(timeoutId);
      
      if (response && response.ok) {
        // Redirect to Microsoft OAuth endpoint
        window.location.href = 'http://localhost:3005/api/auth/microsoft';
      } else {
        throw new Error('service');
      }
    } catch (error: any) {
      setIsLoading(false);
      
      if (error.message === 'network' || error.name === 'AbortError') {
        setError(
          'Microsoft 365 sign-in is not available. This may be due to network restrictions. ' +
          'Please use your Siam GS username and password to sign in below.'
        );
      } else {
        setError(
          'Microsoft 365 service is temporarily unavailable. ' +
          'Please use your Siam GS credentials to sign in below.'
        );
      }
    }
  };

  // Check for URL parameters for errors and check Microsoft availability
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      if (errorParam === 'microsoft_auth_failed') {
        setError('Microsoft authentication failed. Please try again or use your Siam GS credentials.');
      } else if (errorParam === 'invalid_state') {
        setError('Security validation failed. Please try signing in again.');
      } else if (errorParam === 'no_code') {
        setError('Authentication was cancelled. Please try again.');
      } else {
        setError(decodeURIComponent(errorParam));
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check Microsoft SSO availability
    fetch('http://localhost:3005/api/auth/microsoft/check')
      .then(res => res.json())
      .then(data => {
        setMicrosoftAvailable(data.available === true);
      })
      .catch(() => {
        setMicrosoftAvailable(false);
      });
    
    // Check LDAP server availability
    fetch('http://localhost:3005/api/auth/ldap/check')
      .then(res => res.json())
      .then(data => {
        setLdapAvailable(data.available === true);
        if (data.server) {
          setLdapServer(`${data.server}:${data.port}`);
        }
        // Show warning if LDAP is not available
        if (data.available === false && data.reason) {
          if (data.reason.includes('unreachable') || data.reason.includes('blocked')) {
            setError(
              `Warning: Siam GS Active Directory server (${data.server}:${data.port}) is not accessible. ` +
              'You may need to connect to the corporate network or use VPN to sign in.'
            );
          }
        }
      })
      .catch(() => {
        setLdapAvailable(false);
        setError('Unable to check authentication service availability.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <GSLogo width={120} height={60} />
          </div>
          <h1 className="text-2xl mb-2">GS Battery Car Booking System</h1>
          <p className="text-muted-foreground">Sign in with your corporate account</p>
        </div>
        
        <Card className="border border-border">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Siam GS Active Directory Login
            </CardTitle>
            <CardDescription>
              Use your corporate credentials to access the car booking system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Alert with different styles based on error type */}
            {error && (
              <Alert 
                variant={error.includes('network') || error.includes('not available') ? 'default' : 'destructive'} 
                className="mb-4"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                  {error.includes('network') && (
                    <div className="mt-2 text-xs">
                      <strong>Tip:</strong> If you're on a restricted network, you may need to use VPN or connect to the corporate network to use Microsoft 365 sign-in.
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Microsoft 365 Single Sign-On */}
            <div className="space-y-4">
              <Button 
                type="button"
                variant={microsoftAvailable === false ? "secondary" : "outline"}
                className={`w-full h-12 gap-3 border-2 ${
                  microsoftAvailable === false 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-accent/50'
                }`}
                onClick={handleMicrosoftLogin}
                disabled={isLoading || microsoftAvailable === false}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 21 21" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={microsoftAvailable === false ? 'opacity-50' : ''}
                >
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                <span className="text-base font-medium">
                  {isLoading ? 'Signing you in...' : 'Sign in with Microsoft 365'}
                </span>
                {microsoftAvailable === false && (
                  <span className="text-xs text-red-500 ml-auto">(Unavailable)</span>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                {microsoftAvailable === false ? (
                  <span className="text-amber-600">
                    Microsoft sign-in unavailable. Use your Siam GS credentials below.
                  </span>
                ) : (
                  'Use your company Microsoft account for secure access'
                )}
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
              {ldapAvailable === false && (
                <Alert variant="default" className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    <strong>LDAP Server Unreachable</strong>
                    <br />
                    The Siam GS authentication server ({ldapServer}) cannot be reached.
                    Please ensure you are connected to the corporate network or VPN.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  Username
                  {ldapAvailable === false && (
                    <span className="text-xs text-amber-600">(Service Unavailable)</span>
                  )}
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="thanakorn.c or thanakorn.c@gsbattery.co.th"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading || ldapAvailable === false}
                  className={`w-full ${ldapAvailable === false ? 'opacity-50' : ''}`}
                />
                <p className="text-xs text-muted-foreground">
                  {ldapAvailable === false 
                    ? 'LDAP authentication is currently unavailable'
                    : 'Enter your Siam GS username or email'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your AD password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || ldapAvailable === false}
                  className={`w-full ${ldapAvailable === false ? 'opacity-50' : ''}`}
                />
              </div>
              
              <Button 
                type="submit" 
                className={`w-full ${
                  ldapAvailable === false 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }`}
                disabled={isLoading || ldapAvailable === false}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : ldapAvailable === false ? (
                  'LDAP Service Unavailable'
                ) : (
                  'Sign In with Active Directory'
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Having trouble? Contact IT support
            </div>
            
            {/* Security Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1">
                  <Shield className={`h-3 w-3 ${ldapAvailable === false ? 'text-amber-600' : ''}`} />
                  Secured by Siam GS Active Directory
                </p>
                <p className="flex items-center gap-1">
                  • Server: Siam GS Active Directory 
                  {ldapAvailable === true && <span className="text-green-600">(Connected)</span>}
                  {ldapAvailable === false && <span className="text-red-600">(Unreachable)</span>}
                </p>
                <p>• Domain: siamgs.co.th</p>
                <p className="flex items-center gap-1">
                  • Microsoft 365 SSO 
                  {microsoftAvailable === true && <span className="text-green-600">(Available)</span>}
                  {microsoftAvailable === false && <span className="text-gray-500">(Not Configured)</span>}
                </p>
                <p>• Role-based access control</p>
                {ldapAvailable === false && (
                  <p className="text-amber-600 font-medium mt-2">
                    ⚠️ Network restriction detected - VPN required
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}