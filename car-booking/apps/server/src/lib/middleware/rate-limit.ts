import { TRPCError } from "@trpc/server";
import type { Context } from "../context";

interface RateLimitStore {
  attempts: number;
  resetTime: number;
}

/**
 * In-memory rate limit store
 * In production, use Redis or similar for distributed rate limiting
 */
class RateLimiter {
  private store = new Map<string, RateLimitStore>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if request should be rate limited
   */
  checkLimit(
    key: string,
    maxAttempts: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.store.get(key);

    // If no record or window expired, create new record
    if (!record || record.resetTime <= now) {
      this.store.set(key, {
        attempts: 1,
        resetTime: now + windowMs
      });
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetTime: now + windowMs
      };
    }

    // Check if limit exceeded
    if (record.attempts >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }

    // Increment attempts
    record.attempts++;
    return {
      allowed: true,
      remaining: maxAttempts - record.attempts,
      resetTime: record.resetTime
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter (clean up interval)
   */
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  keyGenerator?: (ctx: Context) => string;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

/**
 * Create rate limiting middleware for tRPC
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const {
    maxAttempts,
    windowMs,
    keyGenerator = (ctx) => ctx.session?.user?.id || ctx.ip || 'anonymous',
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false
  } = config;

  return async function rateLimitMiddleware({ ctx, next }: any) {
    const key = `ratelimit:${keyGenerator(ctx)}`;
    const result = rateLimiter.checkLimit(key, maxAttempts, windowMs);

    if (!result.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message,
        cause: {
          remaining: result.remaining,
          resetTime: new Date(result.resetTime).toISOString()
        }
      });
    }

    // Add rate limit headers to response
    ctx.rateLimitHeaders = {
      'X-RateLimit-Limit': maxAttempts.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    };

    try {
      const response = await next();
      
      // If configured, don't count successful requests
      if (skipSuccessfulRequests) {
        // Decrement the counter for successful requests
        const record = rateLimiter['store'].get(key);
        if (record && record.attempts > 0) {
          record.attempts--;
        }
      }
      
      return response;
    } catch (error) {
      // Request failed, count it against rate limit
      throw error;
    }
  };
}

/**
 * Pre-configured rate limiters for different operations
 */
export const rateLimiters = {
  // Strict limit for booking creation
  bookingCreation: createRateLimitMiddleware({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many booking requests. Please wait before creating another booking.'
  }),

  // Moderate limit for general API calls
  general: createRateLimitMiddleware({
    maxAttempts: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests. Please slow down.'
  }),

  // Lenient limit for read operations
  readOperations: createRateLimitMiddleware({
    maxAttempts: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
    skipSuccessfulRequests: true
  }),

  // Very strict limit for approval operations
  approvalOperations: createRateLimitMiddleware({
    maxAttempts: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many approval requests. Please try again later.'
  }),

  // Auth operations (login, etc.)
  auth: createRateLimitMiddleware({
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (ctx) => ctx.ip || 'anonymous', // Rate limit by IP for auth
    message: 'Too many authentication attempts. Please try again later.'
  })
};

// Export the rate limiter instance for testing
export { rateLimiter };