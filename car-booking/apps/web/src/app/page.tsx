'use client';

import { useState, useEffect } from "react";
import { LoginPage } from "../../../../components/LoginPage";
import { CarBookingPage } from "../../../../components/CarBookingPage";
import { MyBookingsPage } from "../../../../components/MyBookingsPage";
import { AdminPage } from "../../../../components/AdminPage";
import { ManagerApprovalPage } from "../../../../components/ManagerApprovalPage";
import { HRApprovalPage } from "../../../../components/HRApprovalPage";
import { ApprovalWorkflow } from "../../../../components/ApprovalWorkflow";
import type { User, BookingData, AppState } from "@/types";

export default function App() {
  const [currentState, setCurrentState] =
    useState<AppState>("login");
  const [user, setUser] = useState<User | null>(null);
  const [currentBooking, setCurrentBooking] =
    useState<BookingData | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
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

  const handleLogout = () => {
    setUser(null);
    setCurrentBooking(null);
    setCurrentState("login");
  };

  const handleBookingSubmitted = (booking: BookingData) => {
    setCurrentBooking(booking);
    setCurrentState("approval");
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

  // Render based on current state
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

    case "approval":
      if (!currentBooking) {
        setCurrentState("my-bookings");
        return <div>Loading...</div>;
      }
      return (
        <ApprovalWorkflow
          booking={currentBooking}
          onBackToBooking={handleBackToMyBookings}
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
}