import { EventEmitter } from 'events';

interface QueueOptions {
  concurrency?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface QueueJob<T> {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retries: number;
  priority: number;
}

export class AsyncQueue extends EventEmitter {
  private queue: QueueJob<any>[] = [];
  private running = 0;
  private concurrency: number;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private paused = false;

  constructor(options: QueueOptions = {}) {
    super();
    this.concurrency = options.concurrency || 3;
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  async add<T>(
    fn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const job: QueueJob<T> = {
        id: Math.random().toString(36).substr(2, 9),
        fn,
        resolve,
        reject,
        retries: 0,
        priority,
      };

      this.queue.push(job);
      this.queue.sort((a, b) => b.priority - a.priority);
      
      this.emit('job:added', job.id);
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.paused || this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.running++;
    this.emit('job:started', job.id);

    try {
      const result = await this.executeWithTimeout(job.fn, this.timeout);
      job.resolve(result);
      this.emit('job:completed', job.id);
    } catch (error) {
      if (job.retries < this.maxRetries) {
        job.retries++;
        this.emit('job:retry', job.id, job.retries);
        
        // Re-add to queue with delay
        setTimeout(() => {
          this.queue.unshift(job);
          this.process();
        }, this.retryDelay * Math.pow(2, job.retries - 1));
      } else {
        job.reject(error as Error);
        this.emit('job:failed', job.id, error);
      }
    } finally {
      this.running--;
      this.process();
    }
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      ),
    ]);
  }

  pause(): void {
    this.paused = true;
    this.emit('paused');
  }

  resume(): void {
    this.paused = false;
    this.emit('resumed');
    this.process();
  }

  clear(): void {
    this.queue = [];
    this.emit('cleared');
  }

  size(): number {
    return this.queue.length;
  }

  pending(): number {
    return this.queue.length + this.running;
  }

  isPaused(): boolean {
    return this.paused;
  }
}

// Job Queue for background processing
export class JobQueue {
  private static instance: JobQueue;
  private queues: Map<string, AsyncQueue> = new Map();

  private constructor() {}

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  getQueue(name: string, options?: QueueOptions): AsyncQueue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new AsyncQueue(options));
    }
    return this.queues.get(name)!;
  }

  async addJob<T>(
    queueName: string,
    job: () => Promise<T>,
    priority?: number
  ): Promise<T> {
    const queue = this.getQueue(queueName);
    return queue.add(job, priority);
  }

  pauseQueue(name: string): void {
    const queue = this.queues.get(name);
    if (queue) queue.pause();
  }

  resumeQueue(name: string): void {
    const queue = this.queues.get(name);
    if (queue) queue.resume();
  }

  clearQueue(name: string): void {
    const queue = this.queues.get(name);
    if (queue) queue.clear();
  }

  getQueueStats(name: string): { size: number; pending: number; paused: boolean } | null {
    const queue = this.queues.get(name);
    if (!queue) return null;

    return {
      size: queue.size(),
      pending: queue.pending(),
      paused: queue.isPaused(),
    };
  }
}

// Export singleton
export const jobQueue = JobQueue.getInstance();

// Predefined queues
export const imageGenerationQueue = jobQueue.getQueue('image-generation', {
  concurrency: 2,
  timeout: 60000,
  retries: 2,
});

export const presentationQueue = jobQueue.getQueue('presentation', {
  concurrency: 3,
  timeout: 30000,
  retries: 3,
});

export const exportQueue = jobQueue.getQueue('export', {
  concurrency: 1,
  timeout: 120000,
  retries: 1,
});