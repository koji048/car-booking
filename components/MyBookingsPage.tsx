import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckCircle, Clock, XCircle, Car, Calendar, User, Plus, MoreHorizontal } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import companyLogo from 'figma:asset/f1d5ecc615eefe5572743dd69c6f3c7cf272d0b3.png';
import type { User } from '../types';

interface CarInfo {
  id: string;
  name: string;
  type: string;
  seats: number;
  licensePlate: string;
  image: string;
}

interface Booking {
  id: string;
  user: User;
  car: CarInfo;
  departureDate: Date;
  time: string;
  status: string;
  submittedAt: Date;
  managerComment?: string;
  rejectionReason?: string;
}

interface MyBookingsPageProps {
  user: User;
  onLogout: () => void;
  onNewBooking: () => void;
}

// Mock booking history for the current user
const MOCK_USER_BOOKINGS: Booking[] = [
  {
    id: '1',
    user: { name: 'John Doe', email: 'john.doe@company.com', role: 'Employee' },
    car: {
      id: '1',
      name: 'Toyota Camry',
      type: 'Sedan',
      seats: 5,
      licensePlate: 'กข 1234 กรุงเทพมหานคร',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop'
    },
    departureDate: new Date('2024-12-20'),
    time: '09:00',
    status: 'approved',
    submittedAt: new Date('2024-12-15T10:30:00'),
    managerComment: 'Approved for client meeting'
  },
  {
    id: '2',
    user: { name: 'John Doe', email: 'john.doe@company.com', role: 'Employee' },
    car: {
      id: '2',
      name: 'Honda CR-V',
      type: 'SUV',
      seats: 7,
      licensePlate: 'คง 5678 กรุงเทพมหานคร',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
    },
    departureDate: new Date('2024-12-25'),
    time: 'Full Day',
    status: 'pending_manager_approval',
    submittedAt: new Date('2024-12-18T14:15:00')
  },
  {
    id: '3',
    user: { name: 'John Doe', email: 'john.doe@company.com', role: 'Employee' },
    car: {
      id: '3',
      name: 'Ford Focus',
      type: 'Compact',
      seats: 5,
      licensePlate: 'จฉ 9012 กรุงเทพมหานคร',
      image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop'
    },
    departureDate: new Date('2024-12-22'),
    time: '14:00',
    status: 'pending_manager_approval',
    submittedAt: new Date('2024-12-19T11:20:00')
  },
  {
    id: '4',
    user: { name: 'John Doe', email: 'john.doe@company.com', role: 'Employee' },
    car: {
      id: '4',
      name: 'Chevrolet Suburban',
      type: 'Large SUV',
      seats: 8,
      licensePlate: 'ชซ 3456 กรุงเทพมหานคร',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
    },
    departureDate: new Date('2024-12-10'),
    time: '08:00',
    status: 'rejected_by_manager',
    submittedAt: new Date('2024-12-08T09:45:00'),
    rejectionReason: 'Vehicle not available for requested date'
  }
];

const STATUS_CONFIG = {
  'pending_manager_approval': {
    label: 'Pending Manager Approval',
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
  'rejected_by_manager': {
    label: 'Rejected',
    variant: 'destructive' as const,
    color: 'text-red-600',
    icon: XCircle
  }
};

export function MyBookingsPage({ user, onLogout, onNewBooking }: MyBookingsPageProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
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

  const pendingBookings = MOCK_USER_BOOKINGS.filter(b => 
    b.status === 'pending_manager_approval'
  );
  
  const approvedBookings = MOCK_USER_BOOKINGS.filter(b => b.status === 'approved');
  
  const rejectedBookings = MOCK_USER_BOOKINGS.filter(b => 
    b.status === 'rejected_by_manager'
  );

  const renderBookingCard = (booking: Booking) => {
    const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
    const StatusIcon = statusConfig.icon;

    return (
      <Card key={booking.id} className="hover:bg-accent/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-16 h-12 overflow-hidden rounded-md flex-shrink-0">
                <ImageWithFallback
                  src={booking.car.image}
                  alt={booking.car.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium">{booking.car.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {booking.car.type} • {booking.car.seats} seats
                </p>
                <div className="inline-block bg-muted/50 border border-border rounded px-1.5 py-0.5 mt-1">
                  <p className="text-xs font-mono">{booking.car.licensePlate}</p>
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
                  <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                    View Details
                  </DropdownMenuItem>
                  {booking.status.includes('pending') && (
                    <DropdownMenuItem className="text-red-600">
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
                  {formatDate(booking.departureDate).split(',')[1]}
                </p>
                <p className="text-muted-foreground text-xs">
                  {booking.time === 'Full Day' ? 'Full Day' : booking.time}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-muted-foreground text-xs">Submitted</p>
              <p className="text-xs">{formatDateTime(booking.submittedAt)}</p>
            </div>
          </div>

          {/* Show rejection reason if rejected */}
          {booking.rejectionReason && (
            <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
              <p className="text-destructive font-medium">Rejection Reason:</p>
              <p className="text-destructive">{booking.rejectionReason}</p>
            </div>
          )}

          {/* Show manager comment if approved */}
          {booking.managerComment && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
              <p className="text-green-800 font-medium">Manager Comment:</p>
              <p className="text-green-700">{booking.managerComment}</p>
            </div>
          )}
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
            <img src={companyLogo} alt="GS Company" className="h-6 sm:h-8 w-auto" />
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
              <User className="h-4 w-4" />
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

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Booking Details</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedBooking(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Car Information */}
              <div className="flex items-start gap-4">
                <div className="w-24 h-18 overflow-hidden rounded-md">
                  <ImageWithFallback
                    src={selectedBooking.car.image}
                    alt={selectedBooking.car.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{selectedBooking.car.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.car.type} • {selectedBooking.car.seats} seats
                  </p>
                  <div className="inline-block bg-muted/50 border border-border rounded px-2 py-1 mt-1">
                    <p className="text-xs font-mono">{selectedBooking.car.licensePlate}</p>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Travel Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedBooking.departureDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.time === 'Full Day' ? 'Full Day' : selectedBooking.time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status and Comments */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Status:</h4>
                  <Badge variant={STATUS_CONFIG[selectedBooking.status as keyof typeof STATUS_CONFIG].variant}>
                    {STATUS_CONFIG[selectedBooking.status as keyof typeof STATUS_CONFIG].label}
                  </Badge>
                </div>

                {selectedBooking.managerComment && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="font-medium text-green-800">Manager Comment:</p>
                    <p className="text-green-700 text-sm">{selectedBooking.managerComment}</p>
                  </div>
                )}

                {selectedBooking.rejectionReason && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                    <p className="font-medium text-destructive">Rejection Reason:</p>
                    <p className="text-destructive text-sm">{selectedBooking.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="p-3 bg-muted/50 rounded">
                <h4 className="font-medium mb-2">Request Timeline</h4>
                <p className="text-sm">
                  <strong>Submitted:</strong> {formatDateTime(selectedBooking.submittedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}