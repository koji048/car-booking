'use client';

import { useRouter } from 'next/navigation';

export default function TestPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Car Booking System Navigation Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Routes:</h2>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/')}
              className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded"
            >
              <strong>/</strong> - Main App (Login → My Bookings → Car Booking)
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded"
            >
              <strong>/login</strong> - Redirects to Main App
            </button>
            <button 
              onClick={() => router.push('/booking')}
              className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded"
            >
              <strong>/booking</strong> - Legacy Landing Page
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded"
            >
              <strong>/dashboard</strong> - Dashboard (if exists)
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">App Flow:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>User visits <code>/</code> → Shows LoginPage</li>
            <li>User logs in → Based on role:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• Employee → My Bookings page</li>
                <li>• Manager → Manager Approval page</li>
                <li>• HR → HR Approval page</li>
                <li>• Admin → Admin page</li>
              </ul>
            </li>
            <li>From My Bookings → Click "New Booking" → Car Booking page</li>
            <li>Fill booking form → Submit → Approval Workflow page</li>
          </ol>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-2">Demo Credentials:</h2>
          <p>Email: <strong>demo@company.com</strong></p>
          <p>Password: <strong>demo123456</strong></p>
        </div>
      </div>
    </div>
  );
}
EOF < /dev/null