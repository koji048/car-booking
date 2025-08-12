import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { CheckCircle, XCircle, Clock, User, Car, Calendar, MessageSquare } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import companyLogo from 'figma:asset/f1d5ecc615eefe5572743dd69c6f3c7cf272d0b3.png';

interface User {
  name: string;
  email: string;
  role: string;
}

interface Booking {
  id?: string;
  user: any;
  car: any;
  departureDate: Date;
  time: string;
  status: string;
  submittedAt: Date;
  numberOfDrivers?: number;
  numberOfCompanions?: number;
  driverNames?: string[];
  companionNames?: string[];
}

interface ManagerApprovalPageProps {
  user: User;
  onLogout: () => void;
  onBookingProcessed: (booking: Booking, action: 'approve' | 'reject', comment?: string) => void;
}

// Mock booking requests for the manager to review
const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    user: { name: 'John Smith', email: 'john.smith@company.com', role: 'Employee' },
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
    status: 'pending_manager_approval',
    submittedAt: new Date('2024-12-18T10:30:00'),
    numberOfDrivers: 1,
    numberOfCompanions: 2,
    driverNames: ['John Smith'],
    companionNames: ['Alice Johnson', 'Bob Wilson']
  },
  {
    id: '2',
    user: { name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Employee' },
    car: {
      id: '2',
      name: 'Honda CR-V',
      type: 'SUV',
      seats: 7,
      licensePlate: 'คง 5678 กรุงเทพมหานคร',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
    },
    departureDate: new Date('2024-12-22'),
    time: 'Full Day',
    status: 'pending_manager_approval',
    submittedAt: new Date('2024-12-18T14:15:00'),
    numberOfDrivers: 2,
    numberOfCompanions: 3,
    driverNames: ['Sarah Johnson', 'Mike Davis'],
    companionNames: ['Lisa Chen', 'David Brown', 'Emma Williams']
  }
];

export function ManagerApprovalPage({ user, onLogout, onBookingProcessed }: ManagerApprovalPageProps) {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleBookingAction = async (booking: Booking, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      // Update booking status
      const updatedBookings = bookings.map(b => 
        b.id === booking.id 
          ? { ...b, status: action === 'approve' ? 'manager_approved' : 'rejected_by_manager' }
          : b
      );
      
      setBookings(updatedBookings);
      onBookingProcessed(booking, action, comment);
      setSelectedBooking(null);
      setComment('');
      setIsProcessing(false);
    }, 1000);
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending_manager_approval');
  const processedBookings = bookings.filter(b => b.status !== 'pending_manager_approval');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={companyLogo} alt="GS Company" className="h-8 w-auto" />
            <div className="h-6 w-px bg-border" />
            <CheckCircle className="h-6 w-6" />
            <h1>Manager Approval Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h2>Pending Approvals</h2>
          <p className="text-muted-foreground">Review and approve car booking requests from your team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Requests List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests ({pendingBookings.length})</CardTitle>
                <CardDescription>Click on a request to review details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No pending requests
                  </p>
                ) : (
                  pendingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedBooking?.id === booking.id 
                          ? 'border-primary bg-accent' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{booking.user.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {booking.car.name}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.departureDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDateTime(booking.submittedAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recently Processed */}
            {processedBookings.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recently Processed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {processedBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="p-2 border rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span>{booking.user.name}</span>
                        <Badge 
                          variant={booking.status.includes('rejected') ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {booking.status.includes('rejected') ? 'Rejected' : 'Approved'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Details */}
          <div className="lg:col-span-2">
            {selectedBooking ? (
              <div className="space-y-6">
                {/* Booking Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Request Details</CardTitle>
                    <CardDescription>
                      Review the booking details and make your decision
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Employee Information */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedBooking.user.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedBooking.user.email}</p>
                        <Badge variant="outline" className="mt-1">{selectedBooking.user.role}</Badge>
                      </div>
                    </div>

                    {/* Car Information */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-16 overflow-hidden rounded-md">
                        <ImageWithFallback
                          src={selectedBooking.car.image}
                          alt={selectedBooking.car.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{selectedBooking.car.name}</p>
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

                    {/* Driver and Companion Information */}
                    {(selectedBooking.numberOfDrivers || selectedBooking.numberOfCompanions) && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <p className="font-medium">Travel Party</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Drivers */}
                          {selectedBooking.numberOfDrivers && selectedBooking.numberOfDrivers > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Drivers ({selectedBooking.numberOfDrivers})
                              </p>
                              <div className="space-y-1">
                                {selectedBooking.driverNames?.map((name, index) => (
                                  <div key={`driver-${index}`} className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                    <p className="text-sm">
                                      {name || `Driver ${index + 1}`}
                                      {index === 0 && ' (Primary)'}
                                    </p>
                                  </div>
                                )) || (
                                  <p className="text-sm text-muted-foreground">
                                    {selectedBooking.numberOfDrivers} driver(s) - names not provided
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Companions */}
                          {selectedBooking.numberOfCompanions && selectedBooking.numberOfCompanions > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Companions ({selectedBooking.numberOfCompanions})
                              </p>
                              <div className="space-y-1">
                                {selectedBooking.companionNames?.map((name, index) => (
                                  <div key={`companion-${index}`} className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                                    <p className="text-sm">
                                      {name || `Companion ${index + 1}`}
                                    </p>
                                  </div>
                                )) || (
                                  <p className="text-sm text-muted-foreground">
                                    {selectedBooking.numberOfCompanions} companion(s) - names not provided
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Summary */}
                        <div className="p-3 bg-accent/50 border border-border rounded-md">
                          <p className="text-sm">
                            <strong>Total Travelers:</strong>{' '}
                            {(selectedBooking.numberOfDrivers || 0) + (selectedBooking.numberOfCompanions || 0)} people
                            {' '}({selectedBooking.numberOfDrivers || 0} driver(s), {selectedBooking.numberOfCompanions || 0} companion(s))
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Submission Info */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        <strong>Submitted:</strong> {formatDateTime(selectedBooking.submittedAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Approval Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Manager Decision</CardTitle>
                    <CardDescription>
                      Approve to send to HR for final approval, or reject this request
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="comment">Comment (Optional)</Label>
                      <Textarea
                        id="comment"
                        placeholder="Add any notes or comments about this decision..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-20"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleBookingAction(selectedBooking, 'approve')}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Approve Request'}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={() => handleBookingAction(selectedBooking, 'reject')}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Reject Request'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Select a Request</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a booking request from the list to review details and make a decision
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}