import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export class CacheService {
  private static TTL = 60; // 60 seconds default TTL

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: unknown, ttl = this.TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  // User-scoped cache keys
  static getUserTasksKey(userId: string): string {
    return `tasks:${userId}`;
  }

  static getUserTaskKey(userId: string, taskId: string): string {
    return `task:${userId}:${taskId}`;
  }

  // Invalidate all user-related cache
  static async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidatePattern(`*:${userId}*`);
  }
}
