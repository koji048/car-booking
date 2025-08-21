'use client';

import { useState } from 'react';
import { Button } from '@car-booking/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@car-booking/ui';
import { Badge } from '@car-booking/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@car-booking/ui';
import { CheckCircle, Clock, XCircle, Car, Calendar, User as UserIcon, Plus, MoreHorizontal, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@car-booking/ui';
import { toast } from 'sonner';
import type { User } from '@car-booking/types';

interface MyBookingsPageProps {
  user: User;
  onLogout: () => void;
  onNewBooking: () => void;
}

const STATUS_CONFIG = {
  'pending': {
    label: 'Pending',
    variant: 'secondary' as const,
    color: 'text-yellow-600',
    icon: Clock
  },
  'approved': {
    label: 'Approved',
    variant: 'default' as const,
    color: 'text-green-600',
    icon: CheckCircle
  },
  'rejected': {
    label: 'Rejected',
    variant: 'destructive' as const,
    color: 'text-red-600',
    icon: XCircle
  }
};

export function MyBookingsPage({ user, onLogout, onNewBooking }: MyBookingsPageProps) {
  // Mock data for demonstration
  const [bookings] = useState([
    {
      id: '1',
      vehicle: {
        name: 'Toyota Camry',
        type: 'Sedan',
        seats: 5,
        licensePlate: 'ABC-1234',
        imageUrl: '/car1.jpg'
      },
      departureDate: new Date('2024-01-20'),
      departureTime: '09:00 AM',
      status: 'pending',
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      vehicle: {
        name: 'Honda CR-V',
        type: 'SUV',
        seats: 7,
        licensePlate: 'XYZ-5678',
        imageUrl: '/car2.jpg'
      },
      departureDate: new Date('2024-01-18'),
      departureTime: '14:00 PM',
      status: 'approved',
      createdAt: new Date('2024-01-10'),
      approvals: [{
        approvalLevel: 'manager',
        status: 'approved',
        comments: 'Approved for business trip'
      }]
    }
  ]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const rejectedBookings = bookings.filter(b => b.status === 'rejected');

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      toast.success('Booking cancelled successfully');
    }
  };

  const renderBookingCard = (booking: any) => {
    const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;

    return (
      <Card key={booking.id} className="hover:bg-accent/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-16 h-12 overflow-hidden rounded-md flex-shrink-0 bg-muted">
                <Car className="w-full h-full p-2 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium">{booking.vehicle?.name || 'Vehicle'}</h4>
                <p className="text-sm text-muted-foreground">
                  {booking.vehicle?.type || 'N/A'} • {booking.vehicle?.seats || 0} seats
                </p>
                <div className="inline-block bg-muted/50 border border-border rounded px-1.5 py-0.5 mt-1">
                  <p className="text-xs font-mono">{booking.vehicle?.licensePlate || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <Badge variant={statusConfig.variant} className="text-xs whitespace-nowrap">
                <StatusIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{statusConfig.label}</span>
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    View Details
                  </DropdownMenuItem>
                  {booking.status === 'pending' && (
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel Request
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {booking.departureDate ? formatDate(booking.departureDate).split(',')[1] : 'N/A'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {booking.departureTime || 'N/A'}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-muted-foreground text-xs">Submitted</p>
              <p className="text-xs">{booking.createdAt ? formatDateTime(booking.createdAt) : 'N/A'}</p>
            </div>
          </div>

          {/* Show approval comments */}
          {booking.approvals?.map((approval: any, index: number) => (
            <div key={index} className={`mt-3 p-2 rounded text-sm ${
              approval.status === 'approved' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              <p className={`font-medium ${
                approval.status === 'approved' ? 'text-green-800' : 'text-destructive'
              }`}>
                {approval.approvalLevel === 'manager' ? 'Manager' : 'HR'} {approval.status === 'approved' ? 'Comment' : 'Rejection'}:
              </p>
              <p className={approval.status === 'approved' ? 'text-green-700' : 'text-destructive'}>
                {approval.comments || 'No comment provided'}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-4 sm:h-6 w-px bg-border" />
            <Car className="h-5 sm:h-6 w-5 sm:w-6" />
            <h1 className="text-sm sm:text-base">My Bookings</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button onClick={onNewBooking} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">New Booking</span>
              <span className="xs:hidden">New</span>
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="text-sm">{user.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout} className="text-xs px-2 sm:px-3">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 p-4 sm:p-6">
        <div className="mb-6">
          <h2>Your Car Bookings</h2>
          <p className="text-muted-foreground">Manage and track your vehicle booking requests</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto sm:mx-0">
            <TabsTrigger value="pending" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Pending</span>
              ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Approved</span>
              ({approvedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Rejected</span>
              ({rejectedBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Bookings */}
          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Pending Requests</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You don't have any booking requests waiting for approval
                  </p>
                  <Button onClick={onNewBooking} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Booking
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingBookings.map(renderBookingCard)}
              </div>
            )}
          </TabsContent>

          {/* Approved Bookings */}
          <TabsContent value="approved" className="space-y-4">
            {approvedBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Approved Bookings</h3>
                  <p className="text-sm text-muted-foreground">
                    Your approved bookings will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {approvedBookings.map(renderBookingCard)}
              </div>
            )}
          </TabsContent>

          {/* Rejected Bookings */}
          <TabsContent value="rejected" className="space-y-4">
            {rejectedBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Rejected Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    Any rejected booking requests will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {rejectedBookings.map(renderBookingCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}