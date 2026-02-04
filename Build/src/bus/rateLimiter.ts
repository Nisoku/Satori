/**
 * Rate Limiter implementation
 * Protects against log spam and high-volume scenarios
 */

import type { LogEntry, RateLimitConfig } from '../core/types.js';

export class RateLimiter {
  private eventTimestamps: number[] = [];
  private buffer: LogEntry[] = [];
  private droppedCount = 0;
  private sampledCount = 0;

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if an event should be allowed through
   * Returns: { allowed: boolean, sampled?: boolean }
   */
  shouldAllow(entry: LogEntry): { allowed: boolean; sampled: boolean } {
    if (!this.config.enabled) {
      return { allowed: true, sampled: false };
    }

    const now = Date.now();
    
    // Clean old timestamps (older than 1 second)
    this.eventTimestamps = this.eventTimestamps.filter(ts => now - ts < 1000);
    
    const currentRate = this.eventTimestamps.length;
    
    if (currentRate < this.config.maxEventsPerSecond) {
      // Under the limit, allow through
      this.eventTimestamps.push(now);
      return { allowed: true, sampled: false };
    }

    // Over the limit, apply strategy
    switch (this.config.strategy) {
      case 'drop':
        this.droppedCount++;
        return { allowed: false, sampled: false };
        
      case 'sample':
        if (Math.random() < this.config.samplingRate) {
          this.eventTimestamps.push(now);
          this.sampledCount++;
          return { allowed: true, sampled: true };
        }
        this.droppedCount++;
        return { allowed: false, sampled: false };
        
      case 'buffer':
        if (this.buffer.length < (this.config.bufferSize || 100)) {
          this.buffer.push(entry);
        } else {
          this.droppedCount++;
        }
        return { allowed: false, sampled: false };
        
      default:
        return { allowed: true, sampled: false };
    }
  }

  /**
   * Get buffered events and clear the buffer
   */
  flushBuffer(): LogEntry[] {
    const entries = [...this.buffer];
    this.buffer = [];
    return entries;
  }

  /**
   * Get current rate (events per second)
   */
  getCurrentRate(): number {
    const now = Date.now();
    this.eventTimestamps = this.eventTimestamps.filter(ts => now - ts < 1000);
    return this.eventTimestamps.length;
  }

  /**
   * Get statistics
   */
  getStats(): { dropped: number; sampled: number; buffered: number; currentRate: number } {
    return {
      dropped: this.droppedCount,
      sampled: this.sampledCount,
      buffered: this.buffer.length,
      currentRate: this.getCurrentRate()
    };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.eventTimestamps = [];
    this.buffer = [];
    this.droppedCount = 0;
    this.sampledCount = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
