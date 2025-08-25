import { FirebaseError } from 'firebase/app';
import { 
  Firestore, 
  DocumentReference, 
  CollectionReference,
  Query,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  DocumentData,
  WriteBatch,
  Transaction
} from 'firebase/firestore';

// Exponential backoff configuration
interface BackoffConfig {
  initialDelay: number;
  maxDelay: number;
  maxRetries: number;
  factor: number;
}

const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxRetries: 3,
  factor: 2,
};

// Circuit breaker for Firebase services
class FirebaseCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute
  private readonly resetTimeout = 30000; // 30 seconds

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
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
      throw new Error(
        `Firebase service temporarily unavailable (circuit open for ${operationName})`
      );
    }

    try {
      const result = await operation();
      
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
        console.error(
          `Firebase circuit breaker opened for ${operationName} after ${this.failures} failures`
        );
      }

      throw error;
    }
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }
}

// Global circuit breakers for different Firebase services
const circuitBreakers = {
  firestore: new FirebaseCircuitBreaker(),
  auth: new FirebaseCircuitBreaker(),
  storage: new FirebaseCircuitBreaker(),
};

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<BackoffConfig> = {}
): Promise<T> {
  const { initialDelay, maxDelay, maxRetries, factor } = {
    ...DEFAULT_BACKOFF_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof FirebaseError) {
        if (
          error.code === 'permission-denied' ||
          error.code === 'unauthenticated' ||
          error.code === 'invalid-argument'
        ) {
          throw error;
        }
      }

      // Last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying with jitter
      const jitter = Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      
      // Increase delay for next attempt
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

// Firestore operations with recovery
export const resilientFirestore = {
  async getDoc<T = DocumentData>(
    docRef: DocumentReference<T>
  ): Promise<T | undefined> {
    return circuitBreakers.firestore.execute(
      async () => {
        return retryWithBackoff(async () => {
          const snapshot = await getDoc(docRef);
          return snapshot.exists() ? snapshot.data() : undefined;
        });
      },
      'getDoc'
    );
  },

  async getDocs<T = DocumentData>(
    query: Query<T> | CollectionReference<T>
  ): Promise<T[]> {
    return circuitBreakers.firestore.execute(
      async () => {
        return retryWithBackoff(async () => {
          const snapshot = await getDocs(query);
          return snapshot.docs.map((doc) => doc.data());
        });
      },
      'getDocs'
    );
  },

  async setDoc<T = DocumentData>(
    docRef: DocumentReference<T>,
    data: T,
    options?: any
  ): Promise<void> {
    return circuitBreakers.firestore.execute(
      async () => {
        return retryWithBackoff(async () => {
          await setDoc(docRef, data, options);
        });
      },
      'setDoc'
    );
  },

  async updateDoc<T = DocumentData>(
    docRef: DocumentReference<T>,
    data: Partial<T>
  ): Promise<void> {
    return circuitBreakers.firestore.execute(
      async () => {
        return retryWithBackoff(async () => {
          await updateDoc(docRef, data as any);
        });
      },
      'updateDoc'
    );
  },

  async deleteDoc<T = DocumentData>(
    docRef: DocumentReference<T>
  ): Promise<void> {
    return circuitBreakers.firestore.execute(
      async () => {
        return retryWithBackoff(async () => {
          await deleteDoc(docRef);
        });
      },
      'deleteDoc'
    );
  },

  async addDoc<T = DocumentData>(
    collectionRef: CollectionReference<T>,
    data: T
  ): Promise<DocumentReference<T>> {
    return circuitBreakers.firestore.execute(
      async () => {
        return retryWithBackoff(async () => {
          return await addDoc(collectionRef, data);
        });
      },
      'addDoc'
    );
  },

  // Batch operations with recovery
  async executeBatch(
    batch: WriteBatch,
    operations: Array<() => void>
  ): Promise<void> {
    return circuitBreakers.firestore.execute(
      async () => {
        return retryWithBackoff(async () => {
          operations.forEach((op) => op());
          await batch.commit();
        });
      },
      'batchWrite'
    );
  },

  // Transaction with recovery
  async runTransaction<T>(
    db: Firestore,
    updateFunction: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    return circuitBreakers.firestore.execute(
      async () => {
        return retryWithBackoff(async () => {
          const { runTransaction } = await import('firebase/firestore');
          return runTransaction(db, updateFunction);
        });
      },
      'transaction'
    );
  },
};

// Auth operations with recovery
export const resilientAuth = {
  async signIn(
    signInMethod: () => Promise<any>
  ): Promise<any> {
    return circuitBreakers.auth.execute(
      async () => {
        return retryWithBackoff(signInMethod, {
          maxRetries: 2, // Fewer retries for auth
        });
      },
      'signIn'
    );
  },

  async signOut(signOutMethod: () => Promise<void>): Promise<void> {
    return circuitBreakers.auth.execute(
      async () => {
        return retryWithBackoff(signOutMethod, {
          maxRetries: 1,
        });
      },
      'signOut'
    );
  },

  async updateProfile(
    updateMethod: () => Promise<void>
  ): Promise<void> {
    return circuitBreakers.auth.execute(
      async () => {
        return retryWithBackoff(updateMethod);
      },
      'updateProfile'
    );
  },
};

// Storage operations with recovery
export const resilientStorage = {
  async uploadFile(
    uploadMethod: () => Promise<any>
  ): Promise<any> {
    return circuitBreakers.storage.execute(
      async () => {
        return retryWithBackoff(uploadMethod, {
          maxRetries: 2, // Fewer retries for large uploads
        });
      },
      'uploadFile'
    );
  },

  async downloadFile(
    downloadMethod: () => Promise<string>
  ): Promise<string> {
    return circuitBreakers.storage.execute(
      async () => {
        return retryWithBackoff(downloadMethod);
      },
      'downloadFile'
    );
  },

  async deleteFile(
    deleteMethod: () => Promise<void>
  ): Promise<void> {
    return circuitBreakers.storage.execute(
      async () => {
        return retryWithBackoff(deleteMethod, {
          maxRetries: 2,
        });
      },
      'deleteFile'
    );
  },
};

// Graceful degradation strategies
export const degradationStrategies = {
  // Return cached data if available
  async withCache<T>(
    operation: () => Promise<T>,
    cacheKey: string,
    cache: Map<string, T>
  ): Promise<T> {
    try {
      const result = await operation();
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.warn('Using cached data due to Firebase error:', error);
        return cached;
      }
      throw error;
    }
  },

  // Return default value on failure
  async withDefault<T>(
    operation: () => Promise<T>,
    defaultValue: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error('Operation failed, using default value:', error);
      return defaultValue;
    }
  },

  // Queue operation for later retry
  queueForRetry(
    operation: () => Promise<any>,
    queue: Array<() => Promise<any>>
  ): void {
    queue.push(operation);
  },
};

// Health check for Firebase services
export async function checkFirebaseHealth(): Promise<{
  firestore: boolean;
  auth: boolean;
  storage: boolean;
}> {
  const health = {
    firestore: false,
    auth: false,
    storage: false,
  };

  // Check Firestore
  try {
    const { db } = await import('@/lib/firebase/config');
    const { doc, getDoc } = await import('firebase/firestore');
    await getDoc(doc(db, '_health_check_', 'test'));
    health.firestore = true;
  } catch (error) {
    // Expected to fail if document doesn't exist, but connection works
    if (error instanceof FirebaseError && error.code !== 'unavailable') {
      health.firestore = true;
    }
  }

  // Check Auth
  try {
    const { auth } = await import('@/lib/firebase/config');
    if (auth.currentUser !== undefined) {
      health.auth = true;
    }
  } catch (error) {
    console.error('Auth health check failed:', error);
  }

  // Check Storage
  try {
    const { storage } = await import('@/lib/firebase/config');
    const { ref } = await import('firebase/storage');
    ref(storage, '_health_check_');
    health.storage = true;
  } catch (error) {
    console.error('Storage health check failed:', error);
  }

  return health;
}

// Reset circuit breakers
export function resetCircuitBreakers(): void {
  Object.values(circuitBreakers).forEach((breaker) => breaker.reset());
}

// Export for monitoring
export function getCircuitBreakerStates(): Record<string, string> {
  return {
    firestore: circuitBreakers.firestore['state'],
    auth: circuitBreakers.auth['state'],
    storage: circuitBreakers.storage['state'],
  };
}