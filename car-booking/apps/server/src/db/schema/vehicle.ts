import { pgTable, text, integer, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const vehicleStatusEnum = pgEnum('vehicle_status', ['available', 'booked', 'maintenance']);
export const vehicleTypeEnum = pgEnum('vehicle_type', ['sedan', 'suv', 'compact', 'large-suv', 'van']);

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: vehicleTypeEnum('type').notNull(),
  seats: integer('seats').notNull(),
  licensePlate: text('license_plate').notNull().unique(),
  status: vehicleStatusEnum('status').notNull().default('available'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

import { relations } from "drizzle-orm";
import { bookings } from "./booking";

// Relations
export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  bookings: many(bookings),
}));

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;