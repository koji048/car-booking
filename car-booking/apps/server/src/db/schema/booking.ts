import { pgTable, text, integer, timestamp, date, time, pgEnum, uuid, boolean, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { vehicles } from "./vehicle";

export const bookingStatusEnum = pgEnum('booking_status', [
  'draft',
  'pending_manager',
  'pending_hr', 
  'approved',
  'rejected',
  'cancelled',
  'completed'
]);

export const bookingReasonEnum = pgEnum('booking_reason', [
  'client-meeting',
  'business-trip',
  'airport-transfer',
  'site-visit',
  'conference',
  'training',
  'official-duty',
  'emergency',
  'other'
]);

export const travelerTypeEnum = pgEnum('traveler_type', ['driver', 'companion']);
export const approvalLevelEnum = pgEnum('approval_level', ['manager', 'hr']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected']);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id),
  departureDate: date('departure_date').notNull(),
  departureTime: time('departure_time').notNull(),
  returnDate: date('return_date'),
  returnTime: time('return_time'),
  destination: text('destination').notNull(),
  reason: bookingReasonEnum('reason').notNull(),
  reasonDetails: text('reason_details'),
  status: bookingStatusEnum('status').notNull().default('draft'),
  numberOfDrivers: integer('number_of_drivers').notNull().default(1),
  numberOfCompanions: integer('number_of_companions').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => {
  return {
    userIdIdx: index('idx_bookings_user_id').on(table.userId),
    vehicleDateIdx: index('idx_bookings_vehicle_date').on(table.vehicleId, table.departureDate),
    statusIdx: index('idx_bookings_status').on(table.status),
    statusDateIdx: index('idx_bookings_status_date').on(table.status, table.departureDate),
    createdAtIdx: index('idx_bookings_created_at').on(table.createdAt)
  };
});

export const bookingTravelers = pgTable("booking_travelers", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: travelerTypeEnum('type').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  approverId: text('approver_id').notNull().references(() => user.id),
  approvalLevel: approvalLevelEnum('approval_level').notNull(),
  status: approvalStatusEnum('status').notNull().default('pending'),
  comments: text('comments'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

import { relations } from "drizzle-orm";

// Relations
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(user, {
    fields: [bookings.userId],
    references: [user.id],
  }),
  vehicle: one(vehicles, {
    fields: [bookings.vehicleId],
    references: [vehicles.id],
  }),
  travelers: many(bookingTravelers),
  approvals: many(approvals),
}));

export const bookingTravelersRelations = relations(bookingTravelers, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingTravelers.bookingId],
    references: [bookings.id],
  }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  booking: one(bookings, {
    fields: [approvals.bookingId],
    references: [bookings.id],
  }),
  approver: one(user, {
    fields: [approvals.approverId],
    references: [user.id],
  }),
}));

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingTraveler = typeof bookingTravelers.$inferSelect;
export type NewBookingTraveler = typeof bookingTravelers.$inferInsert;
export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;