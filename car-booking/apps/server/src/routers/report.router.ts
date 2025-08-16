import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { z } from "zod";
import { dateRangeSchema } from "../lib/validations/common";
import { db } from "../db";
import { bookings, vehicles } from "../db/schema";
import { and, gte, lte, eq, sql, inArray } from "drizzle-orm";
import { user } from "../db/schema/auth";

export const reportRouter = router({
  bookingHistory: protectedProcedure
    .input(dateRangeSchema.extend({
      userId: z.string().optional(),
      vehicleId: z.string().uuid().optional(),
      status: z.enum([
        'draft',
        'pending_manager',
        'pending_hr',
        'approved',
        'rejected',
        'cancelled',
        'completed'
      ]).optional(),
      exportFormat: z.enum(['json', 'csv']).optional()
    }))
    .query(async ({ input, ctx }) => {
      // Check if user can view reports for other users
      const currentUser = await db.query.user.findFirst({
        where: eq(user.id, ctx.session.user.id)
      });

      let targetUserId = input.userId || ctx.session.user.id;
      
      // Only admins and HR can view other users' reports
      if (input.userId && input.userId !== ctx.session.user.id) {
        if (!['admin', 'hr'].includes(currentUser?.role || '')) {
          targetUserId = ctx.session.user.id;
        }
      }

      const conditions = [
        gte(bookings.departureDate, input.startDate),
        lte(bookings.departureDate, input.endDate)
      ];

      if (targetUserId) {
        conditions.push(eq(bookings.userId, targetUserId));
      }
      if (input.vehicleId) {
        conditions.push(eq(bookings.vehicleId, input.vehicleId));
      }
      if (input.status) {
        conditions.push(eq(bookings.status, input.status));
      }

      const results = await db.query.bookings.findMany({
        where: and(...conditions),
        with: {
          user: true,
          vehicle: true,
          travelers: true,
          approvals: {
            with: {
              approver: true
            }
          }
        },
        orderBy: (bookings, { desc }) => [desc(bookings.departureDate)]
      });

      // Calculate summary statistics
      const summary = {
        totalBookings: results.length,
        byStatus: results.reduce((acc, booking) => {
          acc[booking.status] = (acc[booking.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byVehicle: results.reduce((acc, booking) => {
          const vehicleName = (booking as any).vehicle?.name || 'Unknown';
          acc[vehicleName] = (acc[vehicleName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalTravelers: results.reduce((sum, booking) => 
          sum + booking.numberOfDrivers + booking.numberOfCompanions, 0
        )
      };

      if (input.exportFormat === 'csv') {
        // Generate CSV data
        const csv = generateCSV(results);
        return { format: 'csv', data: csv, summary };
      }

      return { 
        bookings: results,
        summary,
        period: {
          startDate: input.startDate,
          endDate: input.endDate
        }
      };
    }),

  vehicleUtilization: adminProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      const allVehicles = await db.query.vehicles.findMany();
      
      const vehicleBookings = await db.query.bookings.findMany({
        where: and(
          inArray(bookings.status, ['approved', 'completed']),
          gte(bookings.departureDate, input.startDate),
          lte(bookings.departureDate, input.endDate)
        ),
        with: {
          vehicle: true
        }
      });

      const utilization = allVehicles.map(vehicle => {
        const vehicleBookingList = vehicleBookings.filter(b => b.vehicleId === vehicle.id);
        const totalHours = vehicleBookingList.reduce((sum, booking) => {
          // Simple calculation - assumes same day bookings
          const [depHour, depMin] = booking.departureTime.split(':').map(Number);
          const [retHour, retMin] = (booking.returnTime || '17:00').split(':').map(Number);
          const hours = (retHour + retMin/60) - (depHour + depMin/60);
          return sum + Math.max(0, hours);
        }, 0);

        return {
          vehicle: {
            id: vehicle.id,
            name: vehicle.name,
            type: vehicle.type,
            licensePlate: vehicle.licensePlate
          },
          metrics: {
            bookingsCount: vehicleBookingList.length,
            totalHours: Math.round(totalHours * 10) / 10,
            averageHoursPerBooking: vehicleBookingList.length > 0 
              ? Math.round((totalHours / vehicleBookingList.length) * 10) / 10 
              : 0,
            utilizationRate: Math.round((vehicleBookingList.length / 20) * 100) // Assuming 20 working days
          }
        };
      });

      return {
        period: {
          startDate: input.startDate,
          endDate: input.endDate
        },
        vehicles: utilization,
        summary: {
          totalBookings: vehicleBookings.length,
          totalVehicles: allVehicles.length,
          averageUtilization: Math.round(
            utilization.reduce((sum, v) => sum + v.metrics.utilizationRate, 0) / allVehicles.length
          )
        }
      };
    }),

  departmentStats: adminProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      // Get all bookings with user department info
      const bookingsWithDept = await db.query.bookings.findMany({
        where: and(
          gte(bookings.departureDate, input.startDate),
          lte(bookings.departureDate, input.endDate)
        ),
        with: {
          user: {
            with: {
              department: true
            }
          }
        }
      });

      // Group by department
      const departmentStats = bookingsWithDept.reduce((acc, booking) => {
        const deptName = (booking as any).user?.department?.name || 'No Department';
        if (!acc[deptName]) {
          acc[deptName] = {
            bookingsCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
            pendingCount: 0,
            totalTravelers: 0
          };
        }
        
        acc[deptName].bookingsCount++;
        acc[deptName].totalTravelers += booking.numberOfDrivers + booking.numberOfCompanions;
        
        if (booking.status === 'approved' || booking.status === 'completed') {
          acc[deptName].approvedCount++;
        } else if (booking.status === 'rejected') {
          acc[deptName].rejectedCount++;
        } else if (booking.status === 'pending_manager' || booking.status === 'pending_hr') {
          acc[deptName].pendingCount++;
        }
        
        return acc;
      }, {} as Record<string, any>);

      return {
        period: {
          startDate: input.startDate,
          endDate: input.endDate
        },
        departments: Object.entries(departmentStats).map(([name, stats]) => ({
          name,
          ...stats,
          approvalRate: stats.bookingsCount > 0 
            ? Math.round((stats.approvedCount / stats.bookingsCount) * 100) 
            : 0
        }))
      };
    })
});

// Helper method for CSV generation
function generateCSV(bookings: any[]): string {
  const headers = [
    'Booking ID',
    'Date',
    'Time',
    'Vehicle',
    'Destination',
    'Reason',
    'Status',
    'Requester',
    'Drivers',
    'Companions',
    'Created At'
  ];

  const rows = bookings.map(booking => [
    booking.id,
    booking.departureDate,
    booking.departureTime,
    booking.vehicle?.name || '',
    booking.destination,
    booking.reason,
    booking.status,
    booking.user?.name || '',
    booking.numberOfDrivers,
    booking.numberOfCompanions,
    booking.createdAt.toISOString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}