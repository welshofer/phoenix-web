// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure function execution time
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  // Record a metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get metric statistics
  getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = sorted.reduce((a, b) => a + b, 0) / count;
    const p50 = sorted[Math.floor(count * 0.5)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];

    return { count, min, max, avg, p50, p95, p99 };
  }

  // Get all metrics
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  // Clear metrics
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

// Web Vitals monitoring
export function reportWebVitals(metric: any): void {
  const { name, value, rating } = metric;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.info(`Web Vital: ${name}`, {
      value: Math.round(value),
      rating,
    });
  }
  
  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      value: Math.round(value),
      metric_rating: rating,
      non_interaction: true,
    });
  }
}

// Resource timing observer
export function observeResourceTiming(): void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Log slow resources
        if (resourceEntry.duration > 1000) {
          console.warn('Slow resource:', {
            name: resourceEntry.name,
            duration: Math.round(resourceEntry.duration),
            type: resourceEntry.initiatorType,
          });
        }
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
}

// Long task observer
export function observeLongTasks(): void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.warn('Long task detected:', {
        duration: Math.round(entry.duration),
        startTime: Math.round(entry.startTime),
      });
    }
  });

  if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
    observer.observe({ entryTypes: ['longtask'] });
  }
}

// Memory monitoring (Chrome only)
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if (typeof window === 'undefined') return null;
  
  const memory = (window.performance as any).memory;
  if (!memory) return null;

  return {
    usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
    totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
    jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
  };
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Initialize monitoring
export function initializeMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Start observing
  observeResourceTiming();
  observeLongTasks();

  // Monitor memory usage
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const memory = getMemoryUsage();
      if (memory && memory.usedJSHeapSize > memory.totalJSHeapSize * 0.9) {
        console.warn('High memory usage:', memory);
      }
    }, 30000); // Check every 30 seconds
  }
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}