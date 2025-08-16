import { router, protectedProcedure } from "../lib/trpc";
import { 
  approvalSchema, 
  rejectionSchema, 
  pendingApprovalsSchema 
} from "../lib/validations/approval";
import { paginationSchema } from "../lib/validations/common";
import { getServices } from "../services/service-container";
import { rateLimiters } from "../lib/middleware/rate-limit";

const approvalService = getServices().getApprovalService();

// Rate-limited procedures for approval operations
const approvalProcedure = protectedProcedure.use(rateLimiters.approvalOperations);
const readApprovalProcedure = protectedProcedure.use(rateLimiters.readOperations);

export const approvalRouter = router({
  pending: readApprovalProcedure
    .input(pendingApprovalsSchema.optional())
    .query(async ({ input, ctx }) => {
      return await approvalService.getPendingApprovals(
        ctx.session.user.id,
        input?.approvalLevel
      );
    }),

  approve: approvalProcedure
    .input(approvalSchema)
    .mutation(async ({ input, ctx }) => {
      return await approvalService.approveBooking(
        input.bookingId,
        ctx.session.user.id,
        input.comments
      );
    }),

  reject: approvalProcedure
    .input(rejectionSchema)
    .mutation(async ({ input, ctx }) => {
      return await approvalService.rejectBooking(
        input.bookingId,
        ctx.session.user.id,
        input.comments
      );
    }),

  history: readApprovalProcedure
    .input(paginationSchema.optional())
    .query(async ({ input, ctx }) => {
      return await approvalService.getApprovalHistory(
        ctx.session.user.id,
        input?.page || 1,
        input?.limit || 20
      );
    })
});