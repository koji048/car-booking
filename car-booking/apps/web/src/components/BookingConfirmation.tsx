'use client';

import { useEffect, useState } from 'react';
import { Button } from '@car-booking/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@car-booking/ui';
import { Badge } from '@car-booking/ui';
import { Alert, AlertDescription } from '@car-booking/ui';
import { CheckCircle, Clock, User as UserIcon, Car, Calendar, MapPin, ArrowRight, Info } from 'lucide-react';
import type { BookingData } from '@car-booking/types';

interface BookingConfirmationProps {
  booking: BookingData;
  managerName?: string;
  managerEmail?: string;
  onViewBookings: () => void;
  onNewBooking: () => void;
}

/**
 * Clean, honest booking confirmation page
 * Shows what actually happened: booking was submitted, awaiting approval
 * No fake simulations or misleading "confirmed" messages
 */
export function BookingConfirmation({ 
  booking, 
  managerName, 
  managerEmail,
  onViewBookings,
  onNewBooking 
}: BookingConfirmationProps) {
  const [countdown, setCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(true);

  // Auto-redirect to My Bookings after 5 seconds
  useEffect(() => {
    if (!isRedirecting) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      onViewBookings();
    }
  }, [countdown, isRedirecting, onViewBookings]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    if (time === 'Full Day') return 'Full Day';
    return time;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h1 className="text-lg font-semibold">Booking Submitted Successfully</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Success Alert */}
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Success!</strong> Your booking request has been submitted.
            {managerName ? (
              <> It has been sent to <strong>{managerName}</strong> for approval.</>
            ) : (
              <> It has been sent to <strong>HR Department</strong> for approval.</>
            )}
          </AlertDescription>
        </Alert>

        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Reference: {booking.id}</CardDescription>
              </div>
              <Badge variant="secondary" className="text-orange-600">
                <Clock className="h-3 w-3 mr-1" />
                Pending Approval
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trip Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Trip Dates</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(booking.departureDate)}
                    {booking.returnDate && booking.departureDate !== booking.returnDate && (
                      <> to {formatDate(booking.returnDate)}</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(booking.departureTime)}
                    {booking.returnTime && booking.returnTime !== booking.departureTime && (
                      <> - {formatTime(booking.returnTime)}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Vehicle</p>
                  <p className="text-sm text-muted-foreground">Vehicle ID: {booking.carId}</p>
                  {booking.passengers && (
                    <p className="text-xs text-muted-foreground">{booking.passengers} passenger(s)</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Destination</p>
                  <p className="text-sm text-muted-foreground">{booking.destination}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Purpose</p>
                  <p className="text-sm text-muted-foreground">{booking.purpose || booking.reason || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Manager Review</p>
                  <p className="text-sm text-muted-foreground">
                    {managerName ? (
                      <>{managerName} will review your booking request</>
                    ) : (
                      <>HR Department will review your booking request</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Email Notification</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email when your booking is approved or if changes are needed
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Track Status</p>
                  <p className="text-sm text-muted-foreground">
                    Check your booking status anytime in "My Bookings"
                  </p>
                </div>
              </div>
            </div>

            {/* Approver Information */}
            {managerEmail && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Sent for Approval to:</p>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium">{managerName}</p>
                  <p className="text-sm text-muted-foreground">{managerEmail}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                {isRedirecting ? (
                  <p className="text-sm text-muted-foreground">
                    Redirecting to My Bookings in <strong>{countdown}</strong> seconds...
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    View and track all your bookings
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRedirecting(false);
                    onNewBooking();
                  }}
                >
                  New Booking
                </Button>
                <Button 
                  onClick={() => {
                    setIsRedirecting(false);
                    onViewBookings();
                  }}
                  className="gap-2"
                >
                  View My Bookings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}