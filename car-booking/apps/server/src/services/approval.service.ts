import { db } from "../db";
import { bookings, approvals } from "../db/schema";
import { and, eq, inArray, sql, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { NotificationService } from "./notification.service";
import { user } from "../db/schema/auth";

interface WorkflowStep {
  next: 'pending_hr' | 'approved';
  role: 'manager' | 'hr';
  notificationType: string;
}

export class ApprovalService {
  private readonly workflow: Record<string, WorkflowStep> = {
    'pending_manager': {
      next: 'pending_hr',
      role: 'manager',
      notificationType: 'booking_approved_by_manager'
    },
    'pending_hr': {
      next: 'approved',
      role: 'hr',
      notificationType: 'booking_approved_by_hr'
    }
  };

  constructor(
    private readonly notificationService: NotificationService
  ) {}

  async getPendingApprovals(approverId: string, approvalLevel?: 'manager' | 'hr') {
    // Get user role
    const approver = await db.query.user.findFirst({
      where: eq(user.id, approverId)
    });

    if (!approver) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    const conditions = [];

    // Managers see bookings where they are the assigned approver
    if (approver.role === 'manager' || approver.role === 'admin') {
      conditions.push(
        and(
          eq(approvals.approverId, approverId),
          eq(approvals.status, 'pending')
        )
      );
    }

    // HR sees all pending HR approvals
    if (approver.role === 'hr' || approver.role === 'admin') {
      conditions.push(
        and(
          eq(approvals.approvalLevel, 'hr'),
          eq(approvals.status, 'pending')
        )
      );
    }

    if (conditions.length === 0) {
      return [];
    }

    const pendingApprovals = await db.query.approvals.findMany({
      where: or(...conditions),
      with: {
        booking: {
          with: {
            user: true,
            vehicle: true,
            travelers: true
          }
        }
      },
      orderBy: (approvals, { desc }) => [desc(approvals.createdAt)]
    });

    return pendingApprovals;
  }

  async approveBooking(bookingId: string, approverId: string, comments?: string) {
    return await this.processApproval(bookingId, approverId, 'approved', comments);
  }

  async rejectBooking(bookingId: string, approverId: string, comments: string) {
    if (!comments) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Comments are required when rejecting a booking'
      });
    }
    return await this.processApproval(bookingId, approverId, 'rejected', comments);
  }

  private async processApproval(
    bookingId: string,
    approverId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ) {
    // Get booking and current approval
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        user: true
      }
    });

    if (!booking) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Booking not found'
      });
    }

    const currentApproval = await db.query.approvals.findFirst({
      where: and(
        eq(approvals.bookingId, bookingId),
        eq(approvals.status, 'pending')
      )
    });

    if (!currentApproval) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No pending approval found for this booking'
      });
    }

    // Verify approver has permission
    const approver = await db.query.user.findFirst({
      where: eq(user.id, approverId)
    });

    const canApprove = 
      (currentApproval.approverId === approverId) || // Assigned approver
      (currentApproval.approvalLevel === 'hr' && approver?.role === 'hr') || // Any HR for HR approvals
      (approver?.role === 'admin'); // Admin can approve anything

    if (!canApprove) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to approve this booking'
      });
    }

    // Process approval with transaction
    let result;
    
    try {
      result = await db.transaction(async (tx) => {
      // Update approval record
      await tx.update(approvals)
        .set({
          status: decision,
          comments,
          approverId // Update in case it was an HR/admin approval
        })
        .where(eq(approvals.id, currentApproval.id));

      let newStatus: string;
      
      if (decision === 'approved') {
        const workflowStep = this.workflow[booking.status];
        newStatus = workflowStep.next;

        // If moving to HR approval, create new approval record
        if (newStatus === 'pending_hr') {
          // Get any HR user (in production, you might want to assign specific HR)
          const hrUser = await tx.query.user.findFirst({
            where: eq(user.role, 'hr')
          });

          if (hrUser) {
            await tx.insert(approvals).values({
              bookingId,
              approverId: hrUser.id,
              approvalLevel: 'hr',
              status: 'pending'
            });
          }
        }
      } else {
        newStatus = 'rejected';
      }

      // Update booking status
      const [updatedBooking] = await tx.update(bookings)
        .set({ 
          status: newStatus as any,
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      return updatedBooking;
      });
    } catch (error) {
      console.error('Approval processing failed:', {
        bookingId,
        approverId,
        decision,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process approval. Please try again.',
        cause: error
      });
    }

    // Send notifications outside transaction
    if (decision === 'approved') {
      if (result.status === 'approved') {
        // Final approval - notify requester
        await this.notificationService.sendApprovalNotification(result, booking.userId, 'final');
      } else if (result.status === 'pending_hr') {
        // Notify HR and requester about manager approval
        await this.notificationService.sendApprovalNotification(result, booking.userId, 'manager');
        await this.notificationService.sendHRNotification(result);
      }
    } else {
      // Notify requester about rejection
      await this.notificationService.sendRejectionNotification(result, booking.userId, comments || '');
    }

    return result;
  }

  async getApprovalHistory(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const results = await db.query.approvals.findMany({
      where: eq(approvals.approverId, userId),
      with: {
        booking: {
          with: {
            user: true,
            vehicle: true
          }
        }
      },
      orderBy: (approvals, { desc }) => [desc(approvals.createdAt)],
      limit,
      offset
    });

    const total = await db.select({ count: sql<number>`count(*)` })
      .from(approvals)
      .where(eq(approvals.approverId, userId));

    return {
      approvals: results,
      pagination: {
        page,
        limit,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / limit)
      }
    };
  }
}