/**
 * Circuit Breaker for Image Generation
 * Prevents overwhelming the system when image generation is consistently failing
 */

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

const FAILURE_THRESHOLD = 5; // Open circuit after 5 consecutive failures
const TIMEOUT_MS = 60000; // Try again after 1 minute
const HALF_OPEN_REQUESTS = 1; // Allow 1 request in half-open state

class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'closed',
  };
  
  private halfOpenRequests = 0;

  /**
   * Check if requests should be allowed
   */
  shouldAllow(): boolean {
    if (this.state.state === 'closed') {
      return true;
    }
    
    if (this.state.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - this.state.lastFailureTime > TIMEOUT_MS) {
        this.state.state = 'half-open';
        this.halfOpenRequests = 0;
        return true;
      }
      return false;
    }
    
    // Half-open state: allow limited requests
    if (this.state.state === 'half-open') {
      if (this.halfOpenRequests < HALF_OPEN_REQUESTS) {
        this.halfOpenRequests++;
        return true;
      }
      return false;
    }
    
    return false;
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    if (this.state.state === 'half-open') {
      // Success in half-open state closes the circuit
      this.state = {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed',
      };
      this.halfOpenRequests = 0;
      console.log('Circuit breaker: Closed (service recovered)');
    } else if (this.state.state === 'closed') {
      // Reset failure count on success
      this.state.failures = 0;
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    
    if (this.state.state === 'half-open') {
      // Failure in half-open state reopens the circuit
      this.state.state = 'open';
      console.log('Circuit breaker: Open (service still failing)');
    } else if (this.state.failures >= FAILURE_THRESHOLD) {
      // Too many failures, open the circuit
      this.state.state = 'open';
      console.log(`Circuit breaker: Open (${this.state.failures} failures)`);
    }
  }

  /**
   * Get current state for monitoring
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
    };
    this.halfOpenRequests = 0;
    console.log('Circuit breaker: Reset');
  }
}

// Singleton instance
export const imagenCircuitBreaker = new CircuitBreaker();

/**
 * Wrapper function to use circuit breaker with async operations
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  if (!imagenCircuitBreaker.shouldAllow()) {
    console.log('Circuit breaker: Request blocked (circuit open)');
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error('Service temporarily unavailable (circuit breaker open)');
  }
  
  try {
    const result = await operation();
    imagenCircuitBreaker.recordSuccess();
    return result;
  } catch (error) {
    imagenCircuitBreaker.recordFailure();
    throw error;
  }
}