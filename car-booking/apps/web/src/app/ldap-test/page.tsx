'use client';

import { useState } from 'react';
import { LoginPageLDAP } from '../../components/LoginPageLDAP';
import { CarBookingPage } from '../../components/CarBookingPage';
import { MyBookingsPage } from '../../components/MyBookingsPage';
import type { User, BookingData, AppState } from '@car-booking/types';

export default function LDAPTestApp() {
  const [currentState, setCurrentState] = useState<AppState>('login');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentState('my-bookings');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentState('login');
  };

  const handleNewBooking = () => {
    setCurrentState('booking');
  };

  const handleBookingSubmitted = (booking: BookingData) => {
    console.log('Booking submitted:', booking);
    setCurrentState('my-bookings');
  };

  switch (currentState) {
    case 'login':
      return <LoginPageLDAP onLogin={handleLogin} />;

    case 'my-bookings':
      if (!user) return <LoginPageLDAP onLogin={handleLogin} />;
      return (
        <MyBookingsPage
          user={user}
          onLogout={handleLogout}
          onNewBooking={handleNewBooking}
        />
      );

    case 'booking':
      if (!user) return <LoginPageLDAP onLogin={handleLogin} />;
      return (
        <CarBookingPage
          user={user}
          onLogout={handleLogout}
          onBookingSubmitted={handleBookingSubmitted}
        />
      );

    default:
      return <LoginPageLDAP onLogin={handleLogin} />;
  }
}