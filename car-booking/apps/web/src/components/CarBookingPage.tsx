'use client';

import { useState, useEffect } from 'react';
import { Button } from '@car-booking/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@car-booking/ui';
import { Input } from '@car-booking/ui';
import { Label } from '@car-booking/ui';
import { Badge } from '@car-booking/ui';
import { Textarea } from '@car-booking/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@car-booking/ui';
import { Checkbox } from '@car-booking/ui';
import { Alert, AlertDescription } from '@car-booking/ui';
import { Car, Calendar, Clock, MapPin, User as UserIcon, FileText, Users, Loader2, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { User, BookingData } from '@car-booking/types';

interface CarBookingPageProps {
  user: User;
  onLogout: () => void;
  onBookingSubmitted: (booking: BookingData) => void;
  onViewMyBookings?: () => void;
}

const TIME_SLOTS = [
  'Full Day',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30'
];

// Mock vehicle data
const MOCK_VEHICLES = [
  {
    id: '1',
    name: 'Toyota Camry',
    type: 'Sedan',
    seats: 5,
    transmission: 'Automatic',
    fuelType: 'Hybrid',
    licensePlate: 'ABC-1234',
    available: true
  },
  {
    id: '2',
    name: 'Honda CR-V',
    type: 'SUV',
    seats: 7,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    licensePlate: 'XYZ-5678',
    available: true
  },
  {
    id: '3',
    name: 'Toyota Hiace',
    type: 'Van',
    seats: 12,
    transmission: 'Manual',
    fuelType: 'Diesel',
    licensePlate: 'VAN-9012',
    available: true
  }
];

export function CarBookingPage({ user, onLogout, onBookingSubmitted }: CarBookingPageProps) {
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [isSameDay, setIsSameDay] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [returnTime, setReturnTime] = useState<string>('');
  const [selectedCar, setSelectedCar] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managerInfo, setManagerInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [isLoadingManagerInfo, setIsLoadingManagerInfo] = useState(true);

  const vehicles = MOCK_VEHICLES;

  // Fetch user's manager information on component mount
  useEffect(() => {
    fetchManagerInfo();
  }, []);

  const fetchManagerInfo = async () => {
    try {
      // Check if we're in dev mode
      const isDevelopment = !document.cookie.includes('session=');
      
      if (isDevelopment) {
        // Dev mode: Use mock manager info
        if (user.role === 'Employee') {
          setManagerInfo({
            name: 'Jane Manager',
            email: 'jane.manager@company.com',
          });
        }
        // Managers, HR, and Admin don't have managers
      } else {
        // Production mode: Fetch from API
        const response = await fetch('/api/bookings/submit', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.manager) {
            setManagerInfo({
              name: data.manager.name,
              email: data.manager.email,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch manager info:', error);
    } finally {
      setIsLoadingManagerInfo(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!departureDate) {
      toast.error('Please select a departure date');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select a departure time');
      return;
    }
    if (!selectedCar) {
      toast.error('Please select a vehicle');
      return;
    }
    if (!purpose) {
      toast.error('Please enter the purpose of your trip');
      return;
    }
    if (!destination) {
      toast.error('Please enter your destination');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check if we're in dev mode or if the API is available
      const isDevelopment = !document.cookie.includes('session=');
      
      if (isDevelopment) {
        // Dev mode: Create mock booking without API call
        const bookingData: BookingData = {
          id: `BK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
          userId: user.id || 'dev-user',
          carId: selectedCar,
          departureDate: departureDate.toISOString(),
          returnDate: returnDate?.toISOString() || departureDate.toISOString(),
          departureTime: selectedTime,
          returnTime: returnTime || selectedTime,
          purpose,
          destination,
          passengers: parseInt(passengers),
          specialRequests,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        // Show success message based on manager info
        if (managerInfo) {
          toast.success(`Booking request sent to ${managerInfo.name}`);
        } else {
          toast.success('Booking submitted successfully!');
        }

        // Simulate small delay for realism
        await new Promise(resolve => setTimeout(resolve, 500));
        
        onBookingSubmitted(bookingData);
        
        // Reset form
        setSelectedCar('');
        setPurpose('');
        setDestination('');
        setPassengers('1');
        setSpecialRequests('');
      } else {
        // Production mode: Call actual API
        const response = await fetch('/api/bookings/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicleId: selectedCar,
            startDate: departureDate.toISOString(),
            endDate: returnDate?.toISOString() || departureDate.toISOString(),
            purpose,
            destination,
            passengers: parseInt(passengers),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Show success message with manager routing info
          if (result.routing?.assignedTo) {
            toast.success(result.message || `Booking request sent to ${result.routing.assignedTo}`);
          } else {
            toast.success('Booking submitted successfully!');
          }

          // Create booking data for parent component
          const bookingData: BookingData = {
            id: result.booking.id,
            userId: user.id,
            carId: selectedCar,
            departureDate: departureDate.toISOString(),
            returnDate: returnDate?.toISOString() || departureDate.toISOString(),
            departureTime: selectedTime,
            returnTime: returnTime || selectedTime,
            purpose,
            destination,
            passengers: parseInt(passengers),
            specialRequests,
            status: result.booking.status,
            createdAt: result.booking.submittedAt
          };

          onBookingSubmitted(bookingData);
          
          // Reset form
          setSelectedCar('');
          setPurpose('');
          setDestination('');
          setPassengers('1');
          setSpecialRequests('');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to submit booking');
        }
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      toast.error('Failed to submit booking request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <Car className="h-5 sm:h-6 w-5 sm:w-6" />
            <h1 className="text-sm sm:text-base font-semibold">Car Booking System</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="text-sm">{user.name}</span>
              <Badge variant="secondary" className="text-xs">{user.role}</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout} className="text-xs px-2 sm:px-3">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Book a Vehicle</h2>
          <p className="text-muted-foreground">Fill in the details below to request a vehicle for your trip</p>
        </div>

        {/* Manager Information Alert */}
        {!isLoadingManagerInfo && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {managerInfo ? (
                <>
                  Your booking request will be sent to your manager: <strong>{managerInfo.name}</strong> ({managerInfo.email})
                </>
              ) : (
                <>
                  Your booking request will be sent to <strong>HR Department</strong> for approval (no direct manager assigned)
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date and Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Trip Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departure-date">Departure Date</Label>
                    <Input
                      id="departure-date"
                      type="date"
                      value={departureDate ? departureDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDepartureDate(e.target.value ? new Date(e.target.value) : undefined)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="departure-time">Departure Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger id="departure-time">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="same-day"
                    checked={isSameDay}
                    onCheckedChange={(checked) => setIsSameDay(checked as boolean)}
                  />
                  <Label htmlFor="same-day" className="cursor-pointer">
                    Return same day
                  </Label>
                </div>

                {!isSameDay && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="return-date">Return Date</Label>
                      <Input
                        id="return-date"
                        type="date"
                        value={returnDate ? returnDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setReturnDate(e.target.value ? new Date(e.target.value) : undefined)}
                        min={departureDate ? departureDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="return-time">Return Time</Label>
                      <Select value={returnTime} onValueChange={setReturnTime}>
                        <SelectTrigger id="return-time">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="Enter your destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose of Trip</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe the purpose of your trip"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passengers">Number of Passengers</Label>
                    <Input
                      id="passengers"
                      type="number"
                      min="1"
                      max="12"
                      value={passengers}
                      onChange={(e) => setPassengers(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="special-requests">Special Requests (Optional)</Label>
                  <Textarea
                    id="special-requests"
                    placeholder="Any special requirements or requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Select Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedCar === vehicle.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedCar(vehicle.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-14 bg-muted rounded flex items-center justify-center">
                            <Car className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">{vehicle.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.type} • {vehicle.seats} seats
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {vehicle.transmission}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {vehicle.fuelType}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Plate: {vehicle.licensePlate}
                            </p>
                          </div>
                        </div>
                        {vehicle.available ? (
                          <Badge variant="outline" className="text-green-600">Available</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">Not Available</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Approval Flow */}
                <div className="pb-4 border-b">
                  <p className="text-sm text-muted-foreground mb-2">Approval Flow</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="text-sm">
                      {managerInfo ? (
                        <div>
                          <p className="font-medium">{managerInfo.name}</p>
                          <p className="text-xs text-muted-foreground">Your Manager</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">HR Department</p>
                          <p className="text-xs text-muted-foreground">No direct manager</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {departureDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Departure</p>
                    <p className="font-medium">{formatDate(departureDate)}</p>
                    {selectedTime && <p className="text-sm">{selectedTime}</p>}
                  </div>
                )}

                {!isSameDay && returnDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Return</p>
                    <p className="font-medium">{formatDate(returnDate)}</p>
                    {returnTime && <p className="text-sm">{returnTime}</p>}
                  </div>
                )}

                {destination && (
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">{destination}</p>
                  </div>
                )}

                {selectedCar && (
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-medium">
                      {vehicles.find(v => v.id === selectedCar)?.name}
                    </p>
                  </div>
                )}

                {passengers && (
                  <div>
                    <p className="text-sm text-muted-foreground">Passengers</p>
                    <p className="font-medium">{passengers} {parseInt(passengers) === 1 ? 'person' : 'people'}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !departureDate || !selectedTime || !selectedCar || !purpose || !destination}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Booking Request'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}