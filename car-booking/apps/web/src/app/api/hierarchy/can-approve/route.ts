import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

/**
 * POST /api/hierarchy/can-approve
 * Check if a manager can approve a specific employee's booking
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

    const { employeeId, employeeEmail } = await request.json();

    const currentUser = session.user;
    
    // Admin can approve anyone
    if (currentUser.role === 'Admin') {
      return NextResponse.json({ 
        canApprove: true, 
        reason: 'Admin privilege' 
      });
    }

    // HR can approve anyone
    if (currentUser.role === 'HR') {
      return NextResponse.json({ 
        canApprove: true, 
        reason: 'HR privilege' 
      });
    }

    // Manager can only approve direct reports
    if (currentUser.role === 'Manager') {
      // Check if the employee is in the manager's direct reports
      const isDirectReport = currentUser.directReportIds?.includes(employeeId);
      
      if (isDirectReport) {
        return NextResponse.json({ 
          canApprove: true, 
          reason: 'Direct report' 
        });
      }

      // Alternative: Check by email if ID matching fails
      // This might be needed if there are ID mismatches
      if (employeeEmail && currentUser.directReportEmails?.includes(employeeEmail)) {
        return NextResponse.json({ 
          canApprove: true, 
          reason: 'Direct report (by email)' 
        });
      }

      return NextResponse.json({ 
        canApprove: false, 
        reason: 'Not a direct report' 
      });
    }

    // Regular employees cannot approve
    return NextResponse.json({ 
      canApprove: false, 
      reason: 'Insufficient privileges' 
    });

  } catch (error) {
    console.error('Error checking approval permission:', error);
    return NextResponse.json(
      { error: 'Failed to check approval permission' },
      { status: 500 }
    );
  }
}