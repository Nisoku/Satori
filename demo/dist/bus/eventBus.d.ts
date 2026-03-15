import type { EventBus, EventSubscriber, Middleware, LogEntry, BusMetrics, RateLimitConfig, DeduplicationConfig, CircuitBreakerConfig } from "../core/types.js";
import { RateLimiter } from "./rateLimiter.js";
import { Deduplicator } from "./deduplicator.js";
import { CircuitBreaker } from "./circuitBreaker.js";
export interface EventBusConfig {
    maxBufferSize?: number;
    rateLimiting?: Partial<RateLimitConfig>;
    deduplication?: Partial<DeduplicationConfig>;
    circuitBreaker?: Partial<CircuitBreakerConfig>;
    enableMetrics?: boolean;
}
export declare class SimpleEventBus implements EventBus {
    private subscribers;
    private middleware;
    private buffer;
    private maxBufferSize;
    private rateLimiter;
    private deduplicator;
    private circuitBreaker;
    private metrics;
    private enableMetrics;
    constructor(config?: EventBusConfig | number);
    publish(entry: LogEntry): void;
    private doPublish;
    subscribe(fn: EventSubscriber): () => void;
    use(middleware: Middleware): void;
    getReplayBuffer(): LogEntry[];
    getMetrics(): BusMetrics;
    /**
     * Get the rate limiter instance for advanced configuration
     */
    getRateLimiter(): RateLimiter;
    /**
     * Get the deduplicator instance for advanced configuration
     */
    getDeduplicator(): Deduplicator;
    /**
     * Get the circuit breaker instance for advanced configuration
     */
    getCircuitBreaker(): CircuitBreaker;
    /**
     * Clear the event buffer
     */
    clearBuffer(): void;
    /**
     * Reset all state
     */
    reset(): void;
    private addToBuffer;
}
