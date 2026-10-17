import { getRedisClient, DEFAULT_TTL, getRedisStatus } from '../config/redis.js';

export interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRatio: string;
  lastInvalidatedAt: string | null;
  mode: 'real' | 'mock';
}

const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  totalRequests: 0,
  hitRatio: '0%',
  lastInvalidatedAt: null,
  mode: 'mock',
};

function updateHitRatio() {
  const total = metrics.hits + metrics.misses;
  metrics.totalRequests = total;
  metrics.hitRatio = total > 0 ? `${((metrics.hits / total) * 100).toFixed(1)}%` : '0%';
  metrics.mode = getRedisStatus().mode;
}

export class CacheService {
  public static readonly PREFIX_LIST = 'agents:list:';
  public static readonly PREFIX_DETAIL = 'agents:detail:';
  public static readonly KEY_STATS = 'agents:stats';

  public static generateListKey(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const queryParts = sortedKeys
      .filter((k) => params[k] !== undefined && params[k] !== '')
      .map((k) => `${k}=${params[k]}`);
    return `${this.PREFIX_LIST}${queryParts.length ? queryParts.join('&') : 'all'}`;
  }

  public static generateDetailKey(id: string): string {
    return `${this.PREFIX_DETAIL}${id}`;
  }

  public static async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      const raw = await client.get(key);
      if (raw) {
        metrics.hits++;
        updateHitRatio();
        return JSON.parse(raw) as T;
      }
      metrics.misses++;
      updateHitRatio();
      return null;
    } catch (error) {
      console.warn(`Cache GET error for key ${key}:`, error);
      metrics.misses++;
      updateHitRatio();
      return null;
    }
  }

  public static async set(key: string, value: any, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
    try {
      const client = getRedisClient();
      const serialized = JSON.stringify(value);
      await client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.warn(`Cache SET error for key ${key}:`, error);
    }
  }

  public static async del(key: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.del(key);
    } catch (error) {
      console.warn(`Cache DEL error for key ${key}:`, error);
    }
  }

  public static async delByPattern(pattern: string): Promise<number> {
    try {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.warn(`Cache delByPattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidates agent caches when an agent is created, updated, or deleted.
   * If agentId is provided, also invalidates its individual detail cache.
   */
  public static async invalidateAgentCache(agentId?: string): Promise<void> {
    if (agentId) {
      await this.del(this.generateDetailKey(agentId));
    }
    // Invalidate all list queries and aggregated stats
    await this.delByPattern(`${this.PREFIX_LIST}*`);
    await this.del(this.KEY_STATS);
    metrics.lastInvalidatedAt = new Date().toISOString();
  }

  public static async flushAll(): Promise<void> {
    try {
      const client = getRedisClient();
      await client.flushall();
      metrics.lastInvalidatedAt = new Date().toISOString();
    } catch (error) {
      console.warn('Cache flushAll error:', error);
    }
  }

  public static getMetrics(): CacheMetrics {
    updateHitRatio();
    return { ...metrics };
  }

  public static resetMetrics(): void {
    metrics.hits = 0;
    metrics.misses = 0;
    metrics.totalRequests = 0;
    metrics.hitRatio = '0%';
    metrics.lastInvalidatedAt = null;
  }
}
