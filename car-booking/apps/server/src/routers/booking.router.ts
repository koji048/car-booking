import { router, protectedProcedure } from "../lib/trpc";
import { z } from "zod";
import { 
  createBookingSchema, 
  updateBookingSchema, 
  listBookingsSchema, 
  conflictCheckSchema 
} from "../lib/validations/booking";
import { getServices } from "../services/service-container";
import { rateLimiters } from "../lib/middleware/rate-limit";

const bookingService = getServices().getBookingService();

// Create rate-limited procedures
const createBookingProcedure = protectedProcedure.use(rateLimiters.bookingCreation);
const readBookingProcedure = protectedProcedure.use(rateLimiters.readOperations);

export const bookingRouter = router({
  create: createBookingProcedure
    .input(createBookingSchema)
    .mutation(async ({ input, ctx }) => {
      return await bookingService.createBooking(
        input,
        ctx.session.user.id,
        ctx.session.user.email,
        ctx.session.user.name || 'User'
      );
    }),

  list: readBookingProcedure
    .input(listBookingsSchema)
    .query(async ({ input, ctx }) => {
      return await bookingService.getUserBookings(
        input.userId || ctx.session.user.id,
        input.status,
        input.page,
        input.limit
      );
    }),

  get: readBookingProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return await bookingService.getBookingById(input.id, ctx.session.user.id);
    }),

  update: protectedProcedure
    .input(updateBookingSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementation for updating bookings
      // This would typically only allow updates to draft bookings
      throw new Error("Not implemented yet");
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return await bookingService.cancelBooking(input.id, ctx.session.user.id);
    }),

  checkConflicts: protectedProcedure
    .input(conflictCheckSchema)
    .query(async ({ input }) => {
      const conflicts = await bookingService.checkConflicts(input);
      return {
        hasConflicts: conflicts.length > 0,
        conflicts
      };
    }),

  myBookings: protectedProcedure
    .input(z.object({
      status: z.enum([
        'draft',
        'pending_manager',
        'pending_hr',
        'approved',
        'rejected',
        'cancelled',
        'completed'
      ]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20)
    }).optional())
    .query(async ({ input, ctx }) => {
      return await bookingService.getUserBookings(
        ctx.session.user.id,
        input?.status,
        input?.page || 1,
        input?.limit || 20
      );
    })
});