'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSimpleLogin = () => {
    router.push('/simple');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Car Booking System
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login Page
          </button>
          
          <button
            onClick={handleSimpleLogin}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Go to Simple Login
          </button>
          
          <div className="text-center text-sm text-gray-600 mt-6">
            <p>Both login pages are working.</p>
            <p>Choose your preferred option above.</p>
          </div>
        </div>
      </div>
    </div>
  );
}