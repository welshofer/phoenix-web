import { NextApiResponse } from 'next';
import { FirebaseError } from 'firebase/app';

// Base error class for application errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(resetInMinutes?: number) {
    const message = resetInMinutes
      ? `Rate limit exceeded. Try again in ${resetInMinutes} minutes.`
      : 'Rate limit exceeded. Please try again later.';
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED', { resetInMinutes });
  }
}

export class QuotaExceededError extends AppError {
  constructor(resource: string) {
    super(`Quota exceeded for ${resource}`, 429, true, 'QUOTA_EXCEEDED');
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeoutSeconds: number) {
    super(
      `${operation} timed out after ${timeoutSeconds} seconds`,
      504,
      true,
      'TIMEOUT',
      { operation, timeoutSeconds }
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service error: ${service}`,
      503,
      true,
      'EXTERNAL_SERVICE_ERROR',
      { service, originalError: originalError?.message }
    );
  }
}

// Error response formatter
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

// Convert various error types to AppError
export function normalizeError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Firebase errors
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
      case 'auth/invalid-password':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return new AuthenticationError(error.message);
      
      case 'auth/insufficient-permission':
      case 'auth/unauthorized-domain':
        return new AuthorizationError(error.message);
      
      case 'auth/too-many-requests':
        return new RateLimitError();
      
      case 'auth/quota-exceeded':
        return new QuotaExceededError('authentication');
      
      case 'not-found':
      case 'document-not-found':
        return new NotFoundError('Resource');
      
      default:
        return new AppError(
          error.message || 'Firebase error',
          500,
          true,
          error.code
        );
    }
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('timeout')) {
      return new TimeoutError('Operation', 30);
    }
    if (error.message.includes('quota')) {
      return new QuotaExceededError('API');
    }
    if (error.message.includes('rate limit')) {
      return new RateLimitError();
    }
    if (error.message.includes('not found')) {
      return new NotFoundError('Resource');
    }
    if (error.message.includes('auth')) {
      return new AuthenticationError(error.message);
    }
    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return new AuthorizationError(error.message);
    }
    if (error.message.includes('invalid') || error.message.includes('validation')) {
      return new ValidationError(error.message);
    }

    return new AppError(error.message, 500, true);
  }

  // Unknown error type
  return new AppError(
    'An unexpected error occurred',
    500,
    false,
    'UNKNOWN_ERROR',
    { originalError: String(error) }
  );
}

// Express/Next.js error handler middleware
export function handleApiError(
  error: unknown,
  res: NextApiResponse,
  requestId?: string
): void {
  const appError = normalizeError(error);

  // Log error
  if (!appError.isOperational) {
    console.error('Unexpected error:', error);
    // In production, send to error tracking service
  } else if (appError.statusCode >= 500) {
    console.error('Server error:', appError);
  } else {
    console.warn('Client error:', appError.message);
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      details: process.env.NODE_ENV === 'development' ? appError.details : undefined,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Send response
  res.status(appError.statusCode).json(errorResponse);
}

// Async error wrapper for API routes
export function asyncHandler<T = any>(
  fn: (req: any, res: NextApiResponse<T>) => Promise<void>
) {
  return async (req: any, res: NextApiResponse<T>) => {
    try {
      await fn(req, res);
    } catch (error) {
      handleApiError(error, res as any);
    }
  };
}

// Client-side error boundary helper
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Retry logic with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    shouldRetry = (error) => {
      const appError = normalizeError(error);
      return appError.statusCode >= 500 || appError.code === 'TIMEOUT';
    },
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      // Exponential backoff with jitter
      delay = Math.min(delay * 2 + Math.random() * 1000, maxDelay);
    }
  }

  throw lastError;
}

// Circuit breaker implementation
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000, // 1 minute
    private readonly resetTimeout = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (
      this.state === 'open' &&
      Date.now() - this.lastFailureTime > this.resetTimeout
    ) {
      this.state = 'half-open';
      this.failures = 0;
    }

    // If circuit is open, fail fast
    if (this.state === 'open') {
      throw new ExternalServiceError('Service temporarily unavailable (circuit open)');
    }

    try {
      const result = await fn();
      
      // Reset on success
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold reached
      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.error(`Circuit breaker opened after ${this.failures} failures`);
      }

      throw error;
    }
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }

  getState(): string {
    return this.state;
  }
}