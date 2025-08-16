import { router, publicProcedure, protectedProcedure, adminProcedure } from "../lib/trpc";
import { z } from "zod";
import { getServices } from "../services/service-container";
import { dateRangeSchema } from "../lib/validations/common";

const vehicleService = getServices().getVehicleService();

export const vehicleRouter = router({
  list: publicProcedure
    .query(async () => {
      return await vehicleService.getAllVehicles();
    }),

  availability: protectedProcedure
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/)
    }))
    .query(async ({ input }) => {
      return await vehicleService.getAvailableVehicles(
        input.date,
        input.startTime,
        input.endTime
      );
    }),

  setMaintenance: adminProcedure
    .input(z.object({
      vehicleId: z.string().uuid(),
      inMaintenance: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return await vehicleService.setMaintenanceMode(
        input.vehicleId,
        input.inMaintenance
      );
    }),

  utilization: adminProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      return await vehicleService.getVehicleUtilization(
        input.startDate,
        input.endDate
      );
    })
});