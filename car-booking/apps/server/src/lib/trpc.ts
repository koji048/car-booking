import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const userRole = ctx.session.user.role || 'employee';
  if (!['manager', 'hr', 'admin'].includes(userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Manager access required",
    });
  }
  return next();
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const userRole = ctx.session.user.role || 'employee';
  if (userRole !== 'admin') {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next();
});
