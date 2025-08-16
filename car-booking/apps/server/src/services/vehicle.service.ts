import { db } from "../db";
import { vehicles, bookings } from "../db/schema";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export class VehicleService {
  async getAllVehicles() {
    return await db.query.vehicles.findMany({
      orderBy: (vehicles, { asc }) => [asc(vehicles.name)]
    });
  }

  async getAvailableVehicles(date: string, startTime: string, endTime: string) {
    // Get all vehicles
    const allVehicles = await this.getAllVehicles();
    
    // Get bookings for the specified date/time
    const dateTime = `${date} ${startTime}`;
    const endDateTime = `${date} ${endTime}`;
    
    const bookedVehicles = await db.query.bookings.findMany({
      where: and(
        inArray(bookings.status, ['approved', 'pending_manager', 'pending_hr']),
        or(
          and(
            sql`CONCAT(${bookings.departureDate}, ' ', ${bookings.departureTime}) <= ${dateTime}`,
            sql`CONCAT(${bookings.returnDate}, ' ', ${bookings.returnTime}) >= ${dateTime}`
          ),
          and(
            sql`CONCAT(${bookings.departureDate}, ' ', ${bookings.departureTime}) <= ${endDateTime}`,
            sql`CONCAT(${bookings.returnDate}, ' ', ${bookings.returnTime}) >= ${endDateTime}`
          )
        )
      ),
      columns: {
        vehicleId: true
      }
    });
    
    const bookedVehicleIds = bookedVehicles.map(b => b.vehicleId);
    
    // Filter out booked vehicles and those in maintenance
    return allVehicles.filter(v => 
      !bookedVehicleIds.includes(v.id) && 
      v.status !== 'maintenance'
    );
  }

  async setMaintenanceMode(vehicleId: string, inMaintenance: boolean) {
    const [updated] = await db.update(vehicles)
      .set({ 
        status: inMaintenance ? 'maintenance' : 'available',
        updatedAt: new Date()
      })
      .where(eq(vehicles.id, vehicleId))
      .returning();
    
    if (!updated) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Vehicle not found'
      });
    }
    
    return updated;
  }

  async getVehicleUtilization(startDate: string, endDate: string) {
    // Get all vehicles
    const allVehicles = await this.getAllVehicles();
    
    // Get bookings in date range
    const vehicleBookings = await db.query.bookings.findMany({
      where: and(
        inArray(bookings.status, ['approved', 'completed']),
        sql`${bookings.departureDate} >= ${startDate}`,
        sql`${bookings.departureDate} <= ${endDate}`
      ),
      with: {
        vehicle: true
      }
    });
    
    // Calculate utilization for each vehicle
    const utilization = allVehicles.map(vehicle => {
      const vehicleBookingList = vehicleBookings.filter(b => b.vehicleId === vehicle.id);
      const totalHours = vehicleBookingList.reduce((sum, booking) => {
        const depTime = new Date(`${booking.departureDate} ${booking.departureTime}`);
        const retTime = new Date(`${booking.returnDate} ${booking.returnTime}`);
        const hours = (retTime.getTime() - depTime.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      
      // Assuming 8 hours per day as working hours
      const workDays = this.getWorkingDays(new Date(startDate), new Date(endDate));
      const totalAvailableHours = workDays * 8;
      const utilizationRate = totalAvailableHours > 0 
        ? (totalHours / totalAvailableHours) * 100 
        : 0;
      
      return {
        vehicle,
        bookingsCount: vehicleBookingList.length,
        totalHours: Math.round(totalHours * 10) / 10,
        utilizationRate: Math.round(utilizationRate * 10) / 10
      };
    });
    
    return utilization;
  }

  private getWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }
}