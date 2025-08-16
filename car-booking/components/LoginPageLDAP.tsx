'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Car, Shield, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import type { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPageLDAP({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoLogin, setShowDemoLogin] = useState(false);

  // Demo users for testing when LDAP is not available
  const DEMO_USERS = [
    { username: 'thanakorn.c', name: 'Thanakorn C', role: 'Admin' },
    { username: 'jane.manager', name: 'Jane Manager', role: 'Manager' },
    { username: 'hr.admin', name: 'HR Administrator', role: 'HR' },
    { username: 'john.doe', name: 'John Doe', role: 'Employee' },
  ];

  const handleLDAPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call LDAP authentication endpoint
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

      // Login successful
      // Map lowercase roles to capitalized format for UI
      const roleMapping: Record<string, 'Employee' | 'Manager' | 'HR' | 'Admin'> = {
        'employee': 'Employee',
        'manager': 'Manager',
        'hr': 'HR',
        'admin': 'Admin'
      };
      
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: roleMapping[data.user.role] || 'Employee',
      };

      onLogin(user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
      
      // Show demo login option if LDAP fails
      if (err.message.includes('ECONNREFUSED') || err.message.includes('LDAP')) {
        setShowDemoLogin(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoUser: any) => {
    const user: User = {
      id: `demo-${demoUser.username}`,
      name: demoUser.name,
      email: `${demoUser.username}@gsbattery.co.th`,
      role: demoUser.role,
    };
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <Car className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Car Booking System</h1>
          <p className="text-gray-600">Sign in with your Active Directory account</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Secure Login
            </CardTitle>
            <CardDescription className="text-blue-100">
              Use your corporate credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLDAPLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="thanakorn.c or thanakorn.c@gsbattery.co.th"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Enter your username or email (e.g., thanakorn.c or thanakorn.c@gsbattery.co.th)</p>
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
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In with Active Directory'
                )}
              </Button>
            </form>

            {showDemoLogin && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or use demo account</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600 text-center mb-3">
                    LDAP server not available. Use demo accounts for testing:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_USERS.map((demoUser) => (
                      <Button
                        key={demoUser.username}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoLogin(demoUser)}
                        className="text-xs"
                      >
                        {demoUser.role}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Secured by Active Directory
                </p>
                <p>• Single Sign-On (SSO) enabled</p>
                <p>• Role-based access control</p>
                <p>• Encrypted authentication</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Having trouble signing in?</p>
          <p>Contact IT Support at ext. 1234</p>
        </div>
      </div>
    </div>
  );
}