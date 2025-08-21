'use client';

import { useState } from 'react';
import { Button } from '@car-booking/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@car-booking/ui';
import { Badge } from '@car-booking/ui';
import { Textarea } from '@car-booking/ui';
import { Label } from '@car-booking/ui';
import { CheckCircle, XCircle, Clock, User, Car, Calendar, MessageSquare, Users, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { trpc } from '../utils/trpc';
import { toast } from 'sonner';

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
  managerComment?: string;
  numberOfDrivers?: number;
  numberOfCompanions?: number;
  driverNames?: string[];
  companionNames?: string[];
}

interface HRApprovalPageProps {
  user: User;
  onLogout: () => void;
  onBookingProcessed?: (booking: any, action: 'approve' | 'reject', comment?: string) => void;
}


export function HRApprovalPage({ user, onLogout, onBookingProcessed }: HRApprovalPageProps) {
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [comment, setComment] = useState('');
  
  // Fetch pending HR approvals using tRPC
  const { data: pendingData, isLoading, error, refetch } = trpc.approvals.pending.useQuery({
    approvalLevel: 'hr'
  });
  const bookings = pendingData || [];
  
  // Approval mutations
  const approveMutation = trpc.approvals.approve.useMutation({
    onSuccess: () => {
      toast.success('Booking approved successfully');
      setSelectedBooking(null);
      setComment('');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve booking: ${error.message}`);
    }
  });
  
  const rejectMutation = trpc.approvals.reject.useMutation({
    onSuccess: () => {
      toast.success('Booking rejected');
      setSelectedBooking(null);
      setComment('');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to reject booking: ${error.message}`);
    }
  });

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

  const handleBookingAction = async (booking: any, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      await approveMutation.mutateAsync({
        bookingId: booking.id,
        comments: comment || undefined
      });
    } else {
      await rejectMutation.mutateAsync({
        bookingId: booking.id,
        comments: comment || 'Request rejected by HR'
      });
    }
    
    if (onBookingProcessed) {
      onBookingProcessed(booking, action, comment);
    }
  };

  const pendingBookings = bookings.filter(b => (b.status as any) === 'pending_hr');
  const processedBookings = bookings.filter(b => (b.status as any) === 'approved' || (b.status as any) === 'rejected');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Logo removed */}
            <div className="h-6 w-px bg-border" />
            <Users className="h-6 w-6" />
            <h1>HR Approval Dashboard</h1>
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
          <h2>HR Final Approval</h2>
          <p className="text-muted-foreground">Review manager-approved booking requests for final HR approval</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Requests List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Pending HR Approval ({pendingBookings.length})</CardTitle>
                <CardDescription>Manager-approved requests awaiting HR review</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-destructive">Failed to load bookings</p>
                    <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                      Try Again
                    </Button>
                  </div>
                ) : pendingBookings.length === 0 ? (
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
                        <p className="font-medium text-sm">{(booking as any).user?.name || 'Unknown User'}</p>
                        <Badge variant="outline" className="text-xs">
                          {(booking as any).car?.name || 'Unknown Car'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate((booking as any).departureDate || new Date())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Manager Approved
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
                        <span>{(booking as any).user?.name || 'Unknown User'}</span>
                        <Badge 
                          variant={((booking as any).status || '').includes('rejected') ? 'destructive' : 'default'}
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
                    <CardTitle>HR Review - Booking Request Details</CardTitle>
                    <CardDescription>
                      This request has been approved by the manager and requires HR final approval
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

                    {/* Manager Approval Status */}
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium text-green-800">Manager Approved</p>
                      </div>
                      {selectedBooking.managerComment && (
                        <p className="text-sm text-green-700">
                          <strong>Manager Comment:</strong> {selectedBooking.managerComment}
                        </p>
                      )}
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
                          <Users className="h-5 w-5 text-muted-foreground" />
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
                                {((selectedBooking as any).driverNames || []).map((name: string, index: number) => (
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
                                {((selectedBooking as any).companionNames || []).map((name: string, index: number) => (
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

                {/* HR Approval Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>HR Final Decision</CardTitle>
                    <CardDescription>
                      Add a comment (optional) and provide final approval or rejection
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="comment">HR Comment (Optional)</Label>
                      <Textarea
                        id="comment"
                        placeholder="Add any HR notes, policy reminders, or special instructions..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-20"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleBookingAction(selectedBooking, 'approve')}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {(approveMutation.isPending || rejectMutation.isPending) ? 'Processing...' : 'Final Approval'}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={() => handleBookingAction(selectedBooking, 'reject')}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {(approveMutation.isPending || rejectMutation.isPending) ? 'Processing...' : 'Reject Request'}
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
                      Choose a manager-approved booking request to review for final HR approval
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