import { Ratelimit } from "@upstash/ratelimit";

// Mock Redis for debugging - completely bypass during development
const redis = {
  set: async () => "OK",
  get: async () => null,
  eval: async () => [1, Date.now() + 60000],
  del: async () => 1,
  exists: async () => 0,
  expire: async () => 1,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

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
  // Temporarily bypass rate limiting for debugging
  console.log("🚀 Rate limit bypassed for:", identifier);
  return {
    success: true,
    limit: 60,
    remaining: 59,
    reset: new Date(Date.now() + 60000),
    retryAfter: undefined,
  };
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
