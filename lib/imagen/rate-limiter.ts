/**
 * Rate limiter for Google Imagen API
 * Implements token bucket algorithm with exponential backoff
 */

interface RateLimiterOptions {
  tokensPerMinute: number;
  maxBurst: number;
  retryDelayMs: number;
}

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly tokensPerMs: number;
  private readonly maxTokens: number;
  private retryAfter: number = 0;
  private consecutiveErrors: number = 0;
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
    this.maxTokens = options.maxBurst;
    this.tokens = this.maxTokens;
    this.tokensPerMs = options.tokensPerMinute / 60000;
    this.lastRefill = Date.now();
  }

  /**
   * Check if we can make a request
   */
  canMakeRequest(): boolean {
    this.refillTokens();
    
    // If we're in a backoff period, check if it's over
    if (this.retryAfter > Date.now()) {
      return false;
    }
    
    return this.tokens >= 1;
  }

  /**
   * Consume a token for a request
   */
  consumeToken(): boolean {
    this.refillTokens();
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.consecutiveErrors = 0; // Reset on successful consumption
      return true;
    }
    
    return false;
  }

  /**
   * Handle a rate limit error (429)
   */
  handleRateLimitError(retryAfterMs?: number): void {
    this.consecutiveErrors++;
    
    // Exponential backoff: 2^errors seconds, max 5 minutes
    const backoffMs = Math.min(
      Math.pow(2, this.consecutiveErrors) * 1000,
      300000
    );
    
    // Use the larger of server-provided retry-after or our backoff
    const delayMs = Math.max(retryAfterMs || 0, backoffMs);
    
    this.retryAfter = Date.now() + delayMs;
    
    // Deplete tokens to prevent immediate retries
    this.tokens = 0;
    
    console.warn(`Rate limited. Backing off for ${delayMs}ms (attempt ${this.consecutiveErrors})`);
  }

  /**
   * Handle a successful request
   */
  handleSuccess(): void {
    this.consecutiveErrors = 0;
    this.retryAfter = 0;
  }

  /**
   * Get the time until next available request
   */
  getWaitTimeMs(): number {
    this.refillTokens();
    
    // If in backoff period
    if (this.retryAfter > Date.now()) {
      return this.retryAfter - Date.now();
    }
    
    // If we have tokens
    if (this.tokens >= 1) {
      return 0;
    }
    
    // Calculate time to next token
    const tokensNeeded = 1 - this.tokens;
    return Math.ceil(tokensNeeded / this.tokensPerMs);
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.tokensPerMs;
    
    this.tokens = Math.min(this.tokens + tokensToAdd, this.maxTokens);
    this.lastRefill = now;
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.retryAfter = 0;
    this.consecutiveErrors = 0;
  }
}

// Singleton instance for the Imagen API
// Google Imagen has strict rate limits, so we start conservatively
const imagenRateLimiter = new RateLimiter({
  tokensPerMinute: 6, // Ultra conservative: 6 requests per minute (1 every 10 seconds)
  maxBurst: 2, // Allow 2 concurrent requests max
  retryDelayMs: 10000, // Base retry delay of 10 seconds
});

export { imagenRateLimiter, RateLimiter };