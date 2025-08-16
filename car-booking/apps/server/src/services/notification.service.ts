import { db } from "../db";
import { notifications } from "../db/schema";
import { approvals } from "../db/schema/booking";
import type { Booking } from "../db/schema/booking";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { user } from "../db/schema/auth";

export class NotificationService {
  private sseConnections = new Map<string, ReadableStreamDefaultController>();

  async sendBookingCreatedNotification(booking: Booking, managerId: string, requesterName: string) {
    const notification = {
      userId: managerId,
      bookingId: booking.id,
      type: 'new_booking_request',
      title: 'New Booking Request',
      message: `${requesterName} has submitted a booking request for ${booking.departureDate}`,
      metadata: { booking }
    };

    await this.createNotification(notification);
    
    // Also notify the requester
    await this.createNotification({
      userId: booking.userId,
      bookingId: booking.id,
      type: 'booking_submitted',
      title: 'Booking Request Submitted',
      message: `Your booking request for ${booking.departureDate} has been submitted for approval`,
      metadata: { booking }
    });
  }

  async sendApprovalNotification(booking: Booking, userId: string, level: 'manager' | 'final') {
    const title = level === 'final' 
      ? 'Booking Approved' 
      : 'Booking Approved by Manager';
    
    const message = level === 'final'
      ? `Your booking for ${booking.departureDate} has been fully approved`
      : `Your booking for ${booking.departureDate} has been approved by your manager and sent to HR`;

    await this.createNotification({
      userId,
      bookingId: booking.id,
      type: level === 'final' ? 'booking_approved' : 'booking_approved_manager',
      title,
      message,
      metadata: { booking }
    });
  }

  async sendHRNotification(booking: Booking) {
    // Get all HR users
    const hrUsers = await db.query.user.findMany({
      where: eq(user.role, 'hr')
    });

    // Notify all HR users
    for (const hrUser of hrUsers) {
      await this.createNotification({
        userId: hrUser.id,
        bookingId: booking.id,
        type: 'hr_approval_required',
        title: 'Booking Requires HR Approval',
        message: `A booking for ${booking.departureDate} requires HR approval`,
        metadata: { booking }
      });
    }
  }

  async sendRejectionNotification(booking: Booking, userId: string, reason: string) {
    await this.createNotification({
      userId,
      bookingId: booking.id,
      type: 'booking_rejected',
      title: 'Booking Rejected',
      message: `Your booking for ${booking.departureDate} has been rejected. Reason: ${reason}`,
      metadata: { booking, reason }
    });
  }

  async sendCancellationNotification(booking: Booking) {
    // Notify all approvers who had approved or were pending
    const bookingApprovals = await db.query.approvals.findMany({
      where: and(
        eq(approvals.bookingId, booking.id),
        inArray(approvals.status, ['approved', 'pending'])
      )
    });

    for (const approval of bookingApprovals) {
      await this.createNotification({
        userId: approval.approverId,
        bookingId: booking.id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `A booking for ${booking.departureDate} has been cancelled by the requester`,
        metadata: { booking }
      });
    }
  }

  private async createNotification(data: any) {
    const [notification] = await db.insert(notifications).values(data).returning();
    
    // Send real-time notification if connection exists
    this.sendSSE(data.userId, notification);
    
    // Queue email notification (in production, use a proper queue)
    this.queueEmail(notification);
    
    return notification;
  }

  private sendSSE(userId: string, data: any) {
    const controller = this.sseConnections.get(userId);
    if (controller) {
      const encoder = new TextEncoder();
      const message = `data: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    }
  }

  private async queueEmail(notification: any) {
    // In production, use a proper email queue service
    // For now, we'll just mark it as sent
    console.log('Email queued for notification:', notification.id);
    
    // Properly handle async operation in setTimeout
    setTimeout(() => {
      this.markEmailSent(notification.id).catch(error => {
        console.error('Failed to mark email as sent:', {
          notificationId: notification.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    }, 1000);
  }
  
  private async markEmailSent(notificationId: string) {
    try {
      await db.update(notifications)
        .set({ emailSent: true })
        .where(eq(notifications.id, notificationId));
    } catch (error) {
      // Log and potentially retry
      console.error('Failed to update email status:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, limit = 20) {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit
    });
  }

  async markAsRead(notificationIds: string[], userId: string) {
    return await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        inArray(notifications.id, notificationIds),
        eq(notifications.userId, userId)
      ))
      .returning();
  }

  async getUnreadCount(userId: string) {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return Number(result[0].count);
  }

  // SSE connection management
  setupSSE(userId: string): ReadableStream {
    return new ReadableStream({
      start: (controller) => {
        this.sseConnections.set(userId, controller);
        
        // Send initial connection message
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(': connected\n\n'));
      },
      cancel: () => {
        this.sseConnections.delete(userId);
      }
    });
  }
}