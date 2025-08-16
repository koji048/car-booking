import { router, protectedProcedure } from "../lib/trpc";
import { z } from "zod";
import { getServices } from "../services/service-container";

const notificationService = getServices().getNotificationService();

export const notificationRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(20)
    }).optional())
    .query(async ({ input, ctx }) => {
      return await notificationService.getUserNotifications(
        ctx.session.user.id,
        input?.limit || 20
      );
    }),

  markRead: protectedProcedure
    .input(z.object({
      ids: z.array(z.string().uuid())
    }))
    .mutation(async ({ input, ctx }) => {
      return await notificationService.markAsRead(
        input.ids,
        ctx.session.user.id
      );
    }),

  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const count = await notificationService.getUnreadCount(ctx.session.user.id);
      return { count };
    }),

  // Server-Sent Events endpoint for real-time notifications
  subscribe: protectedProcedure
    .subscription(async function* ({ ctx }) {
      // Create SSE stream
      const stream = notificationService.setupSSE(ctx.session.user.id);
      const reader = stream.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = new TextDecoder().decode(value);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data) {
                yield JSON.parse(data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    })
});