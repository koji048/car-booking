import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { createBookingWithManager, routeBookingRequest, notifyManager } from '@/lib/booking-manager-routing';

/**
 * POST /api/bookings/submit
 * Submit a new car booking request that automatically routes to the employee's manager
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let session: any;
    try {
      session = jwt.verify(sessionCookie.value, sessionSecret);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get booking details from request
    const bookingData = await request.json();
    const user = session.user;

    // Validate user has necessary information
    if (!user.id || !user.email || !user.name) {
      return NextResponse.json({ 
        error: 'User information incomplete. Please log out and log in again.' 
      }, { status: 400 });
    }

    // Create booking with manager assignment
    const booking = createBookingWithManager(
      {
        id: user.azureId || user.id,
        name: user.name,
        email: user.email,
        managerId: user.managerId,
        managerName: user.managerName,
        managerEmail: user.managerEmail,
      },
      bookingData
    );

    // Determine routing
    const routing = routeBookingRequest(booking);
    
    console.log('Booking created:', {
      bookingId: booking.id,
      employee: booking.employeeName,
      manager: booking.managerName || 'No manager',
      routing: routing,
    });

    // In a real implementation, save to database here
    // await saveBookingToDatabase(booking);

    // Send notification to manager
    if (booking.managerEmail) {
      await notifyManager(booking, 'new');
    }

    // Return booking details with routing information
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        submittedAt: booking.submittedAt,
      },
      routing: {
        assignedTo: routing.assignedTo || 'HR Department',
        reason: routing.reason,
        approvalRequired: routing.routeTo,
      },
      message: booking.managerId 
        ? `Booking request sent to your manager: ${booking.managerName}`
        : 'Booking request sent to HR for approval (no direct manager assigned)',
    });

  } catch (error) {
    console.error('Error submitting booking:', error);
    return NextResponse.json(
      { error: 'Failed to submit booking request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/submit
 * Get user's booking submission info (manager details, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let session: any;
    try {
      session = jwt.verify(sessionCookie.value, sessionSecret);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = session.user;

    // Return user's manager information for display
    return NextResponse.json({
      employee: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      manager: user.managerId ? {
        id: user.managerId,
        name: user.managerName,
        email: user.managerEmail,
      } : null,
      approvalFlow: user.managerId 
        ? 'Your booking will be sent to your manager for approval'
        : 'Your booking will be sent to HR for approval (no direct manager assigned)',
    });

  } catch (error) {
    console.error('Error getting booking info:', error);
    return NextResponse.json(
      { error: 'Failed to get booking information' },
      { status: 500 }
    );
  }
}