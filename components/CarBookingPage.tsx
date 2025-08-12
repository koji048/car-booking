import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Car, Calendar, Clock, MapPin, User, FileText, Users } from 'lucide-react';
import { GoogleFlightsDatePicker } from './GoogleFlightsDatePicker';
import { LocationPicker } from './LocationPicker';
import { ImageWithFallback } from './figma/ImageWithFallback';
import companyLogo from 'figma:asset/f1d5ecc615eefe5572743dd69c6f3c7cf272d0b3.png';
import type { User, BookingData } from '../types';

interface CarBookingPageProps {
  user: User;
  onLogout: () => void;
  onBookingSubmitted: (booking: BookingData) => void;
}

const CARS = [
  {
    id: '1',
    name: 'Toyota Camry',
    type: 'Sedan',
    seats: 5,
    licensePlate: 'กข 1234 กรุงเทพมหานคร',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    name: 'Honda CR-V',
    type: 'SUV',
    seats: 7,
    licensePlate: 'คง 5678 กรุงเทพมหานคร',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    name: 'Ford Focus',
    type: 'Compact',
    seats: 5,
    licensePlate: 'จฉ 9012 กรุงเทพมหานคร',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop'
  },
  {
    id: '4',
    name: 'Chevrolet Suburban',
    type: 'Large SUV',
    seats: 8,
    licensePlate: 'ชซ 3456 กรุงเทพมหานคร',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
  }
];

const TIME_SLOTS = [
  'Full Day',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30'
];

export function CarBookingPage({ user, onLogout, onBookingSubmitted }: CarBookingPageProps) {
  const [departureDate, setDepartureDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedCar, setSelectedCar] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Location and reason state
  const [destination, setDestination] = useState<any>(null);
  const [bookingReason, setBookingReason] = useState<string>('');
  const [reasonDetails, setReasonDetails] = useState<string>('');
  
  // Driver and companion state
  const [numberOfDrivers, setNumberOfDrivers] = useState<number>(1);
  const [numberOfCompanions, setNumberOfCompanions] = useState<number>(0);
  const [driverNames, setDriverNames] = useState<string[]>([user.name || '']);
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSameDayChange = (checked: boolean) => {
    setIsSameDay(checked);
    if (checked && departureDate) {
      setReturnDate(departureDate);
    }
  };

  const handleDepartureDateChange = (date: Date | undefined) => {
    setDepartureDate(date);
    if (isSameDay && date) {
      setReturnDate(date);
    }
  };

  const suggestReturnTime = (departureTime: string) => {
    if (departureTime === 'Full Day') {
      return 'Full Day';
    }

    // Parse the time and suggest a return time 8 hours later
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departureMinutes = hours * 60 + minutes;
    const returnMinutes = departureMinutes + (8 * 60); // Add 8 hours

    // Cap at 16:30 (end of business day)
    const maxMinutes = 16 * 60 + 30;
    const finalReturnMinutes = Math.min(returnMinutes, maxMinutes);

    const returnHours = Math.floor(finalReturnMinutes / 60);
    const returnMins = finalReturnMinutes % 60;

    return `${returnHours.toString().padStart(2, '0')}:${returnMins.toString().padStart(2, '0')}`;
  };

  const handleTimeSelection = (time: string) => {
    setSelectedTime(time);
  };

  // Helper functions for driver and companion management
  const updateDriverCount = (count: number) => {
    setNumberOfDrivers(count);
    const newDriverNames = [...driverNames];
    
    if (count > newDriverNames.length) {
      // Add empty names for additional drivers
      for (let i = newDriverNames.length; i < count; i++) {
        newDriverNames.push('');
      }
    } else {
      // Remove excess names
      newDriverNames.splice(count);
    }
    
    setDriverNames(newDriverNames);
  };

  const updateCompanionCount = (count: number) => {
    setNumberOfCompanions(count);
    const newCompanionNames = [...companionNames];
    
    if (count > newCompanionNames.length) {
      // Add empty names for additional companions
      for (let i = newCompanionNames.length; i < count; i++) {
        newCompanionNames.push('');
      }
    } else {
      // Remove excess names
      newCompanionNames.splice(count);
    }
    
    setCompanionNames(newCompanionNames);
  };

  const updateDriverName = (index: number, name: string) => {
    const newNames = [...driverNames];
    newNames[index] = name;
    setDriverNames(newNames);
  };

  const updateCompanionName = (index: number, name: string) => {
    const newNames = [...companionNames];
    newNames[index] = name;
    setCompanionNames(newNames);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departureDate || !selectedTime || !selectedCar || !destination || !bookingReason) return;

    setIsSubmitting(true);
    
    const booking: BookingData = {
      userId: user.email, // Using email as userId
      userName: user.name,
      departureDate: departureDate.toISOString().split('T')[0], // Convert to date string
      departureTime: selectedTime,
      destination: destination.address || destination.name || 'Unknown destination',
      reason: `${bookingReason}${reasonDetails ? ` - ${reasonDetails}` : ''}`,
      carId: selectedCar,
      status: 'pending',
      createdAt: new Date().toISOString(),
      numberOfDrivers,
      numberOfCompanions,
      driverNames: driverNames.filter(name => name.trim() !== ''),
      companionNames: companionNames.filter(name => name.trim() !== '')
    };

    // Mock submission delay
    setTimeout(() => {
      onBookingSubmitted(booking);
      setIsSubmitting(false);
    }, 1000);
  };

  const isFormValid = departureDate && selectedTime && selectedCar && destination && bookingReason;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={companyLogo} alt="GS Company" className="h-8 w-auto" />
            <div className="h-6 w-px bg-border" />
            <Car className="h-6 w-6" />
            <h1>Car Booking System</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h2>Book a Vehicle</h2>
          <p className="text-muted-foreground">Select your preferred date, time, and vehicle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle>Select Date</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDepartureDate(undefined)}>
                  Reset
                </Button>
              </div>
              <CardDescription>Choose your travel date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full justify-start text-left h-16 px-4 transition-colors ${
                    departureDate ? 'border-primary bg-primary/5' : 'border-2 hover:border-primary'
                  }`}
                  onClick={() => setShowDatePicker(true)}
                >
                  <div className="flex flex-col items-start w-full">
                    <span className="text-xs text-muted-foreground mb-1">Travel Date</span>
                    <div className="flex items-center w-full">
                      <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
                      <span className="text-base font-medium">
                        {departureDate ? formatShortDate(departureDate) : "Select date"}
                      </span>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Select Time
              </CardTitle>
              <CardDescription>Available time slots (8:00 AM - 4:30 PM)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      className={`h-12 flex flex-col items-center justify-center transition-all ${
                        selectedTime === time 
                          ? "ring-2 ring-primary" 
                          : "hover:border-primary hover:bg-accent"
                      }`}
                      onClick={() => handleTimeSelection(time)}
                    >
                      <span className="text-sm font-medium">{time}</span>
                      <span className="text-xs text-muted-foreground">
                        {time === 'Full Day' ? '' : parseInt(time.split(':')[0]) < 12 ? 'AM' : 'PM'}
                      </span>
                    </Button>
                  ))}
                </div>
                {selectedTime && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-accent rounded-md border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Selected time: {selectedTime === 'Full Day' ? 'Full Day (8:00 AM - 4:30 PM)' : `${selectedTime} ${selectedTime !== 'Full Day' && parseInt(selectedTime.split(':')[0]) < 12 ? 'AM' : 'PM'}`}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTime('')}
                          className="h-8 px-2"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Car Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Select Vehicle
              </CardTitle>
              <CardDescription>Choose from available vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CARS.map((car) => (
                  <div
                    key={car.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCar === car.id
                        ? 'border-primary bg-accent'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedCar(car.id)}
                  >
                    <div className="aspect-video mb-3 overflow-hidden rounded-md">
                      <ImageWithFallback
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4>{car.name}</h4>
                      <p className="text-sm text-muted-foreground">{car.type} • {car.seats} seats</p>
                      <div className="inline-block bg-muted/50 border border-border rounded px-2 py-1 mt-2">
                        <p className="text-xs font-mono text-foreground">{car.licensePlate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location Selection */}
          <LocationPicker
            destination={destination}
            onDestinationChange={setDestination}
          />

          {/* Driver and Companion Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Driver & Companions
              </CardTitle>
              <CardDescription>Specify the number of drivers and companions with their names</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Number Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Number of Drivers */}
                <div className="space-y-2">
                  <Label>Number of Drivers *</Label>
                  <Select value={numberOfDrivers.toString()} onValueChange={(value) => updateDriverCount(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of drivers..." />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Driver' : 'Drivers'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Companions */}
                <div className="space-y-2">
                  <Label>Number of Companions</Label>
                  <Select value={numberOfCompanions.toString()} onValueChange={(value) => updateCompanionCount(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of companions..." />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Companion' : 'Companions'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Driver Names */}
              {numberOfDrivers > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Driver Names *
                  </Label>
                  <div className="grid gap-3">
                    {Array.from({ length: numberOfDrivers }, (_, index) => (
                      <div key={`driver-${index}`} className="space-y-1">
                        <Label htmlFor={`driver-name-${index}`} className="text-sm text-muted-foreground">
                          Driver {index + 1} {index === 0 ? '(Primary)' : ''}
                        </Label>
                        <Input
                          id={`driver-name-${index}`}
                          placeholder={index === 0 ? `Enter primary driver name...` : `Enter driver ${index + 1} name...`}
                          value={driverNames[index] || ''}
                          onChange={(e) => updateDriverName(index, e.target.value)}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Companion Names */}
              {numberOfCompanions > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Companion Names
                  </Label>
                  <div className="grid gap-3">
                    {Array.from({ length: numberOfCompanions }, (_, index) => (
                      <div key={`companion-${index}`} className="space-y-1">
                        <Label htmlFor={`companion-name-${index}`} className="text-sm text-muted-foreground">
                          Companion {index + 1}
                        </Label>
                        <Input
                          id={`companion-name-${index}`}
                          placeholder={`Enter companion ${index + 1} name...`}
                          value={companionNames[index] || ''}
                          onChange={(e) => updateCompanionName(index, e.target.value)}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="p-3 bg-accent/50 border border-border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Travel Party Summary</p>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• {numberOfDrivers} {numberOfDrivers === 1 ? 'Driver' : 'Drivers'}</p>
                  <p>• {numberOfCompanions} {numberOfCompanions === 1 ? 'Companion' : 'Companions'}</p>
                  <p className="font-medium text-foreground">
                    Total Travelers: {numberOfDrivers + numberOfCompanions}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <strong>Note:</strong> Primary driver must have a valid driving license. All travelers must be company employees or authorized personnel. 
                Ensure the total number of travelers doesn't exceed the selected vehicle's capacity.
              </div>
            </CardContent>
          </Card>

          {/* Booking Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Booking Reason
              </CardTitle>
              <CardDescription>Provide the purpose and details for this vehicle booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="booking-reason">Purpose of Trip *</Label>
                <Select value={bookingReason} onValueChange={setBookingReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the reason for this booking..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client-meeting">Client Meeting</SelectItem>
                    <SelectItem value="business-trip">Business Trip</SelectItem>
                    <SelectItem value="airport-transfer">Airport Transfer</SelectItem>
                    <SelectItem value="site-visit">Site Visit</SelectItem>
                    <SelectItem value="conference">Conference/Event</SelectItem>
                    <SelectItem value="training">Training/Workshop</SelectItem>
                    <SelectItem value="official-duty">Official Duty</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason-details">Additional Details</Label>
                <Textarea
                  id="reason-details"
                  placeholder="Provide additional details about your trip, including destination, purpose, client names, or any special requirements..."
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  className="min-h-20"
                />
              </div>

              {bookingReason && (
                <div className="p-3 bg-accent/50 border border-border rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Selected Purpose: {bookingReason.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      {reasonDetails && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {reasonDetails.length > 100 ? `${reasonDetails.substring(0, 100)}...` : reasonDetails}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <strong>Note:</strong> Providing detailed booking reasons helps managers and HR make informed approval decisions. 
                Emergency requests may be prioritized for faster processing.
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Booking Request'}
              </Button>
              {isFormValid && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Your request will be sent to your manager for approval
                </p>
              )}
            </CardContent>
          </Card>
        </form>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <GoogleFlightsDatePicker
            departureDate={departureDate}
            onDepartureDateChange={setDepartureDate}
            onClose={() => setShowDatePicker(false)}
          />
        )}
      </div>
    </div>
  );
}