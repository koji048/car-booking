/**
 * Booking Manager Routing System
 * Automatically routes booking requests to the employee's direct manager
 */

export interface BookingRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  bookingDetails: {
    vehicleId: string;
    startDate: string;
    endDate: string;
    purpose: string;
    destination: string;
    passengers: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  comments?: string;
}

export interface ManagerApprovalQueue {
  managerId: string;
  managerEmail: string;
  pendingBookings: BookingRequest[];
}

/**
 * Create a booking request with manager assignment
 */
export function createBookingWithManager(
  employeeInfo: {
    id: string;
    name: string;
    email: string;
    managerId?: string;
    managerName?: string;
    managerEmail?: string;
  },
  bookingDetails: BookingRequest['bookingDetails']
): BookingRequest {
  const bookingId = generateBookingId();
  
  const booking: BookingRequest = {
    id: bookingId,
    employeeId: employeeInfo.id,
    employeeName: employeeInfo.name,
    employeeEmail: employeeInfo.email,
    managerId: employeeInfo.managerId,
    managerName: employeeInfo.managerName,
    managerEmail: employeeInfo.managerEmail,
    bookingDetails,
    status: 'pending',
    submittedAt: new Date(),
  };

  // Log for debugging
  if (booking.managerId) {
    console.log(`Booking ${bookingId} assigned to manager: ${booking.managerName} (${booking.managerEmail})`);
  } else {
    console.log(`Booking ${bookingId} has no manager assigned - will need HR approval`);
  }

  return booking;
}

/**
 * Check if a manager can approve a specific booking
 */
export function canManagerApproveBooking(
  managerId: string,
  booking: BookingRequest,
  userRole: string
): boolean {
  // Admin and HR can approve any booking
  if (userRole === 'Admin' || userRole === 'HR') {
    return true;
  }

  // Manager can only approve their direct reports' bookings
  if (userRole === 'Manager') {
    return booking.managerId === managerId;
  }

  return false;
}

/**
 * Get all bookings for a specific manager
 */
export function getManagerBookings(
  allBookings: BookingRequest[],
  managerId: string
): BookingRequest[] {
  return allBookings.filter(booking => 
    booking.managerId === managerId && 
    booking.status === 'pending'
  );
}

/**
 * Route booking based on employee hierarchy
 */
export function routeBookingRequest(booking: BookingRequest): {
  routeTo: 'manager' | 'hr' | 'admin';
  reason: string;
  assignedTo?: string;
} {
  // If employee has a manager, route to manager
  if (booking.managerId && booking.managerEmail) {
    return {
      routeTo: 'manager',
      reason: 'Routed to direct manager',
      assignedTo: booking.managerEmail,
    };
  }

  // If no manager (e.g., executives), route to HR
  return {
    routeTo: 'hr',
    reason: 'No direct manager - requires HR approval',
  };
}

/**
 * Generate unique booking ID
 */
function generateBookingId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BK-${timestamp}-${random}`.toUpperCase();
}

/**
 * Get approval chain for a booking
 */
export function getApprovalChain(booking: BookingRequest): {
  level: number;
  approver: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
}[] {
  const chain = [];

  // Level 1: Direct Manager
  if (booking.managerId) {
    chain.push({
      level: 1,
      approver: booking.managerEmail || 'Unknown Manager',
      role: 'Manager',
      status: booking.status === 'approved' ? 'approved' : 
              booking.status === 'rejected' ? 'rejected' : 'pending',
    });
  } else {
    chain.push({
      level: 1,
      approver: 'No Manager Assigned',
      role: 'Manager',
      status: 'skipped',
    });
  }

  // Level 2: HR (if needed)
  // Add HR to chain for certain conditions (e.g., long duration, no manager)
  if (!booking.managerId || needsHRApproval(booking)) {
    chain.push({
      level: 2,
      approver: 'HR Department',
      role: 'HR',
      status: 'pending',
    });
  }

  return chain;
}

/**
 * Check if booking needs HR approval
 */
function needsHRApproval(booking: BookingRequest): boolean {
  // Business rules for HR approval
  const bookingDuration = calculateDurationInDays(
    booking.bookingDetails.startDate,
    booking.bookingDetails.endDate
  );

  // Needs HR if:
  // - No manager assigned
  // - Booking is longer than 7 days
  // - Cross-department booking (implement as needed)
  return !booking.managerId || bookingDuration > 7;
}

/**
 * Calculate duration in days
 */
function calculateDurationInDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Send notification to manager about new booking
 */
export async function notifyManager(
  booking: BookingRequest,
  notificationType: 'new' | 'reminder' | 'escalation'
): Promise<void> {
  if (!booking.managerEmail) {
    console.log('No manager email available for notification');
    return;
  }

  // In a real implementation, this would send an email or push notification
  console.log(`Notification sent to ${booking.managerEmail}:`, {
    type: notificationType,
    bookingId: booking.id,
    employee: booking.employeeName,
    submittedAt: booking.submittedAt,
  });

  // You can integrate with:
  // - Email service (SendGrid, AWS SES)
  // - Microsoft Teams notifications
  // - Push notifications
  // - In-app notifications
}

/**
 * Escalate booking if not approved within time limit
 */
export function checkEscalation(booking: BookingRequest): {
  shouldEscalate: boolean;
  escalateTo: 'hr' | 'skip-level-manager' | null;
  reason?: string;
} {
  if (booking.status !== 'pending') {
    return { shouldEscalate: false, escalateTo: null };
  }

  const hoursElapsed = (Date.now() - booking.submittedAt.getTime()) / (1000 * 60 * 60);

  // Escalate to HR after 48 hours
  if (hoursElapsed > 48) {
    return {
      shouldEscalate: true,
      escalateTo: 'hr',
      reason: 'Manager has not responded within 48 hours',
    };
  }

  // Send reminder after 24 hours
  if (hoursElapsed > 24) {
    notifyManager(booking, 'reminder');
  }

  return { shouldEscalate: false, escalateTo: null };
}

/**
 * Get manager's team bookings summary
 */
export function getManagerDashboardData(
  managerId: string,
  allBookings: BookingRequest[]
): {
  pendingApprovals: number;
  approvedToday: number;
  teamBookings: BookingRequest[];
  urgentBookings: BookingRequest[];
} {
  const teamBookings = allBookings.filter(b => b.managerId === managerId);
  const today = new Date().toDateString();

  return {
    pendingApprovals: teamBookings.filter(b => b.status === 'pending').length,
    approvedToday: teamBookings.filter(b => 
      b.status === 'approved' && 
      b.approvedAt?.toDateString() === today
    ).length,
    teamBookings: teamBookings,
    urgentBookings: teamBookings.filter(b => {
      const startDate = new Date(b.bookingDetails.startDate);
      const daysUntilStart = (startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return b.status === 'pending' && daysUntilStart <= 2;
    }),
  };
}