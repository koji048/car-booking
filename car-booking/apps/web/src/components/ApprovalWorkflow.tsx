import { useState, useEffect } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Badge } from '@ui/badge';
import { CheckCircle, Clock, User as UserIcon, Users, Car, Calendar, MapPin } from 'lucide-react';
import type { User, BookingData, AppState } from '@/types';

interface ApprovalWorkflowProps {
  booking: BookingData;
  onBackToBooking: () => void;
}

const APPROVAL_STEPS = [
  {
    id: 'submitted',
    title: 'Request Submitted',
    description: 'Booking request has been submitted',
    icon: CheckCircle,
    status: 'completed'
  },
  {
    id: 'manager_review',
    title: 'Manager Approval',
    description: 'Waiting for your direct manager to approve',
    icon: UserIcon,
    status: 'current'
  },
  {
    id: 'hr_review',
    title: 'HR Approval',
    description: 'Final approval from HR department',
    icon: Users,
    status: 'pending'
  },
  {
    id: 'approved',
    title: 'Booking Confirmed',
    description: 'Your booking has been confirmed',
    icon: CheckCircle,
    status: 'pending'
  }
];

export function ApprovalWorkflow({ booking, onBackToBooking }: ApprovalWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (!isSimulating) return;

    const timer = setTimeout(() => {
      if (currentStep < APPROVAL_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsSimulating(false);
        // Start countdown when booking is completed
        setIsRedirecting(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentStep, isSimulating]);

  // Countdown effect for auto-redirect
  useEffect(() => {
    if (!isRedirecting) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto-redirect when countdown reaches 0
      onBackToBooking();
    }
  }, [countdown, isRedirecting, onBackToBooking]);

  const handleManualNavigation = () => {
    setIsRedirecting(false);
    onBackToBooking();
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'current': return 'secondary';
      default: return 'outline';
    }
  };

  const isCompleted = currentStep >= APPROVAL_STEPS.length - 1 && !isSimulating;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Car className="h-6 w-6" />
            <h1>Booking Request Status</h1>
          </div>
          <Button variant="outline" onClick={handleManualNavigation}>
            {isCompleted ? 'View My Bookings' : 'New Booking'}
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Your car booking request summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Vehicle Request</p>
                  <p className="text-sm text-muted-foreground">Car ID: {booking.carId}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {booking.returnDate ? (
                      booking.departureDate === booking.returnDate ? (
                        `${formatDate(booking.departureDate)} (Same day return)`
                      ) : (
                        `${formatDate(booking.departureDate)} → ${formatDate(booking.returnDate)}`
                      )
                    ) : (
                      formatDate(booking.departureDate)
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.returnDate ? 'Round trip' : 'One way'} • 
                    {booking.departureTime === 'Full Day' ? ' Full Day' : ` ${booking.departureTime}`}
                    {booking.returnTime && booking.returnTime !== booking.departureTime && ` → ${booking.returnTime}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{booking.userName}</p>
                  <p className="text-sm text-muted-foreground">{booking.userId}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.createdAt ? formatDateTime(booking.createdAt) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Information */}
            {booking.destination && (
              <div className="border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">Destination</p>
                      <p className="text-sm text-muted-foreground">{booking.destination}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Reason */}
            {booking.reason && (
              <div className="border-t border-border pt-4">
                <div className="space-y-2">
                  <p className="font-medium">Booking Purpose</p>
                  <p className="text-sm text-primary">{booking.reason}</p>
                </div>
              </div>
            )}

            {/* Driver and Companion Information */}
            {(booking.numberOfDrivers || booking.numberOfCompanions) && (
              <div className="border-t border-border pt-4">
                <div className="space-y-3">
                  <p className="font-medium">Travel Party</p>
                  
                  {/* Driver Information */}
                  {booking.numberOfDrivers && booking.numberOfDrivers > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          Drivers ({booking.numberOfDrivers})
                        </p>
                      </div>
                      {booking.driverNames && booking.driverNames.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {booking.driverNames.map((name, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              {index + 1}. {name} {index === 0 ? '(Primary)' : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Companion Information */}
                  {booking.numberOfCompanions && booking.numberOfCompanions > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          Companions ({booking.numberOfCompanions})
                        </p>
                      </div>
                      {booking.companionNames && booking.companionNames.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {booking.companionNames.map((name, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              {index + 1}. {name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total Summary */}
                  <div className="ml-6 pt-2 border-t border-border">
                    <p className="text-sm font-medium text-primary">
                      Total Travelers: {(booking.numberOfDrivers || 0) + (booking.numberOfCompanions || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Progress</CardTitle>
            <CardDescription>
              {isCompleted 
                ? 'Your booking has been approved!' 
                : 'Your request is being processed through the approval workflow'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {APPROVAL_STEPS.map((step, index) => {
                const status = getStepStatus(index);
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2
                      ${status === 'completed' 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : status === 'current'
                        ? 'bg-secondary border-primary text-foreground animate-pulse'
                        : 'bg-background border-border text-muted-foreground'
                      }
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{step.title}</h4>
                        <Badge variant={getStatusBadgeVariant(status)}>
                          {status === 'completed' ? 'Completed' : 
                           status === 'current' ? 'In Progress' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      
                      {status === 'current' && isSimulating && (
                        <p className="text-sm text-primary mt-1">Processing...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {isCompleted && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-700">Booking Confirmed!</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your car booking has been approved. You can pick up the vehicle on {formatDate(booking.departureDate)} at {booking.departureTime}.
                  </p>
                </div>

                {/* Navigation Section */}
                <div className="p-4 border border-border rounded-lg bg-card">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="font-medium">What's next?</p>
                      <p className="text-sm text-muted-foreground">
                        {isRedirecting 
                          ? `Redirecting to your bookings in ${countdown} seconds...`
                          : 'View your booking details and manage your reservations'
                        }
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {isRedirecting && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>{countdown}s</span>
                        </div>
                      )}
                      <Button onClick={handleManualNavigation} className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        View My Bookings
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}