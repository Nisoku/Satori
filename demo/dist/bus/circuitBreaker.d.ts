/**
 * Circuit Breaker implementation
 * Provides error recovery and protection for watchers and other components
 */
import type { CircuitBreakerConfig, CircuitState } from '../core/types.js';
export interface CircuitBreakerEvents {
    onStateChange?: (state: CircuitState, previousState: CircuitState) => void;
    onFailure?: (error: Error, failureCount: number) => void;
    onSuccess?: (successCount: number) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onHalfOpen?: () => void;
}
export declare class CircuitBreaker {
    private config;
    private events;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private totalFailures;
    private totalSuccesses;
    constructor(config: CircuitBreakerConfig, events?: CircuitBreakerEvents);
    /**
     * Execute a function with circuit breaker protection
     */
    execute<T>(fn: () => T | Promise<T>): Promise<T>;
    /**
     * Execute synchronously with circuit breaker protection
     */
    executeSync<T>(fn: () => T): T;
    /**
     * Check if execution is allowed
     */
    canExecute(): boolean;
    /**
     * Record a successful execution
     */
    recordSuccess(): void;
    /**
     * Record a failed execution
     */
    recordFailure(error: Error): void;
    /**
     * Transition to a new state
     */
    private transitionTo;
    /**
     * Get current state
     */
    getState(): CircuitState;
    /**
     * Get statistics
     */
    getStats(): {
        state: CircuitState;
        failureCount: number;
        successCount: number;
        totalFailures: number;
        totalSuccesses: number;
        lastFailureTime: number;
    };
    /**
     * Manually reset the circuit breaker
     */
    reset(): void;
    /**
     * Force the circuit open (for testing/manual intervention)
     */
    forceOpen(): void;
    /**
     * Force the circuit closed (for testing/manual intervention)
     */
    forceClose(): void;
}
/**
 * Error thrown when circuit is open
 */
export declare class CircuitOpenError extends Error {
    constructor(message: string);
}
