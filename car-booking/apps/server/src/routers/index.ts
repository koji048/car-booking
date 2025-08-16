import {
  protectedProcedure, publicProcedure,
  router,
} from "../lib/trpc";
import { bookingRouter } from "./booking.router";
import { vehicleRouter } from "./vehicle.router";
import { approvalRouter } from "./approval.router";
import { notificationRouter } from "./notification.router";
import { reportRouter } from "./report.router";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  
  // Feature routers
  bookings: bookingRouter,
  vehicles: vehicleRouter,
  approvals: approvalRouter,
  notifications: notificationRouter,
  reports: reportRouter,
});

export type AppRouter = typeof appRouter;
