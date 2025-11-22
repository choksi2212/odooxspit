import Redis from 'ioredis';
import { config } from '../config/index.js';

/**
 * Redis Client for caching, rate limiting, and pub/sub
 */
export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

/**
 * Redis Pub/Sub Client (separate connection for pub/sub)
 */
export const redisPubClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

export const redisSubClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisPubClient.on('error', (err) => {
  console.error('Redis Pub Client Error:', err);
});

redisSubClient.on('error', (err) => {
  console.error('Redis Sub Client Error:', err);
});

// Connection events
redisClient.on('connect', () => {
  console.log('Redis Client connected');
});

// Graceful shutdown
export async function disconnectRedis() {
  await Promise.all([
    redisClient.quit(),
    redisPubClient.quit(),
    redisSubClient.quit(),
  ]);
}

/**
 * Cache helper with TTL
 * Time complexity: O(1) for get/set
 */
export class CacheService {
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set cached value with TTL (in seconds)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redisClient.setex(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    await redisClient.del(key);
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  }
}

export const cacheService = new CacheService();

