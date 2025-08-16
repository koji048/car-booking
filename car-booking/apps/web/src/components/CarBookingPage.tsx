'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Car, Calendar, Clock, MapPin, User as UserIcon, FileText, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User, BookingData } from '@/types';

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

  const vehicles = MOCK_VEHICLES;

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
    
    // Simulate API call
    setTimeout(() => {
      const bookingData: BookingData = {
        id: Date.now().toString(),
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
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      toast.success('Booking submitted successfully!');
      onBookingSubmitted(bookingData);
      setIsSubmitting(false);
    }, 1000);
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