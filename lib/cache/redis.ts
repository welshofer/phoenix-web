import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Create rate limiter
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null;

// Cache wrapper with TTL
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, { data: any; expiry: number }> = new Map();

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (redis) {
      try {
        const data = await redis.get<T>(key);
        if (data) return data;
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // Clean expired entry
    if (cached) {
      this.memoryCache.delete(key);
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    // Store in Redis if available
    if (redis) {
      try {
        await redis.set(key, value, { ex: ttlSeconds });
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }

    // Always store in memory cache as backup
    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + ttlSeconds * 1000,
    });

    // Clean old entries if cache is too large
    if (this.memoryCache.size > 1000) {
      this.cleanExpired();
    }
  }

  async delete(key: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(key);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }
    this.memoryCache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate keys matching pattern
    const keysToDelete: string[] = [];
    
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = CacheManager.getInstance();

// Presentation cache utilities
export const presentationCache = {
  key: (id: string) => `presentation:${id}`,
  
  async get(id: string) {
    return cache.get(this.key(id));
  },
  
  async set(id: string, data: any, ttl = 3600) {
    return cache.set(this.key(id), data, ttl);
  },
  
  async invalidate(id: string) {
    return cache.delete(this.key(id));
  },
};

// AI generation cache
export const aiCache = {
  key: (topic: string, style: string, slideCount: number) => 
    `ai:${Buffer.from(`${topic}:${style}:${slideCount}`).toString('base64')}`,
  
  async get(topic: string, style: string, slideCount: number) {
    return cache.get(this.key(topic, style, slideCount));
  },
  
  async set(topic: string, style: string, slideCount: number, data: any) {
    // Cache AI responses for 24 hours
    return cache.set(this.key(topic, style, slideCount), data, 86400);
  },
};

// Image generation cache
export const imageCache = {
  key: (prompt: string) => `image:${Buffer.from(prompt).toString('base64').slice(0, 100)}`,
  
  async get(prompt: string) {
    return cache.get<string>(this.key(prompt));
  },
  
  async set(prompt: string, url: string) {
    // Cache image URLs for 7 days
    return cache.set(this.key(prompt), url, 604800);
  },
};

// Session cache
export const sessionCache = {
  key: (sessionId: string) => `session:${sessionId}`,
  
  async get(sessionId: string) {
    return cache.get(this.key(sessionId));
  },
  
  async set(sessionId: string, data: any) {
    // Sessions expire after 1 hour
    return cache.set(this.key(sessionId), data, 3600);
  },
  
  async extend(sessionId: string) {
    const data = await this.get(sessionId);
    if (data) {
      await this.set(sessionId, data);
    }
  },
};