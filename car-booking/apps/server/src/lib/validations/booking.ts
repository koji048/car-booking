import { z } from "zod";
import { validateBookingDateTime } from "../utils/datetime";

export const createBookingSchema = z.object({
  vehicleId: z.string().uuid(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  departureTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  destination: z.string().min(1).max(500),
  reason: z.enum([
    'client-meeting',
    'business-trip',
    'airport-transfer',
    'site-visit',
    'conference',
    'training',
    'official-duty',
    'emergency',
    'other'
  ]),
  reasonDetails: z.string().max(1000).optional(),
  numberOfDrivers: z.number().int().min(1).max(4).default(1),
  numberOfCompanions: z.number().int().min(0).max(10).default(0),
  travelers: z.array(z.object({
    name: z.string().min(1).max(255),
    type: z.enum(['driver', 'companion']),
    isPrimary: z.boolean().optional()
  })).min(1)
}).refine(
  (data) => {
    const validation = validateBookingDateTime(
      data.departureDate,
      data.departureTime,
      data.returnDate,
      data.returnTime
    );
    return validation.valid;
  },
  {
    message: 'Invalid date/time combination'
  }
);

export const updateBookingSchema = z.object({
  id: z.string().uuid(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  destination: z.string().min(1).max(500).optional(),
  reasonDetails: z.string().max(1000).optional()
});

export const listBookingsSchema = z.object({
  status: z.enum([
    'draft',
    'pending_manager',
    'pending_hr',
    'approved',
    'rejected',
    'cancelled',
    'completed'
  ]).optional(),
  userId: z.string().optional(),
  vehicleId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export const conflictCheckSchema = z.object({
  vehicleId: z.string().uuid(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/),
  excludeBookingId: z.string().uuid().optional()
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type ListBookingsInput = z.infer<typeof listBookingsSchema>;
export type ConflictCheckInput = z.infer<typeof conflictCheckSchema>;