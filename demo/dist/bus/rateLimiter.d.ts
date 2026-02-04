/**
 * Rate Limiter implementation
 * Protects against log spam and high-volume scenarios
 */
import type { LogEntry, RateLimitConfig } from '../core/types.js';
export declare class RateLimiter {
    private config;
    private eventTimestamps;
    private buffer;
    private droppedCount;
    private sampledCount;
    constructor(config: RateLimitConfig);
    /**
     * Check if an event should be allowed through
     * Returns: { allowed: boolean, sampled?: boolean }
     */
    shouldAllow(entry: LogEntry): {
        allowed: boolean;
        sampled: boolean;
    };
    /**
     * Get buffered events and clear the buffer
     */
    flushBuffer(): LogEntry[];
    /**
     * Get current rate (events per second)
     */
    getCurrentRate(): number;
    /**
     * Get statistics
     */
    getStats(): {
        dropped: number;
        sampled: number;
        buffered: number;
        currentRate: number;
    };
    /**
     * Reset statistics
     */
    reset(): void;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<RateLimitConfig>): void;
}
