// Shared TypeScript interfaces for the Car Booking Application

export interface User {
  name: string;
  email: string;
  role: 'Employee' | 'Manager' | 'HR' | 'Admin';
}

export interface BookingData {
  id?: string;
  userId: string;
  userName: string;
  departureDate: string;
  departureTime: string;
  destination: string;
  reason: string;
  carId?: string;
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

export type AppState = 'login' | 'booking' | 'my-bookings' | 'approval' | 'manager-approval' | 'hr-approval' | 'admin';

export type BookingStatus = 'pending' | 'manager_approved' | 'hr_approved' | 'approved' | 'rejected_by_manager' | 'rejected_by_hr' | 'rejected';

export type UserRole = 'Employee' | 'Manager' | 'HR' | 'Admin';