import Redis from 'ioredis';
// @ts-ignore - ioredis-mock doesn't have strict type declarations for default import in TS
import RedisMock from 'ioredis-mock';

let redisClient: Redis;
let isConnected = false;
let redisMode: 'real' | 'mock' = 'mock';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const DEFAULT_TTL = parseInt(process.env.REDIS_CACHE_TTL_SECONDS || '300', 10);

export async function initRedis(): Promise<Redis> {
  if (redisClient) return redisClient;

  // If in test environment without explicit real Redis, use mock directly
  if (process.env.NODE_ENV === 'test' || process.env.USE_REDIS_MOCK === 'true') {
    redisClient = new (RedisMock as any)();
    isConnected = true;
    redisMode = 'mock';
    console.log('⚡ Redis initialized in MOCK mode (In-Memory for testing / development without local Redis server)');
    return redisClient;
  }

  try {
    const realClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      retryStrategy(times) {
        if (times > 1) return null;
        return null;
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    realClient.on('error', (err) => {
      // Handled silently during fallback
    });

    await realClient.connect();
    isConnected = true;
    redisMode = 'real';
    redisClient = realClient;
    console.log(`✅ Redis connected successfully to ${redisUrl}`);

    return redisClient;
  } catch (error: any) {
    console.warn(`⚠️ Could not connect to real Redis (${error.message}). Falling back to in-memory Redis mock.`);
    redisClient = new (RedisMock as any)();
    isConnected = true;
    redisMode = 'mock';
    console.log('⚡ Redis initialized in MOCK mode (In-Memory)');
    return redisClient;
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new (RedisMock as any)();
    isConnected = true;
    redisMode = 'mock';
  }
  return redisClient;
}

export function getRedisStatus(): { connected: boolean; mode: 'real' | 'mock' } {
  return { connected: isConnected, mode: redisMode };
}
