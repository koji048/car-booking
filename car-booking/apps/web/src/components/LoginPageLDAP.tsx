'use client';

import { useState } from 'react';
import { Button } from '@car-booking/ui';
import { Input } from '@car-booking/ui';
import { Label } from '@car-booking/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@car-booking/ui';
import { Separator } from '@car-booking/ui';
import type { User } from '@car-booking/types';

interface LoginPageLDAPProps {
  onLogin: (user: User) => void;
}

export function LoginPageLDAP({ onLogin }: LoginPageLDAPProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/ldap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        onLogin({
          name: userData.name || username,
          email: userData.email || `${username}@company.com`,
          role: userData.role || 'Employee'
        });
      } else {
        const error = await response.json();
        setError(error.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Car Booking System</CardTitle>
          <CardDescription>Sign in with your LDAP credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <Separator className="my-6" />
          
          <div className="text-sm text-muted-foreground text-center">
            Connected to LDAP Authentication
          </div>
        </CardContent>
      </Card>
    </div>
  );
}