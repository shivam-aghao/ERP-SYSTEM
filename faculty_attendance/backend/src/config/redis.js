import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient = null;
let isRedisAvailable = false;
const memoryStore = new Map();

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis connection failed after 3 attempts. Switching to in-memory cache fallback.');
        return null;
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    isRedisAvailable = true;
    logger.info('Connected to Redis successfully.');
  }).catch((err) => {
    isRedisAvailable = false;
    logger.warn(`Redis not available (${err.message}). Using in-memory fallback cache.`);
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
  });
} catch (error) {
  isRedisAvailable = false;
  logger.warn('Failed to initialize Redis client. Using in-memory cache.');
}

export const cache = {
  async get(key) {
    if (isRedisAvailable && redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch {
        // Fallback
      }
    }
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key, value, ttlSeconds = 300) {
    const serialized = JSON.stringify(value);
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback
      }
    }
    memoryStore.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  },

  async del(key) {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch {
        // Fallback
      }
    }
    memoryStore.delete(key);
  },

  async isBlacklisted(token) {
    return Boolean(await this.get(`bl_${token}`));
  },

  async blacklistToken(token, ttlSeconds = 604800) {
    await this.set(`bl_${token}`, 'revoked', ttlSeconds);
  }
};

export default redisClient;
