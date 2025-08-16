import { db } from "../db";
import { bookings, bookingTravelers, approvals, vehicles } from "../db/schema";
import { user } from "../db/schema/auth";
import { and, eq, or, gte, lte, inArray, between, sql } from "drizzle-orm";
import type { CreateBookingInput, ConflictCheckInput } from "../lib/validations/booking";
import { TRPCError } from "@trpc/server";
import { NotificationService } from "./notification.service";

export class BookingService {
  constructor(
    private readonly notificationService: NotificationService
  ) {}

  async createBooking(data: CreateBookingInput, userId: string, userEmail: string, userName: string) {
    // Get user's manager first (outside transaction for better performance)
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, userId)
    });

    if (!userRecord?.managerId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No manager assigned to your account. Please contact HR.'
      });
    }

    // Create booking with transaction and proper conflict checking
    let result;
    
    try {
      result = await db.transaction(async (tx) => {
      // Check for conflicts with row lock to prevent race conditions
      const conflicts = await this.checkConflictsWithLock(tx, {
        vehicleId: data.vehicleId,
        departureDate: data.departureDate,
        departureTime: data.departureTime,
        returnDate: data.returnDate || data.departureDate,
        returnTime: data.returnTime || data.departureTime
      });

      if (conflicts.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Vehicle is already booked for the selected time period'
        });
      }
      // Create booking
      const [newBooking] = await tx.insert(bookings).values({
        userId,
        vehicleId: data.vehicleId,
        departureDate: data.departureDate,
        departureTime: data.departureTime,
        returnDate: data.returnDate || data.departureDate,
        returnTime: data.returnTime || data.departureTime,
        destination: data.destination,
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        status: 'pending_manager',
        numberOfDrivers: data.numberOfDrivers,
        numberOfCompanions: data.numberOfCompanions
      }).returning();

      // Add travelers
      if (data.travelers && data.travelers.length > 0) {
        await tx.insert(bookingTravelers).values(
          data.travelers.map(traveler => ({
            bookingId: newBooking.id,
            name: traveler.name,
            type: traveler.type,
            isPrimary: traveler.isPrimary || false
          }))
        );
      }

      // Create approval request for manager
      if (userRecord.managerId) {
        await tx.insert(approvals).values({
          bookingId: newBooking.id,
          approverId: userRecord.managerId,
          approvalLevel: 'manager',
          status: 'pending'
        });
      }

      return newBooking;
      });
    } catch (error) {
      // Log error for debugging
      console.error('Booking creation failed:', {
        userId,
        vehicleId: data.vehicleId,
        date: data.departureDate,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Re-throw with proper error handling
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create booking. Please try again.',
        cause: error
      });
    }

    // Send notifications outside transaction for better performance
    try {
      await this.notificationService.sendBookingCreatedNotification(
        result,
        userRecord.managerId,
        userName
      );
    } catch (notificationError) {
      // Log but don't fail the booking creation
      console.error('Failed to send booking notification:', notificationError);
      // Could queue for retry here
    }

    return result;
  }

  async checkConflicts(params: ConflictCheckInput) {
    // Use parameterized queries with proper timestamp handling
    const conflictingBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.vehicleId, params.vehicleId),
        inArray(bookings.status, ['approved', 'pending_manager', 'pending_hr']),
        // Use PostgreSQL's timestamp range overlap operator for safe comparison
        sql`
          tsrange(
            (${bookings.departureDate}::date || ' ' || ${bookings.departureTime}::time)::timestamp,
            (COALESCE(${bookings.returnDate}::date, ${bookings.departureDate}::date) || ' ' || COALESCE(${bookings.returnTime}::time, ${bookings.departureTime}::time))::timestamp,
            '[]'
          ) && 
          tsrange(
            ${params.departureDate}::date || ' ' || ${params.departureTime}::time,
            ${params.returnDate || params.departureDate}::date || ' ' || ${params.returnTime || params.departureTime}::time,
            '[]'
          )::tsrange
        `,
        params.excludeBookingId ? sql`${bookings.id}::uuid != ${params.excludeBookingId}::uuid` : undefined
      )
    });

    return conflictingBookings;
  }
  
  /**
   * Check conflicts within a transaction with row locking
   * Prevents race conditions by locking the vehicle row
   */
  private async checkConflictsWithLock(tx: any, params: ConflictCheckInput) {
    // Lock the vehicle to prevent concurrent modifications
    await tx.execute(sql`
      SELECT * FROM vehicles 
      WHERE id = ${params.vehicleId}::uuid 
      FOR UPDATE
    `);
    
    // Now check for conflicts with the lock held
    const conflictingBookings = await tx.query.bookings.findMany({
      where: and(
        eq(bookings.vehicleId, params.vehicleId),
        inArray(bookings.status, ['approved', 'pending_manager', 'pending_hr']),
        sql`
          tsrange(
            (departure_date::date || ' ' || departure_time::time)::timestamp,
            (COALESCE(return_date::date, departure_date::date) || ' ' || COALESCE(return_time::time, departure_time::time))::timestamp,
            '[]'
          ) && 
          tsrange(
            ${params.departureDate}::date || ' ' || ${params.departureTime}::time,
            ${params.returnDate || params.departureDate}::date || ' ' || ${params.returnTime || params.departureTime}::time,
            '[]'
          )::tsrange
        `,
        params.excludeBookingId ? sql`id::uuid != ${params.excludeBookingId}::uuid` : undefined
      )
    });

    return conflictingBookings;
  }

  async getUserBookings(userId: string, status?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const conditions = [eq(bookings.userId, userId)];
    if (status) {
      conditions.push(eq(bookings.status, status as any));
    }

    const results = await db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        vehicle: true,
        travelers: true,
        approvals: {
          with: {
            approver: true
          }
        }
      },
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
      limit,
      offset
    });

    const total = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(and(...conditions));

    return {
      bookings: results,
      pagination: {
        page,
        limit,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / limit)
      }
    };
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId)
    });

    if (!booking) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Booking not found'
      });
    }

    if (booking.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only cancel your own bookings'
      });
    }

    if (!['pending_manager', 'pending_hr', 'approved'].includes(booking.status)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This booking cannot be cancelled'
      });
    }

    const [updated] = await db.update(bookings)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Notify approvers about cancellation
    await this.notificationService.sendCancellationNotification(updated);

    return updated;
  }

  async getBookingById(bookingId: string, userId: string) {
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        vehicle: true,
        travelers: true,
        user: true,
        approvals: {
          with: {
            approver: true
          }
        }
      }
    });

    if (!booking) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Booking not found'
      });
    }

    // Check if user has permission to view this booking
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, userId)
    });

    const canView = 
      booking.userId === userId || // Own booking
      currentUser?.role === 'admin' || // Admin
      currentUser?.role === 'hr' || // HR
      (currentUser?.role === 'manager' && (booking as any).user?.managerId === userId); // Manager of the requester

    if (!canView) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view this booking'
      });
    }

    return booking;
  }
}