import { z } from "zod";

export const approvalSchema = z.object({
  bookingId: z.string().uuid(),
  comments: z.string().max(500).optional()
});

export const rejectionSchema = z.object({
  bookingId: z.string().uuid(),
  comments: z.string().min(1).max(500) // Comments required for rejection
});

export const pendingApprovalsSchema = z.object({
  approvalLevel: z.enum(['manager', 'hr']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export type ApprovalInput = z.infer<typeof approvalSchema>;
export type RejectionInput = z.infer<typeof rejectionSchema>;
export type PendingApprovalsInput = z.infer<typeof pendingApprovalsSchema>;