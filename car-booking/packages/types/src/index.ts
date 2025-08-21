// Shared TypeScript interfaces for the Car Booking Application

export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'Employee' | 'Manager' | 'HR' | 'Admin';
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
}

export interface BookingData {
  id?: string;
  userId: string;
  userName?: string;
  departureDate: string;
  departureTime: string;
  returnDate?: string;
  returnTime?: string;
  destination: string;
  purpose?: string;  // Added for consistency with CarBookingPage
  reason?: string;   // Made optional
  carId?: string;
  passengers?: number;  // Added from CarBookingPage
  specialRequests?: string;  // Added from CarBookingPage
  status?: 'pending' | 'manager_approved' | 'hr_approved' | 'approved' | 'rejected_by_manager' | 'rejected_by_hr' | 'rejected';
  managerComment?: string;
  hrComment?: string;
  createdAt?: string;
  numberOfDrivers?: number;
  numberOfCompanions?: number;
  driverNames?: string[];
  companionNames?: string[];
}

export interface CarData {
  id: string;
  model: string;
  licensePlate: string;
  imageUrl: string;
  available: boolean;
  capacity: number;
  fuelType?: string;
  year?: number;
  color?: string;
  description?: string;
}

export interface TimeSlot {
  value: string;
  label: string;
  available: boolean;
}

export interface LocationData {
  address: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

export type AppState = 'login' | 'booking' | 'my-bookings' | 'approval' | 'confirmation' | 'manager-approval' | 'hr-approval' | 'admin';

export type BookingStatus = 'pending' | 'manager_approved' | 'hr_approved' | 'approved' | 'rejected_by_manager' | 'rejected_by_hr' | 'rejected';

export type UserRole = 'Employee' | 'Manager' | 'HR' | 'Admin';