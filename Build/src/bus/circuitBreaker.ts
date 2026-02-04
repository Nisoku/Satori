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

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  constructor(
    private config: CircuitBreakerConfig,
    private events: CircuitBreakerEvents = {}
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => T | Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    if (!this.canExecute()) {
      throw new CircuitOpenError('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Execute synchronously with circuit breaker protection
   */
  executeSync<T>(fn: () => T): T {
    if (!this.config.enabled) {
      return fn();
    }

    if (!this.canExecute()) {
      throw new CircuitOpenError('Circuit breaker is open');
    }

    try {
      const result = fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Check if execution is allowed
   */
  canExecute(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      // Check if enough time has passed to try half-open
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.transitionTo('half-open');
        return true;
      }
      return false;
    }

    // Half-open: allow one request through
    return true;
  }

  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    this.totalSuccesses++;
    this.events.onSuccess?.(this.successCount + 1);

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('closed');
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed execution
   */
  recordFailure(error: Error): void {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.events.onFailure?.(error, this.failureCount);

    if (this.state === 'half-open') {
      // Any failure in half-open goes back to open
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo('open');
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;

    // Reset counters on state change
    if (newState === 'closed') {
      this.failureCount = 0;
      this.successCount = 0;
      this.events.onClose?.();
    } else if (newState === 'open') {
      this.successCount = 0;
      this.events.onOpen?.();
    } else if (newState === 'half-open') {
      this.successCount = 0;
      this.events.onHalfOpen?.();
    }

    this.events.onStateChange?.(newState, previousState);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

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
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      lastFailureTime: this.lastFailureTime
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.transitionTo('closed');
    this.failureCount = 0;
    this.successCount = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.lastFailureTime = 0;
  }

  /**
   * Force the circuit open (for testing/manual intervention)
   */
  forceOpen(): void {
    this.transitionTo('open');
    this.lastFailureTime = Date.now();
  }

  /**
   * Force the circuit closed (for testing/manual intervention)
   */
  forceClose(): void {
    this.transitionTo('closed');
  }
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}
