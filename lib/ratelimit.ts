import { Ratelimit } from "@upstash/ratelimit";

// Use real Redis for rate limiting
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiting configurations
export const readLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"), // 60 requests per 60 seconds
  analytics: true,
  prefix: "rl:read",
});

export const writeLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"), // 20 requests per 60 seconds
  analytics: true,
  prefix: "rl:write",
});

export const authLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 auth attempts per 60 seconds
  analytics: true,
  prefix: "rl:auth",
});

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await limiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fallback to allow request if rate limiting fails
    return {
      success: true,
      limit: 60,
      remaining: 59,
      reset: new Date(Date.now() + 60000),
      retryAfter: undefined,
    };
  }
}

// Helper to create user + IP identifier
export function createRateLimitKey(userId: string | null, ip: string): string {
  return userId ? `${userId}:${ip}` : ip;
}

// Log rate limit hits
export function logRateLimitHit(
  identifier: string,
  path: string,
  method: string,
  userAgent?: string
): void {
  console.warn("Rate limit exceeded:", {
    identifier,
    path,
    method,
    userAgent,
    timestamp: new Date().toISOString(),
  });
}
