import type {
  EventBus,
  EventSubscriber,
  Middleware,
  LogEntry,
  BusMetrics,
  RateLimitConfig,
  DeduplicationConfig,
  CircuitBreakerConfig,
} from "../core/types.js";
import { RateLimiter } from "./rateLimiter.js";
import { Deduplicator } from "./deduplicator.js";
import { CircuitBreaker } from "./circuitBreaker.js";
import { MetricsCollector } from "../core/metrics.js";
import {
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_DEDUP_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from "../core/config.js";

export interface EventBusConfig {
  maxBufferSize?: number;
  rateLimiting?: Partial<RateLimitConfig>;
  deduplication?: Partial<DeduplicationConfig>;
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  enableMetrics?: boolean;
}

export class SimpleEventBus implements EventBus {
  private subscribers: EventSubscriber[] = [];
  private middleware: Middleware[] = [];
  private buffer: LogEntry[] = [];
  private maxBufferSize: number;

  private rateLimiter: RateLimiter;
  private deduplicator: Deduplicator;
  private circuitBreaker: CircuitBreaker;
  private metrics: MetricsCollector;
  private enableMetrics: boolean;

  constructor(config: EventBusConfig | number = {}) {
    // Handle legacy number parameter
    if (typeof config === "number") {
      config = { maxBufferSize: config };
    }

    this.maxBufferSize = config.maxBufferSize || 1000;
    this.enableMetrics = config.enableMetrics ?? true;

    // Initialize components with merged configs
    this.rateLimiter = new RateLimiter({
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...config.rateLimiting,
    });

    this.deduplicator = new Deduplicator({
      ...DEFAULT_DEDUP_CONFIG,
      ...config.deduplication,
    });

    this.circuitBreaker = new CircuitBreaker(
      {
        ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
        ...config.circuitBreaker,
      },
      {
        onStateChange: (state) => {
          if (this.enableMetrics) {
            this.metrics.setCircuitState(state);
          }
        },
      },
    );

    this.metrics = new MetricsCollector();
  }

  publish(entry: LogEntry): void {
    // Check deduplication (unless skipped)
    if (
      !entry.__internal?.isReplay &&
      !(entry as { skipDedup?: boolean }).skipDedup
    ) {
      const dedupResult = this.deduplicator.isDuplicate(entry);
      if (dedupResult.isDuplicate) {
        if (this.enableMetrics) {
          this.metrics.recordDeduplicated();
        }
        return;
      }
    }

    // Check rate limiting (unless skipped)
    if (
      !entry.__internal?.isReplay &&
      !(entry as { skipRateLimit?: boolean }).skipRateLimit
    ) {
      const rateLimitResult = this.rateLimiter.shouldAllow(entry);
      if (!rateLimitResult.allowed) {
        if (this.enableMetrics) {
          this.metrics.recordDropped();
        }
        return;
      }
      if (rateLimitResult.sampled) {
        entry.__internal = entry.__internal || {};
        entry.__internal.sampled = true;
        if (this.enableMetrics) {
          this.metrics.recordSampled();
        }
      }
    }

    // Use circuit breaker for actual publish
    try {
      this.circuitBreaker.executeSync(() => {
        this.doPublish(entry);
      });

      if (this.enableMetrics) {
        this.metrics.recordPublished();
        this.metrics.setBufferSize(this.buffer.length);
        this.metrics.setSubscriberCount(this.subscribers.length);
      }
    } catch {
      // Circuit is open or publish failed
      if (this.enableMetrics) {
        this.metrics.recordDropped();
      }
    }
  }

  private doPublish(entry: LogEntry): void {
    let index = 0;

    const runNext = () => {
      if (index >= this.middleware.length) {
        this.subscribers.forEach((sub) => sub(entry));
        this.addToBuffer(entry);
        return;
      }

      const mw = this.middleware[index];
      index++;
      mw(entry, runNext);
    };

    runNext();
  }

  subscribe(fn: EventSubscriber): () => void {
    this.subscribers.push(fn);
    if (this.enableMetrics) {
      this.metrics.setSubscriberCount(this.subscribers.length);
    }
    return () => {
      const idx = this.subscribers.indexOf(fn);
      if (idx >= 0) {
        this.subscribers.splice(idx, 1);
        if (this.enableMetrics) {
          this.metrics.setSubscriberCount(this.subscribers.length);
        }
      }
    };
  }

  use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  getReplayBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  getMetrics(): BusMetrics {
    return this.metrics.getBusMetrics();
  }

  /**
   * Get the rate limiter instance for advanced configuration
   */
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /**
   * Get the deduplicator instance for advanced configuration
   */
  getDeduplicator(): Deduplicator {
    return this.deduplicator;
  }

  /**
   * Get the circuit breaker instance for advanced configuration
   */
  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  /**
   * Clear the event buffer
   */
  clearBuffer(): void {
    this.buffer.length = 0;
    if (this.enableMetrics) {
      this.metrics.setBufferSize(0);
    }
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.buffer.length = 0;
    this.middleware.length = 0;
    this.rateLimiter.reset();
    this.deduplicator.reset();
    this.circuitBreaker.reset();
    this.metrics.reset();
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }
}
