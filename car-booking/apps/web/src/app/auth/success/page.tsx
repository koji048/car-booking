'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get user data from query params
    const userParam = searchParams.get('user');
    
    if (userParam) {
      try {
        // Decode user data
        const userInfo = JSON.parse(Buffer.from(userParam, 'base64').toString());
        
        // Store user info in localStorage or state management
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        // Redirect to main app
        router.push('/');
      } catch (error) {
        console.error('Error processing auth success:', error);
        router.push('/?error=auth_processing_failed');
      }
    } else {
      // No user data, redirect to login
      router.push('/?error=no_user_data');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}