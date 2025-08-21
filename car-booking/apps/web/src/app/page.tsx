'use client';

import { useState, useEffect } from "react";
import { LoginPage } from "../components/LoginPage";
import { CarBookingPage } from "../components/CarBookingPage";
import { MyBookingsPage } from "../components/MyBookingsPage";
import { AdminPage } from "../components/AdminPage";
import { ManagerApprovalPage } from "../components/ManagerApprovalPage";
import { HRApprovalPage } from "../components/HRApprovalPage";
import { BookingConfirmation } from "../components/BookingConfirmation";
import Providers from "../components/providers";
import type { User, BookingData, AppState } from '@car-booking/types';

// ⚠️ DEVELOPMENT MODE - Set to false in production!
const DEV_MODE = true;

// Mock users for development
const MOCK_USERS = {
  employee: {
    id: 'emp-001',
    name: 'John Employee',
    email: 'john.employee@company.com',
    role: 'Employee' as const,
  },
  manager: {
    id: 'mgr-001',
    name: 'Jane Manager',
    email: 'jane.manager@company.com',
    role: 'Manager' as const,
  },
  hr: {
    id: 'hr-001',
    name: 'Bob HR',
    email: 'bob.hr@company.com',
    role: 'HR' as const,
  },
  admin: {
    id: 'admin-001',
    name: 'Alice Admin',
    email: 'alice.admin@company.com',
    role: 'Admin' as const,
  },
};

export default function App() {
  const [currentState, setCurrentState] =
    useState<AppState>("login");
  const [user, setUser] = useState<User | null>(null);
  const [currentBooking, setCurrentBooking] =
    useState<BookingData | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration and check for existing session
  useEffect(() => {
    setIsHydrated(true);
    
    // Check for existing session cookie
    const checkSession = () => {
      const userInfoCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_info='));
      
      if (userInfoCookie) {
        try {
          const userInfo = JSON.parse(decodeURIComponent(userInfoCookie.split('=')[1]));
          console.log('Existing session found:', userInfo);
          setUser(userInfo);
          
          // Route based on user role
          if (userInfo.role === "Manager") {
            setCurrentState("manager-approval");
          } else if (userInfo.role === "HR") {
            setCurrentState("hr-approval");
          } else if (userInfo.role === "Admin") {
            setCurrentState("admin");
          } else {
            setCurrentState("my-bookings");
          }
        } catch (error) {
          console.error('Error parsing user session:', error);
        }
      }
    };
    
    checkSession();
  }, []);

  // Handle invalid state combinations with useEffect - only run after hydration
  useEffect(() => {
    if (!isHydrated) return;
    
    // If we're not on login page but have no user, redirect to login
    if (currentState !== "login" && !user) {
      setCurrentState("login");
      setCurrentBooking(null);
      return;
    }

    // If we're on approval page but have no booking, redirect based on user role
    if (
      currentState === "approval" &&
      !currentBooking &&
      user
    ) {
      if (user.role === "Manager") {
        setCurrentState("manager-approval");
      } else if (user.role === "Admin") {
        setCurrentState("admin");
      } else {
        setCurrentState("my-bookings");
      }
      return;
    }

    // Validate user role matches current state
    if (user) {
      if (
        currentState === "manager-approval" &&
        user.role !== "Manager"
      ) {
        setCurrentState("my-bookings");
        return;
      }
      if (
        currentState === "hr-approval" &&
        user.role !== "HR"
      ) {
        setCurrentState("my-bookings");
        return;
      }
      if (currentState === "admin" && user.role !== "Admin") {
        setCurrentState("my-bookings");
        return;
      }
    }
  }, [isHydrated, currentState, user, currentBooking]);

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>;
  }

  const handleLogin = (userData: User) => {
    setUser(userData);

    // Route based on user role
    if (userData.role === "Manager") {
      setCurrentState("manager-approval");
    } else if (userData.role === "HR") {
      setCurrentState("hr-approval");
    } else if (userData.role === "Admin") {
      setCurrentState("admin");
    } else {
      setCurrentState("my-bookings");
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API - don't logout from Azure AD, just clear local session
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logoutFromAzure: false }), // Changed to false
      });

      const data = await response.json();
      
      // Clear local state
      setUser(null);
      setCurrentBooking(null);
      setCurrentState("login");
      
      // Clear cookies on client side as well
      document.cookie = 'user_info=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Stay on the current page (login state will show login page)
      // No need to redirect since we're already setting state to "login"
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear local state even if API call fails
      setUser(null);
      setCurrentBooking(null);
      setCurrentState("login");
      // Clear cookies on error too
      document.cookie = 'user_info=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  const handleBookingSubmitted = (booking: BookingData) => {
    setCurrentBooking(booking);
    setCurrentState("confirmation"); // Changed from "approval" to "confirmation"
  };

  const handleBackToBooking = () => {
    setCurrentBooking(null);
    setCurrentState("booking");
  };

  const handleBookingProcessed = (
    booking: BookingData,
    action: "approve" | "reject",
    comment?: string,
  ) => {
    // Handle booking approval/rejection
    console.log(`Booking ${action}ed:`, booking, comment);
    // In a real app, this would update the backend
  };

  const handleNewBooking = () => {
    setCurrentState("booking");
  };

  const handleBackToMyBookings = () => {
    setCurrentBooking(null);
    setCurrentState("my-bookings");
  };

  // Development Mode UI - Quick role switcher
  const renderDevMode = () => {
    if (!DEV_MODE) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50 bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500 rounded-lg p-4 shadow-lg">
        <div className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">
          ⚠️ DEV MODE
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-700 dark:text-gray-300">Quick Login As:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLogin(MOCK_USERS.employee)}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Employee
            </button>
            <button
              onClick={() => handleLogin(MOCK_USERS.manager)}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              Manager
            </button>
            <button
              onClick={() => handleLogin(MOCK_USERS.hr)}
              className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              HR
            </button>
            <button
              onClick={() => handleLogin(MOCK_USERS.admin)}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              Admin
            </button>
          </div>
          {user && (
            <div className="mt-2 pt-2 border-t border-yellow-400">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Current: {user.name} ({user.role})
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setCurrentState("booking")}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Booking
                </button>
                <button
                  onClick={() => setCurrentState("my-bookings")}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  My Bookings
                </button>
                {user.role === 'Manager' && (
                  <button
                    onClick={() => setCurrentState("manager-approval")}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Manager Page
                  </button>
                )}
                {user.role === 'HR' && (
                  <button
                    onClick={() => setCurrentState("hr-approval")}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    HR Page
                  </button>
                )}
                {user.role === 'Admin' && (
                  <button
                    onClick={() => setCurrentState("admin")}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Admin Page
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render based on current state
  const renderContent = () => {
    switch (currentState) {
      case "login":
        return <LoginPage onLogin={handleLogin} />;

      case "booking":
        if (!user) return <LoginPage onLogin={handleLogin} />;
        return (
          <CarBookingPage
            user={user}
            onLogout={handleLogout}
            onBookingSubmitted={handleBookingSubmitted}
          />
        );

      case "my-bookings":
        if (!user) return <LoginPage onLogin={handleLogin} />;
        return (
          <MyBookingsPage
            user={user}
            onLogout={handleLogout}
            onNewBooking={handleNewBooking}
          />
        );

      case "confirmation":
        if (!currentBooking || !user) {
          setCurrentState("my-bookings");
          return <div>Loading...</div>;
        }
        return (
          <BookingConfirmation
            booking={currentBooking}
            managerName={user.managerName}
            managerEmail={user.managerEmail}
            onViewBookings={handleBackToMyBookings}
            onNewBooking={handleBackToBooking}
          />
        );

      case "manager-approval":
        if (!user || user.role !== "Manager") {
          return <LoginPage onLogin={handleLogin} />;
        }
        return (
          <ManagerApprovalPage
            user={user}
            onLogout={handleLogout}
            onBookingProcessed={handleBookingProcessed}
          />
        );

      case "hr-approval":
        if (!user || user.role !== "HR") {
          return <LoginPage onLogin={handleLogin} />;
        }
        return (
          <HRApprovalPage
            user={user}
            onLogout={handleLogout}
            onBookingProcessed={handleBookingProcessed}
          />
        );

      case "admin":
        if (!user || user.role !== "Admin") {
          return <LoginPage onLogin={handleLogin} />;
        }
        return <AdminPage user={user} onLogout={handleLogout} />;

      default:
        // Fallback to login for any unhandled state
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  // Wrap with providers only for pages that need TRPC
  if (currentState === "admin" || currentState === "manager-approval" || currentState === "hr-approval") {
    return (
      <>
        <Providers>{renderContent()}</Providers>
        {renderDevMode()}
      </>
    );
  }
  
  return (
    <>
      {renderContent()}
      {renderDevMode()}
    </>
  );
}