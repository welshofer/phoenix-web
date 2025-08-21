import { db } from '@/lib/firebase/config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

/**
 * Rate limiting and usage tracking for AI features
 */

interface RateLimitConfig {
  maxRequests: number;      // Max requests per window
  windowMs: number;         // Time window in milliseconds
  maxSlidesPerDay: number;  // Max slides generated per day
  maxImagesPerDay: number;  // Max images generated per day
}

interface UserUsage {
  userId: string;
  requests: {
    count: number;
    windowStart: Timestamp;
  };
  daily: {
    date: string;
    slidesGenerated: number;
    imagesGenerated: number;
    presentationsCreated: number;
  };
  monthly: {
    month: string;
    totalSlides: number;
    totalImages: number;
    totalPresentations: number;
    totalTokens?: number;
  };
  lifetime: {
    totalSlides: number;
    totalImages: number;
    totalPresentations: number;
    firstUsed: Timestamp;
    lastUsed: Timestamp;
  };
}

// Default rate limits based on subscription tier
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 requests per hour
    maxSlidesPerDay: 50,
    maxImagesPerDay: 10,
  },
  pro: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 100 requests per hour
    maxSlidesPerDay: 500,
    maxImagesPerDay: 100,
  },
  enterprise: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 1000 requests per hour
    maxSlidesPerDay: 5000,
    maxImagesPerDay: 1000,
  },
};

/**
 * Check if user has exceeded rate limit
 */
export async function checkRateLimit(
  userId: string,
  tier: string = 'free'
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
  reason?: string;
}> {
  const config = RATE_LIMITS[tier] || RATE_LIMITS.free;
  const now = new Date();
  
  try {
    const usageRef = doc(db, 'usage', userId);
    const usageDoc = await getDoc(usageRef);
    
    if (!usageDoc.exists()) {
      // First time user
      await initializeUsage(userId);
      return { allowed: true, remaining: config.maxRequests - 1 };
    }
    
    const usage = usageDoc.data() as UserUsage;
    
    // Check request rate limit
    const windowStart = usage.requests.windowStart.toDate();
    const windowEnd = new Date(windowStart.getTime() + config.windowMs);
    
    if (now < windowEnd) {
      // Still in current window
      if (usage.requests.count >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: windowEnd,
          reason: `Rate limit exceeded. Try again at ${windowEnd.toLocaleTimeString()}`,
        };
      }
      return {
        allowed: true,
        remaining: config.maxRequests - usage.requests.count - 1,
        resetAt: windowEnd,
      };
    } else {
      // New window
      await updateDoc(usageRef, {
        'requests.count': 1,
        'requests.windowStart': serverTimestamp(),
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
      };
    }
  } catch (error: any) {
    // Only log if it's not a permission error (which is expected in dev)
    if (error?.code !== 'permission-denied') {
      console.error('Rate limit check failed:', error);
    }
    // Allow on error but log it
    return { allowed: true, remaining: 0 };
  }
}

/**
 * Track usage for billing and analytics
 */
export async function trackUsage(
  userId: string,
  type: 'presentation' | 'slides' | 'image',
  count: number = 1,
  metadata?: {
    presentationId?: string;
    model?: string;
    tokens?: number;
  }
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);
  
  try {
    const usageRef = doc(db, 'usage', userId);
    const updates: any = {
      'lifetime.lastUsed': serverTimestamp(),
    };
    
    // Update counters based on type
    switch (type) {
      case 'presentation':
        updates['daily.presentationsCreated'] = increment(count);
        updates['monthly.totalPresentations'] = increment(count);
        updates['lifetime.totalPresentations'] = increment(count);
        break;
      case 'slides':
        updates['daily.slidesGenerated'] = increment(count);
        updates['monthly.totalSlides'] = increment(count);
        updates['lifetime.totalSlides'] = increment(count);
        break;
      case 'image':
        updates['daily.imagesGenerated'] = increment(count);
        updates['monthly.totalImages'] = increment(count);
        updates['lifetime.totalImages'] = increment(count);
        break;
    }
    
    // Update request count
    updates['requests.count'] = increment(1);
    
    // Add token usage if provided
    if (metadata?.tokens) {
      updates['monthly.totalTokens'] = increment(metadata.tokens);
    }
    
    await updateDoc(usageRef, updates);
    
    // Log to analytics collection for detailed tracking
    if (metadata?.presentationId) {
      await logAnalytics(userId, type, metadata);
    }
  } catch (error: any) {
    // Only log if it's not a permission error (which is expected in dev)
    if (error?.code !== 'permission-denied') {
      console.error('Usage tracking failed:', error);
    }
    // Don't block on tracking errors
  }
}

/**
 * Initialize usage document for new user
 */
async function initializeUsage(userId: string): Promise<void> {
  const now = serverTimestamp();
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);
  
  const initialUsage: Omit<UserUsage, 'userId'> = {
    requests: {
      count: 0,
      windowStart: now as Timestamp,
    },
    daily: {
      date: today,
      slidesGenerated: 0,
      imagesGenerated: 0,
      presentationsCreated: 0,
    },
    monthly: {
      month: month,
      totalSlides: 0,
      totalImages: 0,
      totalPresentations: 0,
      totalTokens: 0,
    },
    lifetime: {
      totalSlides: 0,
      totalImages: 0,
      totalPresentations: 0,
      firstUsed: now as Timestamp,
      lastUsed: now as Timestamp,
    },
  };
  
  await setDoc(doc(db, 'usage', userId), {
    userId,
    ...initialUsage,
  });
}

/**
 * Log detailed analytics
 */
async function logAnalytics(
  userId: string,
  type: string,
  metadata: any
): Promise<void> {
  try {
    const analyticsRef = doc(
      db, 
      'analytics', 
      `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
    
    await setDoc(analyticsRef, {
      userId,
      type,
      timestamp: serverTimestamp(),
      ...metadata,
    });
  } catch (error: any) {
    // Only log if it's not a permission error (which is expected in dev)
    if (error?.code !== 'permission-denied') {
      console.error('Analytics logging failed:', error);
    }
  }
}

/**
 * Get user's current usage stats
 */
export async function getUserUsage(userId: string): Promise<UserUsage | null> {
  try {
    const usageRef = doc(db, 'usage', userId);
    const usageDoc = await getDoc(usageRef);
    
    if (!usageDoc.exists()) {
      return null;
    }
    
    return usageDoc.data() as UserUsage;
  } catch (error: any) {
    // Only log if it's not a permission error (which is expected in dev)
    if (error?.code !== 'permission-denied') {
      console.error('Failed to get user usage:', error);
    }
    return null;
  }
}

/**
 * Check daily limits
 */
export async function checkDailyLimits(
  userId: string,
  tier: string = 'free',
  type: 'slides' | 'images'
): Promise<{
  allowed: boolean;
  remaining: number;
  reason?: string;
}> {
  const config = RATE_LIMITS[tier] || RATE_LIMITS.free;
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const usage = await getUserUsage(userId);
    
    if (!usage || usage.daily.date !== today) {
      // No usage today or new day
      return {
        allowed: true,
        remaining: type === 'slides' ? config.maxSlidesPerDay : config.maxImagesPerDay,
      };
    }
    
    const used = type === 'slides' 
      ? usage.daily.slidesGenerated 
      : usage.daily.imagesGenerated;
    const max = type === 'slides' 
      ? config.maxSlidesPerDay 
      : config.maxImagesPerDay;
    
    if (used >= max) {
      return {
        allowed: false,
        remaining: 0,
        reason: `Daily ${type} limit reached. Resets at midnight.`,
      };
    }
    
    return {
      allowed: true,
      remaining: max - used,
    };
  } catch (error: any) {
    // Only log if it's not a permission error (which is expected in dev)
    if (error?.code !== 'permission-denied') {
      console.error('Daily limit check failed:', error);
    }
    return { allowed: true, remaining: 0 };
  }
}